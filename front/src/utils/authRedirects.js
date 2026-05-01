export function normalizeUserRole(role) {
  return String(role || '').trim().toUpperCase();
}

export function getRoleHomePath(user) {
  const role = normalizeUserRole(user?.role);

  if (role === 'ADMIN') {
    return '/dashboard';
  }

  if (role === 'TEACHER') {
    return '/teacher/dashboard';
  }

  if (role === 'SCOLARITE') {
    return '/scolarite/dashboard';
  }

  return '/wow';
}

export function shouldForcePasswordReset(user) {
  return Boolean(user?.must_change_password) && normalizeUserRole(user?.role) !== 'ADMIN';
}
