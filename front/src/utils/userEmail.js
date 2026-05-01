function normalizeNamePart(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

const TITLE_PREFIXES = new Set(['dr', 'prof', 'pr', 'mr', 'mrs', 'ms']);

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

export function buildInstitutionalEmailFromFullName(fullName) {
  const nameParts = normalizeNamePart(fullName)
    .split(/\s+/)
    .filter(Boolean);

  if (!nameParts.length) {
    return '';
  }

  const partsWithoutTitle = TITLE_PREFIXES.has(nameParts[0])
    ? nameParts.slice(1)
    : nameParts;

  if (!partsWithoutTitle.length) {
    return '';
  }

  const familyName = partsWithoutTitle[partsWithoutTitle.length - 1] || '';
  const givenNameParts = partsWithoutTitle.slice(0, -1);
  const initials = givenNameParts
    .map((part) => part[0])
    .join('');

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
