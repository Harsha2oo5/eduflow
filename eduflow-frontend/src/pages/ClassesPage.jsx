import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../utils/api';

export default function ClassesPage() {
  const { user } = useAuth();
  const { showToast, Toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', joinCode: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchClasses = () => {
    api.get('/classes').then(res => {
      setClasses(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchClasses(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (user.role === 'teacher') {
        await api.post('/classes', { name: form.name, subject: form.subject });
        showToast('Class created!');
      } else {
        await api.post('/classes/join', { joinCode: form.joinCode });
        showToast('Joined class!');
      }
      setShowModal(false);
      setForm({ name: '', subject: '', joinCode: '' });
      fetchClasses();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      {Toast}
      <div className="page-header">
        <div>
          <h1 className="page-title">Classes</h1>
          <div className="page-subtitle">
            {user.role === 'teacher' ? `${classes.length} classes` : `${classes.length} enrolled`}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + {user.role === 'teacher' ? 'New class' : 'Join class'}
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎓</div>
          <p>{user.role === 'teacher' ? 'Create your first class.' : 'Ask your teacher for a join code.'}</p>
        </div>
      ) : (
        <div className="card-grid">
          {classes.map(cls => (
            <div key={cls.id} className="card">
              <h3 style={{ marginBottom: 4 }}>{cls.name}</h3>
              <div className="text-mute" style={{ marginBottom: 12 }}>{cls.subject || 'No subject'}</div>

              {user.role === 'teacher' ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-blue">{cls.student_count || 0} students</span>
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Code: </span>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)', letterSpacing: '0.1em' }}>
                      {cls.join_code}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-mute">👤 {cls.teacher_name}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              {user.role === 'teacher' ? 'Create a new class' : 'Join a class'}
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {user.role === 'teacher' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Class name</label>
                    <input className="form-input" placeholder="e.g. ECE Signals A" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <input className="form-input" placeholder="e.g. Signals and Systems" value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })} />
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label className="form-label">Join code</label>
                  <input className="form-input" placeholder="e.g. 1E8E29" value={form.joinCode}
                    onChange={e => setForm({ ...form, joinCode: e.target.value })} required />
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Please wait...' : user.role === 'teacher' ? 'Create' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
