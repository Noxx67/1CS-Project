import api from '../api/axios.js';
import { readEndpointData } from './backendSupport.js';

export const SCOLARITE_JUSTIFICATIONS_ENDPOINTS = {
  overview: 'scolarite/justifications/',
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

function normalizeStatusTone(status, tone = '') {
  const explicitTone = normalizeText(tone).toLowerCase();

  if (explicitTone) {
    return explicitTone;
  }

  const normalizedStatus = normalizeText(status).toLowerCase();

  if (normalizedStatus.includes('approved') || normalizedStatus.includes('valid')) {
    return 'success';
  }

  if (normalizedStatus.includes('pending') || normalizedStatus.includes('review')) {
    return 'warning';
  }

  if (normalizedStatus.includes('reject') || normalizedStatus.includes('invalid')) {
    return 'danger';
  }

  return 'neutral';
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

export function normalizeJustificationDocument(payload = {}) {
  const status = normalizeText(payload.status || payload.review_status || payload.reviewStatus);

  return {
    id: normalizeText(payload.id || payload.document_id || payload.documentId),
    studentName: normalizeText(
      payload.student_name
        || payload.studentName
        || payload.student?.full_name
        || payload.student?.name,
    ),
    studentCode: normalizeText(
      payload.student_code
        || payload.studentCode
        || payload.registration_number
        || payload.registrationNumber
        || payload.student?.registration_number,
    ),
    avatarUrl: normalizeText(payload.avatar_url || payload.avatarUrl || payload.student?.profile_picture),
    absenceDate: normalizeText(payload.absence_date || payload.absenceDate || payload.date),
    documentTitle: normalizeText(payload.document_title || payload.documentTitle || payload.document_type || payload.documentType || payload.title),
    documentMeta: normalizeText(
      payload.document_meta
        || payload.documentMeta
        || [payload.file_type || payload.fileType, payload.file_size || payload.fileSize].filter(Boolean).join(' - '),
    ),
    reason: normalizeText(payload.reason || payload.description),
    status,
    statusLabel: normalizeText(payload.status_label || payload.statusLabel || status),
    statusTone: normalizeStatusTone(status, payload.status_tone || payload.statusTone),
    documentType: normalizeText(payload.document_type || payload.documentType || payload.type),
    detailUrl: normalizeText(payload.detail_url || payload.detailUrl || payload.url),
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

export function normalizeJustificationsOverview(payload = {}) {
  const metricsSource = payload.metrics || payload.summary || {};
  const documents = normalizeList(payload.documents || payload.justifications || payload.results).map(normalizeJustificationDocument);

  return {
    metrics: {
      pendingReview: normalizeMetric(metricsSource.pending_review || metricsSource.pendingReview || {}),
      approvedThisWeek: normalizeMetric(metricsSource.approved_this_week || metricsSource.approvedThisWeek || {}),
      rejected: normalizeMetric(metricsSource.rejected || {}),
    },
    statuses: normalizeList(payload.statuses),
    documentTypes: normalizeList(payload.document_types || payload.documentTypes),
    documents,
    notificationsCount: normalizeNumber(pickValue(payload, ['notifications_count', 'notificationsCount'])),
  };
}

export async function fetchJustificationsOverview() {
  return readEndpointData({
    getPreviewData: createEmptyJustificationsOverview,
    request: () => api.get(SCOLARITE_JUSTIFICATIONS_ENDPOINTS.overview),
    normalize: normalizeJustificationsOverview,
  });
}
