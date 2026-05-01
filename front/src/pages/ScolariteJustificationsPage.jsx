import { useEffect, useMemo, useState } from 'react';
import ScolaritePageHeader from '../components/ScolaritePageHeader';
import {
  createEmptyJustificationsOverview,
  fetchJustificationsOverview,
} from '../services/scolariteJustificationsEndpoint';
import { exportTableToCsv } from '../utils/exportTableToCsv';
import dashboardStyles from './ScolariteDashboardPage.module.css';
import studentStyles from './ScolariteStudentsPage.module.css';
import styles from './ScolariteJustificationsPage.module.css';

const metricCards = [
  { key: 'pendingReview', label: 'Pending Review', helper: 'Need validation today', tone: 'blue', icon: 'pending' },
  { key: 'approvedThisWeek', label: 'Approved This Week', helper: 'Medical and official documents', tone: 'blue', icon: 'approved' },
  { key: 'rejected', label: 'Rejected', helper: 'Incomplete or invalid files', tone: 'blue', icon: 'rejected' },
];

function Icon({ name }) {
  if (name === 'export') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4v10" />
        <path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
        <path d="M5 18.5h14" />
      </svg>
    );
  }

  if (name === 'filter') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16l-6 6v5l-4 2v-7L4 6Z" />
      </svg>
    );
  }

  if (name === 'approved') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4.5 18.5 7v5.2c0 3.2-2.6 5.9-6.5 7.3-3.9-1.4-6.5-4.1-6.5-7.3V7L12 4.5Z" />
        <path d="m9.2 12 1.8 1.8 3.9-4" />
      </svg>
    );
  }

  if (name === 'rejected') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 4.5h6l3.5 3.5v11.5H8a2.5 2.5 0 0 1-2.5-2.5v-10A2.5 2.5 0 0 1 8 4.5Z" />
        <path d="m10 13 4 4M14 13l-4 4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4.5h6l3.5 3.5v11.5H8a2.5 2.5 0 0 1-2.5-2.5v-10A2.5 2.5 0 0 1 8 4.5Z" />
      <path d="M13.5 4.8V8.5H17" />
      <circle cx="12" cy="14" r="2.7" />
    </svg>
  );
}

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0]?.slice(0, 2).toUpperCase() || 'ST';
}

function matchesSearch(values, searchQuery) {
  const normalizedQuery = String(searchQuery || '').trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
}

function MetricCard({ card, metric, loading }) {
  return (
    <article className={dashboardStyles.metricCard}>
      <div className={dashboardStyles.metricCopy}>
        <strong className={dashboardStyles.metricValue}>{loading ? '-' : metric?.value ?? 0}</strong>
        <span className={dashboardStyles.metricLabel}>{metric?.label || card.label}</span>
        <span className={dashboardStyles.metricHelper}>{metric?.helper || card.helper}</span>
      </div>
      <span className={`${dashboardStyles.metricIcon} ${dashboardStyles.metricIconblue}`}>
        <Icon name={metric?.icon || card.icon} />
      </span>
    </article>
  );
}

export default function ScolariteJustificationsPage() {
  const [overview, setOverview] = useState(createEmptyJustificationsOverview());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [page, setPage] = useState(1);

  async function loadJustifications() {
    setLoading(true);
    setError('');

    try {
      setOverview(await fetchJustificationsOverview());
    } catch (requestError) {
      setOverview(createEmptyJustificationsOverview());
      setError(requestError.response?.data?.error || requestError.message || 'Unable to load justifications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJustifications();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [dateRange, searchQuery, statusFilter, typeFilter]);

  const statuses = useMemo(
    () => overview.statuses.length ? overview.statuses : [...new Set(overview.documents.map((document) => document.statusLabel || document.status).filter(Boolean))],
    [overview],
  );
  const documentTypes = useMemo(
    () => overview.documentTypes.length ? overview.documentTypes : [...new Set(overview.documents.map((document) => document.documentType || document.documentTitle).filter(Boolean))],
    [overview],
  );

  const visibleDocuments = useMemo(
    () => overview.documents.filter((document) => (
      (!statusFilter || document.statusLabel === statusFilter || document.status === statusFilter)
      && (!typeFilter || document.documentType === typeFilter || document.documentTitle === typeFilter)
      && (!dateRange || document.absenceDate.includes(dateRange))
      && matchesSearch([
        document.studentName,
        document.studentCode,
        document.documentTitle,
        document.documentType,
        document.reason,
        document.absenceDate,
      ], searchQuery)
    )),
    [dateRange, overview.documents, searchQuery, statusFilter, typeFilter],
  );

  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(visibleDocuments.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedDocuments = visibleDocuments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function exportDocuments() {
    exportTableToCsv({
      filename: 'submitted_justifications.csv',
      headers: ['Student', 'Student ID', 'Absence Date', 'Document', 'Reason', 'Status'],
      rows: visibleDocuments.map((document) => [
        document.studentName,
        document.studentCode,
        document.absenceDate,
        document.documentTitle,
        document.reason,
        document.statusLabel || document.status,
      ]),
    });
  }

  function clearFilters() {
    setSearchQuery('');
    setStatusFilter('');
    setTypeFilter('');
    setDateRange('');
  }

  const paginationPages = useMemo(() => {
    const visiblePages = new Set([1, pageCount, currentPage - 1, currentPage, currentPage + 1]);
    return Array.from(visiblePages)
      .filter((pageNumber) => pageNumber >= 1 && pageNumber <= pageCount)
      .sort((firstPage, secondPage) => firstPage - secondPage);
  }, [currentPage, pageCount]);

  return (
    <div className={dashboardStyles.page}>
      <ScolaritePageHeader
        title="Justification"
        breadcrumb="Home / Supporting Documents"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by student, document type, or session..."
        notificationCount={overview.notificationsCount}
      />

      <main className={dashboardStyles.content}>
        {error ? <div className={dashboardStyles.errorBanner}>{error}</div> : null}

        <section className={styles.metricGrid}>
          {metricCards.map((card) => (
            <MetricCard key={card.key} card={card} metric={overview.metrics[card.key]} loading={loading} />
          ))}
        </section>

        <section className={dashboardStyles.panel}>
          <div className={studentStyles.directoryHeader}>
            <div>
              <h2>Submitted Documents</h2>
              <p>Review absence justifications, verify uploaded evidence, and keep a clear decision history for each attendance record.</p>
            </div>
          </div>

          <div className={styles.toolbar}>
            <button type="button" className={studentStyles.secondaryButton}>
              <Icon name="filter" />
              Advanced Filter
            </button>
            <button type="button" className={studentStyles.primaryButton} onClick={exportDocuments}>
              <Icon name="export" />
              Export CSV
            </button>
          </div>

          <section className={styles.filtersPanel}>
            <label className={studentStyles.filterField}>
              <span>Search</span>
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Student / document / reason..." />
            </label>
            <label className={studentStyles.filterField}>
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All Statuses</option>
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label className={studentStyles.filterField}>
              <span>Document Type</span>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="">All Types</option>
                {documentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className={studentStyles.filterField}>
              <span>Date Range</span>
              <input value={dateRange} onChange={(event) => setDateRange(event.target.value)} placeholder="Date text" />
            </label>
            <button type="button" className={styles.clearButton} onClick={clearFilters}>
              Clear Filters
            </button>
          </section>

          <div className={dashboardStyles.tableWrap}>
            <table className={`${dashboardStyles.absenceTable} ${styles.documentsTable}`}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Absence Date</th>
                  <th>Document</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className={dashboardStyles.tableState}>Loading submitted documents...</td></tr>
                ) : pagedDocuments.length === 0 ? (
                  <tr><td colSpan={6} className={dashboardStyles.tableState}>No submitted documents match the current filters.</td></tr>
                ) : pagedDocuments.map((document) => (
                  <tr key={document.id || `${document.studentName}-${document.absenceDate}-${document.documentTitle}`}>
                    <td>
                      <div className={studentStyles.studentCell}>
                        <span>{document.avatarUrl ? <img src={document.avatarUrl} alt="" /> : getInitials(document.studentName)}</span>
                        <strong>{document.studentName || '-'}</strong>
                        <small>{document.studentCode || '-'}</small>
                      </div>
                    </td>
                    <td>{document.absenceDate || '-'}</td>
                    <td>
                      <div className={styles.documentCell}>
                        <span><Icon /></span>
                        <strong>{document.documentTitle || '-'}</strong>
                        <small>{document.documentMeta || '-'}</small>
                      </div>
                    </td>
                    <td>{document.reason || '-'}</td>
                    <td>
                      <span className={`${dashboardStyles.statusBadge} ${dashboardStyles[`status${document.statusTone}`] || dashboardStyles.statusneutral}`}>
                        {document.statusLabel || document.status || '-'}
                      </span>
                    </td>
                    <td>
                      {document.detailUrl ? (
                        <a className={dashboardStyles.viewButton} href={document.detailUrl}>Open</a>
                      ) : (
                        <button type="button" className={dashboardStyles.viewButton} disabled>Open</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className={studentStyles.tableFooter}>
            <span>Showing {visibleDocuments.length === 0 ? 0 : ((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, visibleDocuments.length)} of {visibleDocuments.length} submitted documents</span>
            <div className={studentStyles.pagination}>
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>‹</button>
              {paginationPages.map((pageNumber) => (
                <button key={pageNumber} type="button" className={pageNumber === currentPage ? studentStyles.paginationActive : ''} onClick={() => setPage(pageNumber)}>{pageNumber}</button>
              ))}
              <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount}>›</button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
