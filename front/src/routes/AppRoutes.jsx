import { lazy } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/routing/ProtectedRoute.jsx';
import PublicRoute from '../components/routing/PublicRoute.jsx';
import RoleHomeRedirect from '../components/routing/RoleHomeRedirect.jsx';
import { useAppPreferences } from '../context/AppPreferencesContext.jsx';

const LoginPage = lazy(() => import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const Wowzers = lazy(() => import('../pages/Wowzers'));
const WrongInfoPage = lazy(() => import('../pages/WrongInfoPage'));
const DashboardShell = lazy(() => import('../pages/DashboardShell'));
const TeacherShell = lazy(() => import('../pages/TeacherShell'));
const ScolariteShell = lazy(() => import('../pages/ScolariteShell'));
const TeacherDashboardPage = lazy(() => import('../pages/TeacherDashboardPage'));
import { TeacherPortalProvider } from '../context/TeacherPortalContext';
import Rattrapages from '../pages/Rattrapage.jsx';
const TeacherGroupsPage = lazy(() => import('../pages/TeacherGroupsPage'));
const LiveAttendancePage1 = lazy(() => import('../pages/LiveAttendancePage1').then(m => ({ default: m.LiveAttendancePage1 })));
const TeacherFeaturePlaceholderPage = lazy(() => import('../pages/TeacherFeaturePlaceholderPage'));
const TeacherSettingsPage = lazy(() => import('../pages/TeacherSettingsPage'));
const ScolariteDashboardPage = lazy(() => import('../pages/ScolariteDashboardPage'));
const ScolariteTodayAbsencesPage = lazy(() => import('../pages/ScolariteTodayAbsencesPage'));
const ScolariteStudentsPage = lazy(() => import('../pages/ScolariteStudentsPage'));
const ScolariteJustificationsPage = lazy(() => import('../pages/ScolariteJustificationsPage'));
const ScolariteMakeupSessionsPage = lazy(() => import('../pages/ScolariteMakeupSessionsPage'));
const ScolariteScheduleExamsPage = lazy(() => import('../pages/ScolariteScheduleExamsPage'));
const ScolariteFeaturePlaceholderPage = lazy(() => import('../pages/ScolariteFeaturePlaceholderPage'));
const ResetPassword = lazy(() => import('../pages/ResetPassword').then((module) => ({ default: module.ResetPassword })));
const StudentAbsencePage = lazy(() => import('../pages/StudentAbsencePage'));
const DashboardStudent = lazy(() => import('../pages/DashboardStudent'));
const Justification = lazy(() => import('../pages/Justification'));
const NewJustification = lazy(() => import('../pages/NewJustification'));
const Rattrapage = lazy(() => import('../pages/Rattrapage'));
const StudentProfile = lazy(() => import('../pages/StudentProfile'));

export default function AppRoutes() {
  const { t } = useAppPreferences();

  return (
    <Routes>
      <Route
        path="/"
        element={(
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        )}
      />

      <Route path="/contact" element={<ContactPage />} />

      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardShell />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/teacher"
        element={(
          <ProtectedRoute allowedRoles={['TEACHER']}>
            <TeacherShell />
          </ProtectedRoute>
        )}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        {/* Wrap dashboard + attendance in ONE shared TeacherPortalProvider so they share context state */}
        <Route element={<TeacherPortalProvider><Outlet /></TeacherPortalProvider>}>
          <Route path="dashboard" element={<TeacherDashboardPage />} />
          <Route path="attendance" element={<LiveAttendancePage1 />} />
        </Route>
        <Route path="groups" element={<TeacherGroupsPage />} />
        <Route
          path="sessions"
          element={(
            <TeacherFeaturePlaceholderPage
              eyebrow={t('teacherPlaceholders.flow')}
              title={t('teacherPlaceholders.sessions')}
              endpoint="/teacher/sessions/"
            />
          )}
        />
        <Route path="settings" element={<TeacherSettingsPage />} />
      </Route>

      <Route
        path="/scolarite"
        element={(
          <ProtectedRoute allowedRoles={['SCOLARITE']}>
            <ScolariteShell />
          </ProtectedRoute>
        )}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ScolariteDashboardPage />} />
        <Route path="today-absences" element={<ScolariteTodayAbsencesPage />} />
        <Route path="supporting-documents" element={<ScolariteJustificationsPage />} />
        <Route path="makeup-sessions" element={<ScolariteMakeupSessionsPage />} />
        <Route path="students" element={<ScolariteStudentsPage />} />
        <Route path="schedule-exams" element={<ScolariteScheduleExamsPage />} />
        <Route
          path="import-export"
          element={(
            <ScolariteFeaturePlaceholderPage
              title="Import / Export CSV"
              breadcrumb="Home / Import / Export CSV"
              description="Prepare CSV imports and exports for scolarite absence workflows."
            />
          )}
        />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route
        path="/home"
        element={(
          <ProtectedRoute>
            <RoleHomeRedirect />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/ResetPassword"
        element={(
          <ProtectedRoute>
            <ResetPassword />
          </ProtectedRoute>
        )}
      />
      <Route path="/DashboardStudent" element={<DashboardStudent />} />
      <Route path="/StudentAbsencePage" element={<StudentAbsencePage />} />
      <Route path="/Justification" element={<Justification />} />
      <Route path="/NewJustification" element={<NewJustification />} />
      <Route path="/Rattrapage" element={<Rattrapage />} />
      <Route path="/StudentProfile" element={<StudentProfile />} />
      <Route path="/wow" element={<Wowzers />} />
      <Route path="/dumbahh" element={<WrongInfoPage />} />
      <Route
        path="*"
        element={(
          <ProtectedRoute>
            <RoleHomeRedirect />
          </ProtectedRoute>
        )}
      />
    </Routes>
  );
}
