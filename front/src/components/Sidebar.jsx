import './Sidebar.css';

const navItems = [
  { id: 'dashboard', icon: '\u25A6', label: 'Dashboard' },
  { id: 'users', icon: '\u{1F465}', label: 'Users Management' },
  { id: 'schedules', icon: '\u{1F4C5}', label: 'Schedules' },
  { id: 'activity', icon: '\u{1F570}', label: 'Activity Logs' },
  { id: 'settings', icon: '\u2699', label: 'System Settings' },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <span>{'\u{1F393}'}</span>
        </div>
        <div className="logo-text">
          <span className="logo-title">ESI SBA</span>
          <span className="logo-subtitle">ABSENCE PORTAL</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => (
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
          <span className="user-name">Dr. Patrick B.</span>
          <span className="user-role">System Administrator</span>
        </div>
        <button type="button" className="logout-btn" title="Logout" aria-label="Logout">
          {'\u21E5'}
        </button>
      </div>
    </aside>
  );
}
