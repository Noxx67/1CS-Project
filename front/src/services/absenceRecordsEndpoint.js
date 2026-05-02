import api from '../api/axios.js';
import { readEndpointData } from './backendSupport.js';

export const RECENT_ABSENCE_RECORDS_ENDPOINT = '/schedules/scolarite/recent-absence-records';

export async function fetchRecentAbsenceRecords() {
  return readEndpointData({
    getPreviewData: [],
    request: () => api.get(RECENT_ABSENCE_RECORDS_ENDPOINT),
    normalize: (payload) => {
      if (Array.isArray(payload)) {
        return payload;
      }

      if (Array.isArray(payload?.results)) {
        return payload.results;
      }

      if (Array.isArray(payload?.records)) {
        return payload.records;
      }

      return [];
    },
  });
}
