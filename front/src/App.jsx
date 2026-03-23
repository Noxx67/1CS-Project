import { useCallback, useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatCard from './components/StatCard';
import AbsenceTable from './components/AbsenceTable';
import UserManagementPage from './components/UserManagementPage';
import { useStudents } from './context/StudentsContext';
import { useAbsenceRecords } from './context/AbsenceRecordsContext';
import './App.css';

const pageMeta = {
  schedules: {
    title: 'Schedules',
    description: 'This section is ready for the frontend layout when you want to build it next.',
  },
  activity: {
    title: 'Activity Logs',
    description: 'This section is ready for the frontend layout when you want to build it next.',
  },
  settings: {
    title: 'System Settings',
    description: 'This section is ready for the frontend layout when you want to build it next.',
  },
};

function DashboardPage({ searchQuery, onSearch, onOpenUserManagementSearch }) {
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
      <div className="page-body">
        <div className="stats-row">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
        <AbsenceTable searchQuery={searchQuery} />
      </div>
    </>
  );
}

function PlaceholderPage({ title, description }) {
  return (
    <div className="page-body">
      <section className="placeholder-card">
        <p className="placeholder-label">SECTION PREVIEW</p>
        <h1 className="placeholder-title">{title}</h1>
        <p className="placeholder-description">{description}</p>
      </section>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
  const [pendingUserSearchQuery, setPendingUserSearchQuery] = useState('');
  const handleOpenUserManagementSearch = useCallback((searchQuery) => {
    setPendingUserSearchQuery(searchQuery || '');
    setActivePage('users');
  }, []);
  const handleInitialUserSearchApplied = useCallback(() => {
    setPendingUserSearchQuery('');
  }, []);

  let pageContent;

  if (activePage === 'dashboard') {
    pageContent = (
      <DashboardPage
        searchQuery={dashboardSearchQuery}
        onSearch={setDashboardSearchQuery}
        onOpenUserManagementSearch={handleOpenUserManagementSearch}
      />
    );
  } else if (activePage === 'users') {
    pageContent = (
      <UserManagementPage
        initialSearchQuery={pendingUserSearchQuery}
        onInitialSearchApplied={handleInitialUserSearchApplied}
      />
    );
  } else {
    pageContent = (
      <PlaceholderPage
        title={pageMeta[activePage].title}
        description={pageMeta[activePage].description}
      />
    );
  }

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="main-content">
        {pageContent}
      </main>
    </div>
  );
}
