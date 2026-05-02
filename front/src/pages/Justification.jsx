import React, { useState, useEffect } from "react";
import styles from "./Justification.module.css";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";


const justificationsData = [
    {
        id: 1,
        dateSubmission: "15 Oct. 2023",
        timeSubmission: "09:42",
        absenceCourse: "Algorithmique Avan.",
        absenceDate: "Le 14/10/23 (10h30)",
        motif: "Médical",
        fileType: "pdf",
        status: "JUSTIFIÉE",
        comment: '"Certificat valide. Absence régularisée."',
    },
    {
        id: 2,
        dateSubmission: "22 Oct. 2023",
        timeSubmission: "14:15",
        absenceCourse: "Architecture des Ord.",
        absenceDate: "Le 21/10/23 (08h00)",
        motif: "Transport",
        fileType: "image",
        status: "EN ATTENTE",
        comment: "--",
    },
    {
        id: 3,
        dateSubmission: "05 Nov. 2023",
        timeSubmission: "11:00",
        absenceCourse: "Probabilités & Stat.",
        absenceDate: "Le 03/11/23 (13h30)",
        motif: "Famille",
        fileType: "pdf",
        status: "INJUSTIFIÉE",
        comment: '"Document illisible ou non officiel."',
    },
    {
        id: 4,
        dateSubmission: "12 Nov. 2023",
        timeSubmission: "08:30",
        absenceCourse: "Systèmes d'Exploit.",
        absenceDate: "Le 11/11/23 (15h15)",
        motif: "Médical",
        fileType: "pdf-verified",
        status: "JUSTIFIÉE",
        comment: '"Accepté par le Dr. Hamidi."',
    },
]

export default function JustificationsPage() {
    const { user, logout } = useAuth();
    const [justifications, setJustifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("Tous");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchJustifications = async () => {
            try {
                const response = await api.get('schedules/justifications/');
                setJustifications(response.data);
            } catch (error) {
                console.error("Error fetching justifications:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchJustifications();
    }, []);

    const filteredJustifications = justifications.filter(item => {
        if (activeFilter === "Tous") return true;
        return item.status.toLowerCase() === activeFilter.toLowerCase();
    });

    const stats = {
        total: justifications.length,
        accepted: justifications.filter(j => j.status === 'JUSTIFIÉE').length,
        pending: justifications.filter(j => j.status === 'EN ATTENTE').length,
        rejected: justifications.filter(j => j.status === 'INJUSTIFIÉE').length,
    };

    const filters = ["Tous", "Justifiée", "En attente", "Injustifiée"]

    const getStatusClass = (status) => {
        switch (status) {
            case "JUSTIFIÉE":
                return styles["status-justified"]
            case "EN ATTENTE":
                return styles["status-pending"]
            case "INJUSTIFIÉE":
                return styles["status-unjustified"]
            default:
                return ""
        }
    }

    const getFileIcon = (type) => {
        if (type === "image") {
            return (
                <img src="/Icons/picture.png" alt="image-icon" />
            )
        }
        if (type === "pdf-verified") {
            return (
                <img src="/Icons/pdf.png" alt="image-icon" />
            )
        }
        return (
            <img src="/Icons/soumisIcon.png" alt="pdf-icon" />
        )
    }

    return (
        <div className={styles.appContainer}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <img src="/images/logo.png" alt="esi-logo" className={styles.logoImage} />
                        </div>
                        <div className={styles.logoText}>
                            <h1>ESI SBA</h1>
                            <p>ABSENCE PORTAL</p>
                        </div>
                    </div>
                </div>

                <nav className={styles.sidebarNav}>
                    <a href="/DashboardStudent" className={styles.navItem}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        <span>Dashboard</span>
                    </a>

                    <a href="/StudentAbsencePage" className={styles.navItem}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>Absences</span>
                    </a>

                    <a href="/Justification" className={`${styles.navItem} ${styles.active}`}>
                        <span className={styles.justificationItem}>Justificatifs</span>
                    </a>

                    <a href="/Rattrapage" className={styles.navItem}>
                        <img src="/Icons/rattrapageIcon.png" alt="Rattrapage-icon" />
                        <span>Rattrapages</span>
                    </a>

                    <a href="/Check-in" className={styles.navItem}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span>Check-in (Présence)</span>
                    </a>

                    <a href="/Notifications" className={styles.navItem}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <span>Notifications</span>
                    </a>
                </nav>

                <div className={styles.sidebarFooterSection}>
                    <a href="/SystemSettings" className={`${styles.navItem} ${styles.settings}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        <span>System Settings</span>
                    </a>
                    <button onClick={user?.logout || (() => {})} className={`${styles.navItem} ${styles.settings}`} style={{ border: "none", background: "none", cursor: "pointer", width: "100%", textAlign: "left", fontFamily: "inherit" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userProfile}>
                        <img src={user?.profile_picture || "/Icons/studentPicture.png"} alt={user?.name || "Student"} className={styles.userAvatar} />
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{user?.name || "Student"}</span>
                            <span className={styles.userRole}>Student</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                {/* Top Bar */}
                <header className={styles.topBar}>
                    <div className={styles.searchBar}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                        <input type="text" placeholder="Rechercher un justificatif..." />
                    </div>
                    <div className={styles.topBarActions}>
                        <button className={styles.notificationBtn}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            <span className={styles.notificationBadge}></span>
                        </button>
                        <button className={styles.logoutBtn} onClick={logout}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16,17 21,12 16,7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            <span>Déconnexion</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className={styles.pageContent}>
                    {/* Breadcrumb */}
                    <div className={styles.breadcrumb}>
                        <span>GESTION ADMINISTRATIVE</span>
                        <span className={styles.separator}>{">"}</span>
                        <span className={styles.current}>HISTORIQUE DES JUSTIFICATIFS</span>
                    </div>

                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <div className={styles.pageTitle}>
                            <h1>Historique des Justifications</h1>
                            <p>Consultez et suivez l&apos;état de vos demandes de régularisation d&apos;absence.</p>
                        </div>
                        <a href="/NewJustification" className={styles.addBtn}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Déposer un justificatif
                        </a>
                    </div>

                    {/* Stats Cards */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <span className={styles.statLabel}>TOTAL SOUMIS</span>
                            <div className={styles.statValue}>
                                <span className={styles.statNumber}>{String(stats.total).padStart(2, '0')}</span>
                                <img src="/Icons/soumisIcon.png" alt="soumis-picture" />
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statLabel}>ACCEPTÉS</span>
                            <div className={styles.statValue}>
                                <span className={styles.statNumber}>{String(stats.accepted).padStart(2, '0')}</span>
                                <img src="/Icons/acceptIcon.png" alt="acceptes-picture" />
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statLabel}>EN ATTENTE</span>
                            <div className={styles.statValue}>
                                <span className={styles.statNumber}>{String(stats.pending).padStart(2, '0')}</span>
                                <img src="/Icons/enattent.png" alt="en-attente-picture" />
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statLabel}>REFUSÉS</span>
                            <div className={styles.statValue}>
                                <span className={styles.statNumber}>{String(stats.rejected).padStart(2, '0')}</span>
                                <img src="/Icons/refuser.png" alt="refuser-picture" />
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className={styles["table-section"]}>
                        {/* Filters */}
                        <div className={styles["table-filters"]}>
                            <div className={styles["filter-group"]}>
                                <span className={styles["filter-label"]}>Filtrer par :</span>
                                <div className={styles["filter-buttons"]}>
                                    {filters.map((filter) => (
                                        <button
                                            key={filter}
                                            className={`${styles["filter-btn"]} ${activeFilter === filter ? styles["active"] : ""}`}
                                            onClick={() => setActiveFilter(filter)}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button className={styles["export-btn"]}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7,10 12,15 17,10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Exporter (PDF)
                            </button>
                        </div>

                        {/* Table */}
                        <table className={styles["data-table"]}>
                            <thead>
                                <tr>
                                    <th>Date Soumission</th>
                                    <th>Absence Concernée</th>
                                    <th>Motif / Type</th>
                                    <th>Fichier</th>
                                    <th>Statut</th>
                                    <th>Commentaire Scolarité</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredJustifications.length > 0 ? filteredJustifications.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className={styles["date-cell"]}>
                                                <span className={styles["date-main"]}>{new Date(item.submission_date).toLocaleDateString()}</span>
                                                <span className={styles["date-time"]}>{new Date(item.submission_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles["absence-cell"]}>
                                                <span className={styles["absence-course"]}>{item.absence_details?.subject}</span>
                                                <span className={styles["absence-date"]}>{item.absence_details?.date} ({item.absence_details?.time})</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles["motif-badge"]}>{item.justification_type}</span>
                                        </td>
                                        <td>
                                            <div className={styles["file-icon"]}>
                                                <a href={item.file} target="_blank" rel="noopener noreferrer">
                                                    {getFileIcon(item.file.endsWith('.pdf') ? 'pdf' : 'image')}
                                                </a>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles["status-badge"]} ${getStatusClass(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={styles["comment-text"]}>{item.scholarite_comment || "--"}</span>
                                        </td>
                                        <td>
                                            <button className={styles["row-action"]}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="9,18 15,12 9,6" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>Aucun justificatif trouvé.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className={styles["table-footer"]}>
                            <span className={styles["pagination-info"]}>Affichage de 4 sur 12 justificatifs</span>
                            <div className={styles["pagination"]}>
                                <button className={styles["pagination-btn"]} disabled>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="15,18 9,12 15,6" />
                                    </svg>
                                </button>
                                <button className={`${styles["pagination-btn"]} ${currentPage === 1 ? styles["active"] : ""}`} onClick={() => setCurrentPage(1)}>1</button>
                                <button className={`${styles["pagination-btn"]} ${currentPage === 2 ? styles["active"] : ""}`} onClick={() => setCurrentPage(2)}>2</button>
                                <button className={`${styles["pagination-btn"]} ${currentPage === 3 ? styles["active"] : ""}`} onClick={() => setCurrentPage(3)}>3</button>
                                <button className={styles["pagination-btn"]}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="9,18 15,12 9,6" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}