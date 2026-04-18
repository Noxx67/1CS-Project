const EMPTY_VALUE = '-';

export const ROLE_FILTER_OPTIONS = ['admin', 'student', 'teacher', 'scolarite'];

export function normalizeActivityFilter(value) {
  return String(value || '').trim().toLowerCase();
}

export function formatActivityLabel(value) {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    return '';
  }

  return normalizedValue
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatActivityTimestampForCsv(value) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value || '');
  }

  const pad = (part) => String(part).padStart(2, '0');

  return [
    parsedDate.getFullYear(),
    pad(parsedDate.getMonth() + 1),
    pad(parsedDate.getDate()),
  ].join('-') + ` ${pad(parsedDate.getHours())}:${pad(parsedDate.getMinutes())}:${pad(parsedDate.getSeconds())}`;
}

function escapeCsvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function formatActivityTimestampParts(value, locale) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return {
      dateLabel: EMPTY_VALUE,
      timeLabel: EMPTY_VALUE,
    };
  }

  return {
    dateLabel: new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(parsedDate),
    timeLabel: new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(parsedDate),
  };
}

export function matchesActivityDateFilter(timestamp, selectedDate) {
  if (!selectedDate) {
    return true;
  }

  const parsedDate = new Date(timestamp);

  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const pad = (part) => String(part).padStart(2, '0');
  const normalizedDate = [
    parsedDate.getFullYear(),
    pad(parsedDate.getMonth() + 1),
    pad(parsedDate.getDate()),
  ].join('-');

  return normalizedDate === selectedDate;
}

export function exportActivityLogsToCsv(logs) {
  const headers = [
    'Timestamp',
    'User Name',
    'User Role',
    'Action Type',
    'Action Description',
    'IP Address',
    'Severity',
    'Details',
  ];

  const rows = (Array.isArray(logs) ? logs : []).map((log) => ([
    formatActivityTimestampForCsv(log.timestamp),
    log.userName || '',
    formatActivityLabel(log.userRole),
    formatActivityLabel(log.actionType),
    log.actionDescription || '',
    log.ipAddress || '',
    formatActivityLabel(log.severity) || 'Info',
    log.details || '',
  ]));

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'activity_logs.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export function buildVisiblePages(totalPages, currentPage) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, startPage + 4);
  startPage = Math.max(1, endPage - 4);

  return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
}
