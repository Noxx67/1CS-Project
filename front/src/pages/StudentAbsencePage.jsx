import React, { useState, useEffect } from "react";
import styles from "./studentAbsencePage.module.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";


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
        />
    )
}

function FileCheck({ className }) {
    return (
        <svg
            className={className}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
        />
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
    )
}

function UserCheck({ className }) {
    return (
        <img
            src="/Icons/checkinIcon.png"
            className={className}
            width="24"
            height="24"
            alt="checkin icon"
        />
    )
}

function Bell({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
    )
}

function Settings({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
        </svg>
    )
}

function Search({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
    )
}

function Calendar({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
        </svg>
    )
}

function Filter({ className }) {
    return (
        <img
            src="/Icons/filterIcon.png"
            className={className}
            width="24"
            height="24"
            alt="filter icon"
        />
    )
}

function ChevronDown({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
        </svg>
    )
}

function ChevronLeft({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
        </svg>
    )
}

function ChevronRight({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
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

// Navigation items data
const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: false, path: "/DashboardStudent" },
    { icon: FileText, label: "Absences", active: true, path: "/StudentAbsencePage" },
    { icon: FileCheck, label: "Justificatifs", active: false, path: "/Justification" },
    { icon: RotateCcw, label: "Rattrapages", active: false, path: "/Rattrapage" },
    { icon: UserCheck, label: "Check-in (Présence)", active: false, path: "/Check-in" },
    { icon: Bell, label: "Notifications", active: false, badge: 3, path: "/Notifications" },
]

// Render an absence directly from fetched records

// Status configuration
const statusConfig = {
    justified: {
        label: "Justifiée",
        className: styles["status-justified"],
    },
    unjustified: {
        label: "Injustifiée",
        className: styles["status-unjustified"],
    },
    pending: {
        label: "En attente",
        className: styles["status-pending"],
    },
}

// Image component to handle both remote and local images
function Image({ src, alt, width, height, className }) {
    // If it's a remote URL starting with http, use img tag
    if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
        return <img src={src} alt={alt} width={width} height={height} className={className} />
    }
    // Otherwise use img tag with local path
    return <img src={src} alt={alt} width={width} height={height} className={className} />
}

// Sidebar Component
function Sidebar({ user }) {
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
                {navItems.map((item, index) => (
                    <a
                        key={index}
                        href={item.path}
                        className={`${styles["nav-item"]} ${item.active ? styles["nav-item-active"] : ""}`}
                    >
                        <item.icon className={styles["nav-icon"]} />
                        <span className={styles["nav-label"]}>{item.label}</span>
                        {item.badge && (
                            <span className={styles["nav-badge"]}>{item.badge}</span>
                        )}
                    </a>
                ))}
            </nav>

            <div className={styles["sidebar-settings"]}>
                <a href="#" className={styles["setting-item"]}>
                    <Settings className={styles["nav-icon"]} />
                    <span className={styles["settingtext"]}>System Settings</span>
                </a>
                <button onClick={user?.logout} className={styles["setting-item"]} style={{ border: "none", background: "none", cursor: "pointer", width: "100%", textAlign: "left", fontFamily: "inherit" }}>
                    <LogOut className={styles["nav-icon"]} />
                    <span className={styles["settingtext"]}>Logout</span>
                </button>
            </div>

            <div className={styles["sidebar-profile"]}>
                <div className={styles["profile-avatar"]}>
                    <Image
                        src={user?.profile_picture || "/Icons/studentPicture.png"}
                        alt={user?.name || "Student"}
                        width={40}
                        height={40}
                        className={styles["avatar-image"]}
                    />
                </div>
                <div>
                    <p className={styles["profile-name"]}>{user?.name || "Student"}</p>
                    <p className={styles["profile-role"]}>Student</p>
                </div>
            </div>
        </aside>
    )
}

// Header Component
function Header({ user }) {
    return (
        <header className={styles["header"]}>
            <div className={styles["header-content"]}>
                <button className={styles["notification-btn"]}>
                    <Bell className={styles["notification-icon"]} />
                    <span className={styles["notification-dot"]}></span>
                </button>

                <div className={styles["user-profile"]}>
                    <div className={styles["user-info"]}>
                        <p className={styles["user-name"]}>{user?.first_name || user?.firstName || 'Student'} {user?.last_name?.[0] || user?.lastName?.[0] || ''}.</p>
                        <p className={styles["user-role"]}>{user?.promotion || 'Student'}</p>
                    </div>
                    <div className={styles["user-avatar"]}>
                        <Image
                            src={user?.profile_picture || "/Icons/studentPicture.png"}
                            alt={user?.name || "Student"}
                            width={40}
                            height={40}
                            className={styles["avatar-image"]}
                        />
                    </div>
                    <ChevronDown className={styles["chevron-icon"]} />
                </div>
            </div>
        </header>
    )
}

// Absences Table Component
function AbsencesTable({ absences, onJustify }) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const paginatedAbsences = absences.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.max(1, Math.ceil(absences.length / itemsPerPage));

    return (
        <div className={styles["table-container"]}>
            <div className={styles["filters"]}>
                <div className={styles["search-container"]}>
                    <Search className={styles["search-icon"]} />
                    <input
                        type="text"
                        placeholder="Rechercher un module..."
                        className={styles["search-input"]}
                    />
                </div>

                <button className={`${styles["filter-btn"]} ${styles["filter-btn-light"]}`}>
                    <Calendar className={styles["filter-icon"]} />
                    <div className={styles["filter-text"]}>
                        <p className={styles["filter-label"]}>Semestre</p>
                        <p className={styles["filter-value"]}>1</p>
                    </div>
                    <ChevronDown className={styles["chevron-small"]} />
                </button>

                <button className={`${styles["filter-btn"]} ${styles["filter-btn-dark"]}`}>
                    <Filter className={styles["filter-icon"]} />
                    <div className={styles["filter-text"]}>
                        <p className={styles["filter-label"]}>Tous les</p>
                        <p className={styles["filter-value"]}>statuts</p>
                    </div>
                    <ChevronDown className={styles["chevron-small"]} />
                </button>
            </div>

            <div className={styles["table-wrapper"]}>
                <table className={styles["table"]}>
                    <thead>
                        <tr className={styles["table-header"]}>
                            <th>Date & Heure</th>
                            <th>Module</th>
                            <th>Type & Salle</th>
                            <th>Statut</th>
                            <th className={styles["text-center"]}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedAbsences.length > 0 ? (
                            paginatedAbsences.map((absence) => (
                                <tr key={absence.id}>
                                    <td>
                                        <p className={styles["cell-primary"]}>{absence.date}</p>
                                        <p className={styles["cell-secondary"]}>{absence.time}</p>
                                    </td>
                                    <td>
                                        <p className={styles["cell-primary"]}>{absence.subject}</p>
                                    </td>
                                    <td>
                                        <p className={styles["cell-primary"]}>{absence.type}</p>
                                        <p className={styles["cell-secondary"]}>{absence.room}</p>
                                    </td>
                                    <td>
                                        <span className={`${styles["status-badge"]} ${
                                            absence.justification_status === 'JUSTIFIÉE' ? statusConfig["justified"].className :
                                            absence.justification_status === 'EN ATTENTE' ? statusConfig["pending"].className :
                                            statusConfig["unjustified"].className
                                        }`}>
                                            {absence.justification_status === 'JUSTIFIÉE' ? 'Justifiée' : 
                                             absence.justification_status === 'EN ATTENTE' ? 'En attente' : 
                                             'Injustifiée'}
                                        </span>
                                    </td>
                                    <td className={styles["text-center"]}>
                                        <button 
                                            className={styles["action-btn"]}
                                            onClick={() => onJustify(absence.id)}
                                            disabled={!!absence.justification_status}
                                            style={{ 
                                                opacity: !!absence.justification_status ? 0.5 : 1, 
                                                cursor: !!absence.justification_status ? 'not-allowed' : 'pointer' 
                                            }}
                                        >
                                            {absence.justification_status ? 'Déjà soumis' : 'Justifier'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className={styles["text-center"]} style={{ padding: "20px" }}>
                                    Aucune absence enregistrée.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className={styles["pagination"]}>
                <p className={styles["pagination-info"]}>
                    Affichage de {Math.min((currentPage - 1) * itemsPerPage + 1, absences.length)} à {Math.min(currentPage * itemsPerPage, absences.length)} sur {absences.length} absences
                </p>
                <div className={styles["pagination-controls"]}>
                    <button className={styles["pagination-btn"]} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                        <ChevronLeft className={styles["pagination-icon"]} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`${styles["pagination-number"]} ${currentPage === page ? styles["pagination-active"] : ""}`}
                        >
                            {page}
                        </button>
                    ))}
                    <button className={styles["pagination-btn"]} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
                        <ChevronRight className={styles["pagination-icon"]} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function StudentAbsencePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [absences, setAbsences] = useState([]);

    useEffect(() => {
        const fetchAbsences = async () => {
            try {
                const response = await api.get('schedules/attendance/');
                const absentRecords = response.data.filter(record => record.status === 'absent' || record.justification_status);
                setAbsences(absentRecords);
            } catch (error) {
                console.error("Error fetching absences:", error);
            }
        };
        fetchAbsences();
    }, []);

    return (
        <div className={styles["page-container"]}>
            <Sidebar user={user} />
            <div className={styles["main-content"]}>
                <Header user={user} />
                <main className={styles["content-area"]}>
                    <AbsencesTable absences={absences} onJustify={(absenceId) => navigate(`/NewJustification?absenceId=${absenceId}`)} />
                </main>
            </div>
        </div>
    )
}