import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../utils/api';

export default function MaterialsPage() {
  const { user } = useAuth();
  const { showToast, Toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', classId: '', file: null });
  const [uploading, setUploading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  // Quiz taking state variables
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  const handleStartQuiz = async (quizId) => {
    try {
      setLoadingAttempts(true);
      const quizRes = await api.get(`/quizzes/${quizId}`);
      const quizData = quizRes.data;

      if (typeof quizData.questions === 'string') {
        quizData.questions = JSON.parse(quizData.questions);
      }

      setActiveQuiz(quizData);
      setQuizAnswers(new Array(quizData.questions.length).fill(''));
      setQuizSubmitted(false);
      setQuizResults(null);

      const attemptsRes = await api.get(`/quizzes/${quizId}/attempts`);
      setQuizAttempts(attemptsRes.data);
    } catch (err) {
      showToast('Failed to load quiz details.', 'error');
    } finally {
      setLoadingAttempts(false);
    }
  };

  useEffect(() => {
    api.get('/classes').then(res => {
      setClasses(res.data);
      if (res.data.length > 0) setSelectedClass(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    api.get(`/materials/class/${selectedClass}`).then(res => {
      setMaterials(res.data);
      setLoading(false);
    });
  }, [selectedClass]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) return showToast('Please select a PDF.', 'error');
    setUploading(true);
    try {
      // FormData is how you send files in HTTP — not JSON
      const formData = new FormData();
      formData.append('pdf', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('classId', uploadForm.classId || selectedClass);
      await api.post('/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Material uploaded successfully');
      setShowUpload(false);
      setUploadForm({ title: '', classId: '', file: null });
      // Refresh list
      const res = await api.get(`/materials/class/${selectedClass}`);
      setMaterials(res.data);
    } catch (err) {
      showToast(err.response?.data?.error || 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateQuiz = async (materialId) => {
    setGeneratingQuiz(materialId);
    try {
      await api.post(`/materials/${materialId}/generate-quiz`, { numQuestions: 5 });
      showToast('Quiz generated!');
      // Refresh material details
      const res = await api.get(`/materials/${materialId}`);
      setSelectedMaterial(res.data);
    } catch (err) {
      showToast('Quiz generation failed.', 'error');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  return (
    <div>
      {Toast}
      <div className="page-header">
        <div>
          <h1 className="page-title">Study Materials</h1>
          <div className="page-subtitle">AI-summarized notes and quizzes</div>
        </div>
        {user.role === 'teacher' && (
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>+ Upload PDF</button>
        )}
      </div>

      {/* Class selector */}
      {classes.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {classes.map(cls => (
            <button
              key={cls.id}
              className={`btn ${selectedClass === cls.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setSelectedClass(cls.id)}
            >
              {cls.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading materials...</div>
      ) : materials.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <p>{user.role === 'teacher' ? 'Upload a PDF to get started.' : 'No materials yet.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 20 }}>
          {/* Material list */}
          <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {materials.map(mat => (
              <div
                key={mat.id}
                className="card"
                style={{ cursor: 'pointer', border: selectedMaterial?.id === mat.id ? '2px solid var(--accent)' : undefined }}
                onClick={async () => {
                  const res = await api.get(`/materials/${mat.id}`);
                  setSelectedMaterial(res.data);
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>📄</div>
                <h3 style={{ fontSize: 14, marginBottom: 4 }}>{mat.title}</h3>
                <div className="text-mute">by {mat.uploaded_by}</div>
                <div className="text-mute">{new Date(mat.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>

          {/* Material detail */}
          {selectedMaterial ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 20
              }}
            >
              <h2>{selectedMaterial.title}</h2>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={async () => {
                    try {
                      await api.post(
                        `/materials/${selectedMaterial.id}/generate-summary`
                      );

                      showToast('Summary generated!');

                      const res = await api.get(
                        `/materials/${selectedMaterial.id}`
                      );

                      setSelectedMaterial(res.data);
                    } catch (err) {
                      showToast(
                        'Summary generation failed.',
                        'error'
                      );
                    }
                  }}
                >
                  📖 Generate Summary
                </button>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() =>
                    handleGenerateQuiz(selectedMaterial.id)
                  }
                  disabled={
                    generatingQuiz === selectedMaterial.id
                  }
                >
                  {generatingQuiz === selectedMaterial.id
                    ? '⏳ Generating...'
                    : '✨ Generate Quiz'}
                </button>
              </div>
            </div>

              {selectedMaterial.ai_summary && (
            <div className="card ai-glowing-card" style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-soft)' }}>
                  Study Material Summary
                </div>
                <span className="ai-badge">✨ AI Generated</span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--ink)' }}>
                {selectedMaterial.ai_summary}
              </div>
            </div>
          )}

          {selectedMaterial.quizzes?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-mute)', marginBottom: 10 }}>
                Quizzes ({selectedMaterial.quizzes.length})
              </div>
              {selectedMaterial.quizzes.map(q => (
                <div
                  key={q.id}
                  style={{ padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 14, marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', transition: 'background-color 0.15s' }}
                  onClick={() => handleStartQuiz(q.id)}
                >
                  <span style={{ fontWeight: 500 }}>📝 {q.title}</span>
                  <span className="text-mute">{new Date(q.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
      <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state">
          <div className="empty-icon">👈</div>
          <p>Select a material to view its summary</p>
        </div>
      </div>
          )}
    </div>
  )
}

{/* Upload modal */ }
{
  showUpload && (
    <div
      className="modal-overlay"
      onClick={() => setShowUpload(false)}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-title">
          Upload study material
        </div>

        <form
          onSubmit={handleUpload}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          <div className="form-group">
            <label className="form-label">
              Title
            </label>

            <input
              className="form-input"
              placeholder="e.g. Chapter 3 - Fourier Transform"
              value={uploadForm.title}
              onChange={(e) =>
                setUploadForm({
                  ...uploadForm,
                  title: e.target.value
                })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Class
            </label>

            <select
              className="form-input form-select"
              value={uploadForm.classId || selectedClass}
              onChange={(e) =>
                setUploadForm({
                  ...uploadForm,
                  classId: e.target.value
                })
              }
            >
              {classes.map((cls) => (
                <option
                  key={cls.id}
                  value={cls.id}
                >
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              PDF File
            </label>

            <input
              type="file"
              accept=".pdf"
              className="form-input"
              onChange={(e) =>
                setUploadForm({
                  ...uploadForm,
                  file: e.target.files[0]
                })
              }
              required
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end'
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowUpload(false)}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading}
            >
              {uploading
                ? 'Uploading...'
                : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

{/* Quiz Modal */ }
{
  activeQuiz && (
    <div className="modal-overlay" onClick={() => setActiveQuiz(null)}>
      <div className="modal" style={{ maxWidth: 650, width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 className="modal-title" style={{ margin: 0 }}>{activeQuiz.title}</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveQuiz(null)}>Close</button>
        </div>

        {/* Teacher View */}
        {user.role === 'teacher' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ marginBottom: 10 }}>Quiz Questions Reference:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeQuiz.questions.map((q, idx) => (
                  <div key={idx} style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, fontSize: 13 }}>
                    <div style={{ fontWeight: 600 }}>{idx + 1}. {q.question}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                      {q.options.map((opt, oIdx) => {
                        const optionLetter = ['A', 'B', 'C', 'D'][oIdx];
                        const isCorrect = q.answer === optionLetter;
                        return (
                          <div key={oIdx} style={{ color: isCorrect ? 'var(--success)' : 'inherit', fontWeight: isCorrect ? 600 : 'normal' }}>
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && (
                      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-soft)', fontStyle: 'italic' }}>
                        Explanation: {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <h4 style={{ marginBottom: 10 }}>Student Attempts ({quizAttempts.length})</h4>
            {loadingAttempts ? (
              <div className="text-mute">Loading attempts...</div>
            ) : quizAttempts.length === 0 ? (
              <div className="text-mute">No attempts yet.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Score</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizAttempts.map(att => (
                      <tr key={att.id}>
                        <td>
                          <div>{att.student_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{att.student_email}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{att.score} / {att.total}</td>
                        <td>{new Date(att.attempted_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Student View */}
        {user.role === 'student' && (
          <div>
            {!quizSubmitted && !quizAnswers.some(ans => ans !== '') && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0 }}>Your Attempt History</h4>
                  <button className="btn btn-primary btn-sm" onClick={() => setQuizAnswers(new Array(activeQuiz.questions.length).fill(' '))}>
                    Start New Attempt
                  </button>
                </div>

                {loadingAttempts ? (
                  <div className="text-mute">Loading history...</div>
                ) : quizAttempts.length === 0 ? (
                  <div className="empty-state" style={{ padding: '20px 0' }}>
                    <p>You haven't attempted this quiz yet.</p>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Score</th>
                          <th>Percentage</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quizAttempts.map(att => {
                          const pct = ((att.score / att.total) * 100).toFixed(0);
                          return (
                            <tr key={att.id}>
                              <td style={{ fontWeight: 600 }}>{att.score} / {att.total}</td>
                              <td>
                                <span className={`badge ${parseInt(pct) >= 80 ? 'badge-green' : parseInt(pct) >= 60 ? 'badge-yellow' : 'badge-red'}`}>
                                  {pct}%
                                </span>
                              </td>
                              <td>{new Date(att.attempted_at).toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Active Quiz Taking */}
            {quizAnswers.some(ans => ans !== '') && !quizSubmitted && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setSubmittingQuiz(true);
                try {
                  const cleanedAnswers = quizAnswers.map(ans => ans.trim());
                  const res = await api.post(`/quizzes/${activeQuiz.id}/submit`, { answers: cleanedAnswers });
                  setQuizResults(res.data);
                  setQuizSubmitted(true);
                  showToast('Quiz submitted successfully!');
                  const attemptsRes = await api.get(`/quizzes/${activeQuiz.id}/attempts`);
                  setQuizAttempts(attemptsRes.data);
                } catch (err) {
                  showToast('Failed to submit quiz.', 'error');
                } finally {
                  setSubmittingQuiz(false);
                }
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
                  {activeQuiz.questions.map((q, idx) => (
                    <div key={idx} className="card" style={{ padding: 16, background: 'var(--surface-2)', border: 'none' }}>
                      <div style={{ fontWeight: 600, marginBottom: 12 }}>{idx + 1}. {q.question}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {q.options.map((opt, oIdx) => {
                          const optionLetter = ['A', 'B', 'C', 'D'][oIdx];
                          const isSelected = quizAnswers[idx]?.trim() === optionLetter;
                          return (
                            <label key={oIdx} style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                              background: 'var(--surface)', border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                              borderRadius: 8, cursor: 'pointer', fontSize: 13, transition: 'all 0.1s'
                            }}>
                              <input type="radio" name={`question-${idx}`} checked={isSelected}
                                onChange={() => {
                                  const next = [...quizAnswers];
                                  next[idx] = optionLetter;
                                  setQuizAnswers(next);
                                }}
                                required style={{ accentColor: 'var(--accent)' }} />
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setQuizAnswers(new Array(activeQuiz.questions.length).fill(''));
                  }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submittingQuiz}>
                    {submittingQuiz ? 'Submitting...' : 'Submit Answers'}
                  </button>
                </div>
              </form>
            )}

            {/* Quiz Results Screen */}
            {quizSubmitted && quizResults && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, background: 'var(--surface-2)', borderRadius: 10, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>Your Score</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', fontFamily: 'Syne, sans-serif' }}>
                      {quizResults.score} / {quizResults.total}
                    </div>
                  </div>
                  <span className={`badge ${((quizResults.score / quizResults.total) * 100) >= 80 ? 'badge-green' : ((quizResults.score / quizResults.total) * 100) >= 60 ? 'badge-yellow' : 'badge-red'}`} style={{ fontSize: 16, padding: '6px 14px' }}>
                    {((quizResults.score / quizResults.total) * 100).toFixed(0)}%
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                  {quizResults.results.map((q, idx) => (
                    <div key={idx} style={{
                      padding: 16, borderRadius: 10, background: q.isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      border: `1px solid ${q.isCorrect ? 'var(--success)' : 'var(--danger)'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{idx + 1}. {q.question}</span>
                        <span className={`badge ${q.isCorrect ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 11 }}>
                          {q.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                        {q.options.map((opt, oIdx) => {
                          const letter = ['A', 'B', 'C', 'D'][oIdx];
                          const isUserAnswer = q.userAnswer === letter;
                          const isCorrectAnswer = q.correctAnswer === letter;
                          return (
                            <div key={oIdx} style={{
                              padding: '8px 12px', borderRadius: 6,
                              background: isCorrectAnswer ? '#d1fae5' : isUserAnswer ? '#fee2e2' : 'var(--surface)',
                              color: isCorrectAnswer ? '#065f46' : isUserAnswer ? '#991b1b' : 'inherit',
                              fontWeight: isCorrectAnswer || isUserAnswer ? 600 : 'normal',
                              border: '1px solid var(--border)'
                            }}>
                              {opt} {isUserAnswer && '👈 (Your choice)'} {isCorrectAnswer && '✓ (Correct)'}
                            </div>
                          );
                        })}
                      </div>
                      {q.explanation && (
                        <div style={{ marginTop: 12, padding: 10, background: 'var(--surface)', borderRadius: 6, fontSize: 12, color: 'var(--ink-soft)', borderLeft: '3px solid var(--accent)' }}>
                          <strong>AI Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={() => {
                    setQuizAnswers(new Array(activeQuiz.questions.length).fill(''));
                    setQuizSubmitted(false);
                    setQuizResults(null);
                  }}>Done</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
    </div >
  );
}
