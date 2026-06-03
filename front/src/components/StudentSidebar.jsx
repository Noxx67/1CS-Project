import React from 'react';
import styles from './StudentSidebar.module.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Icons as SVG components
function LayoutDashboard({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
    )
}

function FileText({ className }) {
    return (
        <img
            src="/Icons/absence.png"
            className={className}
            width="24"
            height="24"
            alt="absence icon"
            style={{ filter: 'brightness(0) invert(1)' }}
        />
    )
}

function FileCheck({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <polyline points="9 15 11 17 15 12"></polyline>
        </svg>
    );
}

function Settings({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
        </svg>
    )
}

function LogOut({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    )
}

function Image({ src, alt, width, height, className }) {
    if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
        return <img src={src} alt={alt} width={width} height={height} className={className} />
    }
    return <img src={src} alt={alt} width={width} height={height} className={className} />
}

export default function StudentSidebar({ activePage }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.name || "Student";
    let displayPhoto = user?.profile_picture || "/Icons/studentPicture.png";
    if (typeof displayPhoto === 'string' && displayPhoto.startsWith('/media/')) {
        displayPhoto = `http://127.0.0.1:8000${displayPhoto}`;
    }

    const navItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: "Dashboard", path: "/DashboardStudent" },
        { id: 'absences', icon: FileText, label: "Absences", path: "/StudentAbsencePage" },
        { id: 'justifications', icon: FileCheck, label: "Justifications", path: "/Justification" },
    ];

    const handleNavigation = (e, path) => {
        e.preventDefault();
        navigate(path);
    };

    return (
        <aside className={styles["sidebar"]}>
            <div className={styles["sidebar-logo"]}>
                <div className={styles["logo-circle"]}>
                    <Image
                        src="/images/logo.png"
                        alt="ESI SBA Logo"
                        width={32}
                        height={32}
                        className={styles["logo-image"]}
                    />
                </div>
                <div>
                    <h1 className={styles["logo-title"]}>ESI SBA</h1>
                    <p className={styles["logo-subtitle"]}>Absence Portal</p>
                </div>
            </div>

            <nav className={styles["sidebar-nav"]}>
                {navItems.map((item) => (
                    <a
                        key={item.id}
                        href={item.path}
                        onClick={(e) => handleNavigation(e, item.path)}
                        className={`${styles["nav-item"]} ${activePage === item.id ? styles["nav-item-active"] : ""}`}
                    >
                        <item.icon className={styles["nav-icon"]} />
                        <span className={styles["nav-label"]}>{item.label}</span>
                    </a>
                ))}
            </nav>

            <div className={styles["sidebar-settings"]}>
                <a 
                    href="/StudentProfile" 
                    onClick={(e) => handleNavigation(e, '/StudentProfile')}
                    className={`${styles["setting-item"]} ${activePage === 'settings' ? styles["nav-item-active"] : ""}`}
                >
                    <Settings className={styles["nav-icon"]} />
                    <span className={styles["settingtext"]}>System Settings</span>
                </a>
                <button onClick={user?.logout} className={styles["setting-item"]}>
                    <LogOut className={styles["nav-icon"]} />
                    <span className={styles["settingtext"]}>Logout</span>
                </button>
            </div>

            <div className={styles["sidebar-profile"]}>
                <div className={styles["profile-avatar"]}>
                    <Image
                        src={displayPhoto}
                        alt={fullName}
                        width={40}
                        height={40}
                        className={styles["avatar-image"]}
                    />
                </div>
                <div>
                    <p className={styles["profile-name"]}>{fullName}</p>
                    <p className={styles["profile-role"]}>Student</p>
                </div>
            </div>
        </aside>
    );
}
