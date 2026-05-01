function escapeCsvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function exportTableToCsv({ filename, headers, rows }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const csvContent = [headers, ...safeRows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'export.csv';
  link.click();
  URL.revokeObjectURL(url);
}
