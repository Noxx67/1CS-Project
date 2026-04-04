import Header from '../components/Header';
import StatCard from '../components/StatCard';
import AbsenceTable from '../components/AbsenceTable';
import { useUsers } from '../context/UsersContext';
import { useAbsenceRecords } from '../context/AbsenceRecordsContext';
import { useAppPreferences } from '../context/AppPreferencesContext';
import styles from './DashboardPage.module.css';
import { useEffect } from 'react';

export default function DashboardPage({ searchQuery, onSearch, onOpenUserManagementSearch }) {
    const { locale, t } = useAppPreferences();
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
        label: t('dashboard.totalStudents'),
        value: totalStudents.toLocaleString(locale),
        sub: totalStudents === 0 ? t('dashboard.noStudentRecords') : t('dashboard.managedStudents'),
        subIcon: '\u2713',
        color: '#1a2340',
      },
      {
        icon: '\u{1F6AB}',
        label: t('dashboard.totalAbsences'),
        value: totalAbsences.toLocaleString(locale),
        sub: totalAbsences === 0
          ? t('dashboard.waitingAbsenceRecords')
          : t('dashboard.loadedFromAbsenceFlow'),
        subIcon: '\u26A0',
        color: '#e63946',
      },
      {
        icon: '\u{1F4CB}',
        label: t('dashboard.pendingJustifications'),
        value: pendingJustifications.toLocaleString(locale),
        sub: pendingJustifications === 0
          ? t('dashboard.noPendingJustifications')
          : t('dashboard.awaitingVerification'),
        subIcon: '\u{1F512}',
        color: '#1a2340',
        badge: pendingJustifications > 0 ? t('dashboard.actionNeeded') : undefined,
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
