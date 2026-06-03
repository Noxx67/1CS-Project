import { useEffect, useMemo, useRef, useState } from 'react';
import ScolaritePageHeader from '../components/ScolaritePageHeader';
import { SchedulesProvider, useSchedules } from '../context/SchedulesContext';
import { fetchExams, createExam, updateExam, deleteExam, createReplacementExam, fetchEligibleForReplacement } from '../services/schedulesEndpoint';
import api from '../api/axios';
import dashboardStyles from './ScolariteDashboardPage.module.css';
import styles from './ScolariteScheduleExamsPage.module.css';


function Icon({ name }) {
  if (name === 'exam') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 4.5h6l3.5 3.5v11.5H8a2.5 2.5 0 0 1-2.5-2.5v-10A2.5 2.5 0 0 1 8 4.5Z" />
        <path d="M13.5 4.8V8.5H17" />
        <path d="M9 13h6M9 16h4" />
      </svg>
    );
  }

  if (name === 'room') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="4.5" width="14" height="15" rx="2" />
        <path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 19.5v-3h4v3" />
      </svg>
    );
  }

  if (name === 'check') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="7.2" />
        <path d="m8.8 12.2 2 2 4.4-4.5" />
      </svg>
    );
  }

  if (name === 'plus') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === 'print') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 8V4.5h10V8" />
        <rect x="5" y="8" width="14" height="8" rx="2" />
        <path d="M8 14h8v5H8v-5Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="5.5" width="14" height="14" rx="2.4" />
      <path d="M8.5 3.5v4M15.5 3.5v4M5 10h14M9 14h2.5M13.5 14H15" />
    </svg>
  );
}

function normalizeValue(value) {
  return String(value || '').trim().toLowerCase();
}

function timeToMinutes(value) {
  const [hours, minutes] = String(value || '').split(':').map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
}

function sessionsOverlap(firstSession, secondSession) {
  if (
    normalizeValue(firstSession.day) !== normalizeValue(secondSession.day)
    || normalizeValue(firstSession.room) !== normalizeValue(secondSession.room)
  ) {
    return false;
  }

  return timeToMinutes(firstSession.startTime) < timeToMinutes(secondSession.endTime)
    && timeToMinutes(secondSession.startTime) < timeToMinutes(firstSession.endTime);
}

function isExamSession(session) {
  return [session.sessionName, session.sessionType]
    .some((value) => normalizeValue(value).includes('exam'));
}

function matchesSearch(values, searchQuery) {
  const normalizedQuery = normalizeValue(searchQuery);

  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) => normalizeValue(value).includes(normalizedQuery));
}

function MetricCard({ value, label, helper, tone, icon }) {
  const toneClass = dashboardStyles[`metricIcon${tone}`] || dashboardStyles.metricIconblue;

  return (
    <article className={`${dashboardStyles.metricCard} ${styles.metricCard}`}>
      <div className={dashboardStyles.metricCopy}>
        <strong className={`${dashboardStyles.metricValue} ${tone === 'red' ? dashboardStyles.metricValueDanger : ''}`}>
          {value}
        </strong>
        <span className={dashboardStyles.metricLabel}>{label}</span>
        <span className={dashboardStyles.metricHelper}>{helper}</span>
      </div>
      <span className={`${dashboardStyles.metricIcon} ${toneClass}`}>
        <Icon name={icon} />
      </span>
    </article>
  );
}

function getSessionGroupsLabel(session) {
  return session.assignedGroups.length ? session.assignedGroups.join(', ') : `Section ${session.section}`;
}

function ScheduleExamsContent() {
  const {
    sessions,
    loading,
    error,
    loadSessions,
    loadMetadata,
  } = useSchedules();
  
  const [localMetadata, setLocalMetadata] = useState({ teachers: [], years: [], groups: [], days: [] });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const printAreaRef = useRef(null);

  // Exam list states
  const [examsList, setExamsList] = useState([]);
  const [examsLoading, setExamsLoading] = useState(false);

  // Unified Create/Edit Modal State
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [examForm, setExamForm] = useState({
    module: '',
    exam_type: 'TD',
    date: '',
    start_time: '08:30',
    end_time: '10:00',
    year: '1CS',
    speciality: '',
    teachers: [],
    rooms: [],
  });

  // Replacement exam modal state
  const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
  const [replacementSourceExam, setReplacementSourceExam] = useState(null);
  const [eligibleStudents, setEligibleStudents] = useState({ count: 0, students: [] });
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [replacementForm, setReplacementForm] = useState({
    date: '',
    start_time: '08:30',
    end_time: '10:00',
    teachers: [],
    rooms: [{ name: 'Salle 1', type: 'SALLE', capacity: 20 }],
  });
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedExamDetails, setSelectedExamDetails] = useState(null);
  const [selectedRoomAssignments, setSelectedRoomAssignments] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadExamsList = async () => {
    setExamsLoading(true);
    try {
      const data = await fetchExams();
      setExamsList(data);
    } catch (e) {
      console.error("Failed to fetch exams:", e);
    } finally {
      setExamsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions({}).catch(() => {});
    loadExamsList();
    loadMetadata().then(m => setLocalMetadata(m)).catch(() => {});
  }, [loadSessions, loadMetadata]);

  // Year/Specialty logic (same as session editor)
  const isSpecialtySupported = examForm.year === '2CS' || examForm.year === '3CS';

  const handleOpenNewExam = () => {
    setEditingExam(null);
    setExamForm({
      module: '',
      exam_type: 'TD',
      date: new Date().toISOString().split('T')[0],
      start_time: '08:30',
      end_time: '10:00',
      year: '1CS',
      speciality: '',
      teachers: [],
      rooms: [{ name: 'Amphi A', capacity: 80, type: 'AMPHI' }],
    });
    setIsExamModalOpen(true);
  };

  const handleOpenEditExam = (exam) => {
    setEditingExam(exam);
    setExamForm({
      module: exam.module,
      exam_type: exam.exam_type,
      date: exam.date,
      start_time: exam.start_time.slice(0, 5),
      end_time: exam.end_time.slice(0, 5),
      year: exam.year || '1CS',
      speciality: exam.speciality || '',
      teachers: exam.teachers || [],
      rooms: exam.rooms ? exam.rooms.map(r => ({ name: r.room_name, capacity: r.capacity, type: r.room_type })) : [],
      is_replacement: exam.is_replacement || false,
      original_exam: exam.original_exam || null,
    });
    setIsExamModalOpen(true);
  };

  const handleExamInputChange = (field, value) => {
    setExamForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'year') {
        const nextSpecialtySupported = value === '2CS' || value === '3CS';
        updated.speciality = nextSpecialtySupported ? prev.speciality : '';
      }
      return updated;
    });
  };

  const handleTeacherCheckboxChange = (teacherId) => {
    setExamForm((prev) => {
      const isSelected = prev.teachers.includes(teacherId);
      const nextTeachers = isSelected
        ? prev.teachers.filter((id) => id !== teacherId)
        : [...prev.teachers, teacherId];
      return { ...prev, teachers: nextTeachers };
    });
  };

  const handleExamSubmit = async (e) => {
    e.preventDefault();
    if (!examForm.module || !examForm.date || !examForm.start_time || !examForm.end_time || !examForm.year) {
      alert("Please fill all required fields");
      return;
    }
    try {
      if (editingExam) {
        // ensure we keep replacement flags when updating
        const payload = { ...examForm };
        if (editingExam.is_replacement) {
          payload.is_replacement = true;
          payload.original_exam = editingExam.original_exam || examForm.original_exam || null;
        }
        await updateExam(editingExam.id, payload);
      } else {
        await createExam(examForm);
      }
      setIsExamModalOpen(false);
      loadExamsList();
    } catch (err) {
      console.error("Failed to save exam:", err);
      alert(err.response?.data?.detail || "Failed to save exam.");
    }
  };

  const handleOpenReplacementModal = async (exam) => {
    setReplacementSourceExam(exam);
    setReplacementForm({
      date: '',
      start_time: '08:30',
      end_time: '10:00',
      teachers: [],
      rooms: [{ name: 'Salle 1', type: 'SALLE', capacity: 20 }],
    });
    setIsReplacementModalOpen(true);
    setEligibleLoading(true);
    try {
      const data = await fetchEligibleForReplacement(exam.id);
      setEligibleStudents(data);
    } catch (e) {
      setEligibleStudents({ count: 0, students: [] });
    } finally {
      setEligibleLoading(false);
    }
  };

  const handleReplacementSubmit = async (e) => {
    e.preventDefault();
    if (!replacementForm.date || !replacementForm.start_time || !replacementForm.end_time) {
      alert('Please fill all required fields');
      return;
    }
    if (replacementForm.rooms.length === 0) {
      alert('At least one room is required.');
      return;
    }
    try {
      await createReplacementExam(replacementSourceExam.id, {
        module: replacementSourceExam.module,
        exam_type: replacementSourceExam.exam_type,
        year: replacementSourceExam.year,
        speciality: replacementSourceExam.speciality || '',
        date: replacementForm.date,
        start_time: replacementForm.start_time,
        end_time: replacementForm.end_time,
        teachers: replacementForm.teachers,
        rooms: replacementForm.rooms,
      });
      setIsReplacementModalOpen(false);
      loadExamsList();
    } catch (err) {
      console.error('Failed to create replacement exam:', err);
      alert(err.response?.data?.detail || 'Failed to create replacement exam.');
    }
  };

  const handleDeleteExamClick = async (examId) => {
    if (window.confirm("Are you sure you want to delete this exam? All assigned seating and supervisors will be deleted.")) {
      try {
        await deleteExam(examId);
        loadExamsList();
      } catch (err) {
        console.error("Failed to delete exam:", err);
        alert("Failed to delete exam.");
      }
    }
  };

  const handleOpenDetails = async (exam) => {
    setSelectedExamDetails(exam);
    setIsDetailsModalOpen(true);
    setDetailsLoading(true);
    try {
      // Fetch details
      const response = await api.get(`schedules/exams/${exam.id}/`);
      const examDetail = response.data;
      
      // Fetch student assignments
      const assResponse = await api.get(`schedules/exam-attendance/?exam=${exam.id}`);
      const allRecords = assResponse.data;
      
      // Group assignments by room
      const roomsWithStudents = examDetail.rooms.map((room) => {
        const roomRecords = allRecords.filter((r) => r.exam_room === room.id);
        return {
          ...room,
          students: roomRecords
        };
      });
      setSelectedRoomAssignments(roomsWithStudents);
    } catch (err) {
      console.error("Failed to fetch room assignments:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredSessions = useMemo(
    () => sessions.filter((session) => (
      (!programFilter || session.year === programFilter)
      && (!groupFilter || session.assignedGroups.includes(groupFilter))
      && matchesSearch([
        session.sessionName,
        session.sessionType,
        session.responsibleTeacherName,
        session.year,
        session.specialty,
        session.section,
        session.assignedGroups.join(' '),
        session.room,
        session.day,
      ], searchQuery)
    )),
    [groupFilter, programFilter, searchQuery, sessions],
  );

  const days = useMemo(
    () => (localMetadata.days?.length ? localMetadata.days : [...new Set(sessions.map((session) => session.day).filter(Boolean))]),
    [localMetadata.days, sessions],
  );
  const timeSlots = useMemo(
    () => [...new Map(filteredSessions.map((session) => [
      `${session.startTime}-${session.endTime}`,
      { startTime: session.startTime, endTime: session.endTime },
    ])).values()].sort((firstSlot, secondSlot) => firstSlot.startTime.localeCompare(secondSlot.startTime)),
    [filteredSessions],
  );
  const groupOptions = useMemo(
    () => {
      const metadataGroups = (localMetadata.groups || []).map((group) => group.code || group.label).filter(Boolean);
      const sessionGroups = sessions.flatMap((session) => session.assignedGroups);
      return [...new Set([...metadataGroups, ...sessionGroups])];
    },
    [localMetadata.groups, sessions],
  );
  const programOptions = useMemo(
    () => {
      const sessionYears = sessions.map((session) => session.year).filter(Boolean);
      return [...new Set([...(localMetadata.years || []), ...sessionYears])];
    },
    [localMetadata.years, sessions],
  );
  const examSessions = useMemo(
    () => filteredSessions.filter(isExamSession),
    [filteredSessions],
  );
  const activeRoomsCount = useMemo(
    () => new Set(filteredSessions.map((session) => session.room).filter(Boolean)).size,
    [filteredSessions],
  );
  const conflictCount = useMemo(
    () => filteredSessions.reduce((count, session, index) => (
      count + filteredSessions.slice(index + 1).filter((nextSession) => sessionsOverlap(session, nextSession)).length
    ), 0),
    [filteredSessions],
  );

  function getSessionForCell(day, slot) {
    return filteredSessions.find((session) => (
      session.day === day
      && session.startTime === slot.startTime
      && session.endTime === slot.endTime
    ));
  }

  function handlePrint() {
    const printContent = printAreaRef.current;

    if (!printContent) {
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1100,height=800');

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Weekly Timetable</title>
          <style>
            body { margin: 24px; font-family: Arial, sans-serif; color: #092452; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            th, td { border: 1px solid #d9e2ef; padding: 8px; vertical-align: top; font-size: 12px; }
            thead th, tbody th { background: #f7fafc; font-weight: 800; text-align: center; }
            article { min-height: 72px; border-left: 3px solid #092452; border-radius: 4px; padding: 10px; background: #e8f2ff; }
            article strong, article span, article small { display: block; }
            article strong { font-size: 12px; }
            article span, article small { margin-top: 5px; color: #66758f; font-size: 11px; }
          </style>
        </head>
        <body>${printContent.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  return (
    <div className={dashboardStyles.page}>
      <ScolaritePageHeader
        title="Schedule & Exams"
        breadcrumb="Home / Schedule & Exams"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className={dashboardStyles.content}>
        {error ? <div className={dashboardStyles.errorBanner}>{error}</div> : null}

        <section className={dashboardStyles.metricsGrid}>
          <MetricCard value={filteredSessions.length} label="Scheduled Classes" helper="Weekly active sessions" tone="blue" icon="calendar" />
          <MetricCard value={examsList.length} label="Scheduled Exams" helper="Exams in exam system database" tone="orange" icon="exam" />
          <MetricCard value={activeRoomsCount} label="Active Rooms" helper="Rooms used by visible sessions" tone="sky" icon="room" />
          <MetricCard value={conflictCount} label="Conflicts Detected" helper={conflictCount ? 'Review overlapping sessions' : 'Schedules are clear'} tone={conflictCount ? 'red' : 'success'} icon="check" />
        </section>

        <section style={{ marginTop: '24px' }}>
          <div className={dashboardStyles.panel} style={{ maxWidth: '100%' }}>
            <div className={styles.examHeader}>
              <h2>Upcoming Exams</h2>
              <button type="button" onClick={handleOpenNewExam}>
                <Icon name="plus" />
                New Exam
              </button>
            </div>

            {examsLoading ? (
              <p className={dashboardStyles.emptyState}>Loading exams...</p>
            ) : examsList.length === 0 ? (
              <p className={dashboardStyles.emptyState}>No exams have been added to the system yet.</p>
            ) : (
              <ul className={styles.examList} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', listStyle: 'none', padding: 0, margin: 0 }}>
                {examsList.map((exam) => (
                  <li key={exam.id}>
                      <div className={styles.examTopline}>
                        <div>
                          <strong>{exam.module}</strong>
                          <span>{exam.year} {exam.speciality && exam.speciality !== 'N/A' ? `- ${exam.speciality}` : ''}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {exam.is_replacement && (
                            <span className={styles.replacementBadge} style={{ background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>
                              Replacement
                            </span>
                          )}
                          <b>{exam.exam_type}</b>
                        </div>
                      </div>
                    <dl>
                      <div>
                        <dt>Date</dt>
                        <dd>{new Date(exam.date).toLocaleDateString()}</dd>
                      </div>
                      <div>
                        <dt>Time</dt>
                        <dd>{exam.start_time.slice(0, 5)} - {exam.end_time.slice(0, 5)}</dd>
                      </div>
                      <div>
                        <dt>Teachers Assigned</dt>
                        <dd>{exam.teachers_details?.length || 0} teachers</dd>
                      </div>
                      <div>
                        <dt>Total Students</dt>
                        <dd>{exam.student_count || 0} students</dd>
                      </div>
                    </dl>
                      <div className={styles.examActions}>
                        <button type="button" onClick={() => handleOpenEditExam(exam)}>Edit</button>
                        <button type="button" onClick={() => handleOpenDetails(exam)}>Seatings</button>
                        {!exam.is_replacement && (
                          <button type="button" onClick={() => handleOpenReplacementModal(exam)} style={{ gridColumn: 'span 2', borderColor: '#6366f1', color: '#6366f1', marginTop: '4px' }}>+ Replacement Exam</button>
                        )}
                        <button type="button" style={{ gridColumn: 'span 2', borderColor: '#ef4444', color: '#ef4444', marginTop: '4px' }} onClick={() => handleDeleteExamClick(exam.id)}>Delete Exam</button>
                      </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      {/* Unified Create/Edit Exam Modal */}
      {isExamModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingExam ? 'Edit Exam' : 'Create New Exam'}</h3>
              <button className={styles.closeButton} onClick={() => setIsExamModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleExamSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formFieldFull}>
                    <label className={styles.formLabel}>
                      Module Name *
                      <input
                        type="text"
                        className={styles.input}
                        required
                        value={examForm.module}
                        onChange={(e) => handleExamInputChange('module', e.target.value)}
                        placeholder="e.g., ARCH, SYS, ALGO..."
                      />
                    </label>
                  </div>

                  <div>
                    <label className={styles.formLabel}>
                      Exam Type *
                      <select
                        className={styles.select}
                        value={examForm.exam_type}
                        onChange={(e) => handleExamInputChange('exam_type', e.target.value)}
                      >
                        <option value="TD">TD</option>
                        <option value="TD_COLLECTIF">TD Collectif</option>
                        <option value="EXAM">Examen</option>
                        <option value="PARTIEL">Partiel</option>
                      </select>
                    </label>
                  </div>

                  <div>
                    <label className={styles.formLabel}>
                      Promotion (Year) *
                      <select
                        className={styles.select}
                        value={examForm.year}
                        onChange={(e) => handleExamInputChange('year', e.target.value)}
                      >
                        <option value="1CP">1CP</option>
                        <option value="2CP">2CP</option>
                        <option value="1CS">1CS</option>
                        <option value="2CS">2CS</option>
                        <option value="3CS">3CS</option>
                      </select>
                    </label>
                  </div>

                  <div>
                    <label className={styles.formLabel}>
                      Specialty
                      <select
                        className={styles.select}
                        disabled={!isSpecialtySupported}
                        value={examForm.speciality}
                        onChange={(e) => handleExamInputChange('speciality', e.target.value)}
                      >
                        <option value="">All Specialties / None</option>
                        <option value="ISI">ISI</option>
                        <option value="SIW">SIW</option>
                        <option value="IASD">IASD</option>
                        <option value="Cybersecurity">Cybersecurity</option>
                      </select>
                    </label>
                  </div>

                  <div>
                    <label className={styles.formLabel}>
                      Date *
                      <input
                        type="date"
                        className={styles.input}
                        required
                        value={examForm.date}
                        onChange={(e) => handleExamInputChange('date', e.target.value)}
                      />
                    </label>
                  </div>

                  <div>
                    <label className={styles.formLabel}>
                      Start Time *
                      <input
                        type="time"
                        className={styles.input}
                        required
                        value={examForm.start_time}
                        onChange={(e) => handleExamInputChange('start_time', e.target.value)}
                      />
                    </label>
                  </div>

                  <div>
                    <label className={styles.formLabel}>
                      End Time *
                      <input
                        type="time"
                        className={styles.input}
                        required
                        value={examForm.end_time}
                        onChange={(e) => handleExamInputChange('end_time', e.target.value)}
                      />
                    </label>
                  </div>

                  <div className={styles.formFieldFull}>
                    <label className={styles.formLabel}>
                      Exam Rooms & Capacity *
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {examForm.rooms.map((room, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Room Name"
                            className={styles.input}
                            value={room.name}
                            onChange={(e) => {
                              const newRooms = [...examForm.rooms];
                              newRooms[idx].name = e.target.value;
                              handleExamInputChange('rooms', newRooms);
                            }}
                            required
                          />
                          <select
                            className={styles.select}
                            value={room.type}
                            onChange={(e) => {
                              const newRooms = [...examForm.rooms];
                              newRooms[idx].type = e.target.value;
                              handleExamInputChange('rooms', newRooms);
                            }}
                          >
                            <option value="AMPHI">Amphi</option>
                            <option value="SALLE">Salle</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Capacity"
                            className={styles.input}
                            value={room.capacity}
                            onChange={(e) => {
                              const newRooms = [...examForm.rooms];
                              newRooms[idx].capacity = parseInt(e.target.value) || 0;
                              handleExamInputChange('rooms', newRooms);
                            }}
                            required
                            style={{ width: '80px' }}
                          />
                          <button type="button" onClick={() => {
                            const newRooms = examForm.rooms.filter((_, i) => i !== idx);
                            handleExamInputChange('rooms', newRooms);
                          }} style={{ padding: '8px', color: 'red', border: '1px solid red', borderRadius: '4px', background: 'transparent', cursor: 'pointer' }}>
                            &times;
                          </button>
                        </div>
                      ))}
                      {examForm.rooms.length === 0 && <span style={{color: 'red', fontSize: '12px'}}>At least one room is required.</span>}
                      <button type="button" onClick={() => {
                        handleExamInputChange('rooms', [...examForm.rooms, { name: '', type: 'SALLE', capacity: 20 }]);
                      }} style={{ alignSelf: 'flex-start', padding: '8px 12px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '4px', fontSize: '14px' }}>
                        + Add Room
                      </button>
                    </div>
                  </div>

                  <div className={styles.formFieldFull}>
                    <label className={styles.formLabel}>
                      Select Supervising Staff * (Check teachers to assign)
                      <div className={styles.teacherSelection}>
                        {localMetadata.teachers?.map((t) => (
                          <label key={t.id} className={styles.teacherCheckbox}>
                            <input
                              type="checkbox"
                              checked={examForm.teachers.includes(t.id)}
                              onChange={() => handleTeacherCheckboxChange(t.id)}
                            />
                            {t.name}
                          </label>
                        ))}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setIsExamModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.btnConfirm}>
                  {editingExam ? 'Save Changes' : 'Schedule Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seatings / Room Assignments Details Modal */}
      {isDetailsModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.modalContentLarge}`}>
            <div className={styles.modalHeader}>
              <h3>Room & Supervision Assignments</h3>
              <button className={styles.closeButton} onClick={() => setIsDetailsModalOpen(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              {detailsLoading ? (
                <p>Loading assignments details...</p>
              ) : selectedRoomAssignments.length === 0 ? (
                <p>No room assignments generated yet.</p>
              ) : (
                <div className={styles.roomList}>
                  {selectedRoomAssignments.map((room) => (
                    <div key={room.id} className={styles.roomCard}>
                      <div className={styles.roomCardHeader}>
                        <h4>{room.room_name}</h4>
                        <span className={styles.roomBadge}>{room.room_type}</span>
                      </div>
                      <div className={styles.supervisorsList}>
                        <strong>Supervisors assigned:</strong>{' '}
                        {room.supervisors_details?.length > 0 
                          ? room.supervisors_details.map(s => s.full_name).join(', ') 
                          : 'None'}
                      </div>
                      <div className={styles.roomCapacityLabel} style={{ marginBottom: '8px' }}>
                        Capacity: {room.capacity} | Assigned: {room.students?.length || 0}
                      </div>
                      <div className={styles.studentTableWrap}>
                        <table className={styles.studentTable}>
                          <thead>
                            <tr>
                              <th>Seat</th>
                              <th>Name</th>
                              <th>Reg Number</th>
                              <th>Group</th>
                            </tr>
                          </thead>
                          <tbody>
                            {room.students?.length > 0 ? (
                              room.students.map((rec, idx) => (
                                <tr key={rec.id}>
                                  <td><strong>{idx + 1}</strong></td>
                                  <td>{rec.student_name}</td>
                                  <td>{rec.registration_number || 'N/A'}</td>
                                  <td>{rec.group || 'N/A'}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" style={{ textAlign: 'center', color: '#66758f' }}>No students in this room</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnCancel} onClick={() => setIsDetailsModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Replacement Exam Modal */}
      {isReplacementModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Schedule Replacement Exam — {replacementSourceExam?.module}</h3>
              <button className={styles.closeButton} onClick={() => setIsReplacementModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleReplacementSubmit}>
              <div className={styles.modalBody}>
                {eligibleLoading ? (
                  <p>Loading eligible students…</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <strong>Eligible students:</strong> {eligibleStudents?.count || 0}
                      <div style={{ maxHeight: 160, overflow: 'auto', marginTop: 8 }}>
                        {eligibleStudents?.students?.length ? (
                          eligibleStudents.students.map((s) => (
                            <div key={s.student_id} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                              {s.full_name} — {s.registration_number || 'N/A'}
                            </div>
                          ))
                        ) : (
                          <div style={{ color: '#66758f' }}>No eligible students found for this exam.</div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <label className={styles.formLabel}>
                        Date *
                        <input type="date" className={styles.input} value={replacementForm.date} onChange={(e) => setReplacementForm(prev => ({ ...prev, date: e.target.value }))} required />
                      </label>

                      <label className={styles.formLabel}>
                        Start Time *
                        <input type="time" className={styles.input} value={replacementForm.start_time} onChange={(e) => setReplacementForm(prev => ({ ...prev, start_time: e.target.value }))} required />
                      </label>

                      <label className={styles.formLabel}>
                        End Time *
                        <input type="time" className={styles.input} value={replacementForm.end_time} onChange={(e) => setReplacementForm(prev => ({ ...prev, end_time: e.target.value }))} required />
                      </label>

                      <label className={styles.formLabel}>
                        Supervising Staff
                        <div className={styles.teacherSelection} style={{ maxHeight: 160, overflow: 'auto' }}>
                          {localMetadata.teachers?.map((t) => (
                            <label key={t.id} className={styles.teacherCheckbox} style={{ display: 'block' }}>
                              <input
                                type="checkbox"
                                checked={replacementForm.teachers.includes(t.id)}
                                onChange={() => setReplacementForm(prev => ({ ...prev, teachers: prev.teachers.includes(t.id) ? prev.teachers.filter(id => id !== t.id) : [...prev.teachers, t.id] }))}
                              />
                              {t.name}
                            </label>
                          ))}
                        </div>
                      </label>
                    </div>

                    <div className={styles.formFieldFull}>
                      <label className={styles.formLabel}>Rooms & Capacity *</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {replacementForm.rooms.map((room, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="text" placeholder="Room Name" className={styles.input} value={room.name} onChange={(e) => {
                              const newRooms = [...replacementForm.rooms]; newRooms[idx].name = e.target.value; setReplacementForm(prev => ({ ...prev, rooms: newRooms }));
                            }} required />
                            <select className={styles.select} value={room.type} onChange={(e) => { const newRooms = [...replacementForm.rooms]; newRooms[idx].type = e.target.value; setReplacementForm(prev => ({ ...prev, rooms: newRooms })); }}>
                              <option value="AMPHI">Amphi</option>
                              <option value="SALLE">Salle</option>
                            </select>
                            <input type="number" placeholder="Capacity" className={styles.input} value={room.capacity} onChange={(e) => { const newRooms = [...replacementForm.rooms]; newRooms[idx].capacity = parseInt(e.target.value) || 0; setReplacementForm(prev => ({ ...prev, rooms: newRooms })); }} style={{ width: 80 }} required />
                            <button type="button" onClick={() => { const newRooms = replacementForm.rooms.filter((_, i) => i !== idx); setReplacementForm(prev => ({ ...prev, rooms: newRooms })); }} style={{ padding: '8px', color: 'red', border: '1px solid red', borderRadius: 4, background: 'transparent' }}>&times;</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => setReplacementForm(prev => ({ ...prev, rooms: [...prev.rooms, { name: '', type: 'SALLE', capacity: 20 }] }))} style={{ alignSelf: 'flex-start', padding: '8px 12px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: 4 }}>+ Add Room</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setIsReplacementModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.btnConfirm}>Create Replacement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScolariteScheduleExamsPage() {
  return (
    <SchedulesProvider>
      <ScheduleExamsContent />
    </SchedulesProvider>
  );
}
