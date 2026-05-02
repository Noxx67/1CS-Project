import React, { useState, useEffect } from 'react';
import styles from './StudentProfile.module.css';
import { useAuth } from '../context/AuthContext';

export default function StudentProfile() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        lastName: user?.last_name || user?.lastName || '',
        firstName: user?.first_name || user?.firstName || '',
        studentId: user?.registration_number || '',
        email: user?.email || '',
        major: user?.speciality || 'N/A',
        level: user?.promotion || 'Student',
        academicYear: user?.year || 'N/A',
        currentPassword: '••••••••',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                lastName: user?.last_name || user?.lastName || '',
                firstName: user?.first_name || user?.firstName || '',
                studentId: user?.registration_number || '',
                email: user?.email || '',
                major: user?.speciality || 'N/A',
                level: user?.promotion || 'Student',
                academicYear: user?.year || 'N/A',
            }));
        }
    }, [user]);

    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className={styles["app-container"]}>
            {/* Sidebar */}
            <aside className={styles["sidebar"]}>
                <div className={styles["sidebar-header"]}>
                    <div className={styles["logo"]}>
                        <div className={styles["logo-icon"]}>
                            <img src="/images/logo.png" alt="ESI SBA" className={styles["logo-img"]} />
                        </div>
                        <div className={styles["logo-text"]}>
                            <span className={styles["logo-title"]}>ESI SBA</span>
                            <span className={styles["logo-subtitle"]}>ABSENCE PORTAL</span>
                        </div>
                    </div>
                </div>

                <nav className={styles["sidebar-nav"]}>
                    <a href="/DashboardStudent" className={styles["nav-item"]}>
                        <svg className={styles["nav-icon"]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                        </svg>
                        <span>Dashboard</span>
                    </a>
                    <a href="/StudentAbsencePage" className={`${styles["nav-item"]} ${styles["active"]}`}>
                        <svg className={styles["nav-icon"]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>Absences</span>
                    </a>
                    <div className={styles["nav-submenu"]}>
                        <a href="/Justification" className={styles["nav-subitem"]}>Justificatifs</a>

                    </div>
                    <a href="/Rattrapage" className={styles["nav-item"]}>
                        <img src="/Icons/rattrapageIcon.png" alt="" />
                        Rattrapages
                    </a>
                    <a href="#" className={styles["nav-item"]}>
                        <img src="/Icons/checkinIcon.png" alt="" />
                        <span>Check-in (Présence)</span>
                    </a>
                    <a href="#" className={styles["nav-item"]}>
                        <svg className={styles["nav-icon"]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <span>Notifications</span>
                        <span className={styles["notification-badge"]}>3</span>
                    </a>
                </nav>
                <a href="#" className={styles["settings"]}>
                    <svg className={styles["nav-icon"]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>System Settings</span>
                </a>
                <button onClick={user?.logout || (() => {})} className={styles["settings"]} style={{ border: "none", background: "none", cursor: "pointer", width: "100%", textAlign: "left", fontFamily: "inherit" }}>
                    <svg className={styles["nav-icon"]} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Logout</span>
                </button>
                <div className={styles["sidebar-footer"]}>


                    <div className={styles["user-profile"]}>
                        <div className={styles["user-avatar"]}>
                            <img src={user?.profile_picture || "/Icons/studentPicture.png"} alt={user?.name || "Student"} />
                        </div>
                        <div className={styles["user-info"]}>
                            <span className={styles["user-name"]}>{user?.name || "Student"}</span>
                            <span className={styles["user-role"]}>Student</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles["main-content"]}>
                <header className={styles["page-header"]}>
                    <div className={styles["page-title"]}>
                        <svg className={styles["title-icon"]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        <h1>Student Profile</h1>
                    </div>
                    <div className={styles["header-actions"]}>
                        <button className={styles["icon-btn"]}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </button>
                        <button className={styles["icon-btn"]}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    </div>
                </header>

                <div className={styles["content-area"]}>
                    {/* Profile Card */}
                    <div className={styles["profile-card"]}>
                        <div className={styles["profile-info"]}>
                            <div className={styles["avatar-container"]}>
                                <div className={styles["avatar"]}>
                                    <div className={styles["avatar-placeholder"]}></div>
                                </div>
                                <button className={styles["camera-btn"]}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                </button>
                            </div>
                            <div className={styles["profile-details"]}>
                                <h2 className={styles["profile-name"]}>{user?.first_name || user?.firstName} {user?.last_name || user?.lastName}</h2>
                                <p className={styles["profile-subtitle"]}>Student in {user?.promotion || 'Unknown'}</p>
                                <div className={styles["profile-badges"]}>
                                    <span className={`${styles["badge"]} ${styles["badge-id"]}`}>
                                        <img src="/Icons/Icon (10).png" alt="icon" />
                                        {user?.registration_number || 'N/A'}
                                    </span>
                                    <span className={`${styles["badge"]} ${styles["badge-status"]}`}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        Status: Regular
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button className={`${styles["btn"]} ${styles["btn-primary"]}`}>Save Changes</button>
                    </div>

                    <div className={styles["content-grid"]}>
                        {/* Personal Information */}
                        <div className={styles["info-card"]}>
                            <div className={styles["card-header"]}>
                                <div className={styles["card-title"]}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <h3>Personal Information</h3>
                                </div>
                                <button className={styles["edit-btn"]}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    Edit
                                </button>
                            </div>

                            <div className={styles["form-grid"]}>
                                <div className={styles["form-group"]}>
                                    <label>LAST NAME</label>
                                    <input type="text" value={formData.lastName} readOnly />
                                </div>
                                <div className={styles["form-group"]}>
                                    <label>FIRST NAME</label>
                                    <input type="text" value={formData.firstName} readOnly />
                                </div>
                                <div className={styles["form-group"]}>
                                    <label>STUDENT ID</label>
                                    <input type="text" value={formData.studentId} readOnly />
                                </div>
                                <div className={styles["form-group"]}>
                                    <label>INSTITUTIONAL EMAIL</label>
                                    <input type="email" value={formData.email} readOnly />
                                </div>
                                <div className={styles["form-group"]}>
                                    <label>MAJOR</label>
                                    <input type="text" value={formData.major} readOnly />
                                </div>
                                <div className={styles["form-group"]}>
                                    <label>LEVEL</label>
                                    <input type="text" value={formData.level} readOnly />
                                </div>
                                <div className={`${styles["form-group"]} ${styles["full-width"]}`}>
                                    <label>ACADEMIC YEAR</label>
                                    <input type="text" value={formData.academicYear} readOnly />
                                </div>
                            </div>

                            <div className={styles["admin-note"]}>
                                <div className={styles["note-icon"]}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                </div>
                                <div className={styles["note-content"]}>
                                    <h4>Administrative Note</h4>
                                    <p>Student ID and Academic Year fields are managed by the administration and cannot be modified directly.</p>
                                </div>
                            </div>
                        </div>

                        {/* Security */}
                        <div className={styles["security-card"]}>
                            <div className={styles["card-title"]}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <h3>Security</h3>
                            </div>

                            <p className={styles["security-desc"]}>Modify your password to maintain the security of your student account.</p>

                            <div className={styles["form-group"]}>
                                <label>CURRENT PASSWORD</label>
                                <div className={styles["password-input"]}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.currentPassword}
                                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                    />
                                    <button
                                        className={styles["toggle-password"]}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className={styles["form-group"]}>
                                <label>NEW PASSWORD</label>
                                <input
                                    type="password"
                                    placeholder="New password"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                />
                            </div>

                            <div className={styles["form-group"]}>
                                <label>CONFIRM NEW</label>
                                <input
                                    type="password"
                                    placeholder="Confirm new"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>

                            <button className={`${styles["btn"]} ${styles["btn-primary"]} ${styles["btn-full"]}`}>Update Password</button>
                            <p className={styles["last-update"]}>Last update: 3 months ago</p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className={styles["footer-actions"]}>
                        <button className={`${styles["btn"]} ${styles["btn-secondary"]}`}>Cancel</button>
                        <button className={`${styles["btn"]} ${styles["btn-primary"]}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                <polyline points="17 21 17 13 7 13 7 21" />
                                <polyline points="7 3 7 8 15 8" />
                            </svg>
                            Save all changes
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}