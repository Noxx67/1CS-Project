import React, { useState } from "react";
import styles from "./Rattrapage.module.css";
import { useAuth } from "../context/AuthContext";


export default function Rattrapages() {
    const { user, logout } = useAuth();
    const [viewMode, setViewMode] = useState("list");

    const availableMakeups = [
        {
            id: 1,
            module: "Computer Architecture",
            date: "Monday May 24, 2024",
            time: "10:30 - 12:30",
            room: "Lab 04 (Bldg. C)",
            instructor: "Dr. Belhadj",
            status: "Pending",
        },
        {
            id: 2,
            module: "Graph Theory",
            date: "Wednesday May 26, 2024",
            time: "13:00 - 15:00",
            room: "Amphi E",
            instructor: "Mrs. Mansouri",
            status: "Pending",
        },
    ];

    const confirmedMakeups = [
        {
            id: 1,
            module: "Numerical Analysis",
            instructor: "Dr. Kessous",
            time: "08:30 - 10:00",
            location: "Room 12",
            month: "MAY",
            day: "22",
            status: "Confirmed",
        },
        {
            id: 2,
            module: "Information Systems",
            instructor: "Prof. Amrani",
            time: "14:00 - 16:00",
            location: "IS Lab",
            month: "MAY",
            day: "20",
            status: "Confirmed",
        },
        {
            id: 3,
            module: "Algebra 2",
            instructor: "Dr. Zeghbib",
            time: "08:30 - 10:30",
            location: "Room 01",
            month: "MAY",
            day: "15",
            status: "Completed",
        },
    ];

    return (
        <div className={styles["layout"]}>
            {/* Sidebar */}
            <aside className={styles["sidebar"]}>
                <div className={styles["sidebar-content"]}>
                    <div className={styles["logo"]}>
                        <div className={styles["logo-icon"]}>
                            <img src="/images/logo.png" alt="ESI SBA" width={40} height={40} />
                        </div>
                        <div className={styles["logo-text"]}>
                            <span className={styles["logo-title"]}>ESI SBA</span>
                            <span className={styles["logo-subtitle"]}>ABSENCE PORTAL</span>
                        </div>
                    </div>

                    <nav className={styles["nav-menu"]}>
                        <a href="/DashboardStudent" className={styles["nav-item"]}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                            </svg>
                            <span>Dashboard</span>
                        </a>

                        <a href="/StudentAbsencePage" className={`${styles["nav-item"]} ${styles["active"]}`}>
                            <img src="/Icons/absence.png" alt="absence icon" />
                            <span>Absences</span>
                        </a>

                        <a href="/NewJustification" className={`${styles["nav-item"]} ${styles["nav-subitem"]}`}>
                            <span>Justificatifs</span>
                        </a>

                        <a href="/Rattrapage" className={`${styles["nav-item"]} ${styles["active-subitem"]}`}>
                            <img src="/Icons/rattrapageIcon.png" alt="rattrapage-icon" />
                            <span>Rattrapages</span>
                        </a>

                        <a href="/Check-in" className={styles["nav-item"]}>
                            <img src="/Icons/checkinIcon.png" alt="checkin icon" />
                            <span>Check-in (Présence)</span>
                        </a>

                        <a href="/Notifications" className={styles["nav-item"]}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            <span>Notifications</span>
                            <span className={styles["nav-badge"]}>3</span>
                        </a>
                    </nav>
                </div>
                <div className={styles["sidebar-setting"]}>
                    <a href="/SystemSettings" className={styles["nav-item"]}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        <span className={styles["settingtext"]}>System Settings</span>
                    </a>
                    <button onClick={user?.logout || (() => {})} className={styles["nav-item"]} style={{ border: "none", background: "none", cursor: "pointer", width: "100%", textAlign: "left", fontFamily: "inherit" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span className={styles["settingtext"]}>Logout</span>
                    </button>
                </div>
                <div className={styles["user-profile"]}>
                    <div className={styles["user-avatar"]}>
                        <img src={user?.profile_picture || "/Icons/studentPicture.png"} alt={user?.name || "Student"} />
                    </div>
                    <div className={styles["user-info"]}>
                        <span className={styles["user-name"]}>{user?.name || "Student"}</span>
                        <span className={styles["user-role"]}>Student</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles["main-content"]}>
                {/* Header */}
                <header className={styles["header"]}>
                    <h1 className={styles["page-title"]}>Makeup Sessions</h1>
                    <div className={styles["header-actions"]}>
                        <div className={styles["view-toggle"]}>
                            <button
                                className={`${styles["toggle-btn"]} ${viewMode === "list" ? styles["active"] : ""}`}
                                onClick={() => setViewMode("list")}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="8" y1="6" x2="21" y2="6" />
                                    <line x1="8" y1="12" x2="21" y2="12" />
                                    <line x1="8" y1="18" x2="21" y2="18" />
                                    <line x1="3" y1="6" x2="3.01" y2="6" />
                                    <line x1="3" y1="12" x2="3.01" y2="12" />
                                    <line x1="3" y1="18" x2="3.01" y2="18" />
                                </svg>
                                List
                            </button>
                            <button
                                className={`${styles["toggle-btn"]} ${viewMode === "calendar" ? styles["active"] : ""}`}
                                onClick={() => setViewMode("calendar")}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                Calendar
                            </button>
                        </div>
                        <button className={styles["notification-btn"]}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            <span className={styles["notification-dot"]}></span>
                        </button>
                        <button className={styles["logout-btn"]} onClick={logout}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16,17 21,12 16,7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className={styles["content"]}>
                    {/* Info Banner */}
                    <div className={styles["info-banner"]}>
                        <div className={styles["info-text"]}>
                            <h2>Makeup Sessions Management</h2>
                            <p>Confirm your attendance for available sessions or check your updated schedule.</p>
                        </div>
                        <div className={styles["next-makeup-card"]}>
                            <span className={styles["next-label"]}>Next Makeup</span>
                            <span className={styles["next-time"]}>Tomorrow, 08:30</span>
                            <span className={styles["next-details"]}>Algorithms II • Amphi A</span>
                        </div>
                    </div>

                    {/* Available Makeups */}
                    <section className={styles["section"]}>
                        <div className={styles["section-header"]}>
                            <h3 className={styles["section-title"]}>
                                <span className={styles["title-indicator"]}></span>
                                Available Makeups
                            </h3>
                            <span className={styles["new-badge"]}>3 New</span>
                        </div>

                        <div className={styles["makeups-grid"]}>
                            {availableMakeups.map((makeup) => (
                                <div key={makeup.id} className={styles["makeup-card"]}>
                                    <div className={styles["card-header"]}>
                                        <span className={styles["module-label"]}>MODULE</span>
                                        <span className={`${styles["status-badge"]} ${styles["pending"]}`}>{makeup.status}</span>
                                    </div>
                                    <h4 className={styles["module-name"]}>{makeup.module}</h4>

                                    <div className={styles["card-details"]}>
                                        <div className={styles["detail-row"]}>
                                            <div className={styles["detail-item"]}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                    <line x1="16" y1="2" x2="16" y2="6" />
                                                    <line x1="8" y1="2" x2="8" y2="6" />
                                                    <line x1="3" y1="10" x2="21" y2="10" />
                                                </svg>
                                                <div>
                                                    <span className={styles["detail-label"]}>DATE</span>
                                                    <span className={styles["detail-value"]}>{makeup.date}</span>
                                                </div>
                                            </div>
                                            <div className={styles["detail-item"]}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12,6 12,12 16,14" />
                                                </svg>
                                                <div>
                                                    <span className={styles["detail-label"]}>TIME</span>
                                                    <span className={styles["detail-value"]}>{makeup.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles["detail-row"]}>
                                            <div className={styles["detail-item"]}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                                    <polyline points="9,22 9,12 15,12 15,22" />
                                                </svg>
                                                <div>
                                                    <span className={styles["detail-label"]}>ROOM</span>
                                                    <span className={styles["detail-value"]}>{makeup.room}</span>
                                                </div>
                                            </div>
                                            <div className={styles["detail-item"]}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                    <circle cx="12" cy="7" r="4" />
                                                </svg>
                                                <div>
                                                    <span className={styles["detail-label"]}>INSTRUCTOR</span>
                                                    <span className={styles["detail-value"]}>{makeup.instructor}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles["card-actions"]}>
                                        <button className={styles["confirm-btn"]}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20,6 9,17 4,12" />
                                            </svg>
                                            Confirm
                                        </button>
                                        <button className={styles["info-btn"]}>
                                            <img src="/Icons/Icon (9).png" alt="" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Confirmed Makeups */}
                    <section className={styles["section"]}>
                        <div className={styles["section-header"]}>
                            <h3 className={styles["section-title"]}>
                                <span className={styles["title-indicator2"]}></span>
                                Confirmed Makeups
                            </h3>
                            <a href="#" className={styles["history-link"]}>Recent history</a>
                        </div>

                        <div className={styles["confirmed-list"]}>
                            {confirmedMakeups.map((makeup) => (
                                <div key={makeup.id} className={`${styles["confirmed-item"]} ${makeup.status === "Completed" ? styles["completed"] : ""}`}>
                                    <div className={styles["date-badge"]}>
                                        <span className={styles["date-month"]}>{makeup.month}</span>
                                        <span className={styles["date-day"]}>{makeup.day}</span>
                                    </div>
                                    <div className={styles["confirmed-info"]}>
                                        <h4 className={styles["confirmed-module"]}>{makeup.module}</h4>
                                        <span className={styles["confirmed-details"]}>
                                            {makeup.instructor} • {makeup.time}
                                        </span>
                                    </div>
                                    <div className={styles["confirmed-location"]}>
                                        <span className={styles["location-label"]}>LOCATION</span>
                                        <span className={styles["location-value"]}>{makeup.location}</span>
                                    </div>
                                    <span className={`${styles["confirmed-status"]} ${styles[makeup.status.toLowerCase()]}`}>
                                        {makeup.status === "Confirmed" && (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20,6 9,17 4,12" />
                                            </svg>
                                        )}
                                        {makeup.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}