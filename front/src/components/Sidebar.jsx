import './Sidebar.css';
import { useAuth } from '../context/AuthContext';
import { useAppPreferences } from '../context/AppPreferencesContext';

const navItems = [
  { id: 'dashboard', icon: '\u25A6', labelKey: 'nav.dashboard' },
  { id: 'users', icon: '\u{1F465}', labelKey: 'nav.users' },
  { id: 'schedules', icon: '\u{1F4C5}', labelKey: 'nav.schedules' },
  { id: 'exams', icon: '\u{1F4DD}', labelKey: 'nav.exams' },
  { id: 'settings', icon: '\u2699', labelKey: 'nav.settings' },
];

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return parts[0]?.slice(0, 2).toUpperCase() || 'AD';
}

export default function Sidebar({ activePage, onNavigate }) {
  const { user, logout } = useAuth();
  const { adminDisplayName, adminPhotoUrl, t } = useAppPreferences();

  const handleLogout = () => {
    logout();
  };

  function getRoleLabel(role) {
    if (!role) {
      return t('sidebar.user');
    }

    return t(`roles.${String(role).toUpperCase()}`, role);
  }

  const allowedNavItems = user?.role === 'ADMIN'
    ? navItems
    : navItems.filter((item) => item.id !== 'users' && item.id !== 'activity' && item.id !== 'settings');
  const fallbackUserName = user
    ? user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim()
    : '';
  const displayUserName = adminDisplayName || fallbackUserName || t('sidebar.guest');
  const displayUserAlt = displayUserName || t('sidebar.guest');

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
          <img src="../../public/images/logo.png" className="logo-icon" />
        <div className="logo-text">
          <span className="logo-title">ESI SBA</span>
          <span className="logo-subtitle">{t('sidebar.portal')}</span>
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
            <span className="nav-label">{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar">
          {(() => {
            let photoUrl = adminPhotoUrl || user?.profile_picture || null;
            if (typeof photoUrl === 'string' && photoUrl.startsWith('/')) {
              photoUrl = `http://127.0.0.1:8000${photoUrl}`;
            }
            return photoUrl ? (
              <img
                src={photoUrl}
                alt={displayUserAlt}
              />
            ) : (
              <span className="user-avatar-fallback" aria-hidden="true">
                {getInitials(displayUserName)}
              </span>
            );
          })()}
        </div>
        <div className="user-info">
          <span className="user-name">{displayUserName}</span>
          <span className="user-role">{getRoleLabel(user?.role)}</span>
        </div>
        <button type="button" className="logout-btn" title={t('sidebar.logout')} aria-label={t('sidebar.logout')} onClick={handleLogout}>
          {'\u21E5'}
        </button>
      </div>
    </aside>
  );
}
