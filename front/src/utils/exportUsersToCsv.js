function escapeCsvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function formatLabel(value) {
  const normalizedValue = String(value || '').toLowerCase();
  const labels = {
    student: 'Student',
    teacher: 'Teacher',
    scolarite: 'Scolarite',
    admin: 'Admin',
    active: 'Active',
    suspended: 'Suspended',
  };

  return labels[normalizedValue] || value || '';
}

export function exportUsersToCsv(users) {
  const headers = ['Name', 'Email', 'ID Number', 'Role', 'Department', 'Status'];
  const rows = (Array.isArray(users) ? users : []).map((user) => ([
    user.name,
    user.email,
    user.idNumber,
    formatLabel(user.role),
    user.department,
    formatLabel(user.accountStatus),
  ]));

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'user_directory.csv';
  link.click();
  URL.revokeObjectURL(url);
}
