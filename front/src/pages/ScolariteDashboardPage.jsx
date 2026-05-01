import { useEffect, useMemo, useState } from 'react';
import ScolaritePageHeader from '../components/ScolaritePageHeader';
import {
  createEmptyScolariteDashboardOverview,
  fetchScolariteDashboardOverview,
  runScolariteDashboardAction,
  SCOLARITE_DASHBOARD_ENDPOINTS,
} from '../services/scolariteDashboardEndpoint';
import styles from './ScolariteDashboardPage.module.css';

const metricCards = [
  { key: 'absencesToday', label: 'Absences today', tone: 'blue', icon: 'calendar' },
  { key: 'pendingJustifications', label: 'Pending justifications', tone: 'orange', icon: 'document' },
  { key: 'scheduledMakeupSessions', label: 'Scheduled makeup sessions', tone: 'sky', icon: 'refresh' },
  { key: 'overallAbsenceRate', label: 'Overall absence rate', tone: 'red', icon: 'chart' },
];

function Icon({ name }) {
  if (name === 'document') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 4.5h6l3.5 3.5v11.5H8a2.5 2.5 0 0 1-2.5-2.5v-10A2.5 2.5 0 0 1 8 4.5Z" />
        <path d="M13.5 4.8V8.5H17" />
        <circle cx="12" cy="14" r="2.8" />
        <path d="M12 12.4v1.7l1.2.8" />
      </svg>
    );
  }

  if (name === 'refresh') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.4 8.2A6.2 6.2 0 0 0 7.2 6.8L5.5 8.5" />
        <path d="M5.5 5.2v3.3h3.3" />
        <path d="M5.6 15.8a6.2 6.2 0 0 0 11.2 1.4l1.7-1.7" />
        <path d="M18.5 18.8v-3.3h-3.3" />
      </svg>
    );
  }

  if (name === 'chart') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="7.2" />
        <path d="M12 7.5V12l3.2 2.2" />
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

function formatMetricValue(metric) {
  const value = metric?.value;

  if (value === undefined || value === null || value === '') {
    return '-';
  }

  const unit = metric?.unit || '';

  if (!unit) {
    return value;
  }

  return unit === '%' ? `${value}${unit}` : `${value} ${unit}`;
}

function matchesSearch(values, searchQuery) {
  const normalizedQuery = String(searchQuery || '').trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
}

function MetricCard({ card, metric, loading }) {
  const toneClass = styles[`metricIcon${card.tone}`] || styles.metricIconblue;

  return (
    <article className={styles.metricCard} aria-busy={loading}>
      <div className={styles.metricCopy}>
        <strong className={`${styles.metricValue} ${card.tone === 'red' ? styles.metricValueDanger : ''}`}>
          {loading ? '-' : formatMetricValue(metric)}
        </strong>
        <span className={styles.metricLabel}>{metric?.label || card.label}</span>
        {metric?.helper ? (
          <span className={styles.metricHelper}>{metric.helper}</span>
        ) : null}
        {metric?.trendLabel ? (
          <span className={`${styles.metricTrend} ${metric.trendTone === 'danger' ? styles.metricTrendDanger : ''}`}>
            {metric.trendLabel}
          </span>
        ) : null}
      </div>
      <span className={`${styles.metricIcon} ${toneClass}`}>
        <Icon name={card.icon} />
      </span>
    </article>
  );
}

function EmptyState({ children }) {
  return <p className={styles.emptyState}>{children}</p>;
}

export default function ScolariteDashboardPage() {
  const [overview, setOverview] = useState(createEmptyScolariteDashboardOverview());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAction, setActiveAction] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const nextOverview = await fetchScolariteDashboardOverview();
      setOverview(nextOverview);
    } catch (requestError) {
      setOverview(createEmptyScolariteDashboardOverview());
      setError(requestError.response?.data?.error || requestError.message || 'Unable to load Scolarite dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleJustificationAction(justification, actionType) {
    const actionUrl = actionType === 'approve' ? justification.approveUrl : justification.rejectUrl;

    if (!actionUrl) {
      return;
    }

    setActiveAction(`${actionType}:${justification.id}`);
    setError('');

    try {
      await runScolariteDashboardAction(actionUrl);
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || 'Unable to complete the selected action.');
    } finally {
      setActiveAction('');
    }
  }

  const visibleRecentAbsences = useMemo(
    () => overview.recentAbsences.filter((record) => matchesSearch([
      record.studentName,
      record.department,
      record.subject,
      record.date,
      record.status,
      record.statusLabel,
    ], searchQuery)),
    [overview.recentAbsences, searchQuery],
  );

  const visibleJustifications = useMemo(
    () => overview.justificationsToReview.filter((justification) => matchesSearch([
      justification.studentName,
      justification.subject,
      justification.submittedAtLabel,
    ], searchQuery)),
    [overview.justificationsToReview, searchQuery],
  );

  const visibleDepartments = useMemo(
    () => overview.absencesByDepartment.filter((department) => matchesSearch([
      department.label,
      department.percentLabel,
    ], searchQuery)),
    [overview.absencesByDepartment, searchQuery],
  );

  const visibleMakeupSessions = useMemo(
    () => overview.upcomingMakeupSessions.filter((session) => matchesSearch([
      session.title,
      session.department,
      session.date,
      session.room,
    ], searchQuery)),
    [overview.upcomingMakeupSessions, searchQuery],
  );

  return (
    <div className={styles.page}>
      <ScolaritePageHeader
        title="Dashboard"
        breadcrumb="Home / Dashboard"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        notificationCount={overview.notificationsCount}
      />

      <main className={styles.content}>
        {error ? (
          <div className={styles.errorBanner}>
            <span>{error}</span>
            <span className={styles.errorEndpoint}>{SCOLARITE_DASHBOARD_ENDPOINTS.overview}</span>
          </div>
        ) : null}

        <section className={styles.metricsGrid} aria-label="Scolarite dashboard summary">
          {metricCards.map((card) => (
            <MetricCard
              key={card.key}
              card={card}
              metric={overview.metrics[card.key]}
              loading={loading}
            />
          ))}
        </section>

        <section className={styles.mainGrid}>
          <article className={`${styles.panel} ${styles.recentPanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Recent absences</h2>
                <p>Latest records captured across departments, with current justification status and direct review access.</p>
              </div>
              <button type="button" className={styles.textButton} disabled>
                View all absences
                <span aria-hidden="true">-&gt;</span>
              </button>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.absenceTable}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Department</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className={styles.tableState}>Loading absences...</td>
                    </tr>
                  ) : visibleRecentAbsences.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.tableState}>No recent absences available.</td>
                    </tr>
                  ) : (
                    visibleRecentAbsences.map((record) => (
                      <tr key={record.id || `${record.studentName}-${record.date}-${record.subject}`}>
                        <td>{record.studentName || '-'}</td>
                        <td>{record.department || '-'}</td>
                        <td>{record.subject || '-'}</td>
                        <td>{record.date || '-'}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[`status${record.statusTone}`] || styles.statusneutral}`}>
                            {record.statusLabel || record.status || '-'}
                          </span>
                        </td>
                        <td>
                          {record.detailUrl ? (
                            <a className={styles.viewButton} href={record.detailUrl}>
                              View
                            </a>
                          ) : (
                            <button type="button" className={styles.viewButton} disabled>
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Justifications to review</h2>
              </div>
            </div>

            {loading ? (
              <EmptyState>Loading justifications...</EmptyState>
            ) : visibleJustifications.length === 0 ? (
              <EmptyState>No justifications awaiting review.</EmptyState>
            ) : (
              <ul className={styles.justificationList}>
                {visibleJustifications.map((justification) => {
                  const approveActionId = `approve:${justification.id}`;
                  const rejectActionId = `reject:${justification.id}`;

                  return (
                    <li key={justification.id || justification.studentName} className={styles.justificationItem}>
                      <div className={styles.justificationAvatar}>
                        {justification.initials || getInitials(justification.studentName)}
                      </div>
                      <div className={styles.justificationContent}>
                        <div className={styles.justificationTopline}>
                          <strong>{justification.studentName || '-'}</strong>
                          <span>{justification.submittedAtLabel || '-'}</span>
                        </div>
                        <p>{justification.subject || '-'}</p>
                        <div className={styles.justificationActions}>
                          <button
                            type="button"
                            className={styles.approveButton}
                            disabled={!justification.approveUrl || activeAction === approveActionId}
                            onClick={() => handleJustificationAction(justification, 'approve')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className={styles.rejectButton}
                            disabled={!justification.rejectUrl || activeAction === rejectActionId}
                            onClick={() => handleJustificationAction(justification, 'reject')}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        </section>

        <section className={styles.bottomGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Absences by department</h2>
            </div>

            {loading ? (
              <EmptyState>Loading departments...</EmptyState>
            ) : visibleDepartments.length === 0 ? (
              <EmptyState>No department absence breakdown available.</EmptyState>
            ) : (
              <ul className={styles.departmentList}>
                {visibleDepartments.map((department) => (
                  <li key={department.id || department.label} className={styles.departmentItem}>
                    <span className={styles.departmentLabel}>{department.label || '-'}</span>
                    <span className={styles.departmentTrack}>
                      <span
                        className={styles.departmentFill}
                        style={{ width: `${Math.max(0, Math.min(100, department.percent))}%` }}
                      />
                    </span>
                    <strong>{department.percentLabel || `${department.percent}%`}</strong>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Upcoming makeup sessions</h2>
            </div>

            {loading ? (
              <EmptyState>Loading makeup sessions...</EmptyState>
            ) : visibleMakeupSessions.length === 0 ? (
              <EmptyState>No upcoming makeup sessions available.</EmptyState>
            ) : (
              <ul className={styles.sessionList}>
                {visibleMakeupSessions.map((session) => (
                  <li key={session.id || `${session.title}-${session.date}`} className={styles.sessionItem}>
                    <span className={styles.sessionDot} aria-hidden="true" />
                    <div className={styles.sessionContent}>
                      <strong>
                        {session.title || '-'}
                        {session.department ? <span>{session.department}</span> : null}
                      </strong>
                      <p>
                        {[session.date, session.room].filter(Boolean).join(' - ') || '-'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}
