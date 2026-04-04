export const ACTIVITY_LOGS_ENDPOINT = '/system/activity-logs/';
export const ACTIVITY_LOGS_EXPORT_ENDPOINT = '/system/activity-logs/export/';

// Frontend handoff point for the system activity logs flow.
// The backend team can connect this to the real source later.
export async function fetchActivityLogs() {
  return [];
}
