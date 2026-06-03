import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppPreferences } from '../context/AppPreferencesContext';
import api from '../api/axios.js';
import AcademicYearPicker from '../components/AcademicYearPicker';
import styles from './SystemSettingsPage.module.css';
import UserPasswordPlaceholderDialog from './UserPasswordPlaceholderDialog';
import {
  createEmptySystemSettings,
  changeSystemSettingsPassword,
  fetchSystemSettings,
  normalizeSystemSettingsPayload,
} from '../services/systemSettingsEndpoint';
import { buildUserEmail } from '../utils/userEmail';

const SECTION_IDS = [
  'admin-account',
  'general-configuration',
  'notification-templates',
];

const NOTIFICATION_TAB_IDS = [
  'student-warning',
  'scolarite-alert',
  'justification-rejected',
];

const TEXT_TOOLBAR_ITEMS = ['B', 'I', '\u2022'];

function getClosestVisibleSection(sectionRefs) {
  return SECTION_IDS
    .map((id) => {
      const element = sectionRefs.current[id];

      if (!element) {
        return null;
      }

      return {
        id,
        distance: Math.abs(element.getBoundingClientRect().top - 120),
      };
    })
    .filter(Boolean)
    .sort((firstSection, secondSection) => firstSection.distance - secondSection.distance)[0];
}

function splitFullName(fullName) {
  const nameParts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (nameParts.length === 0) {
    return {
      firstName: '',
      familyName: '',
    };
  }

  if (nameParts.length === 1) {
    return {
      firstName: nameParts[0],
      familyName: '',
    };
  }

  return {
    firstName: nameParts.slice(0, -1).join(' '),
    familyName: nameParts[nameParts.length - 1],
  };
}

function composeFullName(firstName, familyName) {
  return [String(firstName || '').trim(), String(familyName || '').trim()]
    .filter(Boolean)
    .join(' ')
    .trim();
}

export default function SystemSettingsPage() {
  const sectionRefs = useRef({});
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const {
    adminDisplayName,
    adminPhotoUrl,
    language,
    languageOptions,
    setAdminDisplayName,
    setAdminPhotoUrl,
    setLanguage,
    t,
  } = useAppPreferences();
  const [settingsState, setSettingsState] = useState(createEmptySystemSettings());
  const [activeSectionId, setActiveSectionId] = useState(SECTION_IDS[0]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(NOTIFICATION_TAB_IDS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSystemSettings() {
      setIsLoading(true);

      try {
        const response = await fetchSystemSettings();

        if (!isMounted) {
          return;
        }

        const normalizedSettings = normalizeSystemSettingsPayload(response);
        const fallbackFirstName = [user?.first_name, user?.middle_name]
          .filter(Boolean)
          .join(' ')
          .trim();
        const fallbackFamilyName = String(user?.last_name || '').trim();
        const fallbackFullName = composeFullName(fallbackFirstName, fallbackFamilyName);

        const nameSeed = normalizedSettings.adminAccount.fullName || adminDisplayName || fallbackFullName;
        const parsedName = splitFullName(nameSeed);
        const nextFirstName = normalizedSettings.adminAccount.firstName || parsedName.firstName || fallbackFirstName;
        const nextFamilyName = normalizedSettings.adminAccount.familyName || parsedName.familyName || fallbackFamilyName;
        const nextAdminDisplayName = composeFullName(nextFirstName, nextFamilyName) || nameSeed;
        const nextAdminEmail = buildUserEmail(nextFirstName, nextFamilyName) || normalizedSettings.adminAccount.email || user?.email || '';
        const nextAdminPhone = normalizedSettings.adminAccount.phoneNumber || user?.phone_number || user?.phone || '';
        const nextJobTitle = normalizedSettings.adminAccount.jobTitle || user?.job_title || user?.title || '';
        const nextLanguage = normalizedSettings.adminAccount.preferredLanguage || language;
        const nextPhoto = normalizedSettings.adminAccount.profilePhotoUrl || adminPhotoUrl || user?.profile_picture || '';

        setSettingsState({
          ...normalizedSettings,
          adminAccount: {
            ...normalizedSettings.adminAccount,
            firstName: nextFirstName,
            familyName: nextFamilyName,
            fullName: nextAdminDisplayName,
            email: nextAdminEmail,
            phoneNumber: nextAdminPhone,
            jobTitle: nextJobTitle,
            preferredLanguage: nextLanguage,
            profilePhotoUrl: nextPhoto,
          },
        });
        setSelectedTemplateKey(normalizedSettings.notificationTemplates.selectedKey || NOTIFICATION_TAB_IDS[0]);

        if (nextAdminDisplayName) {
          setAdminDisplayName(nextAdminDisplayName);
        }

        if (normalizedSettings.adminAccount.preferredLanguage) {
          setLanguage(normalizedSettings.adminAccount.preferredLanguage);
        }

        if (nextPhoto) {
          setAdminPhotoUrl(nextPhoto);
        }
      } catch {
        if (isMounted) {
          const fallbackFirstName = [user?.first_name, user?.middle_name]
            .filter(Boolean)
            .join(' ')
            .trim();
          const fallbackFamilyName = String(user?.last_name || '').trim();
          const fallbackFullName = composeFullName(fallbackFirstName, fallbackFamilyName);
          const parsedFallbackName = splitFullName(adminDisplayName || fallbackFullName);

          setSettingsState((currentState) => ({
            ...createEmptySystemSettings(),
            adminAccount: {
              ...currentState.adminAccount,
              firstName: currentState.adminAccount.firstName || parsedFallbackName.firstName || fallbackFirstName,
              familyName: currentState.adminAccount.familyName || parsedFallbackName.familyName || fallbackFamilyName,
              fullName: composeFullName(
                currentState.adminAccount.firstName || parsedFallbackName.firstName || fallbackFirstName,
                currentState.adminAccount.familyName || parsedFallbackName.familyName || fallbackFamilyName,
              ) || adminDisplayName || fallbackFullName,
              email: buildUserEmail(
                currentState.adminAccount.firstName || parsedFallbackName.firstName || fallbackFirstName,
                currentState.adminAccount.familyName || parsedFallbackName.familyName || fallbackFamilyName,
              ) || currentState.adminAccount.email || user?.email || '',
              phoneNumber: user?.phone_number || user?.phone || '',
              jobTitle: user?.job_title || user?.title || '',
              preferredLanguage: language,
              profilePhotoUrl: adminPhotoUrl || user?.profile_picture || '',
            },
          }));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSystemSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function updateActiveSection() {
      const closestSection = getClosestVisibleSection(sectionRefs);

      if (closestSection?.id) {
        setActiveSectionId(closestSection.id);
      }
    }

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, []);

  function scrollToSection(sectionId) {
    const sectionElement = sectionRefs.current[sectionId];

    if (!sectionElement) {
      return;
    }

    const targetTop = Math.max(0, sectionElement.getBoundingClientRect().top + window.scrollY - 24);
    setActiveSectionId(sectionId);
    window.scrollTo({
      top: targetTop,
      behavior: 'smooth',
    });
  }

  function updateAdminAccountField(fieldName, nextValue) {
    if (fieldName === 'firstName' || fieldName === 'familyName') {
      const nextFirstName = fieldName === 'firstName'
        ? nextValue
        : (settingsState.adminAccount.firstName || '');
      const nextFamilyName = fieldName === 'familyName'
        ? nextValue
        : (settingsState.adminAccount.familyName || '');
      const nextAdminDisplayName = composeFullName(nextFirstName, nextFamilyName);
      const nextEmail = buildUserEmail(nextFirstName, nextFamilyName) || settingsState.adminAccount.email;

      setSettingsState((currentState) => ({
        ...currentState,
        adminAccount: {
          ...currentState.adminAccount,
          firstName: nextFirstName,
          familyName: nextFamilyName,
          fullName: nextAdminDisplayName,
          email: nextEmail,
        },
      }));
      setAdminDisplayName(nextAdminDisplayName);
      return;
    }

    setSettingsState((currentState) => ({
      ...currentState,
      adminAccount: {
        ...currentState.adminAccount,
        [fieldName]: nextValue,
      },
    }));

    if (fieldName === 'fullName') {
      setAdminDisplayName(nextValue);
    }
  }

  function updateGeneralConfigurationField(fieldName, nextValue) {
    setSettingsState((currentState) => ({
      ...currentState,
      generalConfiguration: {
        ...currentState.generalConfiguration,
        [fieldName]: nextValue,
      },
    }));
  }

  function updateNotificationTemplateField(templateKey, fieldName, nextValue) {
    setSettingsState((currentState) => ({
      ...currentState,
      notificationTemplates: {
        ...currentState.notificationTemplates,
        selectedKey: templateKey,
        templates: {
          ...currentState.notificationTemplates.templates,
          [templateKey]: {
            ...currentState.notificationTemplates.templates[templateKey],
            [fieldName]: nextValue,
          },
        },
      },
    }));
  }

  // makeUpExamAutomation removed — kept settingsState untouched for compatibility

  function handleLanguageChange(nextLanguage) {
    updateAdminAccountField('preferredLanguage', nextLanguage);
    setLanguage(nextLanguage);
  }

  async function handlePhotoSelection(event) {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile || !String(selectedFile.type || '').startsWith('image/')) {
      event.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('profile_picture', selectedFile);
      const response = await api.put('/accounts/me/picture/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const nextPhotoUrl = response.data.profile_picture;
      updateAdminAccountField('profilePhotoUrl', nextPhotoUrl);
      setAdminPhotoUrl(nextPhotoUrl);
    } catch (error) {
      console.error('Failed to update profile picture', error);
      // Fallback to local data URL if backend fails
      const reader = new FileReader();
      reader.onload = () => {
        const nextPhotoUrl = typeof reader.result === 'string' ? reader.result : '';
        updateAdminAccountField('profilePhotoUrl', nextPhotoUrl);
        setAdminPhotoUrl(nextPhotoUrl);
      };
      reader.readAsDataURL(selectedFile);
    }

    event.target.value = '';
  }

  async function handleRemovePhoto() {
    try {
      await api.put('/accounts/me/picture/', { profile_picture: '' });
    } catch (error) {
      console.error('Failed to remove profile picture', error);
    }
    updateAdminAccountField('profilePhotoUrl', '');
    setAdminPhotoUrl('');
  }

  async function handlePasswordChange({ currentPassword, newPassword }) {
    await changeSystemSettingsPassword({
      currentPassword,
      newPassword,
    });
  }

  const sectionItems = [
    {
      id: 'admin-account',
      label: t('settings.adminAccount'),
      title: t('settings.adminAccount'),
      description: t('settings.adminAccountDescription'),
    },
    {
      id: 'general-configuration',
      label: t('settings.generalConfiguration'),
      title: t('settings.generalConfiguration'),
      description: t('settings.generalConfigurationDescription'),
    },
    {
      id: 'notification-templates',
      label: t('settings.notificationTemplates'),
      title: t('settings.notificationTemplates'),
      description: t('settings.notificationTemplatesDescription'),
    },
  ];

  const notificationTabs = [
    { id: 'student-warning', label: t('settings.studentWarning') },
    { id: 'scolarite-alert', label: t('settings.scolariteAlert') },
    { id: 'justification-rejected', label: t('settings.justificationRejected') },
  ];

  const selectedTemplate = settingsState.notificationTemplates.templates[selectedTemplateKey]
    || settingsState.notificationTemplates.templates[NOTIFICATION_TAB_IDS[0]];
  const resourceSummaryFallback = '--';
  let displayPhotoUrl = settingsState.adminAccount.profilePhotoUrl || adminPhotoUrl;
  if (typeof displayPhotoUrl === 'string' && displayPhotoUrl.startsWith('/')) {
    displayPhotoUrl = `http://127.0.0.1:8000${displayPhotoUrl}`;
  }
  const examSessionOptions = [
    t('settings.semester1'),
    t('settings.semester2'),
  ];

  return (
    <div className={`page-body ${styles.pageBody}`} aria-busy={isLoading}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t('settings.pageTitle')}</h1>
          <p className={styles.pageSubtitle}>{t('settings.pageSubtitle')}</p>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sideNavigation}>
          {sectionItems.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`${styles.sideNavButton} ${activeSectionId === section.id ? styles.sideNavButtonActive : ''}`}
              onClick={() => scrollToSection(section.id)}
            >
              <span className={styles.sideNavIndicator} aria-hidden="true" />
              <span className={styles.sideNavLabel}>{section.label}</span>
            </button>
          ))}
        </aside>

        <div className={styles.sections}>
          <section
            id="admin-account"
            ref={(node) => { sectionRefs.current['admin-account'] = node; }}
            className={styles.sectionCard}
          >
            <div className={styles.sectionHeader}>
              <h2 className={`${styles.sectionTitle} ${activeSectionId === 'admin-account' ? styles.sectionTitleActive : ''}`}>
                {t('settings.adminAccount')}
              </h2>
              <p className={styles.sectionDescription}>{t('settings.adminAccountDescription')}</p>
            </div>

            <div className={styles.sectionBody}>
              <div className={styles.profileIntro}>
                <div className={styles.profileAvatar} aria-hidden="true">
                  {displayPhotoUrl ? (
                    <img src={displayPhotoUrl} alt={t('settings.adminAccount')} className={styles.profileAvatarImage} />
                  ) : (
                    '\u{1F464}'
                  )}
                </div>
                <div className={styles.profileControls}>
                  <div className={styles.inlineButtons}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {t('settings.changePhoto')}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={handleRemovePhoto}
                    >
                      {t('settings.removePhoto')}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className={styles.hiddenInput}
                      onChange={handlePhotoSelection}
                    />
                  </div>
                  <p className={styles.inlineHint}>{t('settings.profileHint')}</p>
                </div>
              </div>

              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t('settings.familyName', 'Family Name')}</span>
                  <input
                    type="text"
                    className={styles.input}
                    value={settingsState.adminAccount.familyName || ''}
                    onChange={(event) => updateAdminAccountField('familyName', event.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t('settings.firstName', 'First Name')}</span>
                  <input
                    type="text"
                    className={styles.input}
                    value={settingsState.adminAccount.firstName || ''}
                    onChange={(event) => updateAdminAccountField('firstName', event.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t('settings.emailAddress')}</span>
                  <input
                    type="email"
                    className={styles.input}
                    value={settingsState.adminAccount.email}
                    readOnly
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t('settings.phoneNumber')}</span>
                  <input
                    type="text"
                    className={styles.input}
                    value={settingsState.adminAccount.phoneNumber}
                    onChange={(event) => updateAdminAccountField('phoneNumber', event.target.value)}
                  />
                </label>



                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t('settings.preferredLanguage')}</span>
                  <select
                    className={styles.select}
                    value={settingsState.adminAccount.preferredLanguage || language}
                    onChange={(event) => handleLanguageChange(event.target.value)}
                  >
                    <option value="">{t('settings.selectLanguage')}</option>
                    {languageOptions.map((languageOption) => (
                      <option key={languageOption.value} value={languageOption.value}>
                        {languageOption.label}
                      </option>
                    ))}
                  </select>
                </label>

              </div>

              <div className={styles.passwordActionRow}>
                <button
                  type="button"
                  className={styles.inlineActionButton}
                  onClick={() => setShowPasswordDialog(true)}
                >
                  {t('settings.changePassword')}
                </button>
              </div>
            </div>
          </section>

          <section
            id="general-configuration"
            ref={(node) => { sectionRefs.current['general-configuration'] = node; }}
            className={styles.sectionCard}
          >
            <div className={styles.sectionHeader}>
              <h2 className={`${styles.sectionTitle} ${activeSectionId === 'general-configuration' ? styles.sectionTitleActive : ''}`}>
                {t('settings.generalConfiguration')}
              </h2>
              <p className={styles.sectionDescription}>{t('settings.generalConfigurationDescription')}</p>
            </div>

            <div className={styles.sectionBody}>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>{t('settings.absenceConfirmationSchedule', 'Absence Confirmation Schedule')}</span>
                  <span className={styles.fieldHint}>{t('settings.absenceConfirmationScheduleHint', 'Recurring weekly schedule to auto-confirm pending absences.')}</span>
                  <div className={styles.metricShellWide} style={{ gap: '12px' }}>
                    <select
                      className={styles.select}
                      value={settingsState.generalConfiguration.absenceConfirmationDay || 'Thursday'}
                      onChange={(event) => updateGeneralConfigurationField('absenceConfirmationDay', event.target.value)}
                      style={{ flex: 1 }}
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      className={styles.input}
                      value={settingsState.generalConfiguration.absenceConfirmationTimeOfDay || '18:00'}
                      onChange={(event) => updateGeneralConfigurationField('absenceConfirmationTimeOfDay', event.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <span className={styles.fieldLabel}>{t('settings.maxAbsences', 'Max Absences Before Exclusion')}</span>
                  <span className={styles.fieldHint}>{t('settings.maxAbsencesHint', 'Number of absences before a student is excluded.')}</span>
                  <div className={styles.metricShellWide}>
                    <input
                      type="number"
                      className={styles.metricInput}
                      value={settingsState.generalConfiguration.maxAbsencesBeforeExclusion || 0}
                      onChange={(event) => updateGeneralConfigurationField('maxAbsencesBeforeExclusion', event.target.value)}
                    />
                    <span className={styles.metricLabel}>{t('settings.absences', 'Absences')}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="notification-templates"
            ref={(node) => { sectionRefs.current['notification-templates'] = node; }}
            className={styles.sectionCard}
          >
            <div className={styles.sectionHeader}>
              <h2 className={`${styles.sectionTitle} ${activeSectionId === 'notification-templates' ? styles.sectionTitleActive : ''}`}>
                {t('settings.notificationTemplates')}
              </h2>
              <p className={styles.sectionDescription}>{t('settings.notificationTemplatesDescription')}</p>
            </div>

            <div className={styles.templateTabs}>
              {notificationTabs.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`${styles.templateTab} ${selectedTemplateKey === template.id ? styles.templateTabActive : ''}`}
                  onClick={() => setSelectedTemplateKey(template.id)}
                >
                  {template.label}
                </button>
              ))}
            </div>

            <div className={styles.sectionBody}>
              <div className={styles.fieldStack}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t('settings.emailSubject')}</span>
                  <input
                    type="text"
                    className={styles.input}
                    value={selectedTemplate?.subject || ''}
                    onChange={(event) => updateNotificationTemplateField(selectedTemplateKey, 'subject', event.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t('settings.emailBody')}</span>
                  <div className={styles.editorShell}>
                    <div className={styles.editorToolbar}>
                      {TEXT_TOOLBAR_ITEMS.map((item) => (
                        <button key={item} type="button" className={styles.toolbarButton}>
                          {item}
                        </button>
                      ))}
                      <button
                        type="button"
                        className={styles.insertVariableButton}
                        disabled={settingsState.notificationTemplates.variables.length === 0}
                      >
                        {t('settings.insertVariable')}
                      </button>
                    </div>
                    <textarea
                      className={styles.textarea}
                      value={selectedTemplate?.body || ''}
                      onChange={(event) => updateNotificationTemplateField(selectedTemplateKey, 'body', event.target.value)}
                    />
                  </div>
                </label>
              </div>
            </div>
          </section>

          {/* Make-up exam (rattrapage) automation removed per request */}
        </div>
      </div>

      {showPasswordDialog && (
        <UserPasswordPlaceholderDialog
          title={t('settings.changePassword')}
          currentPasswordLabel={t('settings.currentPassword')}
          newPasswordLabel={t('settings.newPassword')}
          onSubmit={handlePasswordChange}
          submitLabel={t('settings.changePassword')}
          closeLabel={t('settings.close')}
          closeAriaLabel={t('settings.changePassword')}
          onClose={() => setShowPasswordDialog(false)}
        />
      )}
    </div>
  );
}
