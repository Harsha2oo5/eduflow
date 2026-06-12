import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ClassesPage from './pages/ClassesPage';
import MaterialsPage from './pages/MaterialsPage';
import AttendancePage from './pages/AttendancePage';
import MarksPage from './pages/MarksPage';
import './index.css';

// Protected route wrapper
// If not logged in → redirect to /login
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

// Teacher-only route wrapper
const TeacherRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'teacher') return <Navigate to="/dashboard" replace />;
  return children;
};

// App shell with sidebar
const AppLayout = ({ children }) => (
  <div className="app-shell">
    <Sidebar />
    <main className="main-content">{children}</main>
  </div>
);

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <AuthPage />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/classes" element={
        <ProtectedRoute>
          <AppLayout><ClassesPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/materials" element={
        <ProtectedRoute>
          <AppLayout><MaterialsPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/attendance" element={
        <TeacherRoute>
          <AppLayout><AttendancePage /></AppLayout>
        </TeacherRoute>
      } />

      <Route path="/marks" element={
        <TeacherRoute>
          <AppLayout><MarksPage /></AppLayout>
        </TeacherRoute>
      } />

      <Route path="/my-marks" element={
        <ProtectedRoute>
          <AppLayout><MarksPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
