import { useEffect, useMemo, useRef, useState } from 'react';
import ScolaritePageHeader from '../components/ScolaritePageHeader';
import { useUsers } from '../context/UsersContext';
import { buildUserEmail } from '../utils/userEmail';
import dashboardStyles from './ScolariteDashboardPage.module.css';
import styles from './ScolariteStudentProfilePage.module.css';

function Icon({ name }) {
  if (name === 'camera') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.5 7.5 10 5.5h4l1.5 2H19a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3.5Z" />
        <circle cx="12" cy="13" r="3" />
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

  if (name === 'save') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5h12l2 2v12H5V5Z" />
        <path d="M8 5v5h7V5M8 19v-5h8v5" />
      </svg>
    );
  }

  if (name === 'info') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 11.5v4M12 8.2h.01" />
      </svg>
    );
  }

  if (name === 'delete') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 7h14M9 7V5h6v2M8 10v8M12 10v8M16 10v8" />
        <path d="M7 7l1 13h8l1-13" />
      </svg>
    );
  }

  if (name === 'back') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m15 6-6 6 6 6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.8 18.5a5.2 5.2 0 0 1 10.4 0" />
      <circle cx="17.2" cy="9.2" r="2.2" />
      <path d="M15.2 17.8a4.2 4.2 0 0 1 5-1.9" />
    </svg>
  );
}

function splitName(user) {
  const nameParts = String(user?.name || '').trim().split(/\s+/).filter(Boolean);

  return {
    firstName: user?.firstName || nameParts.slice(0, -1).join(' ') || nameParts[0] || '',
    lastName: user?.lastName || nameParts.at(-1) || '',
  };
}

function buildAcademicYear(student) {
  if (student.promotion) {
    return student.promotion;
  }

  return student.year ? `${student.year}` : '';
}

export default function ScolariteStudentProfilePage({ studentId, onBack }) {
  const { users, fetchAllUsers, updateUser, deleteUser } = useUsers();
  const photoInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    avatarUrl: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (users.length === 0) {
      fetchAllUsers({ role: 'STUDENT' }).catch(() => {});
    }
  }, [fetchAllUsers, users.length]);

  const student = useMemo(
    () => users.find((user) => String(user.id) === String(studentId)),
    [studentId, users],
  );

  useEffect(() => {
    if (!student) {
      return;
    }

    const { firstName, lastName } = splitName(student);
    setFormValues({
      firstName,
      lastName,
      phone: student.phone || '',
      avatarUrl: student.profilePicture || student.profile_picture || '',
    });
  }, [student]);

  const generatedEmail = buildUserEmail(formValues.firstName, formValues.lastName) || student?.email || '';
  const displayName = `${formValues.firstName} ${formValues.lastName}`.trim() || student?.name || 'Student';
  const academicYear = buildAcademicYear(student || {});

  function handleFieldChange(fieldName, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));
  }

  function handlePhotoButtonClick() {
    photoInputRef.current?.click();
  }

  function handlePhotoChange(event) {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile || !String(selectedFile.type || '').startsWith('image/')) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const nextAvatarUrl = typeof reader.result === 'string' ? reader.result : '';
      handleFieldChange('avatarUrl', nextAvatarUrl);
    };

    reader.readAsDataURL(selectedFile);
    event.target.value = '';
  }

  async function handleSave() {
    if (!student) {
      return;
    }

    setIsSaving(true);

    try {
      await updateUser(student.id, {
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        phone: formValues.phone,
        role: 'STUDENT',
        registration_number: student.idNumber,
        promotion: student.promotion,
        year: student.year,
        speciality: student.specialty || student.specialization || 'N/A',
        avatarUrl: formValues.avatarUrl,
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!student) {
      return;
    }

    if (!window.confirm(`Delete ${student.name || displayName}?`)) {
      return;
    }

    await deleteUser(student.id);
    onBack();
  }

  if (!student) {
    return (
      <div className={dashboardStyles.page}>
        <ScolaritePageHeader
          title="Student Profile"
          breadcrumb="Home / Students / Profile"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <main className={dashboardStyles.content}>
          <p className={dashboardStyles.emptyState}>Loading student profile...</p>
        </main>
      </div>
    );
  }

  return (
    <div className={dashboardStyles.page}>
      <ScolaritePageHeader
        title="Student Profile"
        breadcrumb="Home / Students / Profile"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className={`${dashboardStyles.content} ${styles.content}`}>
        <section className={styles.heroCard}>
          <div className={styles.avatarWrap}>
            {formValues.avatarUrl ? (
              <img src={formValues.avatarUrl} alt="" />
            ) : (
              <span className={styles.avatarFallback}>{student.initials || displayName.slice(0, 2).toUpperCase()}</span>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className={styles.photoInput}
              onChange={handlePhotoChange}
            />
            <button type="button" aria-label="Change profile photo" onClick={handlePhotoButtonClick}>
              <Icon name="camera" />
            </button>
          </div>
          <div className={styles.heroCopy}>
            <h2>{displayName}</h2>
            <p>Student in {academicYear || 'active academic year'}</p>
            <div className={styles.badges}>
              <span>{student.idNumber || 'No student ID'}</span>
              <span>Status: {student.accountStatus === 'suspended' ? 'Suspended' : 'Regular'}</span>
            </div>
          </div>
          <button type="button" className={styles.saveHeroButton} onClick={handleSave} disabled={isSaving}>
            Save Changes
          </button>
        </section>

        <section className={styles.profileGrid}>
          <div>
            <article className={styles.panel}>
              <header>
                <h2><Icon /> Personal Information</h2>
              </header>
              <div className={styles.formGrid}>
                <label>
                  <span>Last Name</span>
                  <input value={formValues.lastName} onChange={(event) => handleFieldChange('lastName', event.target.value)} />
                </label>
                <label>
                  <span>First Name</span>
                  <input value={formValues.firstName} onChange={(event) => handleFieldChange('firstName', event.target.value)} />
                </label>
                <label>
                  <span>Academic Office ID</span>
                  <input value={student.idNumber || ''} disabled />
                </label>
                <label>
                  <span>Institutional Email</span>
                  <input value={generatedEmail} disabled />
                </label>
                <label className={styles.fieldFull}>
                  <span>Academic Year</span>
                  <input value={academicYear} disabled />
                </label>
              </div>
            </article>

            <article className={styles.noteCard}>
              <span><Icon name="info" /></span>
              <div>
                <strong>Administrative Note</strong>
                <p>Student ID and Academic Year fields are managed by the administration and cannot be modified directly.</p>
              </div>
            </article>
          </div>

          <aside className={styles.panel}>
            <header>
              <h2><Icon name="lock" /> Security</h2>
            </header>
            <div className={styles.securityBody}>
              <p>Modify your password to maintain the security of your student account.</p>
              <label>
                <span>Current Password</span>
                <input type="password" placeholder="Current password" />
              </label>
              <label>
                <span>New Password</span>
                <input type="password" placeholder="New password" />
              </label>
              <label>
                <span>Confirm New</span>
                <input type="password" placeholder="Confirm new" />
              </label>
              <button type="button" disabled>Update Password</button>
            </div>
          </aside>
        </section>

        <footer className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onBack}>
            <Icon name="back" />
            Cancel
          </button>
          <button type="button" className={styles.deleteButton} onClick={handleDelete}>
            <Icon name="delete" />
            Delete Student
          </button>
          <button type="button" className={styles.saveButton} onClick={handleSave} disabled={isSaving}>
            <Icon name="save" />
            Save all changes
          </button>
        </footer>
      </main>
    </div>
  );
}
