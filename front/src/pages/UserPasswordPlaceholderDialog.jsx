import styles from './UserPasswordPlaceholderDialog.module.css';
import { useAppPreferences } from '../context/AppPreferencesContext';

export default function UserPasswordPlaceholderDialog({
  onClose,
  title,
  currentPasswordLabel,
  newPasswordLabel,
  newPasswordPlaceholder,
  closeLabel,
  closeAriaLabel,
}) {
  const { t } = useAppPreferences();
  const resolvedTitle = title || t('userEdit.changePassword');
  const resolvedCurrentPasswordLabel = currentPasswordLabel || t('userEdit.currentPassword');
  const resolvedNewPasswordLabel = newPasswordLabel || t('userEdit.newPassword');
  const resolvedNewPasswordPlaceholder = newPasswordPlaceholder || t('userEdit.newPasswordPlaceholder');
  const resolvedCloseLabel = closeLabel || t('common.close');
  const resolvedCloseAriaLabel = closeAriaLabel || t('userEdit.closeDialog');

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

        <div className={styles.content}>
          <label className={styles.field}>
            <span className={styles.label}>{resolvedCurrentPasswordLabel}</span>
            <input
              type="password"
              className={styles.input}
              disabled
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>{resolvedNewPasswordLabel}</span>
            <input
              type="password"
              placeholder={resolvedNewPasswordPlaceholder}
              className={`${styles.input} ${styles.inputActive}`}
            />
          </label>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            {resolvedCloseLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
