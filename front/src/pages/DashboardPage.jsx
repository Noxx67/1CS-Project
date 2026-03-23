import Header from '../components/Header';
import StatCard from '../components/StatCard';
import AbsenceTable from '../components/AbsenceTable';
import { useStudents } from '../context/StudentsContext';
import { useAbsenceRecords } from '../context/AbsenceRecordsContext';
import styles from './DashboardPage.module.css';

export default function DashboardPage({ searchQuery, onSearch, onOpenUserManagementSearch }) {
    const { students } = useStudents();
    const { absenceRecords } = useAbsenceRecords();
    const totalStudents = students.length;
    const totalAbsences = absenceRecords.length;
    const pendingJustifications = absenceRecords.filter((record) => record.status === 'pending').length;
    const stats = [
      {
        icon: '\u{1F465}',
        label: 'Total Students',
        value: totalStudents.toLocaleString('en-US'),
        sub: totalStudents === 0 ? 'No student records yet' : 'Managed through shared user records',
        subIcon: '\u2713',
        color: '#1a2340',
      },
      {
        icon: '\u{1F6AB}',
        label: 'Total Absences',
        value: totalAbsences.toLocaleString('en-US'),
        sub: totalAbsences === 0
          ? 'Waiting for Scolarite absence records'
          : 'Loaded from the Scolarite absence flow',
        subIcon: '\u26A0',
        color: '#e63946',
      },
      {
        icon: '\u{1F4CB}',
        label: 'Pending Justifications',
        value: pendingJustifications.toLocaleString('en-US'),
        sub: pendingJustifications === 0
          ? 'No pending justifications from Scolarite'
          : 'Awaiting administrative verification',
        subIcon: '\u{1F512}',
        color: '#1a2340',
        badge: pendingJustifications > 0 ? 'ACTION NEEDED' : undefined,
      },
    ];
  
    return (
      <>
        <Header
          searchQuery={searchQuery}
          onSearch={onSearch}
          onOpenUserManagementSearch={onOpenUserManagementSearch}
        />
        <div className={styles.pageBody}>
          <div className={styles.statsRow}>
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
          <AbsenceTable searchQuery={searchQuery} />
        </div>
      </>
    );
  }