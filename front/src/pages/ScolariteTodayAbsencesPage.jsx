import { useEffect, useMemo, useState } from 'react';
import ScolaritePageHeader from '../components/ScolaritePageHeader';
import { useAbsenceRecords } from '../context/AbsenceRecordsContext';
import {
  buildTodayAbsencesOverviewFromRecords,
  createEmptyTodayAbsencesOverview,
  fetchTodayAbsencesOverview,
  syncTodayAbsencesRecords,
} from '../services/scolariteTodayAbsencesEndpoint';
import { exportTableToCsv } from '../utils/exportTableToCsv';
import dashboardStyles from './ScolariteDashboardPage.module.css';
import styles from './ScolariteTodayAbsencesPage.module.css';

const metricCards = [
  { key: 'totalAbsences', fallbackLabel: 'Total absences recorded', helper: 'Across teaching sessions today', tone: 'blue', icon: 'calendar' },
  { key: 'unjustified', fallbackLabel: 'Unjustified so far', helper: 'Need immediate follow-up', tone: 'red', icon: 'alert' },
  { key: 'pendingReview', fallbackLabel: 'Pending review', helper: 'Documents expected within 48h', tone: 'orange', icon: 'document' },
  { key: 'criticalSessions', fallbackLabel: 'Critical sessions', helper: 'More than 5 students absent', tone: 'sky', icon: 'siren' },
];

function Icon({ name }) {
  if (name === 'alert') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 4 8 15H4l8-15Z" />
        <path d="M12 9v4" />
        <path d="M12 16.5h.01" />
      </svg>
    );
  }

  if (name === 'document') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 4.5h6l3.5 3.5v11.5H8a2.5 2.5 0 0 1-2.5-2.5v-10A2.5 2.5 0 0 1 8 4.5Z" />
        <path d="M13.5 4.8V8.5H17" />
        <path d="M9 13h6M9 16h4" />
      </svg>
    );
  }

  if (name === 'siren') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 18v-5a4 4 0 0 1 8 0v5" />
        <path d="M6 18h12M12 5V3M5.8 7.2 4.4 5.8M18.2 7.2l1.4-1.4" />
        <path d="M10 13h4" />
      </svg>
    );
  }

  if (name === 'clock') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="7.2" />
        <path d="M12 8v4l2.5 1.6" />
      </svg>
    );
  }

  if (name === 'download') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4v10" />
        <path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
        <path d="M5 18.5h14" />
      </svg>
    );
  }

  if (name === 'sync') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.4 8.2A6.2 6.2 0 0 0 7.2 6.8L5.5 8.5" />
        <path d="M5.5 5.2v3.3h3.3" />
        <path d="M5.6 15.8a6.2 6.2 0 0 0 11.2 1.4l1.7-1.7" />
        <path d="M18.5 18.8v-3.3h-3.3" />
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

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return parts[0]?.slice(0, 2).toUpperCase() || 'ST';
}

function formatTodayLabel() {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

function matchesSearch(values, searchQuery) {
  const normalizedQuery = String(searchQuery || '').trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
}

function MetricCard({ card, metric, loading }) {
  const tone = metric?.tone || card.tone;
  const toneClass = dashboardStyles[`metricIcon${tone}`] || dashboardStyles.metricIconblue;

  return (
    <article className={dashboardStyles.metricCard} aria-busy={loading}>
      <div className={dashboardStyles.metricCopy}>
        <strong className={`${dashboardStyles.metricValue} ${tone === 'red' ? dashboardStyles.metricValueDanger : ''}`}>
          {loading ? '-' : metric?.value ?? 0}
        </strong>
        <span className={dashboardStyles.metricLabel}>{metric?.label || card.fallbackLabel}</span>
        <span className={dashboardStyles.metricHelper}>{metric?.helper || card.helper}</span>
      </div>
      <span className={`${dashboardStyles.metricIcon} ${toneClass}`}>
        <Icon name={metric?.icon || card.icon} />
      </span>
    </article>
  );
}

function EmptyState({ children }) {
  return <p className={dashboardStyles.emptyState}>{children}</p>;
}

function SelectFilter({ label, value, options, onChange, allLabel }) {
  return (
    <label className={styles.filterField}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={String(option)} value={String(option)}>
            {String(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function ScolariteTodayAbsencesPage() {
  const absenceRecordsContext = useAbsenceRecords();
  const [overview, setOverview] = useState(createEmptyTodayAbsencesOverview());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [page, setPage] = useState(1);

  const absenceRecords = absenceRecordsContext?.absenceRecords || [];

  async function loadTodayAbsences() {
    setLoading(true);
    setError('');

    try {
      const nextOverview = await fetchTodayAbsencesOverview();
      setOverview(nextOverview);
    } catch (requestError) {
      setOverview(buildTodayAbsencesOverviewFromRecords(absenceRecords));
      setError(requestError.response?.data?.error || requestError.message || 'Unable to load today absences.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncRecords() {
    setLoading(true);
    setError('');

    try {
      await syncTodayAbsencesRecords();
      const nextOverview = await fetchTodayAbsencesOverview();
      setOverview(nextOverview);
    } catch (requestError) {
      setOverview(buildTodayAbsencesOverviewFromRecords(absenceRecords));
      setError(requestError.response?.data?.error || requestError.message || 'Unable to sync today absences.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTodayAbsences();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, programFilter, statusFilter, timeFilter]);

  const filters = useMemo(() => {
    const programs = overview.programs.length
      ? overview.programs
      : [...new Set(overview.records.map((record) => record.program).filter(Boolean))];
    const statuses = overview.statuses.length
      ? overview.statuses
      : [...new Set(overview.records.map((record) => record.statusLabel || record.status).filter(Boolean))];
    const timeSlots = overview.timeSlots.length
      ? overview.timeSlots
      : [...new Set(overview.records.map((record) => record.time).filter(Boolean))];

    return { programs, statuses, timeSlots };
  }, [overview]);

  const visibleRecords = useMemo(
    () => overview.records.filter((record) => (
      (!programFilter || record.program === programFilter)
      && (!statusFilter || record.statusLabel === statusFilter || record.status === statusFilter)
      && (!timeFilter || record.time === timeFilter)
      && matchesSearch([
        record.studentName,
        record.studentCode,
        record.program,
        record.subject,
        record.room,
        record.time,
        record.statusLabel,
      ], searchQuery)
    )),
    [overview.records, programFilter, searchQuery, statusFilter, timeFilter],
  );

  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(visibleRecords.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRecords = visibleRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const escalationCount = visibleRecords.filter((record) => record.statusTone === 'danger' || record.missingDocuments).length;

  function clearFilters() {
    setSearchQuery('');
    setProgramFilter('');
    setStatusFilter('');
    setTimeFilter('');
  }

  function handleExportRecords() {
    exportTableToCsv({
      filename: 'today_absences.csv',
      headers: ['Student', 'Student ID', 'Program', 'Subject', 'Room', 'Time', 'Status'],
      rows: visibleRecords.map((record) => [
        record.studentName,
        record.studentCode,
        record.program,
        record.subject,
        record.room,
        record.time,
        record.statusLabel || record.status,
      ]),
    });
  }

  return (
    <div className={dashboardStyles.page}>
      <ScolaritePageHeader
        title="Today's Absences"
        breadcrumb="Home / Today's Absences"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search for a student, department, room, or subject..."
        notificationCount={overview.notificationsCount}
      >
        <button type="button" className={styles.headerButton} onClick={handleExportRecords}>
          <Icon name="download" />
          <span>Export today's report</span>
        </button>
        <button type="button" className={styles.headerButton} onClick={handleSyncRecords} disabled={loading}>
          <Icon name="sync" />
          <span>Sync records</span>
        </button>
      </ScolaritePageHeader>

      <main className={dashboardStyles.content}>
        {error ? (
          <div className={dashboardStyles.errorBanner}>
            <span>{error}</span>
          </div>
        ) : null}

        <section className={styles.heroPanel}>
          <div>
            <h2>Attendance incidents detected for {overview.dateLabel || formatTodayLabel()}</h2>
            <p>Track recorded absences, find high-risk sessions quickly, and review pending justifications.</p>
          </div>
          {overview.lastSyncLabel ? <span>{overview.lastSyncLabel}</span> : null}
        </section>

        <section className={styles.filtersPanel} aria-label="Today absence filters">
          <label className={styles.filterField}>
            <span>Search</span>
            <input
              type="search"
              value={searchQuery}
              placeholder="Student name, student ID, or teacher"
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <SelectFilter
            label="Program"
            value={programFilter}
            options={filters.programs}
            onChange={setProgramFilter}
            allLabel="All programs"
          />
          <SelectFilter
            label="Status"
            value={statusFilter}
            options={filters.statuses}
            onChange={setStatusFilter}
            allLabel="All statuses"
          />
          <SelectFilter
            label="Time slot"
            value={timeFilter}
            options={filters.timeSlots}
            onChange={setTimeFilter}
            allLabel="All time slots"
          />

          <button type="button" className={styles.clearButton} onClick={clearFilters}>
            Clear filters
          </button>
        </section>

        <section className={dashboardStyles.metricsGrid} aria-label="Today's absence summary">
          {metricCards.map((card) => (
            <MetricCard
              key={card.key}
              card={card}
              metric={overview.metrics[card.key]}
              loading={loading}
            />
          ))}
        </section>

        <section className={styles.pageGrid}>
          <article className={`${dashboardStyles.panel} ${styles.logPanel}`}>
            <div className={dashboardStyles.panelHeader}>
              <div>
                <h2>Today's absence log</h2>
                <p>Sorted by most recent session updates and highest absence volume.</p>
              </div>
            </div>

            {escalationCount > 0 ? (
              <span className={styles.escalationBadge}>{escalationCount} records need escalation</span>
            ) : null}

            <div className={dashboardStyles.tableWrap}>
              <table className={`${dashboardStyles.absenceTable} ${styles.todayTable}`}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Program</th>
                    <th>Subject</th>
                    <th>Room</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className={dashboardStyles.tableState}>Loading today absences...</td>
                    </tr>
                  ) : pagedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={dashboardStyles.tableState}>No absence records match the current filters.</td>
                    </tr>
                  ) : (
                    pagedRecords.map((record) => (
                      <tr key={record.id || `${record.studentName}-${record.subject}-${record.time}`}>
                        <td>
                          <div className={styles.studentCell}>
                            <span>{record.initials || getInitials(record.studentName)}</span>
                            <strong>{record.studentName || '-'}</strong>
                            <small>{record.studentCode || '-'}</small>
                          </div>
                        </td>
                        <td>{record.program || '-'}</td>
                        <td>{record.subject || '-'}</td>
                        <td>{record.room || '-'}</td>
                        <td>
                          <span className={styles.timePill}>
                            <Icon name="clock" />
                            {record.time || '-'}
                          </span>
                        </td>
                        <td>
                          <span className={`${dashboardStyles.statusBadge} ${dashboardStyles[`status${record.statusTone}`] || dashboardStyles.statusneutral}`}>
                            {record.statusLabel || record.status || '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <footer className={styles.tableFooter}>
              <span>
                Showing {visibleRecords.length === 0 ? 0 : ((currentPage - 1) * pageSize) + 1}
                {'-'}
                {Math.min(currentPage * pageSize, visibleRecords.length)} of {visibleRecords.length} absence records
              </span>
              <div className={styles.pagination}>
                <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>
                  Prev
                </button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).slice(0, 4).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={pageNumber === currentPage ? styles.paginationActive : ''}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount}>
                  Next
                </button>
              </div>
            </footer>
          </article>

          <aside className={styles.sideRail}>
            <article className={dashboardStyles.panel}>
              <div className={dashboardStyles.panelHeader}>
                <h2>High-absence sessions</h2>
              </div>

              {loading ? (
                <EmptyState>Loading sessions...</EmptyState>
              ) : overview.highAbsenceSessions.length === 0 ? (
                <EmptyState>No high-absence sessions available.</EmptyState>
              ) : (
                <ul className={styles.sessionList}>
                  {overview.highAbsenceSessions.map((session) => (
                    <li key={session.id || session.title}>
                      <div>
                        <strong>{session.title || '-'}</strong>
                        <span>{session.meta || '-'}</span>
                      </div>
                      <b>{session.countLabel || `${session.count} absent`}</b>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className={dashboardStyles.panel}>
              <div className={dashboardStyles.panelHeader}>
                <h2>Action center</h2>
              </div>

              {loading ? (
                <EmptyState>Loading actions...</EmptyState>
              ) : overview.actionCenter.length === 0 ? (
                <EmptyState>No action items available.</EmptyState>
              ) : (
                <ul className={styles.actionList}>
                  {overview.actionCenter.map((action) => (
                    <li key={action.id || action.title} className={styles[`action${action.tone}`] || ''}>
                      <span><Icon name={action.icon || 'alert'} /></span>
                      <div>
                        <strong>{action.title || '-'}</strong>
                        <p>{action.description || '-'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className={dashboardStyles.panel}>
              <div className={dashboardStyles.panelHeader}>
                <h2>Programs most affected today</h2>
              </div>

              {loading ? (
                <EmptyState>Loading programs...</EmptyState>
              ) : overview.affectedPrograms.length === 0 ? (
                <EmptyState>No program breakdown available.</EmptyState>
              ) : (
                <ul className={styles.programList}>
                  {overview.affectedPrograms.map((program) => (
                    <li key={program.id || program.label}>
                      <span>{program.label || '-'}</span>
                      <span className={styles.programTrack}>
                        <span style={{ width: `${Math.max(0, Math.min(100, program.percent))}%` }} />
                      </span>
                      <strong>{program.value}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </aside>
        </section>
      </main>
    </div>
  );
}
