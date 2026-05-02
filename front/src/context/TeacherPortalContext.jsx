import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  fetchScheduleSessions,
  startSessionAttendance,
  updateAttendanceRecord,
  submitAttendanceInstance,
  normalizeScheduleSessionPayload,
} from '../services/schedulesEndpoint';

const TeacherPortalContext = createContext(null);

export function TeacherPortalProvider({ children }) {
  const [allSessions, setAllSessions] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState('');

  // Live attendance state
  const [activeSession, setActiveSession] = useState(null);   // the Session object
  const [instanceId, setInstanceId] = useState(null);         // SessionInstance PK
  const [students, setStudents] = useState([]);               // [{record_id, student_id, full_name, registration_number, group, status}]
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');

  // Derive today's sessions from allSessions
  const todaySessions = useMemo(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return allSessions.filter(s => s.day === today);
  }, [allSessions]);

  const overview = useMemo(() => ({
    summary: {
      totalSessionsToday: todaySessions.length,
      completedSessions: 0,
      remainingSessions: todaySessions.length,
      absencesThisWeek: 0,
      makeUpSessions: 0,
      urgentAlertsCount: 0,
    },
    sessions: todaySessions.map(s => ({
      id: String(s.id),
      title: s.sessionName || s.title || 'Session',
      room: s.room || 'TBD',
      groupLabel: (s.assignedGroups || []).join(', ') || 'General',
      startTime: s.startTime || s.start_time || '',
      endTime: s.endTime || s.end_time || '',
      status: 'upcoming',
      statusLabel: 'Upcoming',
      day: s.day,
    })),
  }), [todaySessions]);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError('');
    try {
      const response = await fetchScheduleSessions({});
      setAllSessions(response);
    } catch (err) {
      console.error('Failed to load teacher sessions', err);
      setOverviewError('Failed to load sessions');
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  /**
   * Called when teacher clicks "Start Attendance" on a session card.
   * Hits POST /api/schedules/sessions/<id>/start_attendance/
   * and stores the instance + students in context.
   */
  const startAttendance = useCallback(async (sessionId) => {
    setAttendanceLoading(true);
    setAttendanceError('');
    try {
      const data = await startSessionAttendance(sessionId);
      // Find the full session object from allSessions
      const sessionObj = allSessions.find(s => String(s.id) === String(sessionId));
      setActiveSession(sessionObj || { id: sessionId });
      setInstanceId(data.instance_id);
      setStudents(data.students || []);
      return data;
    } catch (err) {
      console.error('Failed to start attendance', err);
      setAttendanceError('Failed to start attendance session');
      throw err;
    } finally {
      setAttendanceLoading(false);
    }
  }, [allSessions]);

  /**
   * Mark a student's attendance record.
   * Optimistically updates local state, then persists to backend.
   */
  const markAttendance = useCallback(async (recordId, newStatus) => {
    let previousStatus = 'unmarked';
    
    // Optimistic update
    setStudents(prev => {
      const student = prev.find(s => s.record_id === recordId);
      if (student) previousStatus = student.status;
      return prev.map(s => s.record_id === recordId ? { ...s, status: newStatus } : s);
    });

    try {
      await updateAttendanceRecord(recordId, newStatus);
    } catch (err) {
      console.error('Failed to update attendance record', err);
      // Revert to previous status on failure
      setStudents(prev =>
        prev.map(s => s.record_id === recordId ? { ...s, status: previousStatus } : s)
      );
      throw err;
    }
  }, []);

  /**
   * Submit the attendance session (mark instance as completed).
   */
  const submitAttendance = useCallback(async (teacherNote = '') => {
    if (!instanceId) return;
    try {
      await submitAttendanceInstance(instanceId, teacherNote);
      // Clear active session after submission
      setActiveSession(null);
      setInstanceId(null);
      setStudents([]);
    } catch (err) {
      console.error('Failed to submit attendance', err);
      throw err;
    }
  }, [instanceId]);

  /**
   * Clear the active attendance session without submitting (go back).
   */
  const clearAttendance = useCallback(() => {
    setActiveSession(null);
    setInstanceId(null);
    setStudents([]);
    setAttendanceError('');
  }, []);

  const value = {
    // Overview
    overview,
    loading: overviewLoading,
    error: overviewError,
    loadOverview,
    todaySessions,
    allSessions,
    // Live attendance
    activeSession,
    instanceId,
    students,
    attendanceLoading,
    attendanceError,
    startAttendance,
    markAttendance,
    submitAttendance,
    clearAttendance,
  };

  return (
    <TeacherPortalContext.Provider value={value}>
      {children}
    </TeacherPortalContext.Provider>
  );
}

export function useTeacherPortal() {
  const context = useContext(TeacherPortalContext);
  if (!context) {
    throw new Error('useTeacherPortal must be used within a TeacherPortalProvider');
  }
  return context;
}
