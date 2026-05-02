import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  fetchScheduleSessions,
  createScheduleSession,
  updateScheduleSession,
  deleteScheduleSession,
  createEmptyScheduleMetadata,
} from '../services/schedulesEndpoint';
import { usersService } from '../services/usersService';

const SchedulesContext = createContext(null);

export function SchedulesProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const metadata = useMemo(() => createEmptyScheduleMetadata(), []);

  const loadSessions = useCallback(async (filters) => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchScheduleSessions(filters);
      setSessions(data);
      return data;
    } catch (err) {
      console.error('Failed to load sessions', err);
      setSessions([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(async (payload) => createScheduleSession(payload), []);

  const updateSession = useCallback(async (id, payload, initial) => updateScheduleSession(id, payload, initial), []);

  const deleteSession = useCallback(async (id) => {
    await deleteScheduleSession(id);
  }, []);

  const value = {
    metadata,
    sessions,
    loading,
    error,
    loadMetadata: useCallback(async () => {
      const baseMetadata = createEmptyScheduleMetadata();
      try {
        const response = await usersService.getAllUsers({ role: 'TEACHER' });
        if (response && response.users) {
          baseMetadata.teachers = response.users.map(user => ({
            id: String(user.id),
            name: user.full_name || `${user.first_name} ${user.last_name}`.trim()
          }));
        }
      } catch (err) {
        console.error('Failed to load teachers for schedule metadata', err);
      }
      return baseMetadata;
    }, []),
    loadSessions,
    createSession,
    updateSession,
    deleteSession,
  };

  return (
    <SchedulesContext.Provider value={value}>
      {children}
    </SchedulesContext.Provider>
  );
}

export function useSchedules() {
  const context = useContext(SchedulesContext);

  if (!context) {
    throw new Error('useSchedules must be used within a SchedulesProvider');
  }

  return context;
}
