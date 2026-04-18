import api from '../api/axios.js';
import { TEMP_FRONTEND_PREVIEW_MODE } from '../config/previewMode.js';

const STORAGE_KEY = 'preview_schedule_sessions_v1';
const LEGACY_SEEDED_SESSION_IDS = new Set([
  'session-algorithmic',
  'session-analyse',
  'session-algebre',
  'session-isi',
  'session-acsi',
]);

export const SCHEDULES_ENDPOINTS = {
  sessions: '/schedules/sessions/',
  sessionDetail: (sessionId) => `/schedules/sessions/${sessionId}/`,
  metadata: '/schedules/sessions/metadata/',
};

const DEFAULT_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const DEFAULT_SESSION_TYPES = ['TD', 'TD collectif', 'Cours', 'TP'];
const DEFAULT_YEARS = ['1CP', '2CP', '1CS', '2CS', '3CS'];
const DEFAULT_SPECIALTIES = ['N/A', 'ISI', 'SIW', 'IASD', 'Cybersecurity'];
const DEFAULT_SECTIONS = Array.from({ length: 18 }, (_, index) => String(index + 1));
const DEFAULT_GROUPS = Array.from({ length: 18 }, (_, index) => `G${index + 1}`).map((code) => ({
  id: code.toLowerCase(),
  code,
  label: code,
}));
const DEFAULT_TERM_LABEL = 'Active Academic Term';

function buildPreviewSessionId() {
  return `preview-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function yearSupportsSpecialty(year) {
  const normalizedYear = String(year || '').trim().toUpperCase();

  return normalizedYear === '2CS' || normalizedYear === '3CS';
}

function normalizeStringList(values, fallbackValues = []) {
  if (!Array.isArray(values) || values.length === 0) {
    return [...fallbackValues];
  }

  return values
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

function normalizeTeacherList(teachers) {
  if (!Array.isArray(teachers) || teachers.length === 0) {
    return [];
  }

  return teachers
    .map((teacher) => {
      if (!teacher) {
        return null;
      }

      if (typeof teacher === 'string') {
        const trimmedTeacher = teacher.trim();

        if (!trimmedTeacher) {
          return null;
        }

        return {
          id: trimmedTeacher.toLowerCase().replace(/\s+/g, '-'),
          name: trimmedTeacher,
        };
      }

      const teacherId = String(teacher.id || teacher.value || teacher.code || '').trim();
      const teacherName = String(
        teacher.name
        || teacher.label
        || teacher.full_name
        || teacher.fullName
        || teacher.teacher_name
        || ''
      ).trim();

      if (!teacherId && !teacherName) {
        return null;
      }

      return {
        id: teacherId || teacherName.toLowerCase().replace(/\s+/g, '-'),
        name: teacherName || teacherId,
      };
    })
    .filter(Boolean);
}

function normalizeGroupList(groups) {
  if (!Array.isArray(groups) || groups.length === 0) {
    return DEFAULT_GROUPS.map((group) => ({ ...group }));
  }

  return groups
    .map((group) => {
      if (!group) {
        return null;
      }

      if (typeof group === 'string') {
        const trimmedGroup = group.trim();

        if (!trimmedGroup) {
          return null;
        }

        return {
          id: trimmedGroup.toLowerCase(),
          code: trimmedGroup,
          label: trimmedGroup,
        };
      }

      const groupCode = String(group.code || group.label || group.name || '').trim();
      const groupId = String(group.id || group.value || groupCode || '').trim();

      if (!groupCode && !groupId) {
        return null;
      }

      return {
        id: groupId || groupCode.toLowerCase(),
        code: groupCode || groupId,
        label: group.label || groupCode || groupId,
      };
    })
    .filter(Boolean);
}

function normalizeAssignedGroups(payload) {
  if (Array.isArray(payload.group_codes)) {
    return normalizeStringList(payload.group_codes);
  }

  if (Array.isArray(payload.assignedGroups)) {
    return normalizeStringList(payload.assignedGroups);
  }

  if (Array.isArray(payload.groups)) {
    return payload.groups
      .map((group) => {
        if (!group) {
          return '';
        }

        if (typeof group === 'string') {
          return group;
        }

        return group.code || group.label || group.name || '';
      })
      .map((groupCode) => String(groupCode || '').trim())
      .filter(Boolean);
  }

  return [];
}

function sortGroups(groups = []) {
  return [...groups].sort((firstGroup, secondGroup) =>
    String(firstGroup).localeCompare(String(secondGroup), undefined, { numeric: true })
  );
}

function sortSessionsByTime(sessions = []) {
  return [...sessions].sort((firstSession, secondSession) => {
    const firstKey = `${firstSession.day}-${firstSession.startTime}-${firstSession.sessionName}`;
    const secondKey = `${secondSession.day}-${secondSession.startTime}-${secondSession.sessionName}`;

    return firstKey.localeCompare(secondKey, undefined, { numeric: true });
  });
}

export function createEmptyScheduleSession(day = DEFAULT_DAYS[0]) {
  return {
    id: '',
    sessionName: '',
    sessionType: DEFAULT_SESSION_TYPES[0],
    responsibleTeacherId: '',
    responsibleTeacherName: '',
    year: DEFAULT_YEARS[0],
    section: DEFAULT_SECTIONS[0],
    specialty: DEFAULT_SPECIALTIES[0],
    assignedGroups: [],
    day,
    startTime: '08:30',
    endTime: '10:00',
    room: 'Amphi A',
    termLabel: DEFAULT_TERM_LABEL,
  };
}

export function createEmptyScheduleMetadata() {
  return {
    days: [...DEFAULT_DAYS],
    sessionTypes: [...DEFAULT_SESSION_TYPES],
    years: [...DEFAULT_YEARS],
    specialties: [...DEFAULT_SPECIALTIES],
    sections: [...DEFAULT_SECTIONS],
    groups: DEFAULT_GROUPS.map((group) => ({ ...group })),
    teachers: [],
    termLabel: DEFAULT_TERM_LABEL,
  };
}

function readPreviewSessions() {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    const sanitizedSessions = parsedValue.filter(
      (session) => !LEGACY_SEEDED_SESSION_IDS.has(String(session?.id || ''))
    );

    if (sanitizedSessions.length !== parsedValue.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedSessions));
    }

    return sanitizedSessions;
  } catch (error) {
    console.error('Failed to read preview schedule sessions:', error);
    return [];
  }
}

function writePreviewSessions(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save preview schedule sessions:', error);
  }
}

export function normalizeScheduleMetadataPayload(payload = {}) {
  const emptyMetadata = createEmptyScheduleMetadata();

  return {
    days: normalizeStringList(payload.days, emptyMetadata.days),
    sessionTypes: normalizeStringList(
      payload.session_types || payload.sessionTypes,
      emptyMetadata.sessionTypes
    ),
    years: normalizeStringList(payload.years, emptyMetadata.years),
    specialties: normalizeStringList(
      payload.specialities || payload.specialties,
      emptyMetadata.specialties
    ),
    sections: normalizeStringList(payload.sections, emptyMetadata.sections),
    teachers: normalizeTeacherList(payload.teachers),
    groups: normalizeGroupList(payload.groups),
    termLabel: String(payload.term_label || payload.termLabel || payload.academic_term || emptyMetadata.termLabel).trim(),
  };
}

export function normalizeScheduleSessionPayload(payload = {}) {
  const emptySession = createEmptyScheduleSession();
  const normalizedYear = String(payload.year || emptySession.year).trim();
  const responsibleTeacherName = String(
    payload.responsible_teacher_name
    || payload.responsibleTeacherName
    || payload.teacher_name
    || payload.responsible_teacher?.full_name
    || payload.responsible_teacher?.name
    || payload.teacher?.full_name
    || payload.teacher?.name
    || ''
  ).trim();

  return {
    ...emptySession,
    id: String(payload.id ?? ''),
    sessionName: String(payload.session_name || payload.sessionName || payload.name || '').trim(),
    sessionType: String(payload.session_type || payload.sessionType || payload.type || emptySession.sessionType).trim(),
    responsibleTeacherId: String(
      payload.responsible_teacher_id
      || payload.responsibleTeacherId
      || payload.responsible_teacher?.id
      || payload.teacher?.id
      || ''
    ).trim(),
    responsibleTeacherName,
    year: normalizedYear,
    section: String(payload.section || emptySession.section).trim(),
    specialty: yearSupportsSpecialty(normalizedYear)
      ? String(payload.speciality || payload.specialty || emptySession.specialty).trim()
      : 'N/A',
    assignedGroups: sortGroups(normalizeAssignedGroups(payload)),
    day: String(payload.day || emptySession.day).trim(),
    startTime: String(payload.start_time || payload.startTime || emptySession.startTime).trim(),
    endTime: String(payload.end_time || payload.endTime || emptySession.endTime).trim(),
    room: String(payload.room || payload.location || emptySession.room).trim(),
    termLabel: String(
      payload.academic_term
      || payload.term_label
      || payload.termLabel
      || emptySession.termLabel
    ).trim(),
  };
}

function serializeScheduleSessionPayload(scheduleSession) {
  const normalizedSession = normalizeScheduleSessionPayload(scheduleSession);

  return {
    session_name: normalizedSession.sessionName,
    session_type: normalizedSession.sessionType,
    responsible_teacher_id: normalizedSession.responsibleTeacherId || '',
    responsible_teacher_name: normalizedSession.responsibleTeacherName,
    year: normalizedSession.year,
    section: normalizedSession.section,
    speciality: normalizedSession.specialty,
    group_codes: sortGroups(normalizedSession.assignedGroups),
    day: normalizedSession.day,
    start_time: normalizedSession.startTime,
    end_time: normalizedSession.endTime,
    room: normalizedSession.room,
    academic_term: normalizedSession.termLabel || DEFAULT_TERM_LABEL,
  };
}

function areValuesEqual(previousValue, nextValue) {
  if (Array.isArray(previousValue) || Array.isArray(nextValue)) {
    return JSON.stringify(previousValue || []) === JSON.stringify(nextValue || []);
  }

  return previousValue === nextValue;
}

export function buildScheduleSessionPatchPayload(initialSession, nextSession) {
  const previousPayload = serializeScheduleSessionPayload(initialSession);
  const nextPayload = serializeScheduleSessionPayload(nextSession);
  const patchPayload = {};

  Object.keys(nextPayload).forEach((fieldName) => {
    if (!areValuesEqual(previousPayload[fieldName], nextPayload[fieldName])) {
      patchPayload[fieldName] = nextPayload[fieldName];
    }
  });

  return patchPayload;
}

function matchesScheduleFilters(session, filters = {}) {
  const normalizedSession = normalizeScheduleSessionPayload(session);

  return [
    ['day', normalizedSession.day],
    ['year', normalizedSession.year],
    ['specialty', normalizedSession.specialty],
    ['section', normalizedSession.section],
  ].every(([filterName, sessionValue]) => {
    const rawFilterValue = filters[filterName];

    if (!String(rawFilterValue || '').trim()) {
      return true;
    }

    return String(sessionValue || '').toLowerCase() === String(rawFilterValue || '').toLowerCase();
  });
}

// Frontend handoff point for schedule management.
// Backend can wire these endpoints without changing the page component contract.
export async function fetchScheduleMetadata() {
  if (TEMP_FRONTEND_PREVIEW_MODE) {
    return createEmptyScheduleMetadata();
  }

  const response = await api.get(SCHEDULES_ENDPOINTS.metadata);
  return normalizeScheduleMetadataPayload(response.data);
}

export async function fetchScheduleSessions(filters = {}) {
  if (TEMP_FRONTEND_PREVIEW_MODE) {
    return sortSessionsByTime(
      readPreviewSessions()
        .map((session) => normalizeScheduleSessionPayload(session))
        .filter((session) => matchesScheduleFilters(session, filters))
    );
  }

  const params = new URLSearchParams();

  ['day', 'year', 'specialty', 'section'].forEach((filterName) => {
    const filterValue = String(filters[filterName] || '').trim();

    if (!filterValue) {
      return;
    }

    const queryKey = filterName === 'specialty' ? 'speciality' : filterName;
    params.append(queryKey, filterValue);
  });

  const endpoint = params.toString()
    ? `${SCHEDULES_ENDPOINTS.sessions}?${params.toString()}`
    : SCHEDULES_ENDPOINTS.sessions;
  const response = await api.get(endpoint);
  const responseSessions = Array.isArray(response.data?.sessions) ? response.data.sessions : response.data;

  return sortSessionsByTime((responseSessions || []).map((session) => normalizeScheduleSessionPayload(session)));
}

export async function fetchScheduleSessionById(sessionId) {
  if (TEMP_FRONTEND_PREVIEW_MODE) {
    const matchedSession = readPreviewSessions().find((session) => String(session.id) === String(sessionId));

    if (!matchedSession) {
      throw new Error('Session not found');
    }

    return normalizeScheduleSessionPayload(matchedSession);
  }

  const response = await api.get(SCHEDULES_ENDPOINTS.sessionDetail(sessionId));
  return normalizeScheduleSessionPayload(response.data);
}

export async function createScheduleSession(scheduleSession) {
  const payloadData = serializeScheduleSessionPayload(scheduleSession);

  if (TEMP_FRONTEND_PREVIEW_MODE) {
    const createdSession = normalizeScheduleSessionPayload({
      id: buildPreviewSessionId(),
      ...payloadData,
    });
    const nextSessions = sortSessionsByTime([
      ...readPreviewSessions().map((session) => normalizeScheduleSessionPayload(session)),
      createdSession,
    ]).map((session) => ({
      id: session.id,
      ...serializeScheduleSessionPayload(session),
    }));

    writePreviewSessions(nextSessions);
    return createdSession;
  }

  const response = await api.post(SCHEDULES_ENDPOINTS.sessions, payloadData);
  return normalizeScheduleSessionPayload(response.data?.session || response.data);
}

export async function updateScheduleSession(sessionId, nextSession, initialSession = null) {
  const patchPayload = buildScheduleSessionPatchPayload(initialSession || createEmptyScheduleSession(), nextSession);

  if (TEMP_FRONTEND_PREVIEW_MODE) {
    const currentSessions = readPreviewSessions().map((session) => normalizeScheduleSessionPayload(session));
    const matchedSession = currentSessions.find((session) => String(session.id) === String(sessionId));

    if (!matchedSession) {
      throw new Error('Session not found');
    }

    const updatedSession = normalizeScheduleSessionPayload({
      ...matchedSession,
      ...patchPayload,
      id: sessionId,
    });
    const nextSessions = sortSessionsByTime(
      currentSessions.map((session) => (String(session.id) === String(sessionId) ? updatedSession : session))
    ).map((session) => ({
      id: session.id,
      ...serializeScheduleSessionPayload(session),
    }));

    writePreviewSessions(nextSessions);
    return updatedSession;
  }

  const response = await api.patch(SCHEDULES_ENDPOINTS.sessionDetail(sessionId), patchPayload);
  return normalizeScheduleSessionPayload(response.data?.session || response.data);
}

export async function deleteScheduleSession(sessionId) {
  if (TEMP_FRONTEND_PREVIEW_MODE) {
    const nextSessions = readPreviewSessions().filter((session) => String(session.id) !== String(sessionId));
    writePreviewSessions(nextSessions);
    return;
  }

  await api.delete(SCHEDULES_ENDPOINTS.sessionDetail(sessionId));
}
