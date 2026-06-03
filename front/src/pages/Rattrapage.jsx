import React, { useEffect, useState } from "react";
import styles from "./Rattrapage.module.css";
import { fetchMyReplacementExams } from "../services/schedulesEndpoint";
import StudentSidebar from "../components/StudentSidebar";
import StudentHeader from "../components/StudentHeader";

export default function Rattrapages() {
  const [replacementExams, setReplacementExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadReplacementExams() {
      try {
        setLoading(true);
        const data = await fetchMyReplacementExams();
        setReplacementExams(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.detail || "Unable to load replacement exams.");
      } finally {
        setLoading(false);
      }
    }

    loadReplacementExams();
  }, []);

  const getStatusLabel = (status) => {
    if (status === "present") return "Completed";
    if (status === "absent") return "Missed";
    return "Upcoming";
  };

  return (
    <div className={styles.layout}>
      <StudentSidebar />

      <main className={styles["main-content"]}>
        <StudentHeader />

        <div className={styles["page-title-bar"]}>
          <h1 className={styles["page-title"]}>Replacement Exams</h1>
        </div>

        <div className={styles.content}>
          <div className={styles["info-banner"]}>
            <div className={styles["info-text"]}>
              <h2>Replacement exam schedule</h2>
              <p>
                Your replacement exams are shown below. Only students with approved
                justifications for the original absence are assigned to a replacement.
              </p>
            </div>
          </div>

          <section className={styles.section}>
            <div className={styles["section-header"]}>
              <h3 className={styles["section-title"]}>
                <span className={styles["title-indicator"]}></span>
                Your scheduled replacements
              </h3>
            </div>

            {loading ? (
              <div className={styles["makeups-grid"]}>
                <div className={styles["makeup-card"]}>Loading replacement exams…</div>
              </div>
            ) : error ? (
              <div className={styles["makeup-card"]}>{error}</div>
            ) : replacementExams.length === 0 ? (
              <div className={styles["makeup-card"]}>
                No replacement exams are currently scheduled for your account.
              </div>
            ) : (
              <div className={styles["makeups-grid"]}>
                {replacementExams.map((exam) => (
                  <div key={exam.id} className={styles["makeup-card"]}>
                    <div className={styles["card-header"]}>
                      <span className={styles["module-label"]}>REPLACEMENT</span>
                      <span className={`${styles["status-badge"]} ${styles[exam.status === 'presente' ? 'confirmed' : exam.status === 'absent' ? 'pending' : '']}`}>
                        {getStatusLabel(exam.status)}
                      </span>
                    </div>

                    <h4 className={styles["module-name"]}>{exam.module}</h4>

                    <div className={styles["card-details"]}>
                      <div className={styles["detail-row"]}>
                        <div className={styles["detail-item"]}>
                          <div>
                            <span className={styles["detail-label"]}>Date</span>
                            <span className={styles["detail-value"]}>{exam.date}</span>
                          </div>
                        </div>
                        <div className={styles["detail-item"]}>
                          <div>
                            <span className={styles["detail-label"]}>Time</span>
                            <span className={styles["detail-value"]}>{exam.start_time} - {exam.end_time}</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles["detail-row"]}>
                        <div className={styles["detail-item"]}>
                          <div>
                            <span className={styles["detail-label"]}>Room</span>
                            <span className={styles["detail-value"]}>{exam.room_name}</span>
                          </div>
                        </div>
                        <div className={styles["detail-item"]}>
                          <div>
                            <span className={styles["detail-label"]}>Original Exam</span>
                            <span className={styles["detail-value"]}>{exam.original_module}</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles["detail-row"]}>
                        <div className={styles["detail-item"]}>
                          <div>
                            <span className={styles["detail-label"]}>Teachers</span>
                            <span className={styles["detail-value"]}>{exam.teachers?.join(', ') || 'TBD'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles["card-actions"]}>
                      <span className={styles["detail-value"]}>
                        This exam is a scheduled replacement only. No action is required.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
