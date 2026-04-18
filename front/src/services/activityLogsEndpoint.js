import api from '../api/axios';

export const ACTIVITY_LOGS_ENDPOINT = 'system/activity-logs/';
export const ACTIVITY_LOGS_EXPORT_ENDPOINT = 'system/activity-logs/export/';

// Frontend handoff point for the system activity logs flow.
export async function fetchActivityLogs() {
  try {
    const response = await api.get(ACTIVITY_LOGS_ENDPOINT);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    return [];
  }
}
