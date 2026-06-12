import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../utils/api';

export default function MarksPage() {
  const { user } = useAuth();
  const { showToast, Toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [marks, setMarks] = useState([]);
  const [myMarks, setMyMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [examName, setExamName] = useState('');
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user.role === 'student') {
      api.get('/marks/student/me').then(res => setMyMarks(res.data));
    } else {
      api.get('/classes').then(res => {
        setClasses(res.data);
        if (res.data.length > 0) setSelectedClass(res.data[0]);
      });
    }
  }, [user.role]);

  useEffect(() => {
    if (!selectedClass || user.role !== 'teacher') return;
    api.get(`/marks/class/${selectedClass.id}`).then(res => setMarks(res.data));
    api.get(`/classes/${selectedClass.id}`).then(res => {
      setStudents(res.data.students || []);
      const defaults = {};
      (res.data.students || []).forEach(s => defaults[s.id] = '');
      setScores(defaults);
    });
  }, [selectedClass, user.role]);

  const handleAddMarks = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const records = Object.entries(scores)
        .filter(([, score]) => score !== '')
        .map(([studentId, score]) => ({ studentId: parseInt(studentId), score: parseFloat(score), maxScore: 100 }));
      await api.post('/marks', { classId: selectedClass.id, examName, records });
      showToast('Marks saved!');
      setShowModal(false);
      setExamName('');
      const res = await api.get(`/marks/class/${selectedClass.id}`);
      setMarks(res.data);
    } catch (err) {
      showToast('Failed to save marks.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Student view
  if (user.role === 'student') {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">My Marks</h1>
            <div className="page-subtitle">Your academic performance</div>
          </div>
        </div>
        {myMarks.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📊</div><p>No marks recorded yet.</p></div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Class</th><th>Exam</th><th>Score</th><th>Grade</th></tr>
                </thead>
                <tbody>
                  {myMarks.map(m => {
                    const pct = (m.score / m.max_score) * 100;
                    const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : 'F';
                    const badgeClass = pct >= 80 ? 'badge-green' : pct >= 60 ? 'badge-yellow' : 'badge-red';
                    return (
                      <tr key={m.id}>
                        <td><div style={{ fontWeight: 500 }}>{m.class_name}</div><div className="text-mute">{m.subject}</div></td>
                        <td>{m.exam_name}</td>
                        <td style={{ fontWeight: 600 }}>{m.score} / {m.max_score}</td>
                        <td><span className={`badge ${badgeClass}`}>{grade} ({pct.toFixed(0)}%)</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Teacher view
  return (
    <div>
      {Toast}
      <div className="page-header">
        <div>
          <h1 className="page-title">Marks</h1>
          <div className="page-subtitle">Record and track student performance</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add marks</button>
      </div>

      {/* Class selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {classes.map(cls => (
          <button key={cls.id}
            className={`btn btn-sm ${selectedClass?.id === cls.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedClass(cls)}>
            {cls.name}
          </button>
        ))}
      </div>

      {marks.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📊</div><p>No marks recorded yet.</p></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Student</th><th>Exam</th><th>Score</th><th>%</th></tr></thead>
              <tbody>
                {marks.map(m => {
                  const pct = ((m.score / m.max_score) * 100).toFixed(1);
                  return (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 500 }}>{m.student_name}</td>
                      <td>{m.exam_name}</td>
                      <td>{m.score} / {m.max_score}</td>
                      <td><span className={`badge ${pct >= 80 ? 'badge-green' : pct >= 60 ? 'badge-yellow' : 'badge-red'}`}>{pct}%</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add marks — {selectedClass?.name}</div>
            <form onSubmit={handleAddMarks} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Exam name</label>
                <input className="form-input" placeholder="e.g. Mid Sem 1" value={examName}
                  onChange={e => setExamName(e.target.value)} required />
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {students.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</span>
                    <input type="number" className="form-input" style={{ width: 100 }} placeholder="Score / 100"
                      min="0" max="100" value={scores[s.id] || ''}
                      onChange={e => setScores({ ...scores, [s.id]: e.target.value })} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save marks'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
