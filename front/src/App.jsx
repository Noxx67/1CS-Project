import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import Wowzers  from './pages/Wowzers'; // Ensure capitalization matches exactly!
import WrongInfoPage from './pages/WrongInfoPage';
import DashboardShell from './pages/DashboardShell';
import { useAuth } from './context/AuthContext';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading-screen">Loading...</div>;

  if (!user) {
    // Save the location they were trying to go to
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};  

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Login is Public: If I'm logged in, take me to dashboard instead */}
      <Route 
        path="/" 
        element={
          //<PublicRoute>
            <LoginPage />
          //</PublicRoute>
        } 
      />

      {/* Dashboard is Protected: If I'm NOT logged in, take me to login */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardShell />
          </ProtectedRoute>
        } 
      />

      {/* The Error Page (your /dumbahh route) */}
      <Route path="/dumbahh" element={<WrongInfoPage />} />

      {/* Catch-all: Redirect any weird URLs to the dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}