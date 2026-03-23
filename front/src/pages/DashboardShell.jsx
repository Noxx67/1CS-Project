import { useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DashboardPage from './DashboardPage';
import UserManagementPage from '../components/UserManagementPage';
import styles from './DashboardShell.module.css';

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

export default function DashboardShell() {
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
      <div className={styles.appLayout}>
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <main className={styles.mainContent}>
          {pageContent}
        </main>
      </div>
    );
  }
  