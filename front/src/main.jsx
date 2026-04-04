import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { NotificationsProvider } from './context/NotificationsContext.jsx';
import { UsersProvider } from './context/UsersContext.jsx';
import { AbsenceRecordsProvider } from './context/AbsenceRecordsContext.jsx';
import { DirectoryUsersProvider } from './context/DirectoryUsersContext.jsx';
import { ActivityLogsProvider } from './context/ActivityLogsContext.jsx';
import { AppPreferencesProvider } from './context/AppPreferencesContext.jsx';
import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppPreferencesProvider>
        <AuthProvider>
          <NotificationsProvider>
            <AbsenceRecordsProvider>
              <ActivityLogsProvider>
                <UsersProvider>
                  <DirectoryUsersProvider>
                    <App />
                  </DirectoryUsersProvider>
                </UsersProvider>
              </ActivityLogsProvider>
            </AbsenceRecordsProvider>
          </NotificationsProvider>
        </AuthProvider>
      </AppPreferencesProvider>
    </BrowserRouter>
  </StrictMode>,
);
