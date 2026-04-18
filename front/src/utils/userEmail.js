function normalizeNamePart(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

export function buildUserEmail(firstName, lastName) {
  const firstNameParts = normalizeNamePart(firstName)
    .split(/\s+/)
    .filter(Boolean);
  const lastNameParts = normalizeNamePart(lastName)
    .split(/\s+/)
    .filter(Boolean);

  const initials = firstNameParts
    .map((part) => part[0])
    .join('');
  const familyName = lastNameParts.join('');

  if (!initials && !familyName) {
    return '';
  }

  if (!initials) {
    return `${familyName}@esi-sba.dz`;
  }

  if (!familyName) {
    return `${initials}@esi-sba.dz`;
  }

  return `${initials}.${familyName}@esi-sba.dz`;
}
