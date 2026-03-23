import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { NotificationsProvider } from './context/NotificationsContext.jsx';
import { StudentsProvider } from './context/StudentsContext.jsx';
import { AbsenceRecordsProvider } from './context/AbsenceRecordsContext.jsx';
import { DirectoryUsersProvider } from './context/DirectoryUsersContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <NotificationsProvider>
        <AbsenceRecordsProvider>
          <StudentsProvider>
            <DirectoryUsersProvider>
              <App />
            </DirectoryUsersProvider>
          </StudentsProvider>
        </AbsenceRecordsProvider>
      </NotificationsProvider>
    </BrowserRouter>
  </StrictMode>,
);
