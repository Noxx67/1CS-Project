import api from '../api/axios.js';
import { readEndpointData, runEndpointMutation } from './backendSupport.js';

export const SYSTEM_SETTINGS_ENDPOINTS = {
  base: '/system/settings/',
  adminAccount: '/system/settings/admin-account/',
  generalConfiguration: '/system/settings/general-configuration/',
  notificationTemplates: '/system/settings/notification-templates/',
  notificationTemplateVariables: '/system/settings/notification-templates/variables/',
  makeUpExamAutomation: '/system/settings/make-up-exam-automation/',
  roomResources: '/system/settings/room-resources/',
  teacherSchedules: '/system/settings/teacher-schedules/',
  changePassword: '/accounts/change-password/',
};

export function createEmptySystemSettings() {
  return {
    adminAccount: {
      fullName: '',
      email: '',
      phoneNumber: '',
      jobTitle: '',
      preferredLanguage: '',
      passwordMask: '',
      profilePhotoUrl: '',
    },
    generalConfiguration: {
      absenceConfirmationDay: 'Thursday',
      absenceConfirmationTimeOfDay: '18:00',
      absenceAlertTime: '48',
      maxAbsencesBeforeExclusion: '3',
    },
    notificationTemplates: {
      selectedKey: 'student-warning',
      variables: [],
      templates: {
        'student-warning': {
          subject: '',
          body: '',
        },
        'scolarite-alert': {
          subject: '',
          body: '',
        },
        'justification-rejected': {
          subject: '',
          body: '',
        },
      },
    },
    makeUpExamAutomation: {
      algorithmPriorityLogic: '',
      roomResourcesSummary: '',
      teacherSchedulesSummary: '',
    },
    options: {
      languages: [],
      academicYears: [],
      examSessions: [],
      algorithmPriorities: [],
    },
  };
}

export function normalizeSystemSettingsPayload(payload = {}) {
  const emptyState = createEmptySystemSettings();

  return {
    adminAccount: {
      ...emptyState.adminAccount,
      ...(payload.adminAccount || {}),
    },
    generalConfiguration: {
      ...emptyState.generalConfiguration,
      ...(payload.generalConfiguration || {}),
    },
    notificationTemplates: {
      ...emptyState.notificationTemplates,
      ...(payload.notificationTemplates || {}),
      variables: Array.isArray(payload.notificationTemplates?.variables)
        ? payload.notificationTemplates.variables
        : emptyState.notificationTemplates.variables,
      templates: {
        ...emptyState.notificationTemplates.templates,
        ...(payload.notificationTemplates?.templates || {}),
      },
    },
    makeUpExamAutomation: {
      ...emptyState.makeUpExamAutomation,
      ...(payload.makeUpExamAutomation || {}),
    },
    options: {
      ...emptyState.options,
      ...(payload.options || {}),
      languages: Array.isArray(payload.options?.languages) ? payload.options.languages : [],
      academicYears: Array.isArray(payload.options?.academicYears) ? payload.options.academicYears : [],
      examSessions: Array.isArray(payload.options?.examSessions) ? payload.options.examSessions : [],
      algorithmPriorities: Array.isArray(payload.options?.algorithmPriorities)
        ? payload.options.algorithmPriorities
        : [],
    },
  };
}

export async function fetchSystemSettings() {
  return readEndpointData({
    getPreviewData: createEmptySystemSettings,
    request: () => api.get(SYSTEM_SETTINGS_ENDPOINTS.base),
    normalize: normalizeSystemSettingsPayload,
  });
}

export async function changeSystemSettingsPassword({ currentPassword, newPassword }) {
  const oldPassword = String(currentPassword || '').trim();
  const nextPassword = String(newPassword || '').trim();

  if (!oldPassword || !nextPassword) {
    throw new Error('Current and new passwords are required.');
  }

  return runEndpointMutation({
    endpoint: SYSTEM_SETTINGS_ENDPOINTS.changePassword,
    actionLabel: 'change the password',
    getPreviewResult: {
      success: true,
      preview: true,
      endpoint: SYSTEM_SETTINGS_ENDPOINTS.changePassword,
    },
    request: () => api.post(SYSTEM_SETTINGS_ENDPOINTS.changePassword, {
      old_password: oldPassword,
      new_password: nextPassword,
      confirm_password: nextPassword,
    }),
  });
}
