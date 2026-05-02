import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getRoleHomePath, shouldForcePasswordReset } from '../../utils/authRedirects.js';
import AppLoadingScreen from '../AppLoadingScreen.jsx';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AppLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (shouldForcePasswordReset(user) && location.pathname !== '/ResetPassword') {
    return <Navigate to="/ResetPassword" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHomePath(user)} replace />;
  }

  return children;
}
