import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import api from '../utils/api';

export default function AttendancePage() {
  const { showToast, Toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { studentId: 'present'|'absent'|'late' }
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/classes').then(res => {
      setClasses(res.data);
      if (res.data.length > 0) setSelectedClass(res.data[0]);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    api.get(`/classes/${selectedClass.id}`).then(res => {
      setStudents(res.data.students || []);
      // Default everyone to present
      const defaults = {};
      (res.data.students || []).forEach(s => defaults[s.id] = 'present');
      setAttendance(defaults);
    });
  }, [selectedClass]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId: parseInt(studentId), status
      }));
      await api.post('/attendance', { classId: selectedClass.id, date, records });
      showToast('Attendance saved!');
    } catch (err) {
      showToast('Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const statusColor = { present: 'badge-green', absent: 'badge-red', late: 'badge-yellow' };

  return (
    <div>
      {Toast}
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <div className="page-subtitle">Mark and track student attendance</div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !selectedClass}>
          {saving ? 'Saving...' : 'Save attendance'}
        </button>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
          <label className="form-label">Class</label>
          <select className="form-input form-select"
            value={selectedClass?.id || ''}
            onChange={e => setSelectedClass(classes.find(c => c.id === parseInt(e.target.value)))}>
            {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: 180 }}>
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div style={{ paddingTop: 20 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => {
            const all = {};
            students.forEach(s => all[s.id] = 'present');
            setAttendance(all);
          }}>All present</button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <p>No students in this class yet.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Quick set</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => (
                  <tr key={student.id}>
                    <td style={{ color: 'var(--ink-mute)' }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{student.name}</div>
                      <div className="text-mute">{student.email}</div>
                    </td>
                    <td>
                      <span className={`badge ${statusColor[attendance[student.id]] || 'badge-blue'}`}>
                        {attendance[student.id] || 'present'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {['present', 'absent', 'late'].map(s => (
                          <button
                            key={s}
                            className={`btn btn-sm ${attendance[student.id] === s ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setAttendance({ ...attendance, [student.id]: s })}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            {['present', 'absent', 'late'].map(s => {
              const count = Object.values(attendance).filter(v => v === s).length;
              return (
                <div key={s}>
                  <span className={`badge ${statusColor[s]}`}>{count} {s}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
