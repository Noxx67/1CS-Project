import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ScolaritePageHeader from '../components/ScolaritePageHeader';
import { useNotifications } from '../context/NotificationsContext';
import {
  createEmptyJustificationsOverview,
  fetchJustificationsOverview,
  formatDecisionTimestamp,
  getJustificationStatusLabel,
  JUSTIFICATION_STATUS,
  getJustificationStatusCode,
} from '../services/scolariteJustificationsEndpoint';
import { runScolariteDashboardAction } from '../services/scolariteDashboardEndpoint';
import { exportTableToCsv } from '../utils/exportTableToCsv';
import ScolariteIcon from '../components/scolarite/ScolariteIcons';
import dashboardStyles from './ScolariteDashboardPage.module.css';
import studentStyles from './ScolariteStudentsPage.module.css';
import styles from './ScolariteJustificationsPage.module.css';

const metricCards = [
  { key: 'pendingReview', label: 'Pending Review', helper: 'Need validation today', tone: 'orange', icon: 'pending' },
  { key: 'approvedThisWeek', label: 'Approved This Week', helper: 'Medical and official documents', tone: 'blue', icon: 'approved' },
  { key: 'rejected', label: 'Rejected This Week', helper: 'Incomplete or invalid files', tone: 'red', icon: 'rejected' },
];

const TYPE_DOT_COLORS = {
  MEDICAL: '#f59e0b',
  TRANSPORT: '#4b8ad8',
  FAMILY: '#b97000',
  OTHER: '#9aa0b4',
};

const GUIDANCE_ITEMS = [
  'Verify the absence date matches the affected session.',
  'Confirm the attachment is readable and matches the stated reason.',
  'Add a brief note when rejecting so the student can resubmit correctly.',
];

function normalizeText(value) {
  return String(value || '').trim();
}

function typeBadgeClass(tone) {
  const map = {
    medical: styles.badgeMedical,
    transport: styles.badgeTransport,
    administrative: styles.badgeAdministrative,
  };
  return map[tone] || styles.badgeNeutral;
}

function typeIconName(documentType) {
  switch (documentType) {
    case 'MEDICAL':
      return 'medical';
    case 'TRANSPORT':
      return 'transport';
    case 'FAMILY':
      return 'administrative';
    default:
      return 'document';
  }
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
        <ScolariteIcon name={card.icon} size="lg" />
      </span>
    </article>
  );
}

function JustificationReviewCard({
  doc,
  comment,
  onCommentChange,
  onApprove,
  onReject,
}) {
  return (
    <article className={styles.justificationReviewCard}>
      <header className={styles.reviewCardHeader}>
        <div className={styles.studentInfo}>
          {doc.avatarUrl ? (
            <img src={doc.avatarUrl} alt="" className={styles.reviewAvatar} />
          ) : (
            <div className={styles.reviewAvatar}>{String(doc.studentName || 'S')[0]}</div>
          )}
          <div className={styles.studentDetails}>
            <strong>{doc.studentName || 'Unknown Student'}</strong>
            <span>ID: {doc.studentCode}</span>
          </div>
        </div>
        <div className={styles.reviewBadges}>
          {doc.absenceDateDisplay ? (
            <span className={`${styles.badge} ${styles.badgeDate}`}>
              <ScolariteIcon name="calendar" size="xs" className={styles.badgeIcon} />
              {doc.absenceDateDisplay}
            </span>
          ) : null}
          <span className={`${styles.badge} ${typeBadgeClass(doc.typeBadgeTone)}`}>
            <ScolariteIcon name={typeIconName(doc.documentType)} size="xs" className={styles.badgeIcon} />
            {doc.documentTypeLabel || 'Unspecified'}
          </span>
        </div>
      </header>

      <div className={styles.reviewCardBody}>
        <div className={styles.reasonPanel}>
          <span className={styles.panelLabel}>Reason</span>
          <p className={styles.panelText}>{doc.reason || 'No reason provided by student.'}</p>
        </div>

        <div className={styles.attachmentPanel}>
          <div className={styles.fileRow}>
            <div className={styles.fileIcon}>
              <ScolariteIcon name="document" size="md" />
            </div>
            <div className={styles.fileName}>
              <strong>{doc.documentFileName}</strong>
              {doc.uploadMeta ? (
                <span className={styles.fileMetaLine}>{doc.uploadMeta}</span>
              ) : null}
            </div>
          </div>
          {doc.detailUrl ? (
            <a href={doc.detailUrl} target="_blank" rel="noopener noreferrer" className={styles.viewLink}>
              <ScolariteIcon name="attachment" size="sm" className={styles.linkIcon} />
              View attachment
            </a>
          ) : (
            <span className={styles.noFileLink}>No file attached</span>
          )}
        </div>
      </div>

      <footer className={styles.reviewCardFooter}>
        {doc.status === JUSTIFICATION_STATUS.PENDING ? (
          <>
            <div className={styles.footerActions}>
              <button type="button" onClick={onApprove} className={styles.reviewApproveBtn}>Approve</button>
              <button type="button" onClick={onReject} className={styles.reviewRejectBtn}>Reject</button>
            </div>
            <input
              type="text"
              placeholder="Add review comment for the student or explain the rejection reason."
              className={styles.commentInput}
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
            />
          </>
        ) : (
          <span className={`${dashboardStyles.statusBadge} ${dashboardStyles[`status${doc.statusTone}`]} ${styles.decisionBadge}`}>
            Decision: {doc.statusLabel}
          </span>
        )}
      </footer>
    </article>
  );
}

function JustificationDetailView({ doc, onBack }) {
  const decisionDateLabel = formatDecisionTimestamp(doc.statusUpdatedAt || doc.submissionDate);

  return (
    <div className={dashboardStyles.page}>
      <ScolaritePageHeader
        title="Submission Details"
        breadcrumb="Home / Supporting Documents / Details"
      />

      <main className={dashboardStyles.content}>
        <button type="button" className={styles.backLink} onClick={onBack}>
          ← Back to submitted documents
        </button>

        <div className={styles.reviewPageIntro}>
          <div>
            <h2>Justification submission</h2>
            <p>Full record for this absence justification, including the recorded decision and review comment.</p>
          </div>
        </div>

        <article className={styles.justificationReviewCard}>
          <header className={styles.reviewCardHeader}>
            <div className={styles.studentInfo}>
              {doc.avatarUrl ? (
                <img src={doc.avatarUrl} alt="" className={styles.reviewAvatar} />
              ) : (
                <div className={styles.reviewAvatar}>{String(doc.studentName || 'S')[0]}</div>
              )}
              <div className={styles.studentDetails}>
                <strong>{doc.studentName || 'Unknown Student'}</strong>
                <span>ID: {doc.studentCode}</span>
                {doc.group ? <span>Group: {doc.group}</span> : null}
              </div>
            </div>
            <div className={styles.reviewBadges}>
              {doc.absenceDateDisplay ? (
                <span className={`${styles.badge} ${styles.badgeDate}`}>
                  <ScolariteIcon name="calendar" size="xs" className={styles.badgeIcon} />
                  {doc.absenceDateDisplay}
                </span>
              ) : null}
              <span className={`${styles.badge} ${typeBadgeClass(doc.typeBadgeTone)}`}>
                <ScolariteIcon name={typeIconName(doc.documentType)} size="xs" className={styles.badgeIcon} />
                {doc.documentTypeLabel || 'Unspecified'}
              </span>
            </div>
          </header>

          <div className={styles.reviewCardBody}>
            <div className={styles.reasonPanel}>
              <span className={styles.panelLabel}>Reason</span>
              <p className={styles.panelText}>{doc.reason || 'No reason provided by student.'}</p>
            </div>

            <div className={styles.attachmentPanel}>
              <div className={styles.fileRow}>
                <div className={styles.fileIcon}>
                  <ScolariteIcon name="document" size="md" />
                </div>
                <div className={styles.fileName}>
                  <strong>{doc.documentFileName}</strong>
                  {doc.uploadMeta ? (
                    <span className={styles.fileMetaLine}>{doc.uploadMeta}</span>
                  ) : null}
                </div>
              </div>
              {doc.detailUrl ? (
                <a href={doc.detailUrl} target="_blank" rel="noopener noreferrer" className={styles.viewLink}>
                  <ScolariteIcon name="attachment" size="sm" className={styles.linkIcon} />
                  View attachment
                </a>
              ) : (
                <span className={styles.noFileLink}>No file attached</span>
              )}
            </div>
          </div>

          <section className={styles.detailDecisionSection}>
            <div className={styles.detailDecisionHeader}>
              <h3>Decision</h3>
              <span className={`${dashboardStyles.statusBadge} ${dashboardStyles[`status${doc.statusTone}`]}`}>
                {doc.statusLabel}
              </span>
            </div>
            {decisionDateLabel ? (
              <p className={styles.detailDecisionMeta}>Recorded {decisionDateLabel}</p>
            ) : null}
            <div className={styles.detailCommentBox}>
              <span className={styles.panelLabel}>Review comment</span>
              <p className={styles.panelText}>
                {doc.scholariteComment || 'No review comment was added for this submission.'}
              </p>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}

export default function ScolariteJustificationsPage() {
  const { syncJustificationNotifications, removeJustificationNotification } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [overview, setOverview] = useState(createEmptyJustificationsOverview());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentsById, setCommentsById] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [page, setPage] = useState(1);
  const [queueTypeFilter, setQueueTypeFilter] = useState('');
  const [showQueueFilters, setShowQueueFilters] = useState(false);

  const reviewGroup = searchParams.get('group') || '';
  const selectedId = searchParams.get('id') || '';
  const view = searchParams.get('view')
    || (reviewGroup ? 'review' : selectedId ? 'detail' : '');
  const isReviewMode = view === 'review';
  const isDetailMode = view === 'detail' && Boolean(selectedId);

  async function loadJustifications() {
    setLoading(true);
    setError('');
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

  useEffect(() => {
    const pendingDocuments = overview.documents.filter(
      (doc) => getJustificationStatusCode(doc.status) === JUSTIFICATION_STATUS.PENDING,
    );
    syncJustificationNotifications(pendingDocuments);
  }, [overview.documents, syncJustificationNotifications]);

  const visibleDocuments = useMemo(() => overview.documents.filter((doc) => {
    const matchesQuery = !searchQuery || [
      doc.studentName,
      doc.studentCode,
      doc.documentTitle,
      doc.reason,
      doc.group,
    ].some((value) => String(value || '').toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = !statusFilter || doc.status === statusFilter;
    const matchesType = !typeFilter || doc.documentType === typeFilter;
    return matchesQuery && matchesStatus && matchesType;
  }), [overview.documents, searchQuery, statusFilter, typeFilter]);

  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(visibleDocuments.length / pageSize));
  const pagedDocuments = visibleDocuments.slice((page - 1) * pageSize, page * pageSize);

  const detailDoc = useMemo(() => {
    if (!isDetailMode || !selectedId) return null;
    return overview.documents.find((doc) => doc.id === selectedId) || null;
  }, [overview.documents, isDetailMode, selectedId]);

  const anchorDoc = useMemo(() => {
    if (!isReviewMode) return null;
    if (selectedId) {
      return overview.documents.find((doc) => doc.id === selectedId) || null;
    }
    if (reviewGroup) {
      return overview.documents.find((doc) => normalizeText(doc.group) === normalizeText(reviewGroup)) || null;
    }
    return null;
  }, [overview.documents, isReviewMode, reviewGroup, selectedId]);

  const groupKey = normalizeText(reviewGroup || anchorDoc?.group);

  const groupQueueDocuments = useMemo(() => {
    if (!isReviewMode) return [];

    return overview.documents.filter((doc) => {
      const matchesGroup = groupKey
        ? normalizeText(doc.group) === groupKey
        : doc.id === selectedId;
      const isPending = getJustificationStatusCode(doc.status) === JUSTIFICATION_STATUS.PENDING;
      const matchesType = !queueTypeFilter || doc.documentType === queueTypeFilter;
      return matchesGroup && isPending && matchesType;
    });
  }, [overview.documents, groupKey, isReviewMode, queueTypeFilter, selectedId]);

  const semesterLabel = useMemo(() => {
    const source = groupQueueDocuments[0] || anchorDoc;
    return source?.semesterLabel || '';
  }, [groupQueueDocuments, anchorDoc]);

  const reasonDistribution = useMemo(() => {
    const counts = {};
    groupQueueDocuments.forEach((doc) => {
      const label = doc.documentTypeLabel || doc.documentType || 'Other';
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [groupQueueDocuments]);

  const nextInQueue = useMemo(() => (
    groupQueueDocuments
      .filter((doc) => doc.id !== selectedId)
      .slice(0, 2)
  ), [groupQueueDocuments, selectedId]);

  function openGroupReview(doc) {
    setSearchParams({
      view: 'review',
      group: doc.group || '',
      id: doc.id || '',
    });
  }

  function openJustificationDetail(doc) {
    setSearchParams({
      view: 'detail',
      id: doc.id || '',
    });
  }

  function handleOpenDocument(doc) {
    const isPending = getJustificationStatusCode(doc.status) === JUSTIFICATION_STATUS.PENDING;
    if (isPending) {
      openGroupReview(doc);
      return;
    }
    openJustificationDetail(doc);
  }

  function closeGroupReview() {
    setSearchParams({});
    setCommentsById({});
    setQueueTypeFilter('');
    setShowQueueFilters(false);
  }

  function closeDetailView() {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('view');
      next.delete('id');
      next.delete('group');
      return next;
    });
  }

  function openArchive() {
    setSearchParams({});
    setCommentsById({});
    setQueueTypeFilter('');
    setShowQueueFilters(false);
    setStatusFilter(JUSTIFICATION_STATUS.APPROVED);
    setPage(1);
  }

  useEffect(() => {
    if (view !== 'review' || loading) return;

    const hasPendingInQueue = overview.documents.some((doc) => {
      const matchesScope = groupKey
        ? normalizeText(doc.group) === groupKey
        : Boolean(selectedId && doc.id === selectedId);
      const isPending = getJustificationStatusCode(doc.status) === JUSTIFICATION_STATUS.PENDING;
      return matchesScope && isPending;
    });

    if (!hasPendingInQueue) {
      openArchive();
    }
  }, [
    view,
    loading,
    overview.documents,
    groupKey,
    selectedId,
    queueTypeFilter,
  ]);

  function exportGroupDecisions() {
    exportTableToCsv({
      filename: `justifications-group-${groupKey || 'queue'}.csv`,
      headers: ['Student', 'ID', 'Group', 'Date', 'Type', 'Reason', 'Status'],
      rows: groupQueueDocuments.map((doc) => [
        doc.studentName,
        doc.studentCode,
        doc.group,
        doc.absenceDate,
        doc.documentTypeLabel,
        doc.reason,
        doc.statusLabel,
      ]),
    });
  }

  async function handleAction(id, type) {
    try {
      removeJustificationNotification(id);

      const actionUrl = `schedules/justifications/${id}/${type}/`;
      await runScolariteDashboardAction(actionUrl, { comment: commentsById[id] || '' });
      await loadJustifications();

      setCommentsById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setError('Failed to process justification.');
    }
  }

  if (isDetailMode) {
    if (loading) {
      return (
        <div className={dashboardStyles.page}>
          <ScolaritePageHeader title="Submission Details" breadcrumb="Home / Supporting Documents / Details" />
          <main className={dashboardStyles.content}>
            <p className={styles.emptyQueue}>Loading submission...</p>
          </main>
        </div>
      );
    }

    if (!detailDoc) {
      return (
        <div className={dashboardStyles.page}>
          <ScolaritePageHeader title="Submission Details" breadcrumb="Home / Supporting Documents / Details" />
          <main className={dashboardStyles.content}>
            <button type="button" className={styles.backLink} onClick={closeDetailView}>
              ← Back to submitted documents
            </button>
            <p className={styles.emptyQueue}>This justification could not be found.</p>
          </main>
        </div>
      );
    }

    return <JustificationDetailView doc={detailDoc} onBack={closeDetailView} />;
  }

  if (isReviewMode && anchorDoc) {
    const groupLabel = groupKey || 'Unassigned';
    const pendingGlobal = overview.metrics.pendingReview.value;

    return (
      <div className={dashboardStyles.page}>
        <ScolaritePageHeader
          title="Justifications Review"
          breadcrumb="Home / Supporting Documents / Review"
        />

        <main className={dashboardStyles.content}>
          {error ? <div className={dashboardStyles.errorBanner}>{error}</div> : null}

          <button type="button" className={styles.backLink} onClick={closeGroupReview}>
            ← Back to submitted documents
          </button>

          <div className={styles.reviewPageIntro}>
            <div>
              <h2>Justifications Review</h2>
              <p>
                Review absence justifications from students in the same group, verify evidence,
                and record your decision for each submission.
              </p>
            </div>
            <div className={styles.reviewHeaderPills}>
              <span className={styles.headerPill}>
                <ScolariteIcon name="calendar" size="sm" />
                This week
              </span>
              <span className={`${styles.headerPill} ${styles.headerPillMuted}`}>
                <ScolariteIcon name="clock" size="sm" />
                {pendingGlobal} pending reviews
              </span>
            </div>
          </div>

          <div className={styles.reviewGrid}>
            <section className={styles.reviewQueueSection}>
              <div className={styles.queueHeaderRow}>
                <div className={styles.queueInfo}>
                  <h3>Submitted justifications</h3>
                  <p className={styles.queueMeta}>
                    Showing {groupQueueDocuments.length} pending submission{groupQueueDocuments.length === 1 ? '' : 's'}
                    {' • '}
                    <strong>Group {groupLabel}</strong>
                    {semesterLabel ? (
                      <>
                        {' • '}
                        <strong>{semesterLabel}</strong>
                      </>
                    ) : null}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.filterQueueBtn}
                  onClick={() => setShowQueueFilters((open) => !open)}
                >
                  <ScolariteIcon name="filter" size="sm" className={styles.actionIcon} />
                  Filter queue
                </button>
              </div>

              {showQueueFilters ? (
                <div className={styles.queueFilters}>
                  <label>
                    Document type
                    <select value={queueTypeFilter} onChange={(e) => setQueueTypeFilter(e.target.value)}>
                      <option value="">All types</option>
                      {overview.documentTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}

              {loading ? (
                <p className={styles.emptyQueue}>Loading justifications...</p>
              ) : groupQueueDocuments.length === 0 ? (
                <p className={styles.emptyQueue}>No pending justifications for this group.</p>
              ) : (
                groupQueueDocuments.map((doc) => (
                  <JustificationReviewCard
                    key={doc.id}
                    doc={doc}
                    comment={commentsById[doc.id] || ''}
                    onCommentChange={(value) => setCommentsById((prev) => ({ ...prev, [doc.id]: value }))}
                    onApprove={() => handleAction(doc.id, 'approve')}
                    onReject={() => handleAction(doc.id, 'reject')}
                  />
                ))
              )}
            </section>

            <aside className={styles.summaryPanel}>
              <div className={styles.summarySection}>
                <h3>Review summary</h3>
                <div className={styles.summaryStatCard}>
                  <h4>Pending review</h4>
                  <strong>{overview.metrics.pendingReview.value}</strong>
                  <p>Awaiting validation</p>
                </div>
                <div className={styles.summaryStatCard}>
                  <h4>Approved this week</h4>
                  <strong>{overview.metrics.approvedThisWeek.value}</strong>
                  <p>Validated documents</p>
                </div>
                <div className={styles.summaryStatCard}>
                  <h4>Rejected this week</h4>
                  <strong>{overview.metrics.rejected.value}</strong>
                  <p>Returned to students</p>
                </div>
              </div>

              {reasonDistribution.length > 0 ? (
                <div className={styles.summarySection}>
                  <h3>Reason distribution</h3>
                  {reasonDistribution.map(([label, count]) => {
                    const docType = overview.documents.find((doc) => doc.documentTypeLabel === label)?.documentType;
                    const dotColor = TYPE_DOT_COLORS[docType] || '#3b82f6';
                    return (
                      <div key={label} className={styles.distributionItem}>
                        <span className={styles.distLabel}>
                          <span className={styles.dot} style={{ background: dotColor }} />
                          {label}
                        </span>
                        <span className={styles.distValue}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {nextInQueue.length > 0 ? (
                <div className={styles.summarySection}>
                  <h3>Next in queue</h3>
                  {nextInQueue.map((doc) => {
                    const needsNote = !normalizeText(doc.reason);
                    return (
                      <div key={doc.id} className={styles.queueStudentRow}>
                        <span className={styles.queueStudentName}>{doc.studentName}</span>
                        <span className={`${styles.queueStatusPill} ${needsNote ? styles.queueStatusNeedsNote : styles.queueStatusReady}`}>
                          {needsNote ? 'Needs note' : 'Ready'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <div className={styles.summarySection}>
                <h3>Review guidance</h3>
                <div className={styles.guidanceCard}>
                  <ul className={styles.guidanceList}>
                    {GUIDANCE_ITEMS.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={styles.sidebarActions}>
                <button type="button" className={styles.sidebarActionBtn} onClick={exportGroupDecisions}>
                  <ScolariteIcon name="export" size="sm" className={styles.actionIcon} />
                  Export Decisions
                </button>
                <button type="button" className={`${styles.sidebarActionBtn} ${styles.sidebarActionBtnSecondary}`} onClick={openArchive}>
                  <ScolariteIcon name="archive" size="sm" className={styles.actionIcon} />
                  View Archive
                </button>
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
              <p>Review absence justifications, verify uploaded evidence, and keep a clear decision history.</p>
            </div>
            <div className={styles.toolbar}>
              <button type="button" className={studentStyles.secondaryButton}>
                <ScolariteIcon name="filter" size="sm" className={styles.actionIcon} />
                Advanced Filter
              </button>
              <button
                type="button"
                className={studentStyles.primaryButton}
                onClick={() => exportTableToCsv({
                  filename: 'justifications.csv',
                  headers: ['Student', 'Group', 'Date', 'Type', 'Reason', 'Status'],
                  rows: visibleDocuments.map((doc) => [
                    doc.studentName,
                    doc.group,
                    doc.absenceDate,
                    doc.documentTypeLabel,
                    doc.reason,
                    doc.statusLabel,
                  ]),
                })}
              >
                <ScolariteIcon name="export" size="sm" className={styles.actionIcon} />
                Export CSV
              </button>
            </div>
          </div>

          <div className={styles.filtersPanel}>
            <label className={studentStyles.filterField}>
              <span>Search</span>
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Student name..." />
            </label>
            <label className={studentStyles.filterField}>
              <span>Status</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                {overview.statuses.map((status) => (
                  <option key={status} value={status}>{getJustificationStatusLabel(status)}</option>
                ))}
              </select>
            </label>
            <label className={studentStyles.filterField}>
              <span>Document Type</span>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                {overview.documentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className={studentStyles.filterField}>
              <span>Date Range</span>
              <input type="date" value={dateRange} onChange={(e) => setDateRange(e.target.value)} />
            </label>
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
                setTypeFilter('');
                setDateRange('');
              }}
            >
              Clear Filters
            </button>
          </div>

          <div className={dashboardStyles.tableWrap}>
            <table className={dashboardStyles.absenceTable}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Group</th>
                  <th>Absence Date</th>
                  <th>Document</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>Loading justifications...</td>
                  </tr>
                ) : pagedDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No justifications found.</td>
                  </tr>
                ) : (
                  pagedDocuments.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <div className={studentStyles.studentCell}>
                          {doc.avatarUrl ? (
                            <img src={doc.avatarUrl} alt="" className={styles.reviewAvatar} style={{ width: 32, height: 32, fontSize: 12 }} />
                          ) : (
                            <div className={styles.reviewAvatar} style={{ width: 32, height: 32, fontSize: 12 }}>
                              {String(doc.studentName || 'S')[0]}
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong>{doc.studentName}</strong>
                            <small>#{doc.studentCode}</small>
                          </div>
                        </div>
                      </td>
                      <td>{doc.group || '—'}</td>
                      <td>{doc.absenceDate}</td>
                      <td>
                        <div className={styles.documentCell}>
                          <span className={styles.tableDocIcon}>
                            <ScolariteIcon name="document" size="md" />
                          </span>
                          <div>
                          <strong>{doc.documentTypeLabel || doc.documentTitle}</strong>
                          <small>
                            {doc.documentFileName || doc.absenceDate || doc.documentMeta}
                          </small>
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
                        <button type="button" className={styles.openButton} onClick={() => handleOpenDocument(doc)}>
                          Open
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className={studentStyles.tableFooter}>
            <span>
              Showing {pagedDocuments.length} of {visibleDocuments.length} results
            </span>
            <div className={studentStyles.pagination}>
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>‹</button>
              <button type="button" className={studentStyles.paginationActive}>{page}</button>
              <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount}>›</button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
