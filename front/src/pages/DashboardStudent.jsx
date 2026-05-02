import React, { useState, useEffect } from 'react';
import styles from "./DashboardStudent.module.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
function DashboardIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    )
}

function AbsencesIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    )
}

function FileTextIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    )
}

function RefreshIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        </svg>
    )
}

function CheckInIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
        </svg>
    )
}

function BellIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    )
}

function SettingsIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    )
}

function PlusIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    )
}

function LogoutIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    )
}

function UploadIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    )
}

function EyeIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}

function TotalAbsenceIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="17" y1="11" x2="22" y2="11" />
        </svg>
    )
}

function ValidatedIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}

function CriticalIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    )
}

function InProgressIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <path d="M9 14l2 2 4-4" />
        </svg>
    )
}

function WarningAlertIcon() {
    return (
        <div className={styles["alert-icon"] + " " + styles["warning"]}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
        </div>
    )
}

function SuccessAlertIcon() {
    return (
        <div className={styles["alert-icon"] + " " + styles["success"]}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
        </div>
    )
}

function CalendarAlertIcon() {
    return (
        <div className={styles["alert-icon"] + " " + styles["info"]}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <path d="M9 14l2 2 4-4" />
            </svg>
        </div>
    )
}

// Navigation items
const navItems = [
    { icon: DashboardIcon, label: "Dashboard", active: true, path: "/DashboardStudent" },
    { icon: AbsencesIcon, label: "Absences", active: false, path: "/StudentAbsencePage" },
    { icon: FileTextIcon, label: "Justificatifs", active: false, indent: true, path: "/Justification" },
    { icon: RefreshIcon, label: "Rattrapages", active: false, path: "/Rattrapage" },
    { icon: CheckInIcon, label: "Check-in (Présence)", active: false, path: "/Check-in" },
    { icon: BellIcon, label: "Notifications", active: false, badge: 3, path: "/Notifications" },
]

// Stats data
const stats = [
    { icon: TotalAbsenceIcon, value: "12", label: "Total Absences", type: "TOTAL", color: "blue" },
    { icon: ValidatedIcon, value: "08", label: "Justified", type: "VALIDATED", color: "green" },
    { icon: CriticalIcon, value: "04", label: "Unjustified", type: "CRITICAL", color: "red" },
    { icon: InProgressIcon, value: "02", label: "Pending Makeups", type: "IN PROGRESS", color: "orange" },
]

// Recent absences data
const recentAbsences = [
    { date: "24 Nov 2023", subject: "Artificial Intelligence", type: "TD", status: "Unjustified" },
    { date: "22 Nov 2023", subject: "Mobile Networks", type: "Course", status: "Justified" },
    { date: "18 Nov 2023", subject: "Software Engineering", type: "TP", status: "Pending" },
    { date: "15 Nov 2023", subject: "Information Security", type: "TD", status: "Justified" },
    { date: "12 Nov 2023", subject: "Compilation", type: "Course", status: "Justified" },
]

// Academic alerts
const alerts = [
    {
        icon: WarningAlertIcon,
        title: "Critical threshold in HCI",
        description: "Only 1 more absence allowed before module exclusion.",
    },
    {
        icon: SuccessAlertIcon,
        title: "Justification validated",
        description: "Your absence on 11/12 in Compilation has been justified.",
    },
    {
        icon: CalendarAlertIcon,
        title: "Makeup scheduled",
        description: "Embedded Systems: Wednesday 14:00 - Room 04.",
    },
]

// Chart months
const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"]

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [absences, setAbsences] = useState([]);

    useEffect(() => {
        const fetchAbsences = async () => {
            try {
                const response = await api.get('schedules/attendance/');
                // Filter only absent records
                const absentRecords = response.data.filter(record => record.status === 'absent' || record.justification_status);
                setAbsences(absentRecords);
            } catch (error) {
                console.error("Error fetching absences:", error);
            }
        };
        fetchAbsences();
    }, []);

    // Calculate stats dynamically
    const justifiedCount = absences.filter(a => a.justification_status === 'JUSTIFIÉE').length;
    const unjustifiedCount = absences.filter(a => !a.justification_status || a.justification_status === 'INJUSTIFIÉE').length;
    const pendingCount = absences.filter(a => a.justification_status === 'EN ATTENTE').length;

    const dynamicStats = [
        { icon: TotalAbsenceIcon, value: absences.length < 10 ? `0${absences.length}` : absences.length, label: "Total Absences", type: "TOTAL", color: "blue" },
        { icon: ValidatedIcon, value: justifiedCount < 10 ? `0${justifiedCount}` : justifiedCount, label: "Justified", type: "VALIDATED", color: "green" },
        { icon: CriticalIcon, value: unjustifiedCount < 10 ? `0${unjustifiedCount}` : unjustifiedCount, label: "Unjustified", type: "CRITICAL", color: "red" },
        { icon: InProgressIcon, value: pendingCount < 10 ? `0${pendingCount}` : pendingCount, label: "En attente", type: "IN PROGRESS", color: "orange" },
    ];

    // Map recent absences to match the frontend structure
    const mappedRecentAbsences = absences.slice(0, 5).map(absence => ({
        id: absence.id,
        date: absence.date,
        subject: absence.subject,
        type: absence.type,
        status: absence.justification_status === 'JUSTIFIÉE' ? 'justified' : 
                absence.justification_status === 'EN ATTENTE' ? 'pending' : 'unjustified',
        statusLabel: absence.justification_status === 'JUSTIFIÉE' ? 'Justifiée' : 
                     absence.justification_status === 'EN ATTENTE' ? 'En attente' : 'Injustifiée'
    }));

    return (
        <div className={styles["app-container"]}>
            {/* Sidebar */}
            <aside className={styles["sidebar"]}>
                <div className={styles["sidebar-header"]}>
                    <div className={styles["logo"]}>
                        <div className={styles["logo-icon"]}>
                            <img src="/images/logo.png" alt="esi-logo" className={styles["logo-image"]} />
                        </div>
                        <div className={styles["logo-text"]}>
                            <span className={styles["logo-title"]}>ESI SBA</span>
                            <span className={styles["logo-subtitle"]}>ABSENCE PORTAL</span>
                        </div>
                    </div>
                </div>

                <nav className={styles["nav-menu"]}>
                    {navItems.map((item, index) => (
                        <a
                            key={index}
                            href={item.path}
                            className={`${styles["nav-item"]} ${item.active ? styles["active"] : ""} ${item.indent ? styles["indent"] : ""}`}
                        >
                            <item.icon />
                            <span>{item.label}</span>
                            {item.badge && <span className={styles["badge"]}>{item.badge}</span>}
                        </a>
                    ))}
                </nav>

                <div className={styles["sidebar-settings"]}>
                    <a href="#" className={styles["setting-item"]}>
                        <SettingsIcon className={styles["nav-icon"]} />
                        <span className={styles["settingtext"]}>System Settings</span>
                    </a>
                    <button onClick={logout} className={styles["setting-item"]} style={{ border: "none", background: "none", cursor: "pointer", width: "100%", textAlign: "left", fontFamily: "inherit" }}>
                        <LogoutIcon className={styles["nav-icon"]} />
                        <span className={styles["settingtext"]}>Logout</span>
                    </button>
                </div>

                <div className={styles["sidebar-footer"]}>
                    <div className={styles["user-profile"]}>
                        <img src={user?.profile_picture || "/Icons/studentPicture.png"} alt={user?.name} className={styles["user-avatar"]} />
                        <div className={styles["user-info"]}>
                            <span className={styles["user-name"]}>{user?.name || "Student"}</span>
                            <span className={styles["user-role"]}>Student</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles["main-content"]}>
                {/* Header */}
                <header className={styles["header"]}>
                    <div className={styles["header-icons"]}>
                        <button className={styles["icon-btn"]}>
                            <BellIcon />
                        </button>
                        <button className={styles["icon-btn"]} onClick={logout}>
                            <LogoutIcon />
                        </button>
                    </div>
                </header>

                {/* Welcome Section */}
                <div className={styles["welcome-section"]}>
                    <div className={styles["welcome-text"]}>
                        <h1>Hello, {user?.first_name || user?.firstName || 'Student'}</h1>
                        <p>Here is your current attendance status for the current semester.</p>
                    </div>
                    <button className={styles["submit-btn"]} onClick={() => navigate('/NewJustification')}>
                        <PlusIcon />
                        <span>Submit a Justification</span>
                    </button>
                </div>

                {/* Stats Cards */}
                <div className={styles["stats-grid"]}>
                    {dynamicStats.map((stat, index) => (
                        <div key={index} className={styles["stat-card"]}>
                            <div className={styles["stat-header"]}>
                                <stat.icon className={`${styles["stat-icon"]} ${styles[stat.color]}`} />
                                <span className={`${styles["stat-type"]} ${styles[stat.color]}`}>{stat.type}</span>
                            </div>
                            <div className={`${styles["stat-value"]} ${styles[stat.color]}`}>{stat.value}</div>
                            <div className={styles["stat-label"]}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Middle Section */}
                <div className={styles["middle-section"]}>
                    {/* Chart Section */}
                    <div className={styles["chart-section"]}>
                        <div className={styles["chart-header"]}>
                            <h2>Absence Frequency</h2>
                            <div className={styles["chart-legend"]}>
                                <span className={styles["legend-dot"]}></span>
                                <span>Absence hours per month</span>
                            </div>
                        </div>
                        <div className={styles["chart-container"]}>
                            <div className={styles["chart-area"]}>
                                <div className={styles["chart-placeholder"]}></div>
                            </div>
                            <div className={styles["chart-months"]}>
                                {months.map((month, index) => (
                                    <span key={index}>{month}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Alerts Section */}
                    <div className={styles["alerts-section"]}>
                        <h2>Academic Alerts</h2>
                        <div className={styles["alerts-list"]}>
                            {alerts.map((alert, index) => (
                                <div key={index} className={styles["alert-item"]}>
                                    <alert.icon />
                                    <div className={styles["alert-content"]}>
                                        <span className={styles["alert-title"]}>{alert.title}</span>
                                        <span className={styles["alert-description"]}>{alert.description}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Absences Table */}
                <div className={styles["table-section"]}>
                    <div className={styles["table-header"]}>
                        <h2>Recent Absences</h2>
                        <a href="#" className={styles["view-link"]}>View full registry</a>
                    </div>
                    <table className={styles["absences-table"]}>
                        <thead>
                            <tr>
                                <th>DATE</th>
                                <th>SUBJECT</th>
                                <th>TYPE</th>
                                <th>STATUS</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mappedRecentAbsences.length > 0 ? (
                                mappedRecentAbsences.map((absence, index) => (
                                    <tr key={index}>
                                        <td className={styles["date-cell"]}>{absence.date}</td>
                                        <td>{absence.subject}</td>
                                        <td>{absence.type}</td>
                                        <td>
                                            <span className={`${styles["status-badge"]} ${styles[absence.status]}`}>
                                                {absence.statusLabel}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className={styles["action-btn"]}
                                                onClick={() => {
                                                    if (absence.status === "Unjustified") {
                                                        navigate(`/NewJustification?absenceId=${absence.id}`);
                                                    } else {
                                                        navigate('/Justification');
                                                    }
                                                }}
                                                title={absence.status === "Unjustified" ? "Justifier" : "Voir justification"}
                                            >
                                                {absence.status === "Unjustified" ? <UploadIcon /> : <EyeIcon />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                                        No recent absences.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    )
}