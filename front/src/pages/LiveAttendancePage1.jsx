import { NavLink } from "react-router-dom";
import { useState } from "react";
import styles from './LiveAttendancePage1.module.css';

export function LiveAttendancePage1() {
    const [students, setStudents] = useState([
        { id: "2022-ESI-1487", name: "Sara Benali", status: "present", avatar: "SB" },
        { id: "2022-ESI-1521", name: "Karim Merzoug", status: "absent", avatar: "KM" },
        { id: "2022-ESI-1442", name: "Lina Kaddour", status: "present", avatar: "LK" },
        { id: "2022-ESI-1503", name: "Yacine Douali", status: "absent", avatar: "YD" },
        { id: "2022-ESI-1491", name: "Nour El Houda Saadi", status: "present", avatar: "NS" },
        { id: "2022-ESI-1538", name: "Aymen Boudiaf", status: "present", avatar: "AB" },
    ]);

    const [filter, setFilter] = useState("all");
    const [teacherNote, setTeacherNote] = useState(
        "Two students arrived late due to lab allocation changes. One absence justification is expected after class."
    );

    const totalStudents = students.length;
    const presentCount = students.filter(s => s.status === "present").length;
    const absentCount = students.filter(s => s.status === "absent").length;
    const unmarkedCount = students.filter(s => s.status !== "present" && s.status !== "absent").length;
    const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    const toggleStatus = (studentId, status) => {
        setStudents(prev =>
            prev.map(s => s.id === studentId ? { ...s, status: status } : s)
        );
    };

    const filteredStudents = students.filter(s => {
        if (filter === "unmarked") return s.status !== "present" && s.status !== "absent";
        return true;
    });

    const handleHistoryClick = () => {
        alert("Viewing attendance history");
    };

    return (
        <div className={styles.page}>
            {/* Sidebar */}
            <div className={styles.sidebar}>
                <div className={styles.titlecontainer}>
                    <img src="/images/logo.png" className={styles.logo} alt="Logo" />
                    <div>
                        <p className={styles.title}>ESI SBA</p>
                        <p className={styles.subtitle}>ABSENCE PORTAL</p>
                    </div>
                </div>

                <NavLink to="/dashboard" className={({ isActive }) =>
                    isActive ? styles.activeContainer : styles.container
                }>
                    <img src="/Icons/Icon (1).png" alt="dashboard" className={styles.icons} />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink to="/live-attendance" className={({ isActive }) =>
                    isActive ? styles.activeContainer : styles.container
                }>
                    <img src="/Icons/liveIcon.png" alt="live" className={styles.icons} />
                    <span>Live Attendance</span>
                </NavLink>

                <NavLink to="/my-sessions" className={({ isActive }) =>
                    isActive ? styles.activeContainer : styles.container
                }>
                    <img src="/Icons/sessionIcon.png" alt="sessions" className={styles.icons} />
                    <span>My Sessions</span>
                </NavLink>

                <NavLink to="/my-groups" className={({ isActive }) =>
                    isActive ? styles.activeContainer : styles.container
                }>
                    <img src="/Icons/groupIcon.png" alt="groups" className={styles.icons} />
                    <span>My Groups</span>
                </NavLink>

                <div className={styles.settingstyle}>
                    <NavLink to="/systemSettings" className={({ isActive }) =>
                        isActive ? styles.activeContainer : styles.container
                    }>
                        <img src="/Icons/settingIcon.png" alt="settings" className={styles.icons} />
                        <span>System Settings</span>
                    </NavLink>
                </div>

                <div className={styles.teacherContainer}>
                    <img src="/Icons/Teacher Avatar.png" className={styles.image} alt="teacher" />
                    <div>
                        <p className={styles.title}>Dr. Ahmed Yelles</p>
                        <p className={styles.subtitle}>Professor</p>
                    </div>
                    <button className={styles.loginButton}>
                        <img src="/Icons/Container.png" alt="logout" className={styles.loginIcon} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainPage}>
                <div className={styles.headerContainer}>
                    <div>
                        <h3>Live Attendance</h3>
                        <p className={styles.description}>
                            Large, tablet-friendly class register for quick attendance during the current session.
                        </p>
                    </div>
                    <div className={styles.groupName}>
                        <img src="/Icons/Container (1).png" alt="group" className={styles.groupIcon} />
                        Group 1CS-7
                    </div>
                </div>

                <div className={styles.contentContainer}>
                    {/* LEFT COLUMN */}
                    <div className={styles.leftPanel}>
                        <div className={styles.currentSessionHeader}>
                            <div>
                                <p className={styles.currentSessionTitle}>Current session</p>
                                <p className={styles.currentSessionSubtitle}>Mark each student as present or absent before submitting.</p>
                            </div>
                            <button className={styles.registerButton}>
                                <img src="/Icons/SVG.png" alt="register" className={styles.registerImage} />
                                Class register
                            </button>
                        </div>

                        <div className={styles.infoSessionContainer}>
                            <div>
                                <p className={styles.sessionInfo}>Subject</p>
                                <p className={styles.sessionName}>Operating S..</p>
                                <p className={styles.sessionType}>Practical session</p>
                            </div>
                            <div>
                                <p className={styles.sessionInfo}>Room</p>
                                <p className={styles.sessionName}>A 3</p>
                                <p className={styles.sessionType}>Building sup</p>
                            </div>
                            <div>
                                <p className={styles.sessionInfo}>Time</p>
                                <p className={styles.sessionName}>10:15 - 11:45</p>
                                <p className={styles.sessionType}>Tuesday, March 24</p>
                            </div>
                            <div>
                                <p className={styles.sessionInfo}>Teacher</p>
                                <p className={styles.sessionName}>Dr. Ahmed</p>
                                <p className={styles.sessionType}>ESI Sidi Bel Abbes</p>
                            </div>
                        </div>

                        <div className={styles.statsBar}>
                            <span className={styles.statsText}>
                                <span className={styles.statsHighlight}>{totalStudents} students enrolled</span> •{" "}
                                <span className={styles.statsHighlight}>{presentCount} marked present</span> •{" "}
                                <span className={styles.statsHighlight}>{absentCount} marked absent</span>
                            </span>
                        </div>

                        {/* Filter Tabs - Dark Blue Buttons */}
                        <div className={styles.filterTabs}>
                            <button
                                className={`${styles.filterTab} ${filter === "all" ? styles.filterTabActive : ""}`}
                                onClick={() => setFilter("all")}
                            >
                                All students
                            </button>
                            <button
                                className={`${styles.filterTab} ${filter === "unmarked" ? styles.filterTabActive : ""}`}
                                onClick={() => setFilter("unmarked")}
                            >
                                Unmarked ({unmarkedCount})
                            </button>
                        </div>

                        {/* STUDENT LIST */}
                        <div className={styles.studentsList}>
                            {filteredStudents.map((student) => (
                                <div key={student.id} className={styles.studentRow}>
                                    <div className={styles.studentInfo}>
                                        <div className={styles.studentAvatar}>
                                            {student.avatar}
                                        </div>
                                        <div className={styles.studentDetails}>
                                            <span className={styles.studentName}>
                                                {student.name}
                                            </span>
                                            <span className={styles.studentId}>
                                                ID: {student.id}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.statusBtns}>
                                        <button
                                            className={`${styles.btnPresent} ${student.status === "present" ? styles.on : ""}`}
                                            onClick={() => toggleStatus(student.id, "present")}
                                        >
                                            Present
                                        </button>
                                        <button
                                            className={`${styles.btnAbsent} ${student.status === "absent" ? styles.on : ""}`}
                                            onClick={() => toggleStatus(student.id, "absent")}
                                        >
                                            Absent
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* UPDATE BUTTON and SUBMIT BUTTON in Current Session */}
                        <div className={styles.buttonGroup}>
                            <button className={styles.updateButton}>Update</button>
                            <button className={styles.submitButtonCurrent}>Submit Attendance</button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - SESSION SUMMARY */}
                    <div className={styles.rightPanel}>
                        <div className={styles.summaryHeader}>
                            <h3>Session summary</h3>
                            <p>Quick indicators for the current attendance sheet.</p>
                        </div>

                        <div className={styles.summaryCard}>
                            <div className={styles.summaryCardTitle}>Attendance completion</div>
                            <div className={styles.summaryCardValue}>{attendancePercentage}%</div>
                            <div className={styles.summaryCardDesc}>All enrolled students have been reviewed.</div>
                        </div>

                        <div className={styles.statsRow}>
                            <div className={styles.statBox}>
                                <div className={styles.statNumber}>{absentCount}</div>
                                <div className={styles.statLabel}>Marked absent</div>
                                <div className={styles.statSub}>2 medical, 1 transport, 1 unknown</div>
                            </div>
                            <div className={styles.statBox}>
                                <div className={styles.statNumber}>{presentCount}</div>
                                <div className={styles.statLabel}>Marked present</div>
                                <div className={styles.statSub}>Most students checked in on time.</div>
                            </div>
                        </div>

                        <div className={styles.noteSection}>
                            <div className={styles.noteTitle}>Teacher note</div>
                            <textarea
                                className={styles.noteTextarea}
                                rows="3"
                                value={teacherNote}
                                onChange={(e) => setTeacherNote(e.target.value)}
                                placeholder="Optional remark before submission..."
                            />
                        </div>

                        <button className={styles.saveDraftButton}>Save Draft</button>

                        {/* ATTENDANCE HISTORY BUTTON - Simple Dark Blue Button */}
                        <button className={styles.attendanceHistoryButton} onClick={handleHistoryClick}>
                            Attendance history
                        </button>

                        <div className={styles.professorFooter}>
                            <div className={styles.professorName}>Dr. Ahmed Yelles</div>
                            <div className={styles.professorTitle}>Professor</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}