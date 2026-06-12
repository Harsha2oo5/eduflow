import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const teacherNav = [
  { icon: '⊞', label: 'Dashboard', path: '/dashboard' },
  { icon: '🎓', label: 'My Classes', path: '/classes' },
  { icon: '✓', label: 'Attendance', path: '/attendance' },
  { icon: '📊', label: 'Marks', path: '/marks' },
  { icon: '📄', label: 'Materials', path: '/materials' },
];

const studentNav = [
  { icon: '⊞', label: 'Dashboard', path: '/dashboard' },
  { icon: '🎓', label: 'My Classes', path: '/classes' },
  { icon: '📄', label: 'Study Materials', path: '/materials' },
  { icon: '📝', label: 'My Marks', path: '/my-marks' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navItems = user?.role === 'teacher' ? teacherNav : studentNav;

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="wordmark">EduFlow</div>
        <div className="role-badge">{user?.role}</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 4px' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
            {user?.name}
          </div>
          <button 
            onClick={toggleTheme} 
            style={{ 
              background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', 
              borderRadius: '50%', width: 28, height: 28, display: 'flex', 
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13 
            }}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
        <button className="nav-item" onClick={logout} style={{ color: '#f87171' }}>
          <span className="icon">→</span> Sign out
        </button>
      </div>
    </div>
  );
}
