import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeacherPortal } from '../context/TeacherPortalContext';
import api from '../api/axios';
import styles from './TeacherSessionsPage.module.css';

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

function fmt(t) {
  if (!t) return '--';
  return String(t).slice(0, 5);
}

function getWeekDates() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  // Build dates for Sun-Thu of this week
  return WEEK_DAYS.map((day, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - dayOfWeek + i);
    return { day, date: d };
  });
}

function formatHeaderDate(date) {
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}

function formatRowDate(session, weekDates) {
  const entry = weekDates.find((w) => w.day === session.day);
  if (!entry) return { top: session.day, sub: 'Week' };
  const today = new Date();
  const isToday = entry.date.toDateString() === today.toDateString();
  return {
    top: entry.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    sub: isToday ? 'Today' : 'Week',
    isToday,
  };
}

export default function TeacherSessionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startAttendance, attendanceLoading } = useTeacherPortal();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingId, setStartingId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null); // null = all days

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const weekDates = getWeekDates();

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('schedules/sessions/');
      const raw = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
          ? res.data.results
          : [];
      setSessions(raw);
    } catch (e) {
      console.error(e);
      setError('Could not load sessions — check the API is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  async function handleStart(sessionId) {
    setStartingId(sessionId);
    try {
      await startAttendance(String(sessionId));
      navigate(`/teacher/attendance?sessionId=${sessionId}`);
    } catch {
      setError('Failed to start attendance session.');
      setStartingId(null);
    }
  }

  // Derived stats
  const todaySessions = sessions.filter((s) => s.day === todayName);
  const totalThisWeek = sessions.filter((s) => WEEK_DAYS.includes(s.day)).length;

  // Which sessions to show in table
  const displayedSessions = (selectedDay
    ? sessions.filter((s) => s.day === selectedDay)
    : sessions
  ).sort((a, b) => {
    const di = WEEK_DAYS.indexOf(a.day) - WEEK_DAYS.indexOf(b.day);
    if (di !== 0) return di;
    return (a.start_time || '').localeCompare(b.start_time || '');
  });

  // Next sessions (today or upcoming, first 3)
  const nextSessions = [...sessions]
    .filter((s) => s.day === todayName)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
    .slice(0, 3);

  const teacherName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Teacher';

  return (
    <div className={styles.root}>
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <h1 className={styles.pageTitle}>My Sessions</h1>
          <p className={styles.pageDate}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button type="button" className={styles.weekBtn} onClick={() => setSelectedDay(null)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          week session
        </button>
      </div>

      {/* ── Search / alerts row ───────────────────────────────────── */}
      <div className={styles.searchRow}>
        <label className={styles.searchWrap}>
          <svg className={styles.searchIco} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="6.2" /><path d="M20 20l-4.2-4.2" />
          </svg>
          <input type="search" placeholder="Search students, departments, or records..." className={styles.searchInput} />
        </label>
        <div className={styles.alertChip}>
          <span className={styles.alertDot} />
          <span className={styles.alertText}>{todaySessions.length} TODAY</span>
        </div>
        <button className={styles.notifBtn}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4.5a4.8 4.8 0 0 0-4.8 4.8v2.1c0 1-.34 1.98-.95 2.78L4.8 16h14.4l-1.45-1.82a4.4 4.4 0 0 1-.95-2.78V9.3A4.8 4.8 0 0 0 12 4.5Z" />
            <path d="M9.9 18.2a2.1 2.1 0 0 0 4.2 0" />
          </svg>
        </button>
      </div>

      {/* ── Two-column body ───────────────────────────────────────── */}
      <div className={styles.body}>
        {/* LEFT — schedule table */}
        <section className={styles.mainPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Weekly schedule</h2>
              <p className={styles.panelSub}>
                All teaching sessions for {user?.year || ''} and preparatory classes, including room allocation and attendance state.
              </p>
            </div>
            <button className={styles.filterBtn}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              Filter sessions
            </button>
          </div>

          {/* Day tabs */}
          <div className={styles.dayTabs}>
            {weekDates.map(({ day, date }) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const count = sessions.filter((s) => s.day === day).length;
              const isSelected = selectedDay === day || (!selectedDay && isToday && day === todayName);
              return (
                <button
                  key={day}
                  type="button"
                  className={`${styles.dayTab} ${isSelected ? styles.dayTabActive : ''}`}
                  onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                >
                  <span className={styles.dayName}>{day.slice(0, 3)}</span>
                  <span className={styles.dayDate}>{formatHeaderDate(date)}</span>
                  {count > 0 && (
                    <span className={styles.dayCount}>
                      {count} session{count !== 1 ? 's' : ''}
                      {isToday && <span className={styles.todayDot}> today</span>}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Info strip */}
          <div className={styles.tableInfo}>
            Showing {displayedSessions.length} session{displayedSessions.length !== 1 ? 's' : ''}
            {selectedDay ? ` for ${selectedDay}` : ' for the whole week'}
            &nbsp;• Click a row to open attendance details
          </div>

          {/* Error */}
          {error && <div className={styles.errBanner}>{error}</div>}

          {/* Table */}
          {loading ? (
            <div className={styles.loadingRows}>
              {[1, 2, 3, 4].map((i) => <div key={i} className={styles.skelRow} />)}
            </div>
          ) : displayedSessions.length === 0 ? (
            <div className={styles.empty}>
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p>No sessions assigned to you yet.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Subject</th>
                  <th>Room</th>
                  <th>Group</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {displayedSessions.map((s) => {
                  const rowDate = formatRowDate(s, weekDates);
                  const groups = (s.assigned_groups || []).join(', ') || '—';
                  const isStarting = startingId === s.id;
                  return (
                    <tr
                      key={s.id}
                      className={`${styles.tr} ${rowDate.isToday ? styles.trToday : ''}`}
                    >
                      <td className={styles.tdDate}>
                        <span className={styles.dateTop}>{rowDate.top}</span>
                        <span className={`${styles.dateSub} ${rowDate.isToday ? styles.dateSubToday : ''}`}>
                          {rowDate.sub}
                        </span>
                      </td>
                      <td className={styles.tdTime}>
                        {fmt(s.start_time)} – {fmt(s.end_time)}
                      </td>
                      <td className={styles.tdSubject}>
                        <span className={styles.subjectName}>{s.title}</span>
                        <span className={styles.subjectType}>{s.session_type}</span>
                      </td>
                      <td className={styles.tdRoom}>
                        <span className={styles.roomName}>{s.room}</span>
                        <span className={styles.roomSub}>ESI SBA</span>
                      </td>
                      <td className={styles.tdGroup}>
                        <span className={styles.groupPill}>{groups}</span>
                        {s.year && (
                          <span className={styles.yearTag}>{s.year}</span>
                        )}
                        {s.student_count > 0 && (
                          <span className={styles.studentCount}>{s.student_count} students</span>
                        )}
                      </td>
                      <td className={styles.tdAction}>
                        <button
                          className={`${styles.rowBtn} ${rowDate.isToday ? styles.rowBtnStart : styles.rowBtnDim}`}
                          onClick={() => handleStart(s.id)}
                          disabled={isStarting || attendanceLoading}
                        >
                          {isStarting ? (
                            <span className={styles.spin} />
                          ) : (
                            rowDate.isToday ? 'Start' : 'Open'
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* RIGHT — Week summary sidebar */}
        <aside className={styles.summaryPanel}>
          <div className={styles.summaryHeader}>
            <h2 className={styles.summaryTitle}>Week summary</h2>
            <p className={styles.summarySub}>Overview of teaching load and attendance follow-up.</p>
          </div>

          {/* Stat cards */}
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Total sessions this week</p>
            <p className={styles.statValue}>{totalThisWeek}</p>
            <p className={styles.statDesc}>
              {sessions.filter((s) => s.day === todayName).length} sessions today
            </p>
          </div>

          <div className={styles.statCard}>
            <p className={styles.statLabel}>Sessions today</p>
            <p className={styles.statValue}>{todaySessions.length}</p>
            <p className={styles.statDesc}>
              {todaySessions.length} upcoming class{todaySessions.length !== 1 ? 'es' : ''} remaining.
            </p>
          </div>

          <div className={styles.statCard}>
            <p className={styles.statLabel}>Sessions needing follow-up</p>
            <p className={styles.statValue}>—</p>
            <p className={styles.statDesc}>Submit attendance to update this count.</p>
          </div>

          {/* Next sessions */}
          <div className={styles.nextSection}>
            <h3 className={styles.nextTitle}>Next sessions</h3>
            <p className={styles.nextSub}>Classes coming up in the next 24 hours.</p>
            {nextSessions.length === 0 ? (
              <p className={styles.nextEmpty}>No sessions scheduled for today.</p>
            ) : (
              nextSessions.map((s) => (
                <div key={s.id} className={styles.nextCard}>
                  <div className={styles.nextInfo}>
                    <span className={styles.nextName}>{s.title}</span>
                    <span className={styles.nextMeta}>
                      Today · {fmt(s.start_time)} · {s.room}
                    </span>
                  </div>
                  <button
                    className={styles.nextBtn}
                    onClick={() => handleStart(s.id)}
                    disabled={startingId === s.id || attendanceLoading}
                  >
                    {startingId === s.id ? <span className={styles.spin} /> : 'Start'}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Teaching note */}
          <div className={styles.noteBox}>
            <p className={styles.noteTitle}>Teaching note</p>
            <p className={styles.noteSub}>Quick planning guidance for the week.</p>
            <p className={styles.noteBody}>
              Use this page to verify which groups still require attendance submission, identify
              missed sessions early, and open the next class directly before entering the room.
            </p>
          </div>

          {/* Action buttons */}
          <button
            className={styles.openNextBtn}
            onClick={() => nextSessions[0] && handleStart(nextSessions[0].id)}
            disabled={!nextSessions[0] || attendanceLoading}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none" />
            </svg>
            Open Next Session
          </button>
          <button className={styles.exportBtn}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Schedule
          </button>
        </aside>
      </div>
    </div>
  );
}
