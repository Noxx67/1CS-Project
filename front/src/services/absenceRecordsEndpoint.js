import api from '../api/axios';

export const RECENT_ABSENCE_RECORDS_ENDPOINT = 'absences/recent/';

// Frontend handoff point for the Scolarite absence flow.
export async function fetchRecentAbsenceRecords() {
  try {
    const response = await api.get(RECENT_ABSENCE_RECORDS_ENDPOINT);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch recent absence records:', error);
    return [];
  }
}
