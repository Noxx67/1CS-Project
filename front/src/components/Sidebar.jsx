import './Sidebar.css';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { id: 'dashboard', icon: '\u25A6', label: 'Dashboard' },
  { id: 'users', icon: '\u{1F465}', label: 'Users Management' },
  { id: 'schedules', icon: '\u{1F4C5}', label: 'Schedules' },
  { id: 'activity', icon: '\u{1F570}', label: 'Activity Logs' },
  { id: 'settings', icon: '\u2699', label: 'System Settings' },
];

export default function Sidebar({ activePage, onNavigate }) {

  const { user, logout } = useAuth();


  const handleLogout = () => {
    logout();
  }

  const allowedNavItems = user?.role === 'ADMIN'
    ? navItems
    : navItems.filter((item) => item.id !== 'users' && item.id !== 'activity' && item.id !== 'settings');

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
          <img src="../../public/images/logo.png" className="logo-icon" />
        <div className="logo-text">
          <span className="logo-title">ESI SBA</span>
          <span className="logo-subtitle">ABSENCE PORTAL</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {allowedNavItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${activePage === item.id ? 'nav-item--active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Patrick"
            alt="Dr. Patrick B."
          />
        </div>
        <div className="user-info">
          <span className="user-name">{user ? `${user.first_name} ${user.last_name}` : "Guest"}</span>
          <span className="user-role">{user?.role || "User"}</span>
        </div>
        <button type="button" className="logout-btn" title="Logout" aria-label="Logout" onClick={handleLogout}>
          {'\u21E5'}
        </button>
      </div>
    </aside>
  );
}
