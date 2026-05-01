import api from '../api/axios.js';
import { readEndpointData, runEndpointMutation } from './backendSupport.js';

export const SCOLARITE_MAKEUP_SESSIONS_ENDPOINTS = {
  overview: 'scolarite/makeup-sessions/',
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

function normalizeMetric(payload = {}) {
  return {
    value: pickValue(payload, ['value', 'count', 'total']) ?? null,
    label: normalizeText(payload.label || payload.title),
    helper: normalizeText(payload.helper || payload.description || payload.subtitle),
  };
}

function normalizeStatusTone(status, tone = '') {
  const explicitTone = normalizeText(tone).toLowerCase();

  if (explicitTone) {
    return explicitTone;
  }

  const normalizedStatus = normalizeText(status).toLowerCase();

  if (normalizedStatus.includes('complete') || normalizedStatus.includes('held') || normalizedStatus.includes('done')) {
    return 'success';
  }

  if (normalizedStatus.includes('pending') || normalizedStatus.includes('request')) {
    return 'warning';
  }

  if (normalizedStatus.includes('cancel') || normalizedStatus.includes('reject')) {
    return 'danger';
  }

  return 'neutral';
}

function normalizeSession(payload = {}) {
  const status = normalizeText(payload.status || payload.session_status || payload.sessionStatus);

  return {
    id: normalizeText(payload.id || payload.session_id || payload.sessionId),
    moduleName: normalizeText(payload.module_name || payload.moduleName || payload.module || payload.subject || payload.title),
    group: normalizeText(payload.group || payload.group_code || payload.groupCode || payload.section),
    teacherName: normalizeText(
      payload.teacher_name
        || payload.teacherName
        || payload.responsible_teacher_name
        || payload.teacher?.full_name
        || payload.teacher?.name,
    ),
    date: normalizeText(payload.date || payload.scheduled_date || payload.scheduledDate),
    time: normalizeText(
      payload.time
        || payload.time_range
        || payload.timeRange
        || [payload.start_time || payload.startTime, payload.end_time || payload.endTime].filter(Boolean).join(' - '),
    ),
    room: normalizeText(payload.room || payload.location),
    filterValue: normalizeText(payload.filter || payload.filter_value || payload.filterValue || payload.period),
    status,
    statusLabel: normalizeText(payload.status_label || payload.statusLabel || status),
    statusTone: normalizeStatusTone(status, payload.status_tone || payload.statusTone),
    detailUrl: normalizeText(payload.detail_url || payload.detailUrl || payload.url),
  };
}

function normalizeRequest(payload = {}) {
  const status = normalizeText(payload.status || payload.request_status || payload.requestStatus || 'pending');
  const approveUrl = normalizeText(payload.approve_url || payload.approveUrl);
  const rejectUrl = normalizeText(payload.reject_url || payload.rejectUrl);

  return {
    id: normalizeText(payload.id || payload.request_id || payload.requestId),
    moduleName: normalizeText(payload.module_name || payload.moduleName || payload.module || payload.subject || payload.title),
    teacherName: normalizeText(
      payload.teacher_name
        || payload.teacherName
        || payload.teacher?.full_name
        || payload.teacher?.name,
    ),
    group: normalizeText(payload.group || payload.group_code || payload.groupCode || payload.section),
    proposedDate: normalizeText(payload.proposed_date || payload.proposedDate || payload.date),
    time: normalizeText(
      payload.time
        || payload.time_range
        || payload.timeRange
        || [payload.start_time || payload.startTime, payload.end_time || payload.endTime].filter(Boolean).join(' - '),
    ),
    type: normalizeText(payload.type || payload.session_type || payload.sessionType),
    rooms: normalizeList(payload.rooms || payload.available_rooms || payload.availableRooms)
      .map((room) => normalizeText(typeof room === 'string' ? room : room?.name || room?.label || room?.code))
      .filter(Boolean),
    selectedRoom: normalizeText(payload.selected_room || payload.selectedRoom || payload.room || payload.location),
    status,
    statusLabel: normalizeText(payload.status_label || payload.statusLabel || status),
    statusTone: normalizeStatusTone(status, payload.status_tone || payload.statusTone),
    isNew: Boolean(payload.is_new ?? payload.isNew ?? payload.new),
    approveUrl,
    rejectUrl,
  };
}

function deriveMetric(value, label, helper) {
  return {
    value,
    label,
    helper,
  };
}

export function createEmptyMakeupSessionsOverview() {
  return {
    metrics: {
      pendingRequests: normalizeMetric(),
      scheduledThisWeek: normalizeMetric(),
      totalMakeups: normalizeMetric(),
      completedThisWeek: normalizeMetric(),
    },
    sessions: [],
    requests: [],
    rooms: [],
    filters: [],
    notificationsCount: 0,
  };
}

export function normalizeMakeupSessionsOverview(payload = {}) {
  const sessions = normalizeList(payload.sessions || payload.scheduled_sessions || payload.scheduledSessions || payload.results)
    .map(normalizeSession);
  const requests = normalizeList(payload.requests || payload.pending_requests || payload.pendingRequests)
    .map(normalizeRequest);
  const metricsSource = payload.metrics || payload.summary || {};
  const completedSessions = sessions.filter((session) => session.statusTone === 'success').length;

  return {
    metrics: {
      pendingRequests: normalizeMetric(metricsSource.pending_requests || metricsSource.pendingRequests || deriveMetric(requests.length)),
      scheduledThisWeek: normalizeMetric(metricsSource.scheduled_this_week || metricsSource.scheduledThisWeek || deriveMetric(sessions.length)),
      totalMakeups: normalizeMetric(metricsSource.total_makeups || metricsSource.totalMakeups || deriveMetric(sessions.length + requests.length)),
      completedThisWeek: normalizeMetric(metricsSource.completed_this_week || metricsSource.completedThisWeek || deriveMetric(completedSessions)),
    },
    sessions,
    requests,
    rooms: normalizeList(payload.rooms || payload.available_rooms || payload.availableRooms)
      .map((room) => normalizeText(typeof room === 'string' ? room : room?.name || room?.label || room?.code))
      .filter(Boolean),
    filters: normalizeList(payload.filters || payload.period_filters || payload.periodFilters)
      .map((filter) => ({
        value: normalizeText(filter.value || filter.id || filter.key),
        label: normalizeText(filter.label || filter.name || filter.value),
      }))
      .filter((filter) => filter.value && filter.label),
    notificationsCount: normalizeNumber(pickValue(payload, ['notifications_count', 'notificationsCount'])),
  };
}

export async function fetchMakeupSessionsOverview() {
  return readEndpointData({
    getPreviewData: createEmptyMakeupSessionsOverview,
    request: () => api.get(SCOLARITE_MAKEUP_SESSIONS_ENDPOINTS.overview),
    normalize: normalizeMakeupSessionsOverview,
  });
}

export async function runMakeupSessionRequestAction(request, actionType, room) {
  const endpoint = actionType === 'approve' ? request.approveUrl : request.rejectUrl;

  return runEndpointMutation({
    endpoint,
    actionLabel: `${actionType} makeup session request`,
    request: () => api.post(endpoint, room ? { room } : {}),
  });
}
