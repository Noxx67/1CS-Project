import { useEffect, useMemo, useState } from 'react';
import ScolaritePageHeader from '../components/ScolaritePageHeader';
import {
  createEmptyJustificationsOverview,
  fetchJustificationsOverview,
} from '../services/scolariteJustificationsEndpoint';
import { runScolariteDashboardAction } from '../services/scolariteDashboardEndpoint';
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    );
  }
  if (name === 'filter') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
    );
  }
  if (name === 'file') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    );
  }
  if (name === 'calendar') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    );
  }
  return null;
}

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0]?.slice(0, 2).toUpperCase() || 'ST';
}

function MetricCard({ card, metric, loading }) {
  const toneClass = dashboardStyles[`metricIcon${card.tone}`] || dashboardStyles.metricIconblue;
  return (
    <article className={dashboardStyles.metricCard}>
      <div className={dashboardStyles.metricCopy}>
        <span className={dashboardStyles.metricLabel}>{metric?.label || card.label}</span>
        <strong className={dashboardStyles.metricValue}>{loading ? '-' : metric?.value ?? 0}</strong>
        <span className={dashboardStyles.metricHelper}>{metric?.helper || card.helper}</span>
      </div>
      <span className={`${dashboardStyles.metricIcon} ${toneClass}`}>
        <Icon name="file" />
      </span>
    </article>
  );
}

export default function ScolariteJustificationsPage() {
  const [overview, setOverview] = useState(createEmptyJustificationsOverview());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'review'
  const [selectedId, setSelectedId] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [page, setPage] = useState(1);

  async function loadJustifications() {
    setLoading(true);
    try {
      setOverview(await fetchJustificationsOverview());
    } catch (err) {
      setError('Unable to load justifications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJustifications();
  }, []);

  const visibleDocuments = useMemo(() => overview.documents.filter((doc) => {
    const matchesQuery = !searchQuery || [
      doc.studentName, 
      doc.studentCode, 
      doc.documentTitle, 
      doc.reason
    ].some(v => String(v || '').toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = !statusFilter || doc.statusLabel === statusFilter || doc.status === statusFilter;
    const matchesType = !typeFilter || doc.documentType === typeFilter;
    return matchesQuery && matchesStatus && matchesType;
  }), [overview.documents, searchQuery, statusFilter, typeFilter]);

  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(visibleDocuments.length / pageSize));
  const pagedDocuments = visibleDocuments.slice((page - 1) * pageSize, page * pageSize);

  const selectedDoc = useMemo(() => overview.documents.find(d => d.id === selectedId), [overview.documents, selectedId]);

  async function handleAction(id, type) {
    const actionUrl = `schedules/justifications/${id}/${type}/`;
    try {
      await runScolariteDashboardAction(actionUrl, { comment: reviewComment });
      setReviewComment('');
      if (viewMode === 'review') setViewMode('list');
      loadJustifications();
    } catch (err) {
      setError('Failed to process justification.');
    }
  }

  if (viewMode === 'review' && selectedDoc) {
    return (
      <div className={dashboardStyles.page}>
        <ScolaritePageHeader title="Justifications Review" breadcrumb="Home / Supporting Documents / Review" />
        <main className={dashboardStyles.content}>
          <div className={styles.reviewHeader}>
            <div>
              <button onClick={() => setViewMode('list')} className={styles.clearButton}>← Back to list</button>
            </div>
            <div className={styles.reviewHeaderActions}>
              <span className={dashboardStyles.statusBadge + ' ' + dashboardStyles.statusneutral}>This week</span>
              <span className={dashboardStyles.statusBadge + ' ' + dashboardStyles.statuswarning}>{overview.metrics.pendingReview.value} pending reviews</span>
            </div>
          </div>

          <div className={styles.reviewGrid}>
            <div className={styles.reviewQueueSection}>
              <div className={styles.queueInfo}>
                <h3>Submitted justifications</h3>
                <p>Each request includes the absence date, written reason, and supporting document.</p>
              </div>

              <article className={styles.justificationReviewCard}>
                <header className={styles.reviewCardHeader}>
                  <div className={styles.studentInfo}>
                    <div className={styles.reviewAvatar}>{String(selectedDoc.studentName || 'S')[0]}</div>
                    <div className={styles.studentDetails}>
                      <strong>{selectedDoc.studentName || 'Unknown Student'}</strong>
                      <span>ID: {selectedDoc.studentCode}</span>
                    </div>
                  </div>
                  <div className={styles.reviewBadges}>
                    <span className={`${styles.badge} ${styles.badgeBlue}`}>
                      <Icon name="calendar" />
                      {selectedDoc.absenceDate}
                    </span>
                    <span className={`${styles.badge} ${styles.badgeYellow}`}>
                      {selectedDoc.documentType}
                    </span>
                  </div>
                </header>
                <div className={styles.reviewCardBody}>
                  <div className={styles.reasonBox}>
                    <h4>Reason</h4>
                    <p>{selectedDoc.reason || 'No reason provided by student.'}</p>
                  </div>
                  <div className={styles.documentBox}>
                    <h4>Supporting Document</h4>
                    <div className={styles.documentFileCard}>
                      <div className={styles.fileInfo}>
                        <div className={styles.fileIcon}><Icon name="file" /></div>
                        <div className={styles.fileName}>
                          <strong>{selectedDoc.documentTitle}</strong>
                          <span>{selectedDoc.documentMeta || 'Click to view'}</span>
                        </div>
                      </div>
                      <a 
                        href={selectedDoc.detailUrl?.startsWith('http') ? selectedDoc.detailUrl : `http://127.0.0.1:8000${selectedDoc.detailUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={styles.viewLink}
                      >
                        View attachment →
                      </a>
                    </div>
                  </div>
                </div>
                <footer className={styles.reviewCardFooter}>
                  {selectedDoc.status === 'EN ATTENTE' ? (
                    <>
                      <div className={styles.footerActions}>
                        <button onClick={() => handleAction(selectedDoc.id, 'approve')} className={styles.reviewApproveBtn}>Approve</button>
                        <button onClick={() => handleAction(selectedDoc.id, 'reject')} className={styles.reviewRejectBtn}>Reject</button>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Add review comment for the student..." 
                        className={styles.commentInput}
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                      />
                    </>
                  ) : (
                    <div className={dashboardStyles.statusBadge + ' ' + dashboardStyles[`status${selectedDoc.statusTone}`]}>
                      Decision: {selectedDoc.statusLabel}
                    </div>
                  )}
                </footer>
              </article>
            </div>

            <aside className={styles.summaryPanel}>
              <div className={styles.summarySection}>
                <h3>Review summary</h3>
                <div className={styles.summaryStatCard}>
                  <h4>Pending review</h4>
                  <strong>{overview.metrics.pendingReview.value}</strong>
                  <p>Awaiting validation</p>
                </div>
                <div className={styles.summaryStatCard} style={{background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0'}}>
                  <h4>Approved this week</h4>
                  <strong>{overview.metrics.approvedThisWeek.value}</strong>
                  <p>Validated documents</p>
                </div>
              </div>

              <div className={styles.summarySection}>
                <h3>Review guidance</h3>
                <div className={styles.guidanceCard}>
                  <p>Verify the absence date matches the affected session, confirm that the attachment is readable, and add a brief note when rejecting so the student can resubmit correctly.</p>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={dashboardStyles.page}>
      <ScolaritePageHeader
        title="Justification"
        breadcrumb="Home / Supporting Documents"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        notificationCount={overview.notificationsCount}
      />

      <main className={dashboardStyles.content}>
        <section className={styles.metricGrid}>
          {metricCards.map((card) => (
            <MetricCard key={card.key} card={card} metric={overview.metrics[card.key]} loading={loading} />
          ))}
        </section>

        <section className={dashboardStyles.panel}>
          <div className={studentStyles.directoryHeader}>
            <div>
              <h2>Submitted Documents</h2>
              <p>Review absence justifications, verify uploaded evidence, and keep a clear decision history.</p>
            </div>
            <div className={styles.toolbar}>
              <button className={studentStyles.secondaryButton}><Icon name="filter" /> Advanced Filter</button>
              <button className={studentStyles.primaryButton} onClick={() => exportTableToCsv({
                filename: 'justifications.csv',
                headers: ['Student', 'Date', 'Type', 'Reason', 'Status'],
                rows: visibleDocuments.map(d => [d.studentName, d.absenceDate, d.documentType, d.reason, d.status])
              })}><Icon name="export" /> Export CSV</button>
            </div>
          </div>

          <div className={styles.filtersPanel}>
            <label className={studentStyles.filterField}>
              <span>Search</span>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Student name..." />
            </label>
            <label className={studentStyles.filterField}>
              <span>Status</span>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                {overview.statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className={studentStyles.filterField}>
              <span>Document Type</span>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                {overview.documentTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className={studentStyles.filterField}>
              <span>Date Range</span>
              <input type="date" value={dateRange} onChange={e => setDateRange(e.target.value)} />
            </label>
            <button className={styles.clearButton} onClick={() => { setSearchQuery(''); setStatusFilter(''); setTypeFilter(''); setDateRange(''); }}>Clear Filters</button>
          </div>

          <div className={dashboardStyles.tableWrap}>
            <table className={dashboardStyles.absenceTable}>
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
                {pagedDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className={studentStyles.studentCell}>
                        <div className={styles.reviewAvatar} style={{width: 32, height: 32, fontSize: 12}}>{doc.studentName[0]}</div>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                          <strong>{doc.studentName}</strong>
                          <small>#{doc.studentCode}</small>
                        </div>
                      </div>
                    </td>
                    <td>{doc.absenceDate}</td>
                    <td>
                      <div className={styles.documentCell}>
                        <span><Icon name="file" /></span>
                        <div>
                          <strong>{doc.documentTitle}</strong>
                          <small>{doc.documentMeta}</small>
                        </div>
                      </div>
                    </td>
                    <td>{doc.reason}</td>
                    <td>
                      <span className={`${dashboardStyles.statusBadge} ${dashboardStyles[`status${doc.statusTone}`]}`}>
                        {doc.statusLabel}
                      </span>
                    </td>
                    <td>
                      <button className={styles.openButton} onClick={() => { setSelectedId(doc.id); setViewMode('review'); }}>Open</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className={studentStyles.tableFooter}>
             <span>Showing {pagedDocuments.length} of {visibleDocuments.length} results</span>
             <div className={studentStyles.pagination}>
               <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
               <button className={studentStyles.paginationActive}>{page}</button>
               <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}>›</button>
             </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
