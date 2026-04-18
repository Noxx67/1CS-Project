import { useEffect, useState } from 'react';
import { useActivityLogs } from '../context/ActivityLogsContext';
import { useUsers } from '../context/UsersContext';
import { useAppPreferences } from '../context/AppPreferencesContext';
import ActivityDatePicker from '../components/ActivityDatePicker';
import {
  buildVisiblePages,
  exportActivityLogsToCsv,
  formatActivityLabel,
  formatActivityTimestampParts,
  matchesActivityDateFilter,
  normalizeActivityFilter,
  ROLE_FILTER_OPTIONS,
} from '../utils/activityLogs';
import { exportUsersToCsv } from '../utils/exportUsersToCsv';
import styles from './ActivityLogsPage.module.css';

const SEARCH_ICON = '\u{1F50D}';
const EXPORT_ICON = '\u2B07';
const ADD_ICON = '+';
const INFO_ICON = '\u2139';
const PREV_ICON = '\u2039';
const NEXT_ICON = '\u203A';
const EMPTY_VALUE = '-';

function getTranslatedActivityLabel(value, t, type = 'default') {
  const normalizedValue = normalizeActivityFilter(value);

  if (!normalizedValue) {
    return '';
  }

  if (type === 'role') {
    return t(`roles.${normalizedValue.toUpperCase()}`, formatActivityLabel(value));
  }

  if (type === 'severity') {
    return t(`activity.severityLabels.${normalizedValue}`, formatActivityLabel(value));
  }

  return formatActivityLabel(value);
}

function getRowClassName(severity) {
  const normalizedSeverity = normalizeActivityFilter(severity);

  if (normalizedSeverity === 'alert') {
    return styles.tableRowAlert;
  }

  if (normalizedSeverity === 'warning') {
    return styles.tableRowWarning;
  }

  return '';
}

function getSeverityClassName(severity) {
  const normalizedSeverity = normalizeActivityFilter(severity);

  if (normalizedSeverity === 'alert') {
    return styles.severityAlert;
  }

  if (normalizedSeverity === 'warning') {
    return styles.severityWarning;
  }

  if (normalizedSeverity === 'success') {
    return styles.severitySuccess;
  }

  return styles.severityInfo;
}

export default function ActivityLogsPage({ onOpenAddNewUser }) {
  const { locale, t } = useAppPreferences();
  const { activityLogs, isLoadingActivityLogs } = useActivityLogs();
  const { users, fetchAllUsers } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedActionType, setSelectedActionType] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  const normalizedQuery = normalizeActivityFilter(searchQuery);
  const actionOptions = Array.from(
    new Set(
      activityLogs
        .map((log) => String(log.actionType || '').trim())
        .filter(Boolean)
    )
  );

  const filteredLogs = activityLogs.filter((log) => {
    const matchesQuery = !normalizedQuery || [
      log.userName,
      log.userRole,
      log.actionType,
      log.actionDescription,
      log.ipAddress,
      log.severity,
      log.details,
    ].some((value) => normalizeActivityFilter(value).includes(normalizedQuery));

    const matchesRole = !selectedRole || normalizeActivityFilter(log.userRole) === normalizeActivityFilter(selectedRole);
    const matchesActionType = !selectedActionType || normalizeActivityFilter(log.actionType) === normalizeActivityFilter(selectedActionType);
    const matchesPeriod = matchesActivityDateFilter(log.timestamp, selectedPeriod);

    return matchesQuery && matchesRole && matchesActionType && matchesPeriod;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + rowsPerPage);
  const rangeStart = filteredLogs.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = filteredLogs.length === 0 ? 0 : startIndex + paginatedLogs.length;
  const visiblePages = buildVisiblePages(totalPages, currentPage);
  const hasActiveFilters = Boolean(normalizedQuery || selectedRole || selectedActionType || selectedPeriod);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRole, selectedActionType, selectedPeriod]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function handleExportClick() {
    exportActivityLogsToCsv(filteredLogs);
  }

  async function handleExportUserDirectoryClick() {
    if (users.length > 0) {
      exportUsersToCsv(users);
      return;
    }

    try {
      const fetchedUsers = await fetchAllUsers();
      exportUsersToCsv(fetchedUsers);
    } catch {
      exportUsersToCsv([]);
    }
  }

  return (
    <>
      <section className={styles.topbar}>
        <div className={styles.topbarCopy}>
          <h1 className={styles.title}>{t('activity.pageTitle')}</h1>
        </div>

        <div className={styles.topbarActions}>
          <button
            type="button"
            className={`${styles.topbarButton} ${styles.secondaryButton}`}
            onClick={handleExportUserDirectoryClick}
          >
            <span className={styles.buttonIcon}>{EXPORT_ICON}</span>
            {t('activity.exportList')}
          </button>
          <button
            type="button"
            className={`${styles.topbarButton} ${styles.primaryButton}`}
            onClick={onOpenAddNewUser}
          >
            <span className={styles.buttonIcon}>{ADD_ICON}</span>
            {t('activity.addNewUser')}
          </button>
        </div>
      </section>

      <div className={`page-body ${styles.pageBody}`}>
        <section className={styles.filtersCard}>
          <div className={styles.filtersGrid}>
            <label className={styles.searchField} htmlFor="activity-logs-search">
              <span className={styles.searchIcon}>{SEARCH_ICON}</span>
              <input
                id="activity-logs-search"
                type="text"
                className={styles.searchInput}
                placeholder={t('activity.searchPlaceholder')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>

            <label className={styles.filterField}>
              <span className={styles.filterLabel}>{t('activity.roleLabel')}</span>
              <select
                className={styles.select}
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value)}
              >
                <option value="">{t('activity.allRoles')}</option>
                {ROLE_FILTER_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {getTranslatedActivityLabel(role, t, 'role')}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterField}>
              <span className={styles.filterLabel}>{t('activity.actionLabel')}</span>
              <select
                className={styles.select}
                value={selectedActionType}
                onChange={(event) => setSelectedActionType(event.target.value)}
              >
                <option value="">{t('activity.allTypes')}</option>
                {actionOptions.map((actionType) => (
                  <option key={actionType} value={actionType}>
                    {getTranslatedActivityLabel(actionType, t)}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterField}>
              <span className={styles.filterLabel}>{t('activity.periodLabel')}</span>
              <ActivityDatePicker
                value={selectedPeriod}
                onChange={setSelectedPeriod}
              />
            </label>
          </div>

          <div className={styles.filterActions}>
            <button
              type="button"
              className={`${styles.topbarButton} ${styles.primaryButton}`}
              onClick={handleExportClick}
            >
              <span className={styles.buttonIcon}>{EXPORT_ICON}</span>
              {t('activity.exportCsv')}
            </button>
          </div>
        </section>

        <section className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('activity.timestamp')}</th>
                  <th>{t('activity.userIdentity')}</th>
                  <th>{t('activity.actionDescription')}</th>
                  <th>{t('activity.ipAddress')}</th>
                  <th>{t('activity.severity')}</th>
                  <th>{t('activity.details')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td className={styles.emptyCell} colSpan={6}>
                      {isLoadingActivityLogs
                        ? t('activity.loading')
                        : hasActiveFilters
                          ? t('activity.noMatch')
                          : t('activity.noLogs')}
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => {
                    const timestampParts = formatActivityTimestampParts(log.timestamp, locale);

                    return (
                      <tr key={log.id} className={getRowClassName(log.severity)}>
                        <td>
                          <div className={styles.timestampCell}>
                            <span className={styles.timestampDate}>{timestampParts.dateLabel}</span>
                            <span className={styles.timestampTime}>{timestampParts.timeLabel}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.identityCell}>
                            <span className={styles.identityAvatar}>
                              {log.userInitials || '??'}
                            </span>
                            <div className={styles.identityCopy}>
                              <span className={styles.identityName}>{log.userName || t('common.unknownUser')}</span>
                              <span className={styles.identityRole}>
                                {getTranslatedActivityLabel(log.userRole, t, 'role') || t('common.noRole')}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.descriptionCell}>
                            {log.actionType && (
                              <span className={styles.actionType}>
                                {getTranslatedActivityLabel(log.actionType, t)}
                              </span>
                            )}
                            <span className={styles.descriptionText}>
                              {log.actionDescription || EMPTY_VALUE}
                            </span>
                          </div>
                        </td>
                        <td className={styles.ipAddressCell}>{log.ipAddress || EMPTY_VALUE}</td>
                        <td>
                          <span className={`${styles.severityBadge} ${getSeverityClassName(log.severity)}`}>
                            {getTranslatedActivityLabel(log.severity, t, 'severity') || t('activity.info')}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.detailsButton}
                            title={log.details || t('activity.noDetailsAvailable')}
                            aria-label={log.details ? `${t('activity.viewDetailsFor')} ${log.userName}` : t('activity.noDetailsAvailable')}
                            disabled={!log.details}
                          >
                            {INFO_ICON}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.footer}>
            <p className={styles.resultsText}>
              {t('activity.showing')} <strong>{rangeStart}-{rangeEnd}</strong> {t('activity.of')} <strong>{filteredLogs.length}</strong> {t('activity.logs')}
            </p>

            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageButton}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                aria-label={t('common.previousPage')}
              >
                {PREV_ICON}
              </button>

              {visiblePages.map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`${styles.pageButton} ${page === currentPage ? styles.pageButtonActive : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className={styles.pageButton}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                aria-label={t('common.nextPage')}
              >
                {NEXT_ICON}
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
