import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppPreferences } from '../context/AppPreferencesContext';
import styles from './ScolariteSidebar.module.css';

const navItems = [
  {
    to: '/scolarite/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="6.5" height="6.5" rx="1.4" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" />
      </svg>
    ),
  },
  {
    to: '/scolarite/today-absences',
    label: "Today's Absences",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5l14 14" />
        <path d="M7.5 5.5h8.6a2.4 2.4 0 0 1 2.4 2.4v8.6" />
        <path d="M16.5 19H7.9a2.4 2.4 0 0 1-2.4-2.4V8" />
      </svg>
    ),
  },
  {
    to: '/scolarite/supporting-documents',
    label: 'Justification',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 7.5h5.2l1.6 2h8.2v7.8a2.2 2.2 0 0 1-2.2 2.2H6.7a2.2 2.2 0 0 1-2.2-2.2V7.5Z" />
        <path d="M4.5 7.5V6.8a2.2 2.2 0 0 1 2.2-2.2h2.6l1.6 2h6.4a2.2 2.2 0 0 1 2.2 2.2v.7" />
      </svg>
    ),
  },
  {
    to: '/scolarite/makeup-sessions',
    label: 'Makeup Sessions',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="15" rx="2.3" />
        <path d="M8 3.5v4M16 3.5v4M4 10h16M15.8 14.2h-3.6v3.6" />
        <path d="M12.3 17.6a3.2 3.2 0 1 0 .5-4" />
      </svg>
    ),
  },
  {
    to: '/scolarite/students',
    label: 'Students',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <path d="M3.8 18.5a5.2 5.2 0 0 1 10.4 0" />
        <circle cx="17.2" cy="9.2" r="2.2" />
        <path d="M15.2 17.8a4.2 4.2 0 0 1 5-1.9" />
      </svg>
    ),
  },
  {
    to: '/scolarite/schedule-exams',
    label: 'Schedule & Exams',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4.5" y="5" width="15" height="15" rx="2" />
        <path d="M8 3.5v3M16 3.5v3M4.5 9.5h15M8 13h3M8 16h6" />
      </svg>
    ),
  },
  {
    to: '/scolarite/import-export',
    label: 'Import / Export CSV',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4v10" />
        <path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
        <path d="M5 18.5h14" />
      </svg>
    ),
  },
];

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return parts[0]?.slice(0, 2).toUpperCase() || 'AO';
}

export default function ScolariteSidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useAppPreferences();
  const displayName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Academic Office Admin';
  const roleLabel = t(`roles.${String(user?.role || '').toUpperCase()}`, user?.role || 'Scolarite');
  const avatarLabel = displayName || 'Academic Office Admin';

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <img src="/images/logo.png" alt="ESI SBA" className={styles.logo} />
        <div className={styles.brandText}>
          <span className={styles.brandTitle}>ESI SBA</span>
          <span className={styles.brandSubtitle}>Absence Portal</span>
        </div>
      </div>

      <nav className={styles.nav} aria-label="Scolarite navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.profileCard}>
        <div className={styles.profileAvatar} aria-hidden="true">
          {getInitials(displayName)}
        </div>
        <div className={styles.profileMeta}>
          <span className={styles.profileName}>{avatarLabel}</span>
          <span className={styles.profileRole}>{roleLabel}</span>
        </div>
        <button
          type="button"
          className={styles.logoutButton}
          onClick={handleLogout}
          aria-label="Log out"
          title="Log out"
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
