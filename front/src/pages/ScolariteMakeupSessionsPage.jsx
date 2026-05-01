import { useEffect, useMemo, useRef, useState } from 'react';
import ScolaritePageHeader from '../components/ScolaritePageHeader';
import {
  createEmptyMakeupSessionsOverview,
  fetchMakeupSessionsOverview,
  runMakeupSessionRequestAction,
  SCOLARITE_MAKEUP_SESSIONS_ENDPOINTS,
} from '../services/scolariteMakeupSessionsEndpoint';
import styles from './ScolariteMakeupSessionsPage.module.css';

const metricCards = [
  { key: 'pendingRequests', label: 'Pending Requests', helper: 'Needs room assignment', tone: 'orange', icon: 'clock' },
  { key: 'scheduledThisWeek', label: 'Scheduled This Week', helper: 'Approved & confirmed', tone: 'blue', icon: 'calendar' },
  { key: 'totalMakeups', label: 'Total Makeups', helper: 'All available records', tone: 'muted', icon: 'chart' },
  { key: 'completedThisWeek', label: 'Completed This Week', helper: 'Successfully held', tone: 'green', icon: 'check' },
];

const pageSize = 5;

function Icon({ name }) {
  if (name === 'clock') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="7.2" />
        <path d="M12 8v4.2l2.6 1.6" />
      </svg>
    );
  }

  if (name === 'calendar') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="5.5" width="14" height="14" rx="2.4" />
        <path d="M8.5 3.5v4M15.5 3.5v4M5 10h14M9 14h2.5M13.5 14H15" />
      </svg>
    );
  }

  if (name === 'chart') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 17V9.5" />
        <path d="M12 17V6.8" />
        <path d="M17 17v-5" />
      </svg>
    );
  }

  if (name === 'chevron-left') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m14.5 6.5-5 5.5 5 5.5" />
      </svg>
    );
  }

  if (name === 'chevron-right') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m9.5 6.5 5 5.5-5 5.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7.2" />
      <path d="m8.7 12.1 2 2 4.6-4.4" />
    </svg>
  );
}

function normalizeSearch(value) {
  return String(value || '').trim().toLowerCase();
}

function matchesSearch(values, searchQuery) {
  const normalizedQuery = normalizeSearch(searchQuery);

  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) => normalizeSearch(value).includes(normalizedQuery));
}

function getMetricValue(metric) {
  if (metric?.value === undefined || metric?.value === null || metric?.value === '') {
    return '-';
  }

  return metric.value;
}

function splitModuleAndGroup(session) {
  return {
    moduleName: session.moduleName || '-',
    group: session.group || '-',
  };
}

function MetricCard({ card, metric }) {
  return (
    <article className={`${styles.metricCard} ${styles[`metric${card.tone}`]}`}>
      <div className={styles.metricCopy}>
        <strong>{getMetricValue(metric)}</strong>
        <span>{metric?.label || card.label}</span>
        <small>{metric?.helper || card.helper}</small>
      </div>
      <span className={styles.metricIcon}>
        <Icon name={card.icon} />
      </span>
    </article>
  );
}

function StatusBadge({ item }) {
  return (
    <span className={`${styles.statusBadge} ${styles[`status${item.statusTone}`] || styles.statusneutral}`}>
      {item.statusLabel || item.status || '-'}
    </span>
  );
}

function MakeupSessionsTable({ loading, sessions, filters, activeFilter, onFilterChange, page, pageCount, onPageChange }) {
  const panelRef = useRef(null);
  const firstItem = sessions.length === 0 ? 0 : ((page - 1) * pageSize) + 1;
  const lastItem = Math.min(page * pageSize, sessions.length);
  const visibleSessions = sessions.slice((page - 1) * pageSize, page * pageSize);
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  const hasMultiplePages = pageCount > 1;

  function handlePageChange(nextPage) {
    onPageChange(nextPage);
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleScrollButtonClick() {
    handlePageChange(page === pageCount ? 1 : page + 1);
  }

  return (
    <article className={`${styles.panel} ${styles.sessionsPanel}`} ref={panelRef}>
      <div className={styles.panelHeader}>
        <div>
          <h2>Scheduled Sessions</h2>
          <p>All upcoming and recently completed makeup sessions.</p>
        </div>
        {filters.length > 0 ? (
          <select className={styles.periodSelect} value={activeFilter} onChange={(event) => onFilterChange(event.target.value)} aria-label="Session period">
            {filters.map((filter) => (
              <option key={filter.value} value={filter.value}>{filter.label}</option>
            ))}
          </select>
        ) : null}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.sessionsTable}>
          <thead>
            <tr>
              <th>Module &amp; Group</th>
              <th>Teacher</th>
              <th>Date &amp; Time</th>
              <th>Room</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={styles.tableState}>Loading makeup sessions...</td>
              </tr>
            ) : visibleSessions.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.tableState}>No makeup sessions match the current search.</td>
              </tr>
            ) : (
              visibleSessions.map((session) => {
                const sessionLabel = splitModuleAndGroup(session);

                return (
                  <tr key={session.id || `${session.moduleName}-${session.date}-${session.time}`}>
                    <td>
                      <strong>{sessionLabel.moduleName}</strong>
                      <span>{sessionLabel.group}</span>
                    </td>
                    <td>{session.teacherName || '-'}</td>
                    <td>
                      <strong>{session.date || '-'}</strong>
                      <span>{session.time || '-'}</span>
                    </td>
                    <td>
                      <span className={styles.roomBadge}>{session.room || '-'}</span>
                    </td>
                    <td><StatusBadge item={session} /></td>
                    <td>
                      {session.detailUrl ? (
                        <a href={session.detailUrl} className={styles.outlineButton}>
                          {session.statusTone === 'success' ? 'View' : 'Edit'}
                        </a>
                      ) : (
                        <button type="button" className={styles.outlineButton} disabled>
                          {session.statusTone === 'success' ? 'View' : 'Edit'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <footer className={styles.tableFooter}>
        <span>
          Showing {firstItem} to {lastItem} of {sessions.length} sessions
        </span>
        {hasMultiplePages ? (
          <div className={styles.pagination}>
            <button type="button" onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page === 1} aria-label="Previous page">
              <Icon name="chevron-left" />
            </button>
            {pages.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={pageNumber === page ? styles.paginationActive : ''}
                onClick={() => handlePageChange(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button type="button" onClick={() => handlePageChange(Math.min(pageCount, page + 1))} disabled={page === pageCount} aria-label="Next page">
              <Icon name="chevron-right" />
            </button>
          </div>
        ) : null}
      </footer>

      {hasMultiplePages ? (
        <button
          type="button"
          className={styles.scrollPageButton}
          onClick={handleScrollButtonClick}
          aria-label={page === pageCount ? 'Back to first sessions page' : 'Show next sessions page'}
          title={page === pageCount ? 'Back to first page' : 'Next page'}
        >
          <Icon name={page === pageCount ? 'chevron-left' : 'chevron-right'} />
        </button>
      ) : null}
    </article>
  );
}

function RequestCard({ request, rooms, selectedRoom, activeAction, onRoomChange, onAction }) {
  const availableRooms = request.rooms.length ? request.rooms : rooms;
  const requestKey = request.id || request.moduleName;
  const disabled = Boolean(activeAction);
  const requiresRoom = availableRooms.length > 0 && !selectedRoom;

  return (
    <li className={styles.requestCard}>
      <header className={styles.requestHeader}>
        <div>
          <h3>{request.moduleName || '-'}</h3>
          <p>{[request.teacherName, request.group].filter(Boolean).join(' - ') || '-'}</p>
        </div>
        {request.isNew ? <span>New</span> : null}
      </header>

      <dl className={styles.requestDetails}>
        <div>
          <dt>Proposed Date</dt>
          <dd>{request.proposedDate || '-'}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{request.time || '-'}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{request.type || '-'}</dd>
        </div>
      </dl>

      <label className={styles.roomSelect}>
        <span className={styles.srOnly}>Select room</span>
        <select value={selectedRoom} onChange={(event) => onRoomChange(requestKey, event.target.value)}>
          <option value="">Select Room...</option>
          {availableRooms.map((room) => (
            <option key={room} value={room}>{room}</option>
          ))}
        </select>
      </label>

      <div className={styles.requestActions}>
        <button
          type="button"
          className={styles.approveButton}
          disabled={disabled || requiresRoom || !request.approveUrl}
          onClick={() => onAction(request, 'approve')}
        >
          Approve
        </button>
        <button
          type="button"
          className={styles.rejectButton}
          disabled={disabled || !request.rejectUrl}
          onClick={() => onAction(request, 'reject')}
        >
          Reject
        </button>
      </div>
    </li>
  );
}

export default function ScolariteMakeupSessionsPage() {
  const [overview, setOverview] = useState(createEmptyMakeupSessionsOverview());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRooms, setSelectedRooms] = useState({});
  const [activeAction, setActiveAction] = useState('');

  async function loadOverview() {
    setLoading(true);
    setError('');

    try {
      const nextOverview = await fetchMakeupSessionsOverview();
      setOverview(nextOverview);
      setActiveFilter((currentFilter) => currentFilter || nextOverview.filters[0]?.value || '');
    } catch (requestError) {
      setOverview(createEmptyMakeupSessionsOverview());
      setError(requestError.response?.data?.error || requestError.message || 'Unable to load makeup sessions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const visibleSessions = useMemo(
    () => overview.sessions.filter((session) => (
      (!activeFilter || session.filterValue === activeFilter)
      && matchesSearch([
        session.moduleName,
        session.group,
        session.teacherName,
        session.date,
        session.time,
        session.room,
        session.statusLabel,
      ], searchQuery)
    )),
    [activeFilter, overview.sessions, searchQuery],
  );

  const visibleRequests = useMemo(
    () => overview.requests.filter((request) => matchesSearch([
      request.moduleName,
      request.group,
      request.teacherName,
      request.proposedDate,
      request.time,
      request.type,
      request.statusLabel,
    ], searchQuery)),
    [overview.requests, searchQuery],
  );

  const pageCount = Math.max(1, Math.ceil(visibleSessions.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  function handleRoomChange(requestKey, room) {
    setSelectedRooms((currentRooms) => ({
      ...currentRooms,
      [requestKey]: room,
    }));
  }

  async function handleRequestAction(request, actionType) {
    const requestKey = request.id || request.moduleName;
    const actionKey = `${actionType}:${requestKey}`;

    setActiveAction(actionKey);
    setError('');

    try {
      await runMakeupSessionRequestAction(request, actionType, selectedRooms[requestKey] || request.selectedRoom);
      await loadOverview();
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || 'Unable to complete the selected action.');
    } finally {
      setActiveAction('');
    }
  }

  return (
    <div className={styles.page}>
      <ScolaritePageHeader
        title="Makeup Sessions"
        breadcrumb="Home / Makeup Sessions"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        notificationCount={overview.notificationsCount}
      />

      <main className={styles.content}>
        {error ? (
          <div className={styles.errorBanner}>
            <span>{error}</span>
            <span>{SCOLARITE_MAKEUP_SESSIONS_ENDPOINTS.overview}</span>
          </div>
        ) : null}

        <section className={styles.metricsGrid} aria-label="Makeup sessions summary">
          {metricCards.map((card) => (
            <MetricCard key={card.key} card={card} metric={overview.metrics[card.key]} />
          ))}
        </section>

        <section className={styles.mainGrid}>
          <MakeupSessionsTable
            loading={loading}
            sessions={visibleSessions}
            filters={overview.filters}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
          />

          <aside className={`${styles.panel} ${styles.requestsPanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Pending Requests</h2>
              </div>
            </div>

            {loading ? (
              <p className={styles.emptyState}>Loading pending requests...</p>
            ) : visibleRequests.length === 0 ? (
              <p className={styles.emptyState}>No pending makeup requests match the current search.</p>
            ) : (
              <>
                <ul className={styles.requestList}>
                  {visibleRequests.map((request) => {
                    const requestKey = request.id || request.moduleName;

                    return (
                      <RequestCard
                        key={requestKey}
                        request={request}
                        rooms={overview.rooms}
                        selectedRoom={selectedRooms[requestKey] || request.selectedRoom}
                        activeAction={activeAction}
                        onRoomChange={handleRoomChange}
                        onAction={handleRequestAction}
                      />
                    );
                  })}
                </ul>
                <button type="button" className={styles.viewAllButton} disabled>
                  View all {visibleRequests.length} requests
                </button>
              </>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}
