import { useRef, useState } from 'react';
import styles from './UserEditPage.module.css';
import UserPasswordPlaceholderDialog from './UserPasswordPlaceholderDialog';
import { buildUserEmail } from '../utils/userEmail';
import { useAppPreferences } from '../context/AppPreferencesContext';

function getRoleLabel(role, t) {
  return t(`roles.${String(role || '').toUpperCase()}`, t('common.user'));
}

function formatMemberSince(dateValue, locale, t) {
  if (!dateValue) {
    return t('userEdit.memberSinceUnknown');
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return t('userEdit.memberSinceUnknown');
  }

  const formattedDate = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(parsedDate);

  return `${t('userEdit.memberSince')} ${formattedDate}`;
}

function buildFallbackAvatar() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
      <rect width="160" height="160" rx="80" fill="#EFF4FB"/>
      <circle cx="80" cy="58" r="28" fill="#C4D2E8"/>
      <path d="M38 138c6-26 24-42 42-42s36 16 42 42H38Z" fill="#9FB2D2"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function Icon({ name }) {
  if (name === 'edit') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 19.5h4l10-10a2.1 2.1 0 0 0-3-3l-10 10-1 3Z" />
        <path d="m14 8 3 3" />
      </svg>
    );
  }

  if (name === 'lock') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5.5" y="10" width="13" height="9" rx="2" />
        <path d="M8.5 10V7.8a3.5 3.5 0 0 1 7 0V10" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

export default function UserEditPage({
  user,
  roleOptions,
  promotionOptions,
  studentSpecialties,
  selectedRole,
  formValues,
  formErrors,
  isSubmitting,
  onBack,
  onRoleChange,
  onFieldChange,
  onSubmit,
  onDelete,
  onProfilePictureChange,
  studentHasSpecialty,
}) {
  const { locale, t } = useAppPreferences();
  const fileInputRef = useRef(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const displayName = `${formValues.firstName || user.firstName || ''} ${formValues.lastName || user.lastName || ''}`.trim() || user.name || t('common.user');
  let profileImage = formValues.profilePicture || user.profilePicture || user.profile_picture || buildFallbackAvatar();
  if (typeof profileImage === 'string' && profileImage.startsWith('/')) {
    profileImage = `http://127.0.0.1:8000${profileImage}`;
  }
  const generatedEmail = buildUserEmail(
    formValues.firstName || user.firstName || '',
    formValues.lastName || user.lastName || ''
  );
  const memberSince = formatMemberSince(user.dateJoined || user.date_joined, locale, t);
  const normalizedRole = String(selectedRole || '').toLowerCase();
  const isStudent = normalizedRole === 'student';
  const isTeacher = normalizedRole === 'teacher';

  function renderFieldError(fieldName) {
    if (!formErrors[fieldName]) {
      return null;
    }

    return <span className={styles.fieldError}>{formErrors[fieldName]}</span>;
  }

  function getInputClass(fieldName) {
    return formErrors[fieldName]
      ? `${styles.input} ${styles.inputInvalid}`
      : styles.input;
  }

  return (
    <div className={styles.page}>
      <section className={styles.topbar}>
        <div className={styles.topbarCopy}>
          <button
            type="button"
            className={styles.backButton}
            onClick={onBack}
            aria-label={t('userEdit.backToUsersManagement')}
          >
            <Icon name="back" />
          </button>
          <div>
            <p className={styles.breadcrumb}>{t('userEdit.breadcrumb')}</p>
            <h1 className={styles.title}>{t('userEdit.title')}</h1>
          </div>
        </div>
      </section>

      <div className={styles.content}>
        {formErrors.submit && (
          <div className={styles.submitError}>{formErrors.submit}</div>
        )}

        <div className={styles.heroGrid}>
          <aside className={styles.profileCard}>
            <div className={styles.avatarWrap}>
              <img
                src={profileImage}
                alt={displayName}
                className={styles.avatar}
              />
              <button
                type="button"
                className={styles.avatarButton}
                onClick={() => fileInputRef.current?.click()}
                aria-label={t('userEdit.uploadProfilePhoto')}
              >
                <Icon name="edit" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] || null;
                  onProfilePictureChange(selectedFile);
                  event.target.value = '';
                }}
              />
            </div>

            <h2 className={styles.profileName}>{displayName}</h2>
            <p className={styles.profileEmail}>{generatedEmail || t('userEdit.noEmailAssigned')}</p>
            <span className={styles.memberSince}>{memberSince}</span>
            <div className={styles.profileDivider} />

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setShowPasswordDialog(true)}
            >
              {t('userEdit.changePassword')}
            </button>
            {onDelete ? (
              <button
                type="button"
                className={styles.dangerButton}
                onClick={onDelete}
                disabled={isSubmitting}
              >
                Delete Student
              </button>
            ) : null}
            {renderFieldError('profilePicture')}
          </aside>

          <section className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{t('userEdit.personalAcademicTitle')}</h2>
              <p className={styles.cardSubtitle}>{t('userEdit.personalAcademicSubtitle')}</p>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>{t('userEdit.firstName')}</span>
                <input
                  type="text"
                  name="firstName"
                  value={formValues.firstName}
                  onChange={onFieldChange}
                  className={getInputClass('firstName')}
                  aria-invalid={Boolean(formErrors.firstName)}
                />
                {renderFieldError('firstName')}
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>{t('userEdit.lastName')}</span>
                <input
                  type="text"
                  name="lastName"
                  value={formValues.lastName}
                  onChange={onFieldChange}
                  className={getInputClass('lastName')}
                  aria-invalid={Boolean(formErrors.lastName)}
                />
                {renderFieldError('lastName')}
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.fieldLabel}>{t('userEdit.emailAddress')}</span>
                <div className={styles.lockedField}>
                  <input
                    type="email"
                    value={generatedEmail || ''}
                    disabled
                    className={`${styles.input} ${styles.inputDisabled}`}
                  />
                  <span className={styles.lockBadge} aria-hidden="true">
                    <Icon name="lock" />
                  </span>
                </div>
                <span className={styles.fieldHint}>{t('userEdit.emailHint')}</span>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>{t('userEdit.phoneNumber')}</span>
                <input
                  type="text"
                  name="phone"
                  value={formValues.phone}
                  onChange={onFieldChange}
                  className={getInputClass('phone')}
                  aria-invalid={Boolean(formErrors.phone)}
                />
                {renderFieldError('phone')}
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>{t('userEdit.role')}</span>
                <select
                  value={selectedRole}
                  onChange={(event) => onRoleChange(event.target.value)}
                  className={styles.select}
                >
                  {roleOptions.map((role) => (
                    <option key={role.id} value={role.id}>
                      {getRoleLabel(role.id, t)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        </div>

        <section className={styles.detailsCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              {isStudent ? t('userEdit.academicDetails') : t('userEdit.roleDetails')}
            </h2>
            <p className={styles.cardSubtitle}>
              {isStudent
                ? t('userEdit.academicDetailsSubtitle')
                : t('userEdit.roleDetailsSubtitle')}
            </p>
          </div>

          {isStudent ? (
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>{t('userEdit.registrationNumber')}</span>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formValues.registrationNumber}
                  onChange={onFieldChange}
                  className={getInputClass('registrationNumber')}
                  aria-invalid={Boolean(formErrors.registrationNumber)}
                />
                {renderFieldError('registrationNumber')}
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>{t('userEdit.academicYear')}</span>
                <select
                  name="promotion"
                  value={formValues.promotion}
                  onChange={onFieldChange}
                  className={formErrors.promotion ? `${styles.select} ${styles.inputInvalid}` : styles.select}
                  aria-invalid={Boolean(formErrors.promotion)}
                >
                  <option value="">{t('userEdit.selectAcademicYear')}</option>
                  {promotionOptions.map((promotion) => (
                    <option key={promotion} value={promotion}>
                      {promotion}
                    </option>
                  ))}
                </select>
                {renderFieldError('promotion')}
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>{t('userEdit.specialty')}</span>
                <select
                  name="specialty"
                  value={formValues.specialty}
                  onChange={onFieldChange}
                  disabled={!studentHasSpecialty(formValues.promotion)}
                  className={formErrors.specialty ? `${styles.select} ${styles.inputInvalid}` : styles.select}
                  aria-invalid={Boolean(formErrors.specialty)}
                >
                  <option value="">
                    {studentHasSpecialty(formValues.promotion)
                      ? t('userEdit.selectSpecialty')
                      : t('userEdit.selectYearFirst')}
                  </option>
                  {studentSpecialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
                {renderFieldError('specialty')}
              </label>
            </div>
          ) : isTeacher ? (
            <div className={styles.formGrid}>
              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.fieldLabel}>{t('userEdit.department')}</span>
                <input
                  type="text"
                  name="department"
                  value={formValues.department}
                  onChange={onFieldChange}
                  className={getInputClass('department')}
                  aria-invalid={Boolean(formErrors.department)}
                />
                {renderFieldError('department')}
              </label>
            </div>
          ) : (
            <div className={styles.placeholder}>
              <span className={styles.placeholderBadge}>
                {getRoleLabel(normalizedRole, t)}
              </span>
              <p className={styles.placeholderText}>
                {t('userEdit.noExtraFields')}
              </p>
            </div>
          )}
        </section>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onBack}
            disabled={isSubmitting}
          >
            {t('userEdit.cancel')}
          </button>
          <button
            type="button"
            className={styles.submitButton}
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('userEdit.saving') : t('userEdit.saveChanges')}
          </button>
        </div>
      </div>

      {showPasswordDialog && (
        <UserPasswordPlaceholderDialog
          title={t('userEdit.changePassword')}
          currentPasswordLabel={t('userEdit.currentPassword')}
          newPasswordLabel={t('userEdit.newPassword')}
          newPasswordPlaceholder={t('userEdit.newPasswordPlaceholder')}
          closeAriaLabel={t('userEdit.closeDialog')}
          onClose={() => setShowPasswordDialog(false)}
        />
      )}
    </div>
  );
}
