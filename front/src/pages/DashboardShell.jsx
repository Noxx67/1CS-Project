import { useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardPage from './DashboardPage';
import UserManagementPage from '../components/UserManagementPage';
import ActivityLogsPage from './ActivityLogsPage';
import SystemSettingsPage from './SystemSettingsPage';
import styles from './DashboardShell.module.css';
import { useAppPreferences } from '../context/AppPreferencesContext';

function PlaceholderPage({ label, title, description }) {
  return (
    <div className="page-body">
      <section className="placeholder-card">
        <p className="placeholder-label">{label}</p>
        <h1 className="placeholder-title">{title}</h1>
        <p className="placeholder-description">{description}</p>
      </section>
    </div>
  );
}

export default function DashboardShell() {
    const { t } = useAppPreferences();
    const [activePage, setActivePage] = useState('dashboard');
    const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
    const [pendingUserSearchQuery, setPendingUserSearchQuery] = useState('');
    const [pendingUserViewMode, setPendingUserViewMode] = useState('');

    const handleOpenUserManagementSearch = useCallback((searchQuery) => {
      setPendingUserSearchQuery(searchQuery || '');
      setPendingUserViewMode('');
      setActivePage('users');
    }, []);

    const handleOpenUserManagementCreate = useCallback(() => {
      setPendingUserSearchQuery('');
      setPendingUserViewMode('create');
      setActivePage('users');
    }, []);
  
    const handleInitialUserSearchApplied = useCallback(() => {
      setPendingUserSearchQuery('');
    }, []);

    const handleInitialUserViewModeApplied = useCallback(() => {
      setPendingUserViewMode('');
    }, []);

    const pageMeta = {
      schedules: {
        title: t('nav.schedules'),
        description: t('placeholders.schedulesDescription'),
        label: t('placeholders.sectionPreview'),
      },
    };
  
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
          initialViewMode={pendingUserViewMode}
          onInitialViewModeApplied={handleInitialUserViewModeApplied}
        />
      );
    } else if (activePage === 'activity') {
      pageContent = (
        <ActivityLogsPage
          onOpenAddNewUser={handleOpenUserManagementCreate}
        />
      );
    } else if (activePage === 'settings') {
      pageContent = <SystemSettingsPage />;
    } else {
      pageContent = (
        <PlaceholderPage
          label={pageMeta[activePage].label}
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
  
