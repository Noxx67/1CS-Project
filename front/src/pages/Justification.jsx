import React, { useState, useEffect } from "react";
import styles from "./Justification.module.css";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import StudentSidebar from "../components/StudentSidebar";
import StudentHeader from "../components/StudentHeader";



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
            <StudentSidebar />

            {/* Main Content */}
            <main className={styles.mainContent}>
                <StudentHeader />

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