import React, { useState, useEffect } from "react";
import styles from "./NewJustification.module.css";
import { useAuth } from "../context/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useNotifications } from "../context/NotificationsContext";


export default function NewJustification() {
    const { user, logout } = useAuth();
    const { addNotification } = useNotifications();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [absences, setAbsences] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const initialAbsenceId = searchParams.get('absenceId') || "";

    const [formData, setFormData] = useState({
        absence: initialAbsenceId,
        reason: "",
        description: "",
    });
    const [dragActive, setDragActive] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch absences that need justification
                const absResponse = await api.get('schedules/attendance/');
                // Filter only absent records that don't have a justification yet
                const unjustified = absResponse.data.filter(r => r.status === 'absent');
                setAbsences(unjustified);

                // Fetch recent justifications history
                const histResponse = await api.get('schedules/justifications/');
                setHistory(histResponse.data.slice(0, 5));
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.absence || !formData.reason || !uploadedFile) {
            addNotification("Veuillez remplir tous les champs obligatoires et joindre un fichier.", "error");
            return;
        }

        setLoading(true);
        const data = new FormData();
        data.append('attendance_record', formData.absence);
        data.append('justification_type', formData.reason.toUpperCase());
        data.append('file', uploadedFile);
        if (formData.description) {
            data.append('student_comment', formData.description);
        }

        try {
            await api.post('schedules/justifications/', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            addNotification("Justificatif soumis avec succès !", "success");
            navigate('/Justification');
        } catch (error) {
            console.error("Error submitting justification:", error);
            addNotification(error.response?.data?.error || "Erreur lors de la soumission.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setUploadedFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setUploadedFile(e.target.files[0]);
        }
    };

    const recentHistory = [
        {
            id: 1,
            title: "Medical Certificate – Flu",
            date: "09/28/2023",
            status: "JUSTIFIED",
        },
        {
            id: 2,
            title: "Makeup Request – Emergency",
            date: "10/01/2023",
            status: "PENDING",
        },
    ];

    return (
        <div className={styles["page-container"]}>
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

                <nav className={styles["sidebar-nav"]}>
                    <a href="/DashboardStudent" className={styles["nav-item"]}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        <span>Dashboard</span>
                    </a>

                    <a href="/StudentAbsencePage" className={styles["nav-item"]}>
                        <img src="/Icons/absence.png" alt="absence-icon" />
                        <span>Absences</span>
                    </a>

                    <a href="/Justification" className={`${styles["nav-item"]} ${styles["active"]}`}>
                        <span className={styles["justification-item"]}>Justificatifs</span>
                    </a>

                    <a href="/Rattrapage" className={styles["nav-item"]}>
                        < img src="/Icons/rattrapageIcon.png" alt="rattrapage-icon" />
                        <span>Rattrapages</span>
                    </a>

                    <a href="/Check-in" className={styles["nav-item"]}>
                        <img src="/Icons/checkinIcon.png" alt="presence-icon" />
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


                <div className={styles["sidebar-footer-section"]}>
                    <a href="/SystemSettings" className={`${styles["nav-item"]} ${styles["settings"]}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        <span>System Settings</span>
                    </a>
                    <button onClick={user?.logout || (() => {})} className={`${styles["nav-item"]} ${styles["settings"]}`} style={{ border: "none", background: "none", cursor: "pointer", width: "100%", textAlign: "left", fontFamily: "inherit" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>
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
                {/* Top Bar */}
                <header className={styles["top-bar"]}>
                    <div className={styles["top-bar-right"]}>
                        <button className={styles["notification-btn"]}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            <span className={styles["notification-badge"]}></span>
                        </button>
                        <button className={styles["logout-btn"]} onClick={logout}>
                            <img src="/Icons/logoutIcon.png" alt="" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className={styles["page-content"]}>
                    <div className={styles["page-header"]}>
                        <h1 className={styles["page-title"]}>New Justification</h1>
                        <p className={styles["page-subtitle"]}>Please fill out the form below to regularize your academic situation.</p>
                    </div>

                    {/* Info Banner */}
                    <div className={styles["info-banner"]}>
                        <div className={styles["info-icon"]}>
                            <img src="/Icons/importantIcon.png" alt="info-icon" />
                        </div>
                        <div className={styles["info-content"]}>
                            <h3 className={styles["info-title"]}>Important Information</h3>
                            <p className={styles["info-text"]}>Your justification will be reviewed by the administration within 48h. Any false declaration is subject to sanctions.</p>
                        </div>
                    </div>

                    {/* Form */}
                    <form className={styles["justification-form"]}>
                        <div className={styles["form-row"]}>
                            <div className={styles["form-group"]}>
                                <label className={styles["form-label"]}>SELECT ABSENCE</label>
                                <div className={styles["select-wrapper"]}>
                                    <select
                                        className={styles["form-select"]}
                                        value={formData.absence}
                                        onChange={(e) => setFormData({ ...formData, absence: e.target.value })}
                                        required
                                    >
                                        <option value="">Choose an unjustified session...</option>
                                        {absences.map(abs => (
                                            <option key={abs.id} value={abs.id}>
                                                {abs.subject} - {abs.date}
                                            </option>
                                        ))}
                                    </select>
                                    <svg className={styles["select-arrow"]} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="6,9 12,15 18,9" />
                                    </svg>
                                </div>
                            </div>

                            <div className={styles["form-group"]}>
                                <label className={styles["form-label"]}>REASON FOR ABSENCE</label>
                                <div className={styles["select-wrapper"]}>
                                    <select
                                        className={styles["form-select"]}
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    >
                                        <option value="">Select the reason...</option>
                                        <option value="medical">Médical</option>
                                        <option value="family">Famille</option>
                                        <option value="transport">Transport</option>
                                        <option value="other">Autre</option>
                                    </select>
                                    <svg className={styles["select-arrow"]} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="6,9 12,15 18,9" />
                                    </svg>
                                </div>
                            </div>
                        </div>


                        <div className={`${styles["form-group"]} ${styles["full-width"]}`}>
                            <label className={styles["form-label"]}>DETAILED DESCRIPTION</label>
                            <textarea
                                className={styles["form-textarea"]}
                                placeholder="Briefly explain the reasons for your absence..."
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className={`${styles["form-group"]} ${styles["full-width"]}`}>
                            <label className={styles["form-label"]}>SUPPORTING DOCUMENT (PDF, JPG, PNG)</label>
                            <div
                                className={`${styles["file-upload"]} ${dragActive ? styles["drag-active"] : ""} ${uploadedFile ? styles["has-file"] : ""}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    id="file-input"
                                    className={styles["file-input"]}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                />
                                {uploadedFile ? (
                                    <div className={styles["file-uploaded"]}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14,2 14,8 20,8" />
                                        </svg>
                                        <span>{uploadedFile.name}</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className={styles["upload-icon"]}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17,8 12,3 7,8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                        </div>
                                        <p className={styles["upload-text"]}>Drag & drop your file here</p>
                                        <p className={styles["upload-subtext"]}>
                                            or <label htmlFor="file-input" className={styles["browse-link"]}>browse your documents</label> (Max 5MB)
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className={styles["form-actions"]}>
                            <button type="button" className={`${styles["btn"]} ${styles["btn-cancel"]}`} onClick={() => navigate(-1)}>Cancel</button>
                            <button type="submit" className={`${styles["btn"]} ${styles["btn-submit"]}`} disabled={loading} onClick={handleSubmit}>
                                {loading ? "Submitting..." : "Submit Justification"}
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12,5 19,12 12,19" />
                                </svg>
                            </button>
                        </div>
                    </form>

                    {/* Recent History */}
                    <div className={styles["recent-history"]}>
                        <div className={styles["history-header"]}>
                            <h2 className={styles["history-title"]}>Recent History</h2>
                            <a href="#" className={styles["view-all-link"]}>View all</a>
                        </div>
                        <div className={styles["history-list"]}>
                            {history.length > 0 ? history.map((item) => (
                                <div key={item.id} className={styles["history-item"]}>
                                    <div className={styles["history-icon"]}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14,2 14,8 20,8" />
                                        </svg>
                                    </div>
                                    <div className={styles["history-info"]}>
                                        <span className={styles["history-name"]}>{item.absence_details?.subject || "Justification"}</span>
                                        <span className={styles["history-date"]}>Submitted on {new Date(item.submission_date).toLocaleDateString()}</span>
                                    </div>
                                    <span className={`${styles["status-badge"]} ${styles[(item.status || "PENDING").toLowerCase().replace(' ', '-')]}`}>
                                        {item.status}
                                    </span>
                                </div>
                            )) : (
                                <p className={styles["upload-subtext"]} style={{ textAlign: "center", padding: "20px" }}>No history found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}