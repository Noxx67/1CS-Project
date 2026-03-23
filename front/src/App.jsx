import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import Wowzers  from './pages/Wowzers'; // Ensure capitalization matches exactly!
import WrongInfoPage from './pages/WrongInfoPage';
import DashboardShell from './pages/DashboardShell';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardShell />} />
      <Route path="/wow" element={<Wowzers />} />
      <Route path="/dumbahh" element={<WrongInfoPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}