import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { fetchMyExams, startExamAttendance, updateExamAttendanceRecord } from '../services/schedulesEndpoint';
import styles from './TeacherExamAttendancePage.module.css';

export default function TeacherExamAttendancePage() {
  const { user } = useAuth();
  const { t } = useAppPreferences();

  // Screen modes: 'list' or 'roll_call'
  const [mode, setMode] = useState('list');

  // Exams List State
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [examsError, setExamsError] = useState('');
  const [examSearchQuery, setExamSearchQuery] = useState('');
  const [examFilterTab, setExamFilterTab] = useState('all'); // 'all' | 'today' | 'upcoming' | 'past'

  // Roll Call State
  const [selectedExam, setSelectedExam] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentFilterTab, setStudentFilterTab] = useState('all'); // 'all' | 'present' | 'absent' | 'unmarked'
  const [pendingUpdates, setPendingUpdates] = useState(new Set());

  // Fetch Teacher's assigned exams on mount
  useEffect(() => {
    loadExamsList();
  }, []);

  async function loadExamsList() {
    setLoadingExams(true);
    setExamsError('');
    try {
      const data = await fetchMyExams();
      setExams(data);
    } catch (err) {
      console.error('Error fetching teacher exams:', err);
      setExamsError('Failed to load your assigned exams. Please try again.');
    } finally {
      setLoadingExams(false);
    }
  }

  // Helper to find teacher's supervised room for a specific exam
  function findSupervisedRoom(exam) {
    if (!exam || !exam.rooms || !user) return null;
    return exam.rooms.find((r) => r.supervisors && r.supervisors.includes(user.id)) || null;
  }

  // Open Roll Call sheet for an exam
  async function handleOpenRollCall(exam) {
    const room = findSupervisedRoom(exam);
    if (!room) {
      alert('You are not assigned as a supervisor for any room in this exam.');
      return;
    }

    setSelectedExam(exam);
    setMode('roll_call');
    setLoadingAttendance(true);
    setAttendanceError('');
    setStudentSearchQuery('');
    setStudentFilterTab('all');

    try {
      const data = await startExamAttendance(exam.id);
      setAttendanceData(data);
    } catch (err) {
      console.error('Error starting exam attendance:', err);
      const backendMsg = err.response?.data?.error || 'Failed to open the attendance register.';
      setAttendanceError(backendMsg);
    } finally {
      setLoadingAttendance(false);
    }
  }

  // Go back to the exams list
  function handleBackToList() {
    setMode('list');
    setSelectedExam(null);
    setAttendanceData(null);
    loadExamsList(); // Refresh exam lists to update counts/stats
  }

  // Change student attendance status
  async function handleStatusChange(recordId, newStatus) {
    if (pendingUpdates.has(recordId)) return;

    // Optimistic Update
    setAttendanceData((prev) => {
      if (!prev || !prev.students) return prev;
      return {
        ...prev,
        students: prev.students.map((st) => (st.record_id === recordId ? { ...st, status: newStatus } : st)),
      };
    });

    // Mark as pending
    setPendingUpdates((prev) => {
      const next = new Set(prev);
      next.add(recordId);
      return next;
    });

    try {
      await updateExamAttendanceRecord(recordId, newStatus);
    } catch (err) {
      console.error('Failed to update student attendance record:', err);
      alert('Failed to update attendance status on the server. Please try again.');
      // Revert status on failure (we can fetch latest or toggle back, but fetching start_attendance is cleanest)
      try {
        const data = await startExamAttendance(selectedExam.id);
        setAttendanceData(data);
      } catch (revertErr) {
        console.error('Revert failed:', revertErr);
      }
    } finally {
      setPendingUpdates((prev) => {
        const next = new Set(prev);
        next.delete(recordId);
        return next;
      });
    }
  }

  // Formatting date strings helper
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const dateObj = new Date(dateStr);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  // Formatting time strings helper (HH:MM:SS -> HH:MM)
  function formatTime(timeStr) {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
  }

  // Get Initials for avatars
  function getInitials(fullName) {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  // Filter exams based on search query and tabs
  const filteredExams = exams.filter((exam) => {
    // 1. Search filter
    const matchesSearch =
      exam.module.toLowerCase().includes(examSearchQuery.toLowerCase()) ||
      exam.exam_type.toLowerCase().includes(examSearchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Tab filter
    if (examFilterTab === 'all') return true;

    const todayStr = new Date().toISOString().split('T')[0];
    const examDateStr = exam.date;

    if (examFilterTab === 'today') {
      return examDateStr === todayStr;
    }
    if (examFilterTab === 'upcoming') {
      return examDateStr > todayStr;
    }
    if (examFilterTab === 'past') {
      return examDateStr < todayStr;
    }

    return true;
  });

  // Calculate stats for active roll call
  const totalStudents = attendanceData?.students?.length || 0;
  const presentCount = attendanceData?.students?.filter((s) => s.status === 'present').length || 0;
  const absentCount = attendanceData?.students?.filter((s) => s.status === 'absent').length || 0;
  const unmarkedCount = attendanceData?.students?.filter((s) => s.status === 'unmarked' || !s.status).length || 0;
  const completionPercentage = totalStudents > 0 ? Math.round(((presentCount + absentCount) / totalStudents) * 100) : 0;

  // Filter students based on search and selected tab
  const filteredStudents = (attendanceData?.students || []).filter((st) => {
    // 1. Search Query
    const query = studentSearchQuery.toLowerCase().trim();
    const matchesSearch =
      st.full_name.toLowerCase().includes(query) ||
      (st.registration_number && st.registration_number.toLowerCase().includes(query)) ||
      (st.group && String(st.group).toLowerCase().includes(query));

    if (!matchesSearch) return false;

    // 2. Status Tab
    if (studentFilterTab === 'all') return true;
    if (studentFilterTab === 'present') return st.status === 'present';
    if (studentFilterTab === 'absent') return st.status === 'absent';
    if (studentFilterTab === 'unmarked') return st.status === 'unmarked' || !st.status;

    return true;
  });

  // Find co-supervisors assigned to the same room
  const coSupervisors = (() => {
    if (!selectedExam || !user) return '';
    const room = findSupervisedRoom(selectedExam);
    if (!room || !room.supervisors_details) return '';
    const names = room.supervisors_details
      .filter((s) => s.id !== user.id)
      .map((s) => s.full_name);
    return names.length > 0 ? names.join(', ') : 'None';
  })();

  return (
    <div className={styles.page}>
      {mode === 'list' ? (
        <div className={styles.mainPage}>
          <div className={styles.headerContainer}>
            <div className={styles.headerLeft}>
              <h2 className={styles.pageTitle}>{t('teacherSidebar.exams', 'My Exams')}</h2>
              <p className={styles.pageSubtitle}>
                View and record student attendance for your supervised examinations.
              </p>
            </div>
          </div>

          {/* Controls / Filter Bar */}
          <div className={styles.controlsBar}>
            <div className={styles.searchWrapper}>
              <svg
                className={styles.searchIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by module or type..."
                value={examSearchQuery}
                onChange={(e) => setExamSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.filterTabs}>
              <button
                className={`${styles.filterTab} ${examFilterTab === 'all' ? styles.filterTabActive : ''}`}
                onClick={() => setExamFilterTab('all')}
              >
                All Exams
              </button>
              <button
                className={`${styles.filterTab} ${examFilterTab === 'today' ? styles.filterTabActive : ''}`}
                onClick={() => setExamFilterTab('today')}
              >
                Today
              </button>
              <button
                className={`${styles.filterTab} ${examFilterTab === 'upcoming' ? styles.filterTabActive : ''}`}
                onClick={() => setExamFilterTab('upcoming')}
              >
                Upcoming
              </button>
              <button
                className={`${styles.filterTab} ${examFilterTab === 'past' ? styles.filterTabActive : ''}`}
                onClick={() => setExamFilterTab('past')}
              >
                Past
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {examsError && <div className={styles.errorAlert}>{examsError}</div>}

          {/* Loading Screen */}
          {loadingExams ? (
            <div className={styles.loadingScreen}>
              <div className={styles.loadingSpinner} />
              <p>Loading your assigned exams list...</p>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className={styles.emptyState}>
              <svg
                className={styles.emptyIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
              <p className={styles.emptyText}>No exams scheduled</p>
              <p className={styles.emptySubtext}>
                No examinations match your current filters or you have not been assigned to supervise any upcoming exams.
              </p>
            </div>
          ) : (
            <div className={styles.examGrid}>
              {filteredExams.map((exam) => {
                const room = findSupervisedRoom(exam);
                const isToday = exam.date === new Date().toISOString().split('T')[0];

                return (
                  <div key={exam.id} className={styles.examCard}>
                    <div className={styles.examCardHeader}>
                        {exam.is_replacement ? (
                          <span className={`${styles.badge} ${styles.badgeReplacement}`}>
                            Replacement
                          </span>
                        ) : (
                          <span
                            className={`${styles.badge} ${
                              exam.exam_type === 'EXAM' || exam.exam_type === 'PARTIEL'
                                ? styles.badgeExam
                                : exam.exam_type === 'TD_COLLECTIF'
                                ? styles.badgeTD
                                : styles.badgePartiel
                            }`}
                          >
                            {exam.exam_type?.replace('_', ' ')}
                          </span>
                        )}
                      <span className={`${styles.badge} ${styles.badgeDate}`}>
                        {formatDate(exam.date)}
                      </span>
                    </div>

                    <h3 className={styles.moduleName}>{exam.module}</h3>
                    <div className={styles.specialtyLabel}>
                      {exam.year} {exam.speciality ? ` - ${exam.speciality}` : ''}
                    </div>

                    <div className={styles.detailsList}>
                      <div className={styles.detailItem}>
                        <svg
                          className={styles.detailIcon}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                        <span>
                          {formatTime(exam.start_time)} - {formatTime(exam.end_time)}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <svg
                          className={styles.detailIcon}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span>{exam.student_count || 0} students total</span>
                      </div>
                    </div>

                    {room ? (
                      <div className={styles.supervisedRoomBox}>
                        <div className={styles.supervisedRoomTitle}>Assigned Room</div>
                        <div className={styles.supervisedRoomName}>{room.room_name}</div>
                        <span style={{ fontSize: '12px', color: '#166534', marginTop: '4px', display: 'block' }}>
                          Supervising: {room.student_count || 0} students
                        </span>
                      </div>
                    ) : (
                      <div className={styles.unassignedRoomBox}>
                        <div className={styles.unassignedRoomTitle}>Assigned Room</div>
                        <div className={styles.unassignedRoomName}>Not supervising a room</div>
                      </div>
                    )}

                    <div className={styles.cardFooter}>
                      <button
                        className={styles.btnStart}
                        onClick={() => handleOpenRollCall(exam)}
                        disabled={!room}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        Open Roll Call Register
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ==========================================================================
           ROLL CALL / ATTENDANCE SHEET REGISTER MODE
           ========================================================================== */
        <div className={styles.mainPage}>
          <div className={styles.headerContainer}>
            <div className={styles.headerLeft}>
              <button className={styles.backBtn} onClick={handleBackToList}>
                ← Back to exams list
              </button>
              <h2 className={styles.pageTitle}>{selectedExam.module} Roll Call</h2>
              <p className={styles.pageSubtitle}>
                Mark students present or absent. Updates are synchronized immediately with the server.
              </p>
            </div>
          </div>

          {attendanceError ? (
            <div className={styles.errorAlert}>
              <p>{attendanceError}</p>
              <button
                className={styles.filterTab}
                style={{ marginTop: '12px' }}
                onClick={handleBackToList}
              >
                Go Back
              </button>
            </div>
          ) : loadingAttendance ? (
            <div className={styles.loadingScreen}>
              <div className={styles.loadingSpinner} />
              <p>Opening roll call register & loading student allocations...</p>
            </div>
          ) : (
            <div className={styles.attendanceLayout}>
              {/* Left Main panel with Student list */}
              <div className={styles.attendanceMain}>
                <div className={styles.examMetaGrid}>
                  <div>
                    <div className={styles.metaItemTitle}>Exam Room</div>
                    <div className={styles.metaItemValue}>{attendanceData?.room_name}</div>
                    <div className={styles.metaItemSub}>ESI SBA Allocation</div>
                  </div>
                  <div>
                    <div className={styles.metaItemTitle}>Date & Time</div>
                    <div className={styles.metaItemValue}>
                      {formatTime(selectedExam.start_time)} - {formatTime(selectedExam.end_time)}
                    </div>
                    <div className={styles.metaItemSub}>{formatDate(selectedExam.date)}</div>
                  </div>
                  <div>
                    <div className={styles.metaItemTitle}>Exam Type</div>
                    <div className={styles.metaItemValue}>{selectedExam.exam_type?.replace('_', ' ')}</div>
                    <div className={styles.metaItemSub}>
                      {selectedExam.year} {selectedExam.speciality ? ` - ${selectedExam.speciality}` : ''}
                    </div>
                  </div>
                </div>

                {/* List Controls */}
                <div className={styles.listHeader}>
                  <div className={styles.searchWrapper}>
                    <svg
                      className={styles.searchIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Search name, reg number or group..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className={styles.filterTabs}>
                    <button
                      className={`${styles.filterTab} ${studentFilterTab === 'all' ? styles.filterTabActive : ''}`}
                      onClick={() => setStudentFilterTab('all')}
                    >
                      All students ({totalStudents})
                    </button>
                    <button
                      className={`${styles.filterTab} ${studentFilterTab === 'present' ? styles.filterTabActive : ''}`}
                      onClick={() => setStudentFilterTab('present')}
                    >
                      Present ({presentCount})
                    </button>
                    <button
                      className={`${styles.filterTab} ${studentFilterTab === 'absent' ? styles.filterTabActive : ''}`}
                      onClick={() => setStudentFilterTab('absent')}
                    >
                      Absent ({absentCount})
                    </button>
                    <button
                      className={`${styles.filterTab} ${studentFilterTab === 'unmarked' ? styles.filterTabActive : ''}`}
                      onClick={() => setStudentFilterTab('unmarked')}
                    >
                      Unmarked ({unmarkedCount})
                    </button>
                  </div>
                </div>

                {/* Students list */}
                <div className={styles.studentList}>
                  {filteredStudents.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      No students found matching your filters.
                    </div>
                  ) : (
                    filteredStudents.map((student, idx) => {
                      const isPending = pendingUpdates.has(student.record_id);
                      return (
                        <div key={student.record_id} className={styles.studentRow}>
                          <div className={styles.studentInfo}>
                            <div className={styles.seatNumber} title="Seat Number">
                              {idx + 1}
                            </div>
                            <div className={styles.studentAvatar}>
                              {getInitials(student.full_name)}
                            </div>
                            <div className={styles.studentDetails}>
                              <div className={styles.studentName}>{student.full_name}</div>
                              <div className={styles.studentSub}>
                                Reg: {student.registration_number || 'N/A'} • Group: {student.group || 'N/A'}
                              </div>
                            </div>
                          </div>

                          <div className={styles.rowStatusWrapper}>
                            {isPending && (
                              <div className={styles.savingIndicator}>
                                <div className={styles.spinner} />
                                <span>Saving...</span>
                              </div>
                            )}

                            {!isPending && student.status && student.status !== 'unmarked' && (
                              <div className={styles.statusIndicator}>
                                <span
                                  className={`${styles.statusIndicatorDot} ${
                                    student.status === 'present' ? styles.dotPresent : styles.dotAbsent
                                  }`}
                                />
                                <span
                                  style={{
                                    color: student.status === 'present' ? '#059669' : '#dc2626',
                                    fontWeight: '600',
                                    textTransform: 'capitalize',
                                  }}
                                >
                                  {student.status}
                                </span>
                              </div>
                            )}

                            <div className={styles.btnGroup}>
                              <button
                                className={`${styles.statusBtn} ${
                                  student.status === 'present' ? styles.btnPresentOn : ''
                                }`}
                                onClick={() => handleStatusChange(student.record_id, 'present')}
                                disabled={isPending}
                              >
                                Present
                              </button>
                              <button
                                className={`${styles.statusBtn} ${
                                  student.status === 'absent' ? styles.btnAbsentOn : ''
                                }`}
                                onClick={() => handleStatusChange(student.record_id, 'absent')}
                                disabled={isPending}
                              >
                                Absent
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Summary column */}
              <div className={styles.attendanceRight}>
                <div className={styles.summaryCard}>
                  <h3 className={styles.summaryTitle}>Attendance Progress</h3>
                  <div className={styles.progressSection}>
                    <div className={styles.progressLabelWrapper}>
                      <span>Completion Rate</span>
                      <span>{completionPercentage}%</span>
                    </div>
                    <div className={styles.progressBarContainer}>
                      <div
                        className={styles.progressBar}
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className={styles.coSupervisorsList} style={{ marginTop: '24px' }}>
                    <div className={styles.coSupervisorLabel}>Co-Supervisors</div>
                    <div className={styles.coSupervisorsText}>{coSupervisors}</div>
                  </div>
                </div>

                <div className={styles.summaryCard}>
                  <h3 className={styles.summaryTitle}>Statistics Summary</h3>
                  <div className={styles.statsGrid}>
                    <div className={styles.statBox}>
                      <div className={styles.statVal}>{presentCount}</div>
                      <div className={styles.statLbl}>Present</div>
                    </div>
                    <div className={styles.statBox}>
                      <div className={styles.statVal}>{absentCount}</div>
                      <div className={styles.statLbl}>Absent</div>
                    </div>
                  </div>
                  <div className={styles.statBox} style={{ width: '100%' }}>
                    <div className={styles.statVal}>{unmarkedCount}</div>
                    <div className={styles.statLbl}>Unmarked / Remaining</div>
                  </div>
                </div>

                <button className={styles.btnComplete} onClick={handleBackToList}>
                  Finish & Close Register
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
