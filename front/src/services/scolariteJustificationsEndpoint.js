import api from '../api/axios.js';
import { readEndpointData } from './backendSupport.js';

export const SCOLARITE_JUSTIFICATIONS_ENDPOINTS = {
  overview: 'schedules/justifications/overview/',
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
    id: normalizeText(payload.id),
    studentName: normalizeText(payload.student_name),
    studentCode: normalizeText(payload.student?.registration_number || 'N/A'),
    avatarUrl: normalizeText(payload.student?.profile_picture),
    absenceDate: normalizeText(payload.absence_details?.date),
    documentTitle: normalizeText(payload.justification_type),
    documentMeta: normalizeText(payload.absence_details?.subject),
    reason: normalizeText(payload.scholarite_comment),
    status,
    statusLabel: normalizeText(status),
    statusTone: normalizeStatusTone(status, payload.status_tone || payload.statusTone),
    documentType: normalizeText(payload.justification_type),
    detailUrl: normalizeText(payload.file),
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
