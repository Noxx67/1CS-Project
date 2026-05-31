import api from '../api/axios.js';
import { resolveMediaUrl } from '../utils/mediaUrl.js';

export const SCOLARITE_JUSTIFICATIONS_ENDPOINTS = {
  overview: 'schedules/justifications/overview/',
};

const TYPE_LABELS = {
  MEDICAL: 'Medical',
  TRANSPORT: 'Transport',
  FAMILY: 'Administrative',
  ADMIN: 'Administrative',
  ADMINISTRATIVE: 'Administrative',
  OTHER: 'Other',
};

export function normalizeDocumentType(raw = '') {
  const value = normalizeText(raw)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (!value) return '';
  if (value.includes('MEDIC')) return 'MEDICAL';
  if (value.includes('TRANS')) return 'TRANSPORT';
  if (value.includes('FAMIL') || value.includes('ADMIN')) return 'FAMILY';
  if (value.includes('AUTRE') || value.includes('OTHER')) return 'OTHER';
  if (TYPE_LABELS[value]) return value;
  return value;
}

export function getDocumentTypeLabel(documentType = '') {
  const code = normalizeDocumentType(documentType);
  if (!code) return 'Unspecified';
  return TYPE_LABELS[code] || code.charAt(0) + code.slice(1).toLowerCase();
}

const TYPE_BADGE_TONES = {
  MEDICAL: 'medical',
  TRANSPORT: 'transport',
  FAMILY: 'administrative',
  OTHER: 'neutral',
};

export const JUSTIFICATION_STATUS = {
  PENDING: 'EN ATTENTE',
  APPROVED: 'JUSTIFIÉE',
  REJECTED: 'INJUSTIFIÉE',
};

const METRIC_HELPERS = {
  pendingReview: 'Awaiting validation',
  approvedThisWeek: 'Validated documents',
  rejected: 'Rejected this week',
};

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeList(value) {
  return Array.isArray(value) ? value : [];
}

function pickValue(source = {}, keys = []) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }

  return undefined;
}

function normalizeNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function getJustificationStatusCode(status = '') {
  const normalized = normalizeText(status).toUpperCase();

  if (
    normalized === JUSTIFICATION_STATUS.REJECTED
    || normalized.includes('INJUSTIFI')
    || normalized === 'REJECTED'
    || normalized.includes('REJECT')
  ) {
    return JUSTIFICATION_STATUS.REJECTED;
  }

  if (
    normalized === JUSTIFICATION_STATUS.APPROVED
    || normalized.includes('APPROUV')
    || (normalized.includes('JUSTIFI') && !normalized.includes('INJUSTIFI'))
  ) {
    return JUSTIFICATION_STATUS.APPROVED;
  }

  if (normalized === JUSTIFICATION_STATUS.PENDING || normalized.includes('ATTENTE') || normalized.includes('PENDING')) {
    return JUSTIFICATION_STATUS.PENDING;
  }

  return normalized;
}

export function getJustificationStatusLabel(status = '') {
  switch (getJustificationStatusCode(status)) {
    case JUSTIFICATION_STATUS.APPROVED:
      return 'Approuved';
    case JUSTIFICATION_STATUS.REJECTED:
      return 'Rejected';
    case JUSTIFICATION_STATUS.PENDING:
      return 'Pending review';
    default:
      return normalizeText(status) || 'Pending review';
  }
}

function normalizeStatusTone(status, tone = '') {
  const explicitTone = normalizeText(tone).toLowerCase();

  if (explicitTone) {
    return explicitTone;
  }

  switch (getJustificationStatusCode(status)) {
    case JUSTIFICATION_STATUS.APPROVED:
      return 'success';
    case JUSTIFICATION_STATUS.PENDING:
      return 'warning';
    case JUSTIFICATION_STATUS.REJECTED:
      return 'danger';
    default:
      return 'neutral';
  }
}

function startOfWeek(referenceDate = new Date()) {
  const date = new Date(referenceDate);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isWithinCurrentWeek(isoDate) {
  const value = normalizeText(isoDate);
  if (!value) return false;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  const weekStart = startOfWeek();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return parsed >= weekStart && parsed < weekEnd;
}

export function computeJustificationsMetrics(documents = []) {
  const pendingCount = documents.filter(
    (doc) => getJustificationStatusCode(doc.status) === JUSTIFICATION_STATUS.PENDING,
  ).length;

  const approvedThisWeekCount = documents.filter((doc) => (
    getJustificationStatusCode(doc.status) === JUSTIFICATION_STATUS.APPROVED
    && isWithinCurrentWeek(doc.statusUpdatedAt || doc.submissionDate)
  )).length;

  const rejectedThisWeekCount = documents.filter((doc) => (
    getJustificationStatusCode(doc.status) === JUSTIFICATION_STATUS.REJECTED
    && isWithinCurrentWeek(doc.statusUpdatedAt || doc.submissionDate)
  )).length;

  return {
    pendingReview: normalizeMetric({
      value: pendingCount,
      label: 'Pending review',
      helper: METRIC_HELPERS.pendingReview,
    }),
    approvedThisWeek: normalizeMetric({
      value: approvedThisWeekCount,
      label: 'Approved this week',
      helper: METRIC_HELPERS.approvedThisWeek,
    }),
    rejected: normalizeMetric({
      value: rejectedThisWeekCount,
      label: 'Rejected this week',
      helper: METRIC_HELPERS.rejected,
    }),
  };
}

function deriveStatusOptions(documents = []) {
  const codes = new Set(documents.map((doc) => getJustificationStatusCode(doc.status)).filter(Boolean));
  return [...codes];
}

function normalizeMetric(payload = {}) {
  return {
    value: normalizeNumber(pickValue(payload, ['value', 'count', 'total'])),
    label: normalizeText(payload.label || payload.title),
    helper: normalizeText(payload.helper || payload.description || payload.subtitle),
    tone: normalizeText(payload.tone),
    icon: normalizeText(payload.icon),
  };
}

function fileNameFromPath(filePath) {
  const path = normalizeText(filePath);
  if (!path) return '';
  return path.split('/').pop() || path;
}

function formatSubmissionMeta(submissionDate, subjectFallback) {
  if (!submissionDate) {
    return normalizeText(subjectFallback);
  }

  const parsed = new Date(submissionDate);
  if (Number.isNaN(parsed.getTime())) {
    return normalizeText(subjectFallback);
  }

  const uploadedLabel = parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `Uploaded ${uploadedLabel}`;
}

function formatDisplayDate(raw = '') {
  const value = normalizeText(raw);
  if (!value) return '';

  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).toLowerCase();
  }

  return value.toLowerCase();
}

function formatAbsenceDateOnly(absenceDetails = {}) {
  const fromApi = formatDateYmd(absenceDetails.date);
  if (fromApi) return fromApi;

  const label = normalizeText(absenceDetails.date_label || absenceDetails.dateLabel);
  if (label) {
    const parsed = Date.parse(label);
    if (!Number.isNaN(parsed)) {
      return formatDateYmd(parsed);
    }
  }

  return '';
}

export function formatAbsenceDateDisplay(absenceDetails = {}, submissionDate = '') {
  const label = normalizeText(absenceDetails.date_label || absenceDetails.dateLabel);
  if (label && !/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    return label.toLowerCase();
  }

  const fromAbsence = formatDisplayDate(absenceDetails.date);
  if (fromAbsence) return fromAbsence;

  return formatDisplayDate(submissionDate);
}

export function formatUploadMeta(submissionDate = '', fileSizeLabel = '') {
  if (!submissionDate) {
    return normalizeText(fileSizeLabel);
  }

  const parsed = new Date(submissionDate);
  if (Number.isNaN(parsed.getTime())) {
    return normalizeText(fileSizeLabel);
  }

  const time = parsed.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = [`Uploaded ${time}`];
  if (fileSizeLabel) {
    parts.push(fileSizeLabel);
  }

  return parts.join(' • ');
}

export function formatDateYmd(value = '') {
  const raw = normalizeText(value);
  if (!raw) return '';

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatSubmissionDateLabel(submissionDate = '') {
  return formatDateYmd(submissionDate);
}

function inferDocumentTypeFromText(text = '') {
  const lower = normalizeText(text).toLowerCase();
  if (lower.includes('medical') || lower.includes('medic')) return 'MEDICAL';
  if (lower.includes('transport')) return 'TRANSPORT';
  if (lower.includes('admin') || lower.includes('family') || lower.includes('famille')) return 'FAMILY';
  return '';
}

function inferDocumentTypeFromFileName(fileName = '') {
  return inferDocumentTypeFromText(fileName);
}

function pickFileSizeLabel(payload = {}, fileDetails = {}) {
  return normalizeText(
    fileDetails.size_label
    || fileDetails.sizeLabel
    || payload.file_size_label
    || payload.fileSizeLabel,
  );
}

export function normalizeJustificationDocument(payload = {}) {
  const status = getJustificationStatusCode(payload.status || payload.review_status || payload.reviewStatus);
  const profile = payload.student_profile && typeof payload.student_profile === 'object'
    ? payload.student_profile
    : {};
  const absenceDetails = payload.absence_details && typeof payload.absence_details === 'object'
    ? payload.absence_details
    : {};
  const filePath = normalizeText(payload.file);
  const fileDetailsEarly = payload.file_details && typeof payload.file_details === 'object'
    ? payload.file_details
    : {};
  const fileName = normalizeText(fileDetailsEarly.name) || fileNameFromPath(filePath);
  const reasonText = normalizeText(payload.student_comment || payload.reason);
  const documentType = normalizeDocumentType(
    payload.justification_type
    || payload.document_type
    || payload.type
    || inferDocumentTypeFromFileName(fileName)
    || inferDocumentTypeFromText(reasonText),
  );
  const typeLabel = getDocumentTypeLabel(documentType);
  const submissionDateRaw = payload.submission_date || payload.submissionDate;
  const submissionDateLabel = formatSubmissionDateLabel(submissionDateRaw);
  const fileDetails = fileDetailsEarly;
  const fileSizeLabel = pickFileSizeLabel(payload, fileDetails);
  const student = payload.student && typeof payload.student === 'object' ? payload.student : {};

  return {
    id: normalizeText(payload.id),
    studentName: normalizeText(
      payload.student_name
      || student.full_name
      || [student.first_name, student.last_name].filter(Boolean).join(' '),
    ),
    studentCode: normalizeText(
      profile.registration_number
      || student.registration_number
      || payload.registration_number
      || 'N/A',
    ),
    group: normalizeText(profile.group || payload.group),
    semesterLabel: profile.year != null && profile.year !== ''
      ? `Semester ${profile.year}`
      : '',
    avatarUrl: resolveMediaUrl(profile.profile_picture),
    absenceDate: formatAbsenceDateOnly(absenceDetails),
    absenceDateDisplay: formatAbsenceDateDisplay(absenceDetails, submissionDateRaw),
    submissionDateLabel,
    sessionSubject: normalizeText(absenceDetails.subject),
    documentFileName: fileName || `${typeLabel.replace(/\s+/g, '_')}.pdf`,
    documentTitle: typeLabel,
    uploadMeta: formatUploadMeta(submissionDateRaw, fileSizeLabel) || (filePath ? '' : 'No file attached'),
    hasAttachment: Boolean(filePath),
    reason: normalizeText(payload.student_comment || payload.reason),
    scholariteComment: normalizeText(payload.scholarite_comment),
    submissionDate: normalizeText(payload.submission_date || payload.submissionDate),
    statusUpdatedAt: normalizeText(payload.status_updated_at || payload.statusUpdatedAt),
    status,
    statusLabel: getJustificationStatusLabel(status),
    statusTone: normalizeStatusTone(status, payload.status_tone || payload.statusTone),
    documentType,
    documentTypeLabel: typeLabel,
    typeBadgeTone: TYPE_BADGE_TONES[documentType] || 'neutral',
    detailUrl: resolveMediaUrl(filePath),
  };
}

export function createEmptyJustificationsOverview() {
  return {
    metrics: {
      pendingReview: normalizeMetric(),
      approvedThisWeek: normalizeMetric(),
      rejected: normalizeMetric(),
    },
    statuses: [],
    documentTypes: [],
    documents: [],
    notificationsCount: 0,
  };
}

export function applyComputedMetrics(overview = {}) {
  const documents = normalizeList(overview.documents);
  const metrics = computeJustificationsMetrics(documents);

  return {
    ...overview,
    metrics,
    statuses: deriveStatusOptions(documents),
  };
}

export function normalizeJustificationsOverview(payload = {}) {
  const documents = normalizeList(payload.documents || payload.justifications || payload.results).map(normalizeJustificationDocument);

  return applyComputedMetrics({
    metrics: computeJustificationsMetrics(documents),
    statuses: normalizeList(payload.statuses),
    documentTypes: normalizeList(payload.document_types || payload.documentTypes),
    documents,
    notificationsCount: 0,
  });
}

export function formatDecisionTimestamp(raw = '') {
  const value = normalizeText(raw);
  if (!value) return '';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function updateJustificationDecision(documents, id, decision, comment = '') {
  const nowIso = new Date().toISOString();
  const nextStatus = decision === 'approve'
    ? JUSTIFICATION_STATUS.APPROVED
    : JUSTIFICATION_STATUS.REJECTED;
  const reviewComment = normalizeText(comment);

  return documents.map((doc) => (
    doc.id === id
      ? {
        ...doc,
        status: nextStatus,
        statusLabel: getJustificationStatusLabel(nextStatus),
        statusTone: normalizeStatusTone(nextStatus),
        statusUpdatedAt: nowIso,
        scholariteComment: reviewComment || doc.scholariteComment,
      }
      : doc
  ));
}

export async function fetchJustificationsOverview() {
  const response = await api.get(SCOLARITE_JUSTIFICATIONS_ENDPOINTS.overview);
  return normalizeJustificationsOverview(response?.data ?? response);
}
