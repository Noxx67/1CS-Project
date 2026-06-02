import { useState } from 'react';
import styles from './UserPasswordPlaceholderDialog.module.css';
import { useAppPreferences } from '../context/AppPreferencesContext';

export default function UserPasswordPlaceholderDialog({
  onClose,
  onSubmit,
  title,
  currentPasswordLabel,
  newPasswordLabel,
  newPasswordPlaceholder,
  confirmPasswordLabel,
  confirmPasswordPlaceholder,
  submitLabel,
  closeLabel,
  closeAriaLabel,
  requiredMessage,
  passwordMismatchMessage,
  submitErrorMessage,
}) {
  const { t } = useAppPreferences();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resolvedTitle = title || t('userEdit.changePassword');
  const resolvedCurrentPasswordLabel = currentPasswordLabel || t('userEdit.currentPassword');
  const resolvedNewPasswordLabel = newPasswordLabel || t('userEdit.newPassword');
  const resolvedNewPasswordPlaceholder = newPasswordPlaceholder || t('userEdit.newPasswordPlaceholder');
  const resolvedConfirmPasswordLabel = confirmPasswordLabel || t('settings.confirmPassword', 'Confirm New Password');
  const resolvedConfirmPasswordPlaceholder = confirmPasswordPlaceholder || t('settings.confirmPasswordPlaceholder', 'Re-enter the new password');
  const resolvedSubmitLabel = submitLabel || t('settings.changePassword');
  const resolvedCloseLabel = closeLabel || t('common.close');
  const resolvedCloseAriaLabel = closeAriaLabel || t('userEdit.closeDialog');
  const resolvedRequiredMessage = requiredMessage || t('settings.passwordRequired', t('teacherSettings.passwordRequired'));
  const resolvedPasswordMismatchMessage = passwordMismatchMessage || t('settings.passwordMismatch', 'Passwords do not match.');
  const resolvedSubmitErrorMessage = submitErrorMessage || t('settings.passwordChangeFailed', t('teacherSettings.passwordChangeFailed'));
  const hasSubmitAction = typeof onSubmit === 'function';

  async function handleSubmit(event) {
    event.preventDefault();

    if (!hasSubmitAction) {
      onClose();
      return;
    }

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setErrorMessage(resolvedRequiredMessage);
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorMessage(resolvedPasswordMismatchMessage);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onSubmit({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      onClose();
    } catch (submitError) {
      setErrorMessage(
        submitError?.response?.data?.error
          || submitError?.message
          || resolvedSubmitErrorMessage,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="password-placeholder-title">
      <div className={styles.dialog}>
        <div className={styles.header}>
          <div>
            <h2 id="password-placeholder-title" className={styles.title}>{resolvedTitle}</h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={resolvedCloseAriaLabel}
          >
            {'\u2715'}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.content}>
            <label className={styles.field}>
              <span className={styles.label}>{resolvedCurrentPasswordLabel}</span>
              <input
                type="password"
                className={`${styles.input} ${styles.inputActive}`}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>{resolvedNewPasswordLabel}</span>
              <input
                type="password"
                placeholder={resolvedNewPasswordPlaceholder}
                className={`${styles.input} ${styles.inputActive}`}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>{resolvedConfirmPasswordLabel}</span>
              <input
                type="password"
                placeholder={resolvedConfirmPasswordPlaceholder}
                className={`${styles.input} ${styles.inputActive}`}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </label>

            {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>
              {resolvedCloseLabel}
            </button>
            {hasSubmitAction ? (
              <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
                {resolvedSubmitLabel}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
