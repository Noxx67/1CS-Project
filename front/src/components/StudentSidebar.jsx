import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './StudentSidebar.module.css';

// SVG Icons
function LayoutDashboard({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

function FileText({ className }) {
  return (
    <img
      src="/Icons/absence.png"
      className={className}
      width="24"
      height="24"
      alt="absence icon"
    />
  );
}

function FileCheck({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function RotateCcw({ className }) {
  return (
    <img
      src="/Icons/rattrapageIcon.png"
      className={className}
      width="24"
      height="24"
      alt="rattrapage icon"
    />
  );
}

function Settings({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function LogOut({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", paths: ["/DashboardStudent"] },
  { icon: FileText, label: "Absences", paths: ["/StudentAbsencePage"] },
  { icon: FileCheck, label: "Justificatifs", paths: ["/Justification", "/NewJustification"] },
  { icon: RotateCcw, label: "Rattrapages", paths: ["/Rattrapage"] },
];

export default function StudentSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (e, path) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoSection} onClick={() => navigate('/DashboardStudent')} style={{ cursor: 'pointer' }}>
        <div className={styles.logoCircle}>
          <img
            src="/images/logo.png"
            alt="ESI SBA Logo"
            width={32}
            height={32}
            className={styles.logoImage}
          />
        </div>
        <div>
          <h1 className={styles.logoTitle}>ESI SBA</h1>
          <p className={styles.logoSubtitle}>Absence Portal</p>
        </div>
      </div>

      <nav className={styles.sidebarNav}>
        {navItems.map((item, index) => {
          const isActive = item.paths.some(path => location.pathname.toLowerCase() === path.toLowerCase());
          return (
            <a
              key={index}
              href={item.paths[0]}
              onClick={(e) => handleNavClick(e, item.paths[0])}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <item.icon className={styles.navIcon} />
              <span className={styles.navLabel}>{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div className={styles.sidebarSettings}>
        <a href="/StudentProfile" onClick={(e) => handleNavClick(e, '/StudentProfile')} className={`${styles.settingItem} ${location.pathname.toLowerCase() === '/studentprofile' ? styles.navItemActive : ''}`}>
          <Settings className={styles.navIcon} />
          <span className={styles.settingText}>Profile Settings</span>
        </a>
        <button onClick={logout} className={styles.settingItem} style={{ border: "none", background: "none", cursor: "pointer", width: "100%", textAlign: "left", fontFamily: "inherit" }}>
          <LogOut className={styles.navIcon} />
          <span className={styles.settingText}>Logout</span>
        </button>
      </div>

      <div className={styles.sidebarProfile} onClick={() => navigate('/StudentProfile')} style={{ cursor: 'pointer' }}>
        <div className={styles.profileAvatar}>
          <img
            src={user?.profile_picture || "/Icons/studentPicture.png"}
            alt={user?.name || "Student"}
            className={styles.avatarImage}
          />
        </div>
        <div>
          <p className={styles.profileName}>{user?.name || "Student"}</p>
          <p className={styles.profileRole}>Student</p>
        </div>
      </div>
    </aside>
  );
}
