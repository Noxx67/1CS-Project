import React, { useState, useEffect } from "react";
import styles from "./NewJustification.module.css";
import { useAuth } from "../context/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useNotifications } from "../context/NotificationsContext";
import StudentSidebar from "../components/StudentSidebar";
import StudentHeader from "../components/StudentHeader";



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
                const unjustified = absResponse.data.filter(r => r.status === 'absent');

                const examResponse = await api.get('schedules/exam-attendance/');
                const examUnjustified = examResponse.data
                    .filter(r => r.status === 'absent')
                    .map(r => ({
                        ...r,
                        isExam: true,
                        id: `exam-${r.id}`,
                        subject: `EXAM: ${r.subject}` 
                    }));

                const allUnjustified = [...unjustified, ...examUnjustified];
                setAbsences(allUnjustified);

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
        const selectedId = formData.absence.toString();
        
        if (selectedId.startsWith('exam-')) {
            data.append('exam_attendance_record', selectedId.replace('exam-', ''));
        } else {
            data.append('attendance_record', selectedId);
        }
        
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
            <StudentSidebar />

            {/* Main Content */}
            <main className={styles["main-content"]}>
                <StudentHeader />

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
                                        <span className={styles["history-name"]}>
                                            {item.is_exam ? `EXAM: ${item.absence_details?.subject || "Justification"}` : item.absence_details?.subject || "Justification"}
                                        </span>
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