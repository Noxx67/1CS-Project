import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  fetchScheduleSessions,
  createScheduleSession,
  updateScheduleSession,
  deleteScheduleSession,
  createEmptyScheduleMetadata,
} from '../services/schedulesEndpoint';

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
    loadMetadata: useCallback(async () => metadata, [metadata]),
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
