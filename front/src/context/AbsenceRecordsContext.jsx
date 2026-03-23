import { createContext, useContext, useEffect, useState } from 'react';
import {
  fetchRecentAbsenceRecords,
  RECENT_ABSENCE_RECORDS_ENDPOINT,
} from '../services/absenceRecordsEndpoint';

const AbsenceRecordsContext = createContext(null);

export function AbsenceRecordsProvider({ children }) {
  const [absenceRecords, setAbsenceRecords] = useState([]);
  const [isLoadingAbsenceRecords, setIsLoadingAbsenceRecords] = useState(false);

  function replaceAbsenceRecords(nextRecords) {
    setAbsenceRecords(Array.isArray(nextRecords) ? nextRecords : []);
  }

  async function refreshAbsenceRecords() {
    setIsLoadingAbsenceRecords(true);

    try {
      const nextRecords = await fetchRecentAbsenceRecords();
      replaceAbsenceRecords(nextRecords);
    } catch {
      replaceAbsenceRecords([]);
    } finally {
      setIsLoadingAbsenceRecords(false);
    }
  }

  useEffect(() => {
    refreshAbsenceRecords();
  }, []);

  const value = {
    absenceRecords,
    isLoadingAbsenceRecords,
    refreshAbsenceRecords,
    replaceAbsenceRecords,
    recentAbsenceRecordsEndpoint: RECENT_ABSENCE_RECORDS_ENDPOINT,
  };

  return (
    <AbsenceRecordsContext.Provider value={value}>
      {children}
    </AbsenceRecordsContext.Provider>
  );
}

export function useAbsenceRecords() {
  return useContext(AbsenceRecordsContext);
}
