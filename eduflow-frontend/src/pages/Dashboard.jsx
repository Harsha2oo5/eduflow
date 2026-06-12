import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [attendanceSummaries, setAttendanceSummaries] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/classes').then(async (res) => {
      setClasses(res.data);
      if (user?.role === 'student' && res.data.length > 0) {
        try {
          const summaries = {};
          await Promise.all(res.data.map(async (cls) => {
            const attRes = await api.get(`/attendance/student/${user.id}/class/${cls.id}`);
            summaries[cls.id] = attRes.data;
          }));
          setAttendanceSummaries(summaries);
        } catch (err) {
          console.error('Error fetching student attendance:', err);
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const getOverallAttendance = () => {
    const values = Object.values(attendanceSummaries);
    if (values.length === 0) return '—';
    const validValues = values.filter(v => v.attendance_percentage !== null && v.attendance_percentage !== undefined);
    if (validValues.length === 0) return '—';
    const sum = validValues.reduce((acc, curr) => acc + parseFloat(curr.attendance_percentage || 0), 0);
    return `${(sum / validValues.length).toFixed(1)}%`;
  };

  const getOverallAttendancePct = () => {
    const values = Object.values(attendanceSummaries);
    if (values.length === 0) return 0;
    const validValues = values.filter(v => v.attendance_percentage !== null && v.attendance_percentage !== undefined);
    if (validValues.length === 0) return 0;
    const sum = validValues.reduce((acc, curr) => acc + parseFloat(curr.attendance_percentage || 0), 0);
    return sum / validValues.length;
  };

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
        {user?.role === 'student' ? (
          <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div className="stat-value" style={{ color: '#10b981' }}>{getOverallAttendance()}</div>
              <div className="stat-label">Overall Attendance</div>
            </div>
            {getOverallAttendancePct() > 0 && (
              <svg width="50" height="50" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="24" fill="none" stroke="var(--border)" strokeWidth="5" />
                <circle 
                  cx="30" cy="30" r="24" fill="none" 
                  stroke={getOverallAttendancePct() >= 80 ? 'var(--success)' : getOverallAttendancePct() >= 60 ? 'var(--warning)' : 'var(--danger)'} 
                  strokeWidth="5" 
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - getOverallAttendancePct() / 100)}`}
                  className="progress-ring-circle"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
        ) : (
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#10b981' }}>—</div>
            <div className="stat-label">Active today</div>
          </div>
        )}
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
              {user?.role === 'student' && attendanceSummaries[cls.id] && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 13 }}>
                    <span className="text-mute">Attendance:</span>
                    <span style={{ fontWeight: 600, color: 
                      parseFloat(attendanceSummaries[cls.id].attendance_percentage || 0) >= 80 ? 'var(--success)' : 
                      parseFloat(attendanceSummaries[cls.id].attendance_percentage || 0) >= 60 ? 'var(--warning)' : 'var(--danger)'
                    }}>
                      {attendanceSummaries[cls.id].attendance_percentage !== null ? `${attendanceSummaries[cls.id].attendance_percentage}%` : 'No records'}
                    </span>
                  </div>
                  {attendanceSummaries[cls.id].attendance_percentage !== null && (
                    <div style={{ width: '100%', height: 6, background: 'var(--surface-3)', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${attendanceSummaries[cls.id].attendance_percentage}%`, 
                        height: '100%', 
                        background: 
                          parseFloat(attendanceSummaries[cls.id].attendance_percentage || 0) >= 80 ? 'var(--success)' : 
                          parseFloat(attendanceSummaries[cls.id].attendance_percentage || 0) >= 60 ? 'var(--warning)' : 'var(--danger)',
                        borderRadius: 10,
                        transition: 'width 0.5s ease-in-out'
                      }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
