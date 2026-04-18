import Header from '../components/Header';
import StatCard from '../components/StatCard';
import AbsenceTable from '../components/AbsenceTable';
import { useUsers } from '../context/UsersContext';
import { useAbsenceRecords } from '../context/AbsenceRecordsContext';
import styles from './DashboardPage.module.css';
import { useEffect } from 'react';

export default function DashboardPage({ searchQuery, onSearch, onOpenUserManagementSearch }) {
    const { users, fetchAllUsers, isLoading } = useUsers();
    const { absenceRecords } = useAbsenceRecords();
    
    // Fetch all users on component mount
    useEffect(() => {
      console.log('DashboardPage: Fetching users...');
      fetchAllUsers()
        .then((fetchedUsers) => {
          console.log('DashboardPage: Users fetched successfully:', fetchedUsers);
        })
        .catch((err) => {
          console.error('DashboardPage: Failed to fetch users:', err);
        });
    }, [fetchAllUsers]);
    
    console.log('DashboardPage: Current users state:', users);
    const students = users.filter((user) => String(user.role || '').toUpperCase() === 'STUDENT');
    const totalStudents = students.length;
    console.log('DashboardPage: Total students calculated:', totalStudents);
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