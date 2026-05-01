import api from '../api/axios.js';
import { readEndpointData } from './backendSupport.js';

export const SCOLARITE_DASHBOARD_ENDPOINTS = {
  overview: 'scolarite/dashboard/overview/',
};

function normalizeText(value) {
  return String(value || '').trim();
}

function pickValue(source = {}, keys = []) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }

  return undefined;
}

function normalizeList(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeMetric(payload = {}) {
  const value = pickValue(payload, ['value', 'count', 'total', 'rate']);
  const trend = payload.trend || payload.change || {};

  return {
    value: value ?? null,
    unit: normalizeText(payload.unit || payload.suffix),
    label: normalizeText(payload.label || payload.title),
    helper: normalizeText(payload.helper || payload.description || payload.subtitle),
    trendLabel: normalizeText(trend.label || payload.trend_label || payload.trendLabel),
    trendTone: normalizeText(trend.tone || payload.trend_tone || payload.trendTone),
  };
}

function normalizeStatusTone(status, tone = '') {
  const explicitTone = normalizeText(tone).toLowerCase();

  if (explicitTone) {
    return explicitTone;
  }

  const normalizedStatus = normalizeText(status).toLowerCase();

  if (normalizedStatus.includes('justified') && !normalizedStatus.includes('un')) {
    return 'success';
  }

  if (normalizedStatus.includes('pending')) {
    return 'warning';
  }

  if (normalizedStatus.includes('unjustified') || normalizedStatus.includes('rejected')) {
    return 'danger';
  }

  return 'neutral';
}

function normalizeRecentAbsence(payload = {}) {
  const studentName = normalizeText(
    payload.student_name
      || payload.studentName
      || payload.student?.full_name
      || payload.student?.name,
  );

  return {
    id: normalizeText(payload.id || payload.absence_id || payload.absenceId),
    studentName,
    department: normalizeText(payload.department || payload.department_name || payload.departmentName),
    subject: normalizeText(payload.subject || payload.module || payload.module_name || payload.moduleName),
    date: normalizeText(payload.date || payload.absence_date || payload.absenceDate),
    status: normalizeText(payload.status || payload.justification_status || payload.justificationStatus),
    statusLabel: normalizeText(payload.status_label || payload.statusLabel || payload.status),
    statusTone: normalizeStatusTone(
      payload.status || payload.justification_status || payload.justificationStatus,
      payload.status_tone || payload.statusTone,
    ),
    detailUrl: normalizeText(payload.detail_url || payload.detailUrl || payload.url),
  };
}

function normalizeJustification(payload = {}) {
  const studentName = normalizeText(
    payload.student_name
      || payload.studentName
      || payload.student?.full_name
      || payload.student?.name,
  );

  return {
    id: normalizeText(payload.id || payload.justification_id || payload.justificationId),
    studentName,
    initials: normalizeText(payload.initials || payload.student_initials || payload.studentInitials),
    subject: normalizeText(payload.subject || payload.reason || payload.document_type || payload.documentType),
    submittedAtLabel: normalizeText(
      payload.submitted_at_label
        || payload.submittedAtLabel
        || payload.created_at_label
        || payload.createdAtLabel,
    ),
    approveUrl: normalizeText(payload.approve_url || payload.approveUrl),
    rejectUrl: normalizeText(payload.reject_url || payload.rejectUrl),
  };
}

function normalizeDepartment(payload = {}) {
  const percent = pickValue(payload, ['percent', 'percentage', 'rate', 'value']);

  return {
    id: normalizeText(payload.id || payload.code || payload.name || payload.label),
    label: normalizeText(payload.label || payload.name || payload.department || payload.department_name),
    percent: Number.isFinite(Number(percent)) ? Number(percent) : 0,
    percentLabel: normalizeText(payload.percent_label || payload.percentLabel),
  };
}

function normalizeMakeupSession(payload = {}) {
  return {
    id: normalizeText(payload.id || payload.session_id || payload.sessionId),
    title: normalizeText(payload.title || payload.subject || payload.module || payload.module_name),
    department: normalizeText(payload.department || payload.department_name || payload.departmentName),
    date: normalizeText(payload.date || payload.scheduled_date || payload.scheduledDate),
    room: normalizeText(payload.room || payload.location),
  };
}

export function createEmptyScolariteDashboardOverview() {
  return {
    metrics: {
      absencesToday: normalizeMetric(),
      pendingJustifications: normalizeMetric(),
      scheduledMakeupSessions: normalizeMetric(),
      overallAbsenceRate: normalizeMetric(),
    },
    recentAbsences: [],
    justificationsToReview: [],
    absencesByDepartment: [],
    upcomingMakeupSessions: [],
    notificationsCount: 0,
  };
}

export function normalizeScolariteDashboardOverview(payload = {}) {
  const metricsSource = payload.metrics || payload.summary || {};

  return {
    metrics: {
      absencesToday: normalizeMetric(metricsSource.absences_today || metricsSource.absencesToday || {}),
      pendingJustifications: normalizeMetric(
        metricsSource.pending_justifications || metricsSource.pendingJustifications || {},
      ),
      scheduledMakeupSessions: normalizeMetric(
        metricsSource.scheduled_makeup_sessions || metricsSource.scheduledMakeupSessions || {},
      ),
      overallAbsenceRate: normalizeMetric(
        metricsSource.overall_absence_rate || metricsSource.overallAbsenceRate || {},
      ),
    },
    recentAbsences: normalizeList(
      payload.recent_absences
        || payload.recentAbsences
        || payload.absences
        || [],
    ).map(normalizeRecentAbsence),
    justificationsToReview: normalizeList(
      payload.justifications_to_review
        || payload.justificationsToReview
        || payload.pending_justifications
        || payload.pendingJustifications
        || [],
    ).map(normalizeJustification),
    absencesByDepartment: normalizeList(
      payload.absences_by_department
        || payload.absencesByDepartment
        || payload.departments
        || [],
    ).map(normalizeDepartment),
    upcomingMakeupSessions: normalizeList(
      payload.upcoming_makeup_sessions
        || payload.upcomingMakeupSessions
        || payload.makeup_sessions
        || payload.makeupSessions
        || [],
    ).map(normalizeMakeupSession),
    notificationsCount: Number(pickValue(payload, ['notifications_count', 'notificationsCount'])) || 0,
  };
}

export async function fetchScolariteDashboardOverview() {
  return readEndpointData({
    getPreviewData: createEmptyScolariteDashboardOverview,
    request: () => api.get(SCOLARITE_DASHBOARD_ENDPOINTS.overview),
    normalize: normalizeScolariteDashboardOverview,
  });
}

export async function runScolariteDashboardAction(actionUrl) {
  const normalizedActionUrl = normalizeText(actionUrl);

  if (!normalizedActionUrl) {
    throw new Error('Action endpoint is required.');
  }

  const response = await api.post(normalizedActionUrl);
  return response?.data ?? response;
}
