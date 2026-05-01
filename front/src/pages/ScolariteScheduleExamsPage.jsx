import { useEffect, useMemo, useRef, useState } from 'react';
import ScolaritePageHeader from '../components/ScolaritePageHeader';
import { SchedulesProvider, useSchedules } from '../context/SchedulesContext';
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
    metadata,
    sessions,
    loading,
    error,
    loadSessions,
  } = useSchedules();
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const printAreaRef = useRef(null);

  useEffect(() => {
    loadSessions({}).catch(() => {});
  }, [loadSessions]);

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
    () => (metadata.days?.length ? metadata.days : [...new Set(sessions.map((session) => session.day).filter(Boolean))]),
    [metadata.days, sessions],
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
      const metadataGroups = (metadata.groups || []).map((group) => group.code || group.label).filter(Boolean);
      const sessionGroups = sessions.flatMap((session) => session.assignedGroups);
      return [...new Set([...metadataGroups, ...sessionGroups])];
    },
    [metadata.groups, sessions],
  );
  const programOptions = useMemo(
    () => {
      const sessionYears = sessions.map((session) => session.year).filter(Boolean);
      return [...new Set([...(metadata.years || []), ...sessionYears])];
    },
    [metadata.years, sessions],
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
          <MetricCard value={examSessions.length} label="Upcoming Exams" helper="Exam sessions in schedule data" tone="orange" icon="exam" />
          <MetricCard value={activeRoomsCount} label="Active Rooms" helper="Rooms used by visible sessions" tone="sky" icon="room" />
          <MetricCard value={conflictCount} label="Conflicts Detected" helper={conflictCount ? 'Review overlapping sessions' : 'Schedules are clear'} tone={conflictCount ? 'red' : 'success'} icon="check" />
        </section>

        <section className={styles.pageGrid}>
          <article className={dashboardStyles.panel}>
            <div className={dashboardStyles.panelHeader}>
              <div>
                <h2>Weekly Timetable</h2>
                <p>View and manage class schedules by program and group.</p>
              </div>
            </div>

            <div className={styles.toolbar}>
              <label>
                <span>Program</span>
                <select value={programFilter} onChange={(event) => setProgramFilter(event.target.value)}>
                  <option value="">All Programs</option>
                  {programOptions.map((program) => <option key={program} value={program}>{program}</option>)}
                </select>
              </label>
              <label>
                <span>Group</span>
                <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
                  <option value="">All Groups</option>
                  {groupOptions.map((group) => <option key={group} value={group}>{group}</option>)}
                </select>
              </label>
              <button type="button" onClick={handlePrint}>
                <Icon name="print" />
                Print
              </button>
            </div>

            <div className={styles.timetableWrap} ref={printAreaRef}>
              <table className={styles.timetable}>
                <thead>
                  <tr>
                    <th>Time</th>
                    {days.map((day) => <th key={day}>{day}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={days.length + 1} className={styles.tableState}>Loading schedule...</td></tr>
                  ) : timeSlots.length === 0 ? (
                    <tr><td colSpan={days.length + 1} className={styles.tableState}>No sessions match the current filters.</td></tr>
                  ) : timeSlots.map((slot) => (
                    <tr key={`${slot.startTime}-${slot.endTime}`}>
                      <th>{slot.startTime}<br />{slot.endTime}</th>
                      {days.map((day) => {
                        const session = getSessionForCell(day, slot);
                        return (
                          <td key={`${day}-${slot.startTime}`}>
                            {session ? (
                              <article className={`${styles.sessionBlock} ${isExamSession(session) ? styles.examBlock : ''}`}>
                                <strong>{isExamSession(session) ? `Exam: ${session.sessionName.replace(/^exam:\s*/i, '')}` : session.sessionName}</strong>
                                <span>{session.responsibleTeacherName || session.sessionType}</span>
                                <small>{session.room}</small>
                              </article>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <aside className={dashboardStyles.panel}>
            <div className={styles.examHeader}>
              <h2>Upcoming Exams</h2>
              <button type="button" title="Exam creation flow will be connected after the sub-page design is ready">
                <Icon name="plus" />
                New Exam
              </button>
            </div>

            {loading ? (
              <p className={dashboardStyles.emptyState}>Loading exams...</p>
            ) : examSessions.length === 0 ? (
              <p className={dashboardStyles.emptyState}>No exam sessions are available in the current schedule data.</p>
            ) : (
              <ul className={styles.examList}>
                {examSessions.map((exam) => (
                  <li key={exam.id}>
                    <div className={styles.examTopline}>
                      <div>
                        <strong>{exam.sessionName}</strong>
                        <span>{exam.year} - {getSessionGroupsLabel(exam)}</span>
                      </div>
                      <b>{exam.day}</b>
                    </div>
                    <dl>
                      <div>
                        <dt>Date</dt>
                        <dd>{exam.day}</dd>
                      </div>
                      <div>
                        <dt>Time</dt>
                        <dd>{exam.startTime} - {exam.endTime}</dd>
                      </div>
                      <div>
                        <dt>Room</dt>
                        <dd>{exam.room}</dd>
                      </div>
                    </dl>
                    <div className={styles.examActions}>
                      <button type="button" disabled>Edit</button>
                      <button type="button" disabled>Supervisors</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </section>
      </main>
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
