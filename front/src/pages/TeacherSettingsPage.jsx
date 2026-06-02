import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppPreferences } from '../context/AppPreferencesContext';
import {
  changeSystemSettingsPassword,
} from '../services/systemSettingsEndpoint';
import { buildInstitutionalEmailFromFullName, buildUserEmail } from '../utils/userEmail';
import UserPasswordPlaceholderDialog from './UserPasswordPlaceholderDialog';
import api from '../api/axios';
import { resolveMediaUrl } from '../utils/mediaUrl';
import styles from './TeacherSettingsPage.module.css';

const TEACHER_SETTINGS_STORAGE_KEY = 'teacher_settings_v1';

function getNameParts(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function getInitialsFromName(fullName, fallbackInitial = 'T') {
  const nameParts = getNameParts(fullName);
  const firstInitial = nameParts[0]?.[0] || '';
  const secondInitial = nameParts[1]?.[0] || '';
  const initials = `${firstInitial}${secondInitial}`.toUpperCase();
  return initials || fallbackInitial;
}

function splitFullName(fullName) {
  const nameParts = getNameParts(fullName);

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

function createEmptyTeacherSettings() {
  return {
    teacherAccount: {
      fullName: '',
      email: '',
      phoneNumber: '',
      jobTitle: '',
      profilePhotoUrl: '',
      firstName: '',
      familyName: '',
      address: '',
      password: '',
    },
  };
}

function readStoredTeacherSettings() {
  try {
    const rawValue = localStorage.getItem(TEACHER_SETTINGS_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : null;
  } catch {
    return null;
  }
}

export default function TeacherSettingsPage() {
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const {
    teacherDisplayName,
    teacherPhotoUrl,
    setTeacherDisplayName,
    setTeacherPhotoUrl,
    t,
  } = useAppPreferences();

  const [settingsState, setSettingsState] = useState(createEmptyTeacherSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  useEffect(() => {
    function loadSettings() {
      setIsLoading(true);

      try {
        const storedTeacherSettings = readStoredTeacherSettings();
        const storedTeacherAccount = storedTeacherSettings?.teacherAccount || storedTeacherSettings?.adminAccount || {};
        const fallbackFirstName = [user?.first_name, user?.middle_name]
          .filter(Boolean)
          .join(' ')
          .trim();
        const fallbackFamilyName = String(user?.last_name || '').trim();
        const nameSeed = storedTeacherAccount.fullName
          || teacherDisplayName
          || composeFullName(fallbackFirstName, fallbackFamilyName);
        const parsedNameSeed = splitFullName(nameSeed);
        const nextFirstName = String(storedTeacherAccount.firstName || '').trim() || fallbackFirstName || parsedNameSeed.firstName;
        const nextFamilyName = String(storedTeacherAccount.familyName || '').trim() || fallbackFamilyName || parsedNameSeed.familyName;
        const nextFullName = composeFullName(nextFirstName, nextFamilyName) || nameSeed;
        const nextEmail = buildUserEmail(nextFirstName, nextFamilyName)
          || buildInstitutionalEmailFromFullName(nextFullName)
          || storedTeacherAccount.email
          || user?.email
          || '';
        const nextPhone = storedTeacherAccount.phoneNumber || user?.phone_number || user?.phone || '';
        const nextAddress = storedTeacherAccount.address || user?.address || user?.adress || '';
        const nextJobTitle = storedTeacherAccount.jobTitle || user?.job_title || user?.title || t('teacherSettings.defaultJobTitle');
        const nextPassword = storedTeacherAccount.password || '';
        const rawPhotoUrl = storedTeacherAccount.profilePhotoUrl || user?.profile_picture || user?.photo || '';
        const nextPhotoUrl = rawPhotoUrl ? resolveMediaUrl(rawPhotoUrl) : '';

        setSettingsState((prev) => ({
          ...prev,
          teacherAccount: {
            ...prev.teacherAccount,
            fullName: nextFullName,
            email: nextEmail,
            phoneNumber: nextPhone,
            jobTitle: nextJobTitle,
            address: nextAddress,
            password: nextPassword,
            firstName: nextFirstName,
            familyName: nextFamilyName,
            profilePhotoUrl: nextPhotoUrl,
          },
        }));

        setTeacherDisplayName(nextFullName);
        if (nextPhotoUrl) {
          setTeacherPhotoUrl(nextPhotoUrl);
        }
      } catch (error) {
        console.error('Failed to load teacher settings', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [t, user, teacherDisplayName, setTeacherDisplayName, setTeacherPhotoUrl]);

  const displayPhotoUrl = useMemo(
    () =>
      settingsState.teacherAccount.profilePhotoUrl ||
      teacherPhotoUrl ||
      null,
    [settingsState.teacherAccount.profilePhotoUrl, teacherPhotoUrl]
  );

  const fallbackInitial = useMemo(
    () => getInitialsFromName(settingsState.teacherAccount.fullName),
    [settingsState.teacherAccount.fullName]
  );

  const updateTeacherField = (field, value) => {
    setSettingsState((prev) => ({
      ...prev,
      teacherAccount: {
        ...prev.teacherAccount,
        [field]: value,
      },
    }));
  };

  const handlePhotoSelection = async (event) => {
    const target = event.target;
    const file = target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('profile_picture', file);
      
      const response = await api.put('/accounts/me/picture/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const nextPhotoUrl = response.data.profile_picture ? resolveMediaUrl(response.data.profile_picture) : '';
      updateTeacherField('profilePhotoUrl', nextPhotoUrl);
      setTeacherPhotoUrl(nextPhotoUrl);
      target.value = '';
    } catch (error) {
      console.error('Failed to upload profile picture to server', error);
      // Fallback to local preview if server upload fails
      const reader = new FileReader();
      reader.onload = () => {
        const result = /** @type {string} */ (reader.result);
        updateTeacherField('profilePhotoUrl', result);
        setTeacherPhotoUrl(result);
        target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await api.put('/accounts/me/picture/', { profile_picture: '' });
    } catch (error) {
      console.error('Failed to remove profile picture from server', error);
    }
    updateTeacherField('profilePhotoUrl', '');
    setTeacherPhotoUrl('');
  };

  const handlePasswordChange = async (currentPassword, newPassword) => {
    try {
      await changeSystemSettingsPassword(currentPassword, newPassword);
      setShowPasswordDialog(false);
    } catch (error) {
      console.error('Password change failed', error);
    }
  };

  const accountTitle = useMemo(() => {
    const fullName = settingsState.teacherAccount.fullName || t('teacherSettings.teacherFallbackName');
    return `${fullName} ${t('teacherSettings.accountSuffix')}`;
  }, [settingsState.teacherAccount.fullName, t]);

  return (
    <section className={styles.page} aria-busy={isLoading}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('teacherSettings.pageTitle')}</h1>
      </header>

      <div className={styles.layout}>
        <div className={styles.content}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('teacherSettings.generalAccountTitle')}</h2>
            <p className={styles.sectionDescription}>{t('teacherSettings.generalAccountDescription')}</p>
          </div>

          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{accountTitle}</h3>
              <p className={styles.cardHint}>{t('teacherSettings.profileHint')}</p>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.profileRow}>
                <div className={styles.avatar} aria-hidden="true">
                  {displayPhotoUrl ? (
                    <img src={displayPhotoUrl} alt={settingsState.teacherAccount.fullName || t('teacherSettings.teacherFallbackName')} className={styles.avatarImage} />
                  ) : (
                    <span>{getInitialsFromName(settingsState.teacherAccount.fullName, fallbackInitial)}</span>
                  )}
                </div>

                <div className={styles.profileControls}>
                  <div className={styles.profileButtons}>
                    <button type="button" className={styles.secondaryButton} onClick={() => fileInputRef.current?.click()}>{t('settings.changePhoto')}</button>
                    <button type="button" className={styles.secondaryButton} onClick={handleRemovePhoto}>{t('settings.removePhoto')}</button>
                    <input ref={fileInputRef} type="file" accept="image/*" className={styles.hiddenInput} onChange={handlePhotoSelection} />
                  </div>
                  <p className={styles.profileText}>{t('teacherSettings.changesSavedImmediately')}</p>
                </div>
              </div>

              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span className={styles.label}>{t('teacherSettings.familyName')}</span>
                  <input type="text" className={styles.input} value={settingsState.teacherAccount.familyName} onChange={(event) => updateTeacherField('familyName', event.target.value)} />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>{t('teacherSettings.firstName')}</span>
                  <input type="text" className={styles.input} value={settingsState.teacherAccount.firstName} onChange={(event) => updateTeacherField('firstName', event.target.value)} />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>{t('settings.emailAddress')}</span>
                  <input type="email" className={styles.input} value={settingsState.teacherAccount.email} readOnly />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>{t('settings.phoneNumber')}</span>
                  <input type="text" className={styles.input} value={settingsState.teacherAccount.phoneNumber} onChange={(event) => updateTeacherField('phoneNumber', event.target.value)} />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>{t('teacherSettings.jobTitle')}</span>
                  <input type="text" className={styles.input} value={settingsState.teacherAccount.jobTitle} onChange={(event) => updateTeacherField('jobTitle', event.target.value)} />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>{t('teacherSettings.address')}</span>
                  <input type="text" className={styles.input} value={settingsState.teacherAccount.address} onChange={(event) => updateTeacherField('address', event.target.value)} />
                </label>
              </div>

              <div className={styles.passwordActionRow}>
                <button type="button" className={styles.inlineActionButton} onClick={() => setShowPasswordDialog(true)}>{t('settings.changePassword')}</button>
              </div>
            </div>
          </article>
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
    </section>
  );
}
