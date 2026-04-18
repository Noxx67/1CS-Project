import api from '../api/axios';

export const SYSTEM_SETTINGS_ENDPOINTS = {
  base: 'system/settings/',
  adminAccount: 'system/settings/admin-account/',
  generalConfiguration: 'system/settings/general-configuration/',
  notificationTemplates: 'system/settings/notification-templates/',
  notificationTemplateVariables: 'system/settings/notification-templates/variables/',
  makeUpExamAutomation: 'system/settings/make-up-exam-automation/',
  roomResources: 'system/settings/room-resources/',
  teacherSchedules: 'system/settings/teacher-schedules/',
  changePassword: 'accounts/change-password/',
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
      academicYear: '',
      activeExamSession: '',
      justificationDeadlineHours: '',
      absenceAlertOperator: '>',
      absenceAlertThreshold: '',
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


// Frontend handoff point for the system settings flow.
export async function fetchSystemSettings() {
  try {
    const response = await api.get(SYSTEM_SETTINGS_ENDPOINTS.base);
    return normalizeSystemSettingsPayload(response.data);
  } catch (error) {
    console.error('Failed to fetch system settings:', error);
    return createEmptySystemSettings();
  }
}
