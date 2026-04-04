import { createContext, useContext, useEffect, useState } from 'react';
import {
  ACTIVITY_LOGS_ENDPOINT,
  ACTIVITY_LOGS_EXPORT_ENDPOINT,
  fetchActivityLogs,
} from '../services/activityLogsEndpoint';

const ActivityLogsContext = createContext(null);

function buildInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return '??';
}

function stringifyDetails(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function normalizeActivityLog(log, index) {
  const userName = log.user_name
    || log.userName
    || log.actor_name
    || log.user?.name
    || log.user?.full_name
    || [log.user?.first_name, log.user?.last_name].filter(Boolean).join(' ')
    || 'Unknown User';

  return {
    id: log.id || `activity-log-${index}`,
    timestamp: log.timestamp || log.created_at || log.logged_at || '',
    userName,
    userInitials: log.user_initials || log.userInitials || buildInitials(userName),
    userRole: log.user_role || log.userRole || log.actor_role || log.user?.role || '',
    actionType: log.action_type || log.actionType || log.action || log.event_type || '',
    actionDescription: log.action_description || log.actionDescription || log.description || log.message || '',
    ipAddress: log.ip_address || log.ipAddress || log.ip || '',
    severity: String(log.severity || log.level || '').toLowerCase(),
    details: stringifyDetails(log.details || log.detail || log.metadata),
  };
}

export function ActivityLogsProvider({ children }) {
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLoadingActivityLogs, setIsLoadingActivityLogs] = useState(false);

  function replaceActivityLogs(nextLogs) {
    const safeLogs = Array.isArray(nextLogs) ? nextLogs : [];
    setActivityLogs(safeLogs.map(normalizeActivityLog));
  }

  async function refreshActivityLogs() {
    setIsLoadingActivityLogs(true);

    try {
      const nextLogs = await fetchActivityLogs();
      replaceActivityLogs(nextLogs);
    } catch {
      replaceActivityLogs([]);
    } finally {
      setIsLoadingActivityLogs(false);
    }
  }

  useEffect(() => {
    refreshActivityLogs();
  }, []);

  const value = {
    activityLogs,
    isLoadingActivityLogs,
    refreshActivityLogs,
    replaceActivityLogs,
    activityLogsEndpoint: ACTIVITY_LOGS_ENDPOINT,
    activityLogsExportEndpoint: ACTIVITY_LOGS_EXPORT_ENDPOINT,
  };

  return (
    <ActivityLogsContext.Provider value={value}>
      {children}
    </ActivityLogsContext.Provider>
  );
}

export function useActivityLogs() {
  const context = useContext(ActivityLogsContext);

  if (!context) {
    throw new Error('useActivityLogs must be used within an ActivityLogsProvider');
  }

  return context;
}
