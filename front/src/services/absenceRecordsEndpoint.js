import api from '../api/axios.js';
import { readEndpointData } from './backendSupport.js';

export const RECENT_ABSENCE_RECORDS_ENDPOINT = '/schedules/scolarite/recent-absence-records';

export async function fetchRecentAbsenceRecords() {
  return readEndpointData({
    getPreviewData: [],
    request: () => api.get(RECENT_ABSENCE_RECORDS_ENDPOINT),
    normalize: (payload) => {
      let records = [];
      if (Array.isArray(payload)) {
        records = payload;
      } else if (Array.isArray(payload?.results)) {
        records = payload.results;
      } else if (Array.isArray(payload?.records)) {
        records = payload.records;
      }

      return records.map(record => {
        let statusStr = 'rejected';
        let validationStr = 'Unjustified';
        
        if (record.justification_status === 'EN ATTENTE') {
          statusStr = 'pending';
          validationStr = 'Pending';
        } else if (record.justification_status === 'JUSTIFIÉE') {
          statusStr = 'justified';
          validationStr = 'Justified';
        }
        
        const name = record.student_name || 'Unknown Student';
        const initials = name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';
        
        return {
          id: record.id,
          name: name,
          initials: initials,
          specialization: 'N/A',
          module: record.subject || 'Unknown Module',
          timestamp: `${record.date || ''} ${record.time || ''}`.trim(),
          status: statusStr,
          validation: validationStr
        };
      });
    },
  });
}
