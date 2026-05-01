import api from '../api/axios.js';
import { readEndpointData, runEndpointMutation } from './backendSupport.js';

export const SCOLARITE_TODAY_ABSENCES_ENDPOINTS = {
  overview: 'scolarite/today-absences/',
  export: 'scolarite/today-absences/export/',
  sync: 'scolarite/today-absences/sync/',
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

function normalizeNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
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

  if (normalizedStatus.includes('critical') || normalizedStatus.includes('unjustified') || normalizedStatus.includes('rejected')) {
    return 'danger';
  }

  return 'neutral';
}

export function normalizeTodayAbsenceRecord(payload = {}) {
  const studentName = normalizeText(
    payload.student_name
      || payload.studentName
      || payload.student?.full_name
      || payload.student?.name
      || payload.student,
  );
  const status = normalizeText(payload.status || payload.justification_status || payload.justificationStatus);

  return {
    id: normalizeText(payload.id || payload.absence_id || payload.absenceId || payload.record_id || payload.recordId),
    studentName,
    studentCode: normalizeText(
      payload.student_code
        || payload.studentCode
        || payload.registration_number
        || payload.registrationNumber
        || payload.student?.registration_number,
    ),
    initials: normalizeText(payload.initials || payload.student_initials || payload.studentInitials),
    program: normalizeText(payload.program || payload.department || payload.department_name || payload.departmentName),
    subject: normalizeText(payload.subject || payload.module || payload.module_name || payload.moduleName),
    room: normalizeText(payload.room || payload.location || payload.session?.room),
    time: normalizeText(
      payload.time
        || payload.time_label
        || payload.timeLabel
        || [payload.start_time || payload.startTime, payload.end_time || payload.endTime].filter(Boolean).join(' - '),
    ),
    status,
    statusLabel: normalizeText(payload.status_label || payload.statusLabel || status),
    statusTone: normalizeStatusTone(status, payload.status_tone || payload.statusTone),
    missingDocuments: Boolean(payload.missing_documents || payload.missingDocuments),
    detailUrl: normalizeText(payload.detail_url || payload.detailUrl || payload.url),
  };
}

function normalizeMetric(payload = {}, fallbackLabel = '') {
  return {
    value: normalizeNumber(pickValue(payload, ['value', 'count', 'total']), 0),
    label: normalizeText(payload.label || payload.title || fallbackLabel),
    helper: normalizeText(payload.helper || payload.description || payload.subtitle),
    tone: normalizeText(payload.tone),
    icon: normalizeText(payload.icon),
  };
}

function normalizeSession(payload = {}) {
  return {
    id: normalizeText(payload.id || payload.session_id || payload.sessionId || payload.title),
    title: normalizeText(payload.title || payload.subject || payload.module || payload.module_name),
    meta: normalizeText(
      payload.meta
        || payload.description
        || [payload.program || payload.department, payload.room, payload.time || payload.time_label].filter(Boolean).join(' - '),
    ),
    count: normalizeNumber(pickValue(payload, ['count', 'absent', 'absences', 'absence_count', 'absenceCount']), 0),
    countLabel: normalizeText(payload.count_label || payload.countLabel),
  };
}

function normalizeAction(payload = {}) {
  return {
    id: normalizeText(payload.id || payload.key || payload.title),
    title: normalizeText(payload.title || payload.label),
    description: normalizeText(payload.description || payload.helper || payload.subtitle),
    tone: normalizeText(payload.tone),
    icon: normalizeText(payload.icon),
  };
}

function normalizeProgram(payload = {}) {
  const value = normalizeNumber(pickValue(payload, ['value', 'count', 'total', 'absences']), 0);

  return {
    id: normalizeText(payload.id || payload.code || payload.name || payload.label),
    label: normalizeText(payload.label || payload.name || payload.program || payload.department),
    value,
    percent: normalizeNumber(pickValue(payload, ['percent', 'percentage', 'rate']), value),
  };
}

export function createEmptyTodayAbsencesOverview() {
  return {
    dateLabel: '',
    timeSlots: [],
    programs: [],
    statuses: [],
    metrics: {
      totalAbsences: normalizeMetric(),
      unjustified: normalizeMetric(),
      pendingReview: normalizeMetric(),
      criticalSessions: normalizeMetric(),
    },
    records: [],
    highAbsenceSessions: [],
    actionCenter: [],
    affectedPrograms: [],
    notificationsCount: 0,
    lastSyncLabel: '',
  };
}

export function buildTodayAbsencesOverviewFromRecords(records = []) {
  const normalizedRecords = normalizeList(records).map(normalizeTodayAbsenceRecord);
  const uniquePrograms = [...new Set(normalizedRecords.map((record) => record.program).filter(Boolean))];
  const uniqueStatuses = [...new Set(normalizedRecords.map((record) => record.statusLabel || record.status).filter(Boolean))];
  const uniqueTimeSlots = [...new Set(normalizedRecords.map((record) => record.time).filter(Boolean))];
  const unjustifiedCount = normalizedRecords.filter((record) => record.statusTone === 'danger').length;
  const pendingCount = normalizedRecords.filter((record) => record.statusTone === 'warning').length;

  const affectedPrograms = uniquePrograms.map((program) => {
    const value = normalizedRecords.filter((record) => record.program === program).length;
    return {
      id: program,
      label: program,
      value,
      percent: normalizedRecords.length ? (value / normalizedRecords.length) * 100 : 0,
    };
  });

  return {
    ...createEmptyTodayAbsencesOverview(),
    programs: uniquePrograms,
    statuses: uniqueStatuses,
    timeSlots: uniqueTimeSlots,
    metrics: {
      totalAbsences: normalizeMetric({ value: normalizedRecords.length }),
      unjustified: normalizeMetric({ value: unjustifiedCount }),
      pendingReview: normalizeMetric({ value: pendingCount }),
      criticalSessions: normalizeMetric({ value: 0 }),
    },
    records: normalizedRecords,
    affectedPrograms,
  };
}

export function normalizeTodayAbsencesOverview(payload = {}) {
  const metricsSource = payload.metrics || payload.summary || {};
  const records = normalizeList(payload.records || payload.absences || payload.results).map(normalizeTodayAbsenceRecord);

  return {
    dateLabel: normalizeText(payload.date_label || payload.dateLabel || payload.date),
    timeSlots: normalizeList(payload.time_slots || payload.timeSlots),
    programs: normalizeList(payload.programs || payload.departments),
    statuses: normalizeList(payload.statuses),
    metrics: {
      totalAbsences: normalizeMetric(metricsSource.total_absences || metricsSource.totalAbsences || metricsSource.absences || {}),
      unjustified: normalizeMetric(metricsSource.unjustified || metricsSource.unjustified_so_far || metricsSource.unjustifiedSoFar || {}),
      pendingReview: normalizeMetric(metricsSource.pending_review || metricsSource.pendingReview || {}),
      criticalSessions: normalizeMetric(metricsSource.critical_sessions || metricsSource.criticalSessions || {}),
    },
    records,
    highAbsenceSessions: normalizeList(
      payload.high_absence_sessions
        || payload.highAbsenceSessions
        || payload.sessions
        || [],
    ).map(normalizeSession),
    actionCenter: normalizeList(payload.action_center || payload.actionCenter || payload.actions || []).map(normalizeAction),
    affectedPrograms: normalizeList(
      payload.affected_programs
        || payload.affectedPrograms
        || payload.program_breakdown
        || payload.programBreakdown
        || [],
    ).map(normalizeProgram),
    notificationsCount: normalizeNumber(pickValue(payload, ['notifications_count', 'notificationsCount']), 0),
    lastSyncLabel: normalizeText(payload.last_sync_label || payload.lastSyncLabel || payload.last_sync || payload.lastSync),
  };
}

export async function fetchTodayAbsencesOverview() {
  return readEndpointData({
    getPreviewData: createEmptyTodayAbsencesOverview,
    request: () => api.get(SCOLARITE_TODAY_ABSENCES_ENDPOINTS.overview),
    normalize: normalizeTodayAbsencesOverview,
  });
}

export async function syncTodayAbsencesRecords() {
  return runEndpointMutation({
    endpoint: SCOLARITE_TODAY_ABSENCES_ENDPOINTS.sync,
    actionLabel: 'sync today absence records',
    request: () => api.post(SCOLARITE_TODAY_ABSENCES_ENDPOINTS.sync),
  });
}
