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
      showToast('Material uploaded and summarized by AI!');
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
            <div className="card" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <h2>{selectedMaterial.title}</h2>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleGenerateQuiz(selectedMaterial.id)}
                  disabled={generatingQuiz === selectedMaterial.id}
                >
                  {generatingQuiz === selectedMaterial.id ? '⏳ Generating...' : '✨ Generate Quiz'}
                </button>
              </div>

              {selectedMaterial.ai_summary && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-mute)', marginBottom: 10 }}>
                    AI Summary
                  </div>
                  <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 16, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
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
                    <div key={q.id} style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 14, marginBottom: 6 }}>
                      📝 {q.title}
                      <span className="text-mute" style={{ marginLeft: 8 }}>{new Date(q.created_at).toLocaleDateString()}</span>
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
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Upload study material</div>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" placeholder="e.g. Chapter 3 - Fourier Transform"
                  value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Class</label>
                <select className="form-input form-select"
                  value={uploadForm.classId || selectedClass}
                  onChange={e => setUploadForm({ ...uploadForm, classId: e.target.value })}>
                  {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">PDF file</label>
                <input type="file" accept=".pdf" className="form-input"
                  onChange={e => setUploadForm({ ...uploadForm, file: e.target.files[0] })} required />
              </div>
              {uploading && (
                <div style={{ background: '#ede9fe', color: '#5b21b6', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                  ✨ AI is reading and summarizing your PDF... this takes ~15 seconds.
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Processing...' : 'Upload & Summarize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
