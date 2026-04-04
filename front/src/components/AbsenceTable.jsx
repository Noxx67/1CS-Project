import { useState } from 'react';
import { useAbsenceRecords } from '../context/AbsenceRecordsContext';
import { useAppPreferences } from '../context/AppPreferencesContext';
import './AbsenceTable.css';

const avatarColors = {
  KA: { bg: '#e8eef8', color: '#3a5fa0' },
  SL: { bg: '#e8f4ec', color: '#2e7d52' },
  MB: { bg: '#fce8ea', color: '#c0394a' },
};

const MASK = '\u2022 \u2022 \u2022 \u2022 \u2022';

function exportToCSV(rows, headers) {
  const csvRows = rows.map((row) => [
    row.name,
    row.specialization,
    row.module,
    row.timestamp,
    row.validation,
  ]);

  const csvContent = [headers, ...csvRows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'absence_records.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export default function AbsenceTable({ searchQuery = '' }) {
  const { t } = useAppPreferences();
  const [hidden, setHidden] = useState({});
  const { absenceRecords } = useAbsenceRecords();

  const toggleHide = (id) =>
    setHidden((prev) => ({ ...prev, [id]: !prev[id] }));

  const q = searchQuery.toLowerCase();
  const filtered = absenceRecords.filter(
    (record) =>
      String(record.name || '').toLowerCase().includes(q) ||
      String(record.specialization || '').toLowerCase().includes(q) ||
      String(record.module || '').toLowerCase().includes(q)
  );
  const emptyMessage = q
    ? t('absenceTable.noSearchResults')
    : t('absenceTable.noRecords');
  const csvHeaders = [
    t('absenceTable.studentIdentity'),
    t('absenceTable.specialization'),
    t('absenceTable.module'),
    t('absenceTable.timestamp'),
    t('absenceTable.validation'),
  ];

  return (
    <div className="absence-table-card">
      <div className="table-header">
        <div>
          <h3 className="table-title">{t('absenceTable.title')}</h3>
          <p className="table-subtitle">{t('absenceTable.subtitle')}</p>
        </div>
        <button type="button" className="export-btn" onClick={() => exportToCSV(filtered, csvHeaders)}>
          {t('absenceTable.exportRecords')}
        </button>
      </div>

      <table className="absence-table">
        <thead>
          <tr>
            <th>{t('absenceTable.studentIdentity')}</th>
            <th>{t('absenceTable.specialization')}</th>
            <th>{t('absenceTable.module')}</th>
            <th>{t('absenceTable.timestamp')}</th>
            <th>{t('absenceTable.validation')}</th>
            <th>{t('absenceTable.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#9aa0b4', fontSize: '13px' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            filtered.map((row) => {
              const avatarStyle = avatarColors[row.initials] || { bg: '#eee', color: '#555' };
              const isHidden = !!hidden[row.id];

              return (
                <tr key={row.id} className={isHidden ? 'row--hidden' : ''}>
                  <td>
                    <div className="student-cell">
                      <div
                        className="student-avatar"
                        style={{ background: avatarStyle.bg, color: avatarStyle.color }}
                      >
                        {isHidden ? '?' : row.initials}
                      </div>
                      <span className="student-name">
                        {isHidden ? MASK : row.name}
                      </span>
                    </div>
                  </td>
                  <td className="cell-muted">{isHidden ? MASK : row.specialization}</td>
                  <td className="cell-muted">{isHidden ? MASK : row.module}</td>
                  <td className="cell-muted">{isHidden ? MASK : row.timestamp}</td>
                  <td>
                    <span className={`status-badge status-badge--${row.status}`}>
                      {row.validation}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`view-btn ${isHidden ? 'view-btn--active' : ''}`}
                      title={isHidden ? t('absenceTable.revealInfo') : t('absenceTable.hideInfo')}
                      onClick={() => toggleHide(row.id)}
                    >
                      {isHidden ? '\u{1F648}' : '\u{1F441}'}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
