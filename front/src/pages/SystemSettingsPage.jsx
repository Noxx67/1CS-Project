import { useEffect, useRef, useState } from 'react';
import { useAppPreferences } from '../context/AppPreferencesContext';
import AcademicYearPicker from '../components/AcademicYearPicker';
import styles from './SystemSettingsPage.module.css';
import UserPasswordPlaceholderDialog from './UserPasswordPlaceholderDialog';
import {
  createEmptySystemSettings,
  fetchSystemSettings,
  normalizeSystemSettingsPayload,
} from '../services/systemSettingsEndpoint';

const SECTION_IDS = [
  'admin-account',
  'general-configuration',
  'notification-templates',
  'make-up-exam-rattrapage',
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

export default function SystemSettingsPage() {
  const sectionRefs = useRef({});
  const fileInputRef = useRef(null);
  const {
    adminPhotoUrl,
    language,
    languageOptions,
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
        const nextLanguage = normalizedSettings.adminAccount.preferredLanguage || language;
        const nextPhoto = normalizedSettings.adminAccount.profilePhotoUrl || adminPhotoUrl;

        setSettingsState({
          ...normalizedSettings,
          adminAccount: {
            ...normalizedSettings.adminAccount,
            preferredLanguage: nextLanguage,
            profilePhotoUrl: nextPhoto,
          },
        });
        setSelectedTemplateKey(normalizedSettings.notificationTemplates.selectedKey || NOTIFICATION_TAB_IDS[0]);

        if (normalizedSettings.adminAccount.preferredLanguage) {
          setLanguage(normalizedSettings.adminAccount.preferredLanguage);
        }

        if (normalizedSettings.adminAccount.profilePhotoUrl) {
          setAdminPhotoUrl(normalizedSettings.adminAccount.profilePhotoUrl);
        }
      } catch {
        if (isMounted) {
          setSettingsState((currentState) => ({
            ...createEmptySystemSettings(),
            adminAccount: {
              ...currentState.adminAccount,
              preferredLanguage: language,
              profilePhotoUrl: adminPhotoUrl,
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
    setSettingsState((currentState) => ({
      ...currentState,
      adminAccount: {
        ...currentState.adminAccount,
        [fieldName]: nextValue,
      },
    }));
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

  function updateAutomationField(fieldName, nextValue) {
    setSettingsState((currentState) => ({
      ...currentState,
      makeUpExamAutomation: {
        ...currentState.makeUpExamAutomation,
        [fieldName]: nextValue,
      },
    }));
  }

  function handleLanguageChange(nextLanguage) {
    updateAdminAccountField('preferredLanguage', nextLanguage);
    setLanguage(nextLanguage);
  }

  function handlePhotoSelection(event) {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile || !String(selectedFile.type || '').startsWith('image/')) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextPhotoUrl = typeof reader.result === 'string' ? reader.result : '';

      updateAdminAccountField('profilePhotoUrl', nextPhotoUrl);
      setAdminPhotoUrl(nextPhotoUrl);
    };
    reader.readAsDataURL(selectedFile);
    event.target.value = '';
  }

  function handleRemovePhoto() {
    updateAdminAccountField('profilePhotoUrl', '');
    setAdminPhotoUrl('');
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
    {
      id: 'make-up-exam-rattrapage',
      label: t('settings.makeUpExamRattrapage'),
      title: t('settings.makeUpExamRattrapageTitle'),
      description: t('settings.makeUpExamRattrapageDescription'),
    },
  ];

  const notificationTabs = [
    { id: 'student-warning', label: t('settings.studentWarning') },
    { id: 'scolarite-alert', label: t('settings.scolariteAlert') },
    { id: 'justification-rejected', label: t('settings.justificationRejected') },
  ];

  const selectedTemplate = settingsState.notificationTemplates.templates[selectedTemplateKey]
    || settingsState.notificationTemplates.templates[NOTIFICATION_TAB_IDS[0]];
  const justificationDeadlineValue = Number(settingsState.generalConfiguration.justificationDeadlineHours || 0);
  const resourceSummaryFallback = '--';
  const displayPhotoUrl = settingsState.adminAccount.profilePhotoUrl || adminPhotoUrl;
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
                  <span className={styles.fieldLabel}>{t('settings.fullName')}</span>
                  <input
                    type="text"
                    className={styles.input}
                    value={settingsState.adminAccount.fullName}
                    onChange={(event) => updateAdminAccountField('fullName', event.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t('settings.emailAddress')}</span>
                  <input
                    type="email"
                    className={styles.input}
                    value={settingsState.adminAccount.email}
                    onChange={(event) => updateAdminAccountField('email', event.target.value)}
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
                  <span className={styles.fieldLabel}>{t('settings.jobTitle')}</span>
                  <input
                    type="text"
                    className={styles.input}
                    value={settingsState.adminAccount.jobTitle}
                    onChange={(event) => updateAdminAccountField('jobTitle', event.target.value)}
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

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t('settings.password')}</span>
                  <div className={styles.passwordShell}>
                    <input
                      type="password"
                      className={styles.input}
                      value={settingsState.adminAccount.passwordMask}
                      readOnly
                    />
                    <button
                      type="button"
                      className={styles.inlineActionButton}
                      onClick={() => setShowPasswordDialog(true)}
                    >
                      {t('settings.changePassword')}
                    </button>
                  </div>
                </label>
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
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t('settings.academicYear')}</span>
                  <AcademicYearPicker
                    value={settingsState.generalConfiguration.academicYear}
                    onChange={(nextValue) => updateGeneralConfigurationField('academicYear', nextValue)}
                    label={t('settings.selectAcademicYear')}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t('settings.activeExamSession')}</span>
                  <select
                    className={styles.select}
                    value={settingsState.generalConfiguration.activeExamSession}
                    onChange={(event) => updateGeneralConfigurationField('activeExamSession', event.target.value)}
                  >
                    <option value="">{t('settings.selectExamSession')}</option>
                    {examSessionOptions.map((examSession) => (
                      <option key={examSession} value={examSession}>
                        {examSession}
                      </option>
                    ))}
                  </select>
                </label>

                <div className={styles.field}>
                  <span className={styles.fieldLabel}>{t('settings.justificationDeadline')}</span>
                  <span className={styles.fieldHint}>{t('settings.justificationDeadlineHint')}</span>
                  <div className={styles.deadlineGrid}>
                    <input
                      type="range"
                      min="0"
                      max="72"
                      step="1"
                      className={styles.rangeInput}
                      value={justificationDeadlineValue}
                      onChange={(event) => updateGeneralConfigurationField('justificationDeadlineHours', event.target.value)}
                    />
                    <div className={styles.metricShell}>
                      <input
                        type="number"
                        className={`${styles.metricInput} ${styles.metricInputReadonly}`}
                        value={settingsState.generalConfiguration.justificationDeadlineHours}
                        readOnly
                      />
                      <span className={styles.metricLabel}>{t('settings.hours')}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.field}>
                  <span className={styles.fieldLabel}>{t('settings.absenceAlertThreshold')}</span>
                  <span className={styles.fieldHint}>{t('settings.absenceAlertThresholdHint')}</span>
                  <div className={styles.metricShellWide}>
                    <span className={styles.operatorBadge} aria-hidden="true">{'>'}</span>
                    <input
                      type="number"
                      className={styles.metricInput}
                      value={settingsState.generalConfiguration.absenceAlertThreshold}
                      onChange={(event) => updateGeneralConfigurationField('absenceAlertThreshold', event.target.value)}
                    />
                    <span className={styles.metricLabel}>{t('settings.absences')}</span>
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

          <section
            id="make-up-exam-rattrapage"
            ref={(node) => { sectionRefs.current['make-up-exam-rattrapage'] = node; }}
            className={styles.sectionCard}
          >
            <div className={styles.sectionHeader}>
              <h2 className={`${styles.sectionTitle} ${activeSectionId === 'make-up-exam-rattrapage' ? styles.sectionTitleActive : ''}`}>
                {t('settings.makeUpExamRattrapageTitle')}
              </h2>
              <p className={styles.sectionDescription}>{t('settings.makeUpExamRattrapageDescription')}</p>
            </div>

            <div className={styles.sectionBody}>
              <div className={styles.fieldStack}>
                <label className={`${styles.field} ${styles.fieldWide}`}>
                  <span className={styles.fieldLabel}>{t('settings.algorithmPriorityLogic')}</span>
                  <select
                    className={styles.select}
                    value={settingsState.makeUpExamAutomation.algorithmPriorityLogic}
                    onChange={(event) => updateAutomationField('algorithmPriorityLogic', event.target.value)}
                  >
                    <option value="">{t('settings.selectAlgorithmPriority')}</option>
                    {settingsState.options.algorithmPriorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className={styles.resourceGrid}>
                <article className={styles.resourceCard}>
                  <div className={styles.resourceCopy}>
                    <h3 className={styles.resourceTitle}>{t('settings.roomResources')}</h3>
                    <p className={styles.resourceDescription}>
                      {settingsState.makeUpExamAutomation.roomResourcesSummary || resourceSummaryFallback}
                    </p>
                  </div>
                  <button type="button" className={styles.secondaryButton}>
                    {t('settings.manageRooms')}
                  </button>
                </article>

                <article className={styles.resourceCard}>
                  <div className={styles.resourceCopy}>
                    <h3 className={styles.resourceTitle}>{t('settings.teacherSchedules')}</h3>
                    <p className={styles.resourceDescription}>
                      {settingsState.makeUpExamAutomation.teacherSchedulesSummary || resourceSummaryFallback}
                    </p>
                  </div>
                  <button type="button" className={styles.secondaryButton}>
                    {t('settings.manageSchedules')}
                  </button>
                </article>
              </div>
            </div>
          </section>
        </div>
      </div>

      {showPasswordDialog && (
        <UserPasswordPlaceholderDialog
          title={t('settings.changePassword')}
          currentPasswordLabel={t('settings.currentPassword')}
          newPasswordLabel={t('settings.newPassword')}
          closeLabel={t('settings.close')}
          closeAriaLabel={t('settings.changePassword')}
          onClose={() => setShowPasswordDialog(false)}
        />
      )}
    </div>
  );
}
