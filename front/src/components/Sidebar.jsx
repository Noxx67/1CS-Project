import './Sidebar.css';
import { useAuth } from '../context/AuthContext';
import { useAppPreferences } from '../context/AppPreferencesContext';

const navItems = [
  { id: 'dashboard', icon: '\u25A6', labelKey: 'nav.dashboard' },
  { id: 'users', icon: '\u{1F465}', labelKey: 'nav.users' },
  { id: 'schedules', icon: '\u{1F4C5}', labelKey: 'nav.schedules' },
  { id: 'activity', icon: '\u{1F570}', labelKey: 'nav.activity' },
  { id: 'settings', icon: '\u2699', labelKey: 'nav.settings' },
];

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
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
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
          {adminPhotoUrl ? (
            <img
              src={adminPhotoUrl}
              alt={displayUserAlt}
            />
          ) : (
            <span className="user-avatar-fallback" aria-hidden="true">
              {'\u{1F464}'}
            </span>
          )}
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
