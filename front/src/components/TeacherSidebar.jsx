import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppPreferences } from '../context/AppPreferencesContext';
import styles from './TeacherSidebar.module.css';

const navItems = [
  {
    to: '/teacher/dashboard',
    labelKey: 'nav.dashboard',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
      </svg>
    ),
  },
  {
    to: '/teacher/attendance',
    labelKey: 'teacherSidebar.attendance',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 5.5h9a3 3 0 0 1 3 3V18.5H9a3 3 0 0 1-3-3v-10Z" />
        <path d="M6 10.5h12" />
        <circle cx="16.5" cy="15.5" r="2.5" />
      </svg>
    ),
  },
  {
    to: '/teacher/sessions',
    labelKey: 'teacherSidebar.sessions',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="15" rx="2.6" />
        <path d="M8 3.5v4M16 3.5v4M4 10h16" />
      </svg>
    ),
  },
  {
    to: '/teacher/exams',
    labelKey: 'teacherSidebar.exams',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 4.5h6l3.5 3.5v11.5H8a2.5 2.5 0 0 1-2.5-2.5v-10A2.5 2.5 0 0 1 8 4.5Z" />
        <path d="M13.5 4.8V8.5H17" />
        <path d="M9 13h6M9 16h4" />
      </svg>
    ),
  },
];

function getInitials(fullName) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const firstLetter = parts[0]?.charAt(0) || '';
  const secondLetter = parts[1]?.charAt(0) || '';
  return `${firstLetter}${secondLetter}`.toUpperCase() || 'T';
}

export default function TeacherSidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { teacherDisplayName, teacherPhotoUrl, t } = useAppPreferences();
  const fallbackDisplayName = `${user?.first_name || ''} ${user?.middle_name || ''} ${user?.last_name || ''}`.trim();
  const displayName = teacherDisplayName || fallbackDisplayName || t('teacherSettings.teacherFallbackName');
  let displayPhoto = teacherPhotoUrl || user?.profile_picture || '';
  if (typeof displayPhoto === 'string' && displayPhoto.startsWith('/')) {
    displayPhoto = `http://127.0.0.1:8000${displayPhoto}`;
  }
  const avatarLabel = displayName || t('teacherSettings.teacherFallbackName');

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <img src="/images/logo.png" alt="ESI SBA" className={styles.logo} />
        <div className={styles.brandText}>
          <span className={styles.title}>ESI SBA</span>
          <span className={styles.subtitle}>{t('teacherSidebar.portal')}</span>
        </div>
      </div>

      <nav className={styles.nav} aria-label={t('teacherSidebar.navigation')}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <NavLink
        to="/teacher/settings"
        className={({ isActive }) => `${styles.secondaryLink} ${isActive ? styles.secondaryLinkActive : ''}`}
      >
        <span className={styles.navIcon}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3.2" />
            <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
          </svg>
        </span>
        <span>{t('teacherSidebar.settings')}</span>
      </NavLink>

      <div className={styles.profileCard}>
        <div className={styles.profileAvatar}>
          {displayPhoto ? (
            <img src={displayPhoto} alt={avatarLabel} />
          ) : (
            <span>{getInitials(displayName)}</span>
          )}
        </div>
        <div className={styles.profileMeta}>
          <span className={styles.profileName}>{displayName}</span>
          <span className={styles.profileRole}>{t('teacherSidebar.role')}</span>
        </div>
        <button
          type="button"
          className={styles.logoutIconButton}
          onClick={handleLogout}
          aria-label={t('teacherSidebar.logout')}
          title={t('teacherSidebar.logout')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10.5 6.5H6.8A2.3 2.3 0 0 0 4.5 8.8v6.4a2.3 2.3 0 0 0 2.3 2.3h3.7" />
            <path d="M14 8.5l4 3.5-4 3.5" />
            <path d="M9.5 12H18" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
