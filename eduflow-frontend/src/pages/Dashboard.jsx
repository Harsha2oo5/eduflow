import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/classes').then(res => {
      setClasses(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good morning, {user?.name.split(' ')[0]} 👋</h1>
          <div className="page-subtitle">Here's what's happening today</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-value">{classes.length}</div>
          <div className="stat-label">{user?.role === 'teacher' ? 'Classes teaching' : 'Classes enrolled'}</div>
        </div>
        {user?.role === 'teacher' && (
          <div className="stat-card">
            <div className="stat-value">
              {classes.reduce((sum, c) => sum + parseInt(c.student_count || 0), 0)}
            </div>
            <div className="stat-label">Total students</div>
          </div>
        )}
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#10b981' }}>—</div>
          <div className="stat-label">Active today</div>
        </div>
      </div>

      {/* Classes */}
      <h2 style={{ marginBottom: 16 }}>
        {user?.role === 'teacher' ? 'Your classes' : 'Enrolled classes'}
      </h2>

      {classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎓</div>
          <p>{user?.role === 'teacher' ? 'Create your first class to get started.' : 'Join a class using a join code.'}</p>
        </div>
      ) : (
        <div className="card-grid">
          {classes.map(cls => (
            <div key={cls.id} className="card" style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `hsl(${(cls.id * 47) % 360}, 65%, 92%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18
                  }}
                >
                  📚
                </div>
                {user?.role === 'teacher' && (
                  <span className="badge badge-blue">{cls.student_count || 0} students</span>
                )}
              </div>
              <h3 style={{ marginBottom: 4 }}>{cls.name}</h3>
              <div className="text-mute">{cls.subject || 'No subject'}</div>
              {user?.role === 'teacher' && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Join code: </span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)', letterSpacing: '0.1em' }}>
                    {cls.join_code}
                  </span>
                </div>
              )}
              {user?.role === 'student' && cls.teacher_name && (
                <div className="text-mute" style={{ marginTop: 8 }}>👤 {cls.teacher_name}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
