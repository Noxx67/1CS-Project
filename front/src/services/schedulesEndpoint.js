const STORAGE_KEY = 'preview_schedule_sessions_v1';

export const SCHEDULES_ENDPOINTS = {
  sessions: 'schedules/sessions/',
  sessionDetail: (sessionId) => `schedules/sessions/${sessionId}/`,
  sessionStudents: (sessionId) => `schedules/sessions/${sessionId}/students/`,
  startAttendance: (sessionId) => `schedules/sessions/${sessionId}/start_attendance/`,
  attendanceDetail: (recordId) => `schedules/attendance/${recordId}/`,
  instanceDetail: (instanceId) => `schedules/instances/${instanceId}/`,
  users: 'accounts/users/',
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
  if (Array.isArray(payload.assigned_groups)) {
    return normalizeStringList(payload.assigned_groups);
  }

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

// Preview helpers removed

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
    payload.teacher_name
    || payload.responsible_teacher_name
    || payload.responsibleTeacherName
    || payload.responsible_teacher?.full_name
    || payload.teacher?.full_name
    || ''
  ).trim();

  return {
    ...emptySession,
    id: String(payload.id ?? ''),
    sessionName: String(payload.title || payload.session_name || payload.sessionName || payload.name || '').trim(),
    sessionType: String(payload.session_type || payload.sessionType || payload.type || emptySession.sessionType).trim(),
    responsibleTeacherId: String(
      payload.teacher
      || payload.responsible_teacher_id
      || payload.responsibleTeacherId
      || payload.responsible_teacher?.id
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
    title: normalizedSession.sessionName,
    session_type: normalizedSession.sessionType,
    teacher: Number(normalizedSession.responsibleTeacherId) || null,
    year: normalizedSession.year,
    section: normalizedSession.section,
    specialty: normalizedSession.specialty,
    assigned_groups: sortGroups(normalizedSession.assignedGroups),
    day: normalizedSession.day,
    start_time: normalizedSession.startTime,
    end_time: normalizedSession.endTime,
    room: normalizedSession.room,
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

export async function fetchScheduleMetadata() {
  return createEmptyScheduleMetadata();
}

function readStoredScheduleSessions() {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    const parsedSessions = JSON.parse(storedValue || '[]');

    return Array.isArray(parsedSessions) ? parsedSessions.map(normalizeScheduleSessionPayload) : [];
  } catch {
    return [];
  }
}

function writeStoredScheduleSessions(sessions = []) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.map(normalizeScheduleSessionPayload)));
  } catch {
    // Local storage can be unavailable in restricted browser modes; the visible page should still stay usable.
  }
}

export async function fetchScheduleSessions(filters = {}) {
  const filteredSessions = readStoredScheduleSessions().filter((session) => matchesScheduleFilters(session, filters));

  return sortSessionsByTime(filteredSessions);
}

export async function fetchScheduleSessionById(sessionId) {
  return readStoredScheduleSessions().find((session) => session.id === String(sessionId)) || null;
}

export async function createScheduleSession(scheduleSession) {
  const nextSession = normalizeScheduleSessionPayload({
    ...scheduleSession,
    id: scheduleSession.id || buildPreviewSessionId(),
  });
  const nextSessions = [...readStoredScheduleSessions(), nextSession];

  writeStoredScheduleSessions(nextSessions);
  return nextSession;
}

export async function updateScheduleSession(sessionId, nextSession, initialSession = null) {
  const normalizedSessionId = String(sessionId || '');
  const currentSessions = readStoredScheduleSessions();
  const currentSession = currentSessions.find((session) => session.id === normalizedSessionId);
  const patchPayload = buildScheduleSessionPatchPayload(initialSession || currentSession || createEmptyScheduleSession(), nextSession);
  const updatedSession = normalizeScheduleSessionPayload({
    ...(currentSession || {}),
    ...patchPayload,
    ...nextSession,
    id: normalizedSessionId || nextSession.id || buildPreviewSessionId(),
  });
  const nextSessions = currentSession
    ? currentSessions.map((session) => (session.id === normalizedSessionId ? updatedSession : session))
    : [...currentSessions, updatedSession];

  writeStoredScheduleSessions(nextSessions);
  return updatedSession;
}

export async function deleteScheduleSession(sessionId) {
  writeStoredScheduleSessions(readStoredScheduleSessions().filter((session) => session.id !== String(sessionId)));
}

/**
 * Start a live attendance session for the given session ID.
 * Creates/gets a SessionInstance for today and pre-creates AttendanceRecord rows.
 * Returns { instance_id, session_id, date, status, students[] }
 */
export async function startSessionAttendance(sessionId) {
  return {
    instance_id: `preview-instance-${sessionId}`,
    session_id: sessionId,
    date: new Date().toISOString().slice(0, 10),
    status: 'active',
    students: [],
  };
}

/**
 * Update a single AttendanceRecord's status.
 * status: 'present' | 'absent' | 'unmarked'
 */
export async function updateAttendanceRecord(recordId, status) {
  return { id: recordId, status };
}

/**
 * Submit and close a SessionInstance (set status='completed', save note).
 */
export async function submitAttendanceInstance(instanceId, teacherNote = '') {
  return {
    id: instanceId,
    status: 'completed',
    teacher_note: teacherNote,
  };
}

