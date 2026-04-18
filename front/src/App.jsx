import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import Wowzers from './pages/Wowzers';
import WrongInfoPage from './pages/WrongInfoPage';
import DashboardShell from './pages/DashboardShell';
import { useAuth } from './context/AuthContext';
import './App.css';
import { ResetPassword } from './pages/ResetPassword';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading-screen">Loading...</div>;

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    // Admin should always go to dashboard even if must_change_password is set in backend
    if (user.role === 'ADMIN') {
      return <Navigate to="/dashboard" replace />;
    }

    if (user.must_change_password) {
      return <Navigate to="/ResetPassword" replace />;
    }

    return <Navigate to="/home" replace />;
  }

  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Login is Public: If already logged in, redirect to dashboard */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />

      {/* Dashboard is Protected: If not logged in, redirect to login */}
          <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ 'ADMIN' ]}>
            <DashboardShell />
          </ProtectedRoute>
        }
      />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Wowzers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ResetPassword"
        element={
          <ProtectedRoute>
            <ResetPassword />
          </ProtectedRoute>
        }
      />
      <Route path="/wow" element={<Wowzers />} />
      <Route path="/dumbahh" element={<WrongInfoPage />} />

      {/* Catch-all: Redirect unknown URLs to home/dashboard based on authentication */}
      <Route path="*" element={<ProtectedRoute><Navigate to="/home" replace /></ProtectedRoute>} />
    </Routes>
  );
}