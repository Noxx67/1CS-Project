import { useEffect, useState } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { useUsers } from '../context/UsersContext';
import { useAppPreferences } from '../context/AppPreferencesContext';
import UserEditPage from '../pages/UserEditPage';
import { getStudentDepartmentFromPromotion } from '../utils/studentDepartment';
import { exportUsersToCsv } from '../utils/exportUsersToCsv';
import './UserManagementPage.css';

const roleOptions = [
  { id: 'student', icon: 'student' },
  { id: 'teacher', icon: 'teacher' },
  { id: 'scolarite', icon: 'folder' },
  { id: 'admin', icon: 'settings' },
];

const studentSpecialties = ['ISI', 'SIW', 'IASD', 'CyberSecurity'];
const promotionOptions = ['1CPI', '2CPI', '1CS', '2CS', '3CS'];
const PROMOTION_TO_YEAR = {
  '1CPI': 1,
  '2CPI': 2,
  '1CS': 3,
  '2CS': 4,
  '3CS': 5,
};
const ALGERIAN_PHONE_REGEX = /^(0\d{9}|\+213\d{9})$/;

const initialFormState = {
  firstName: '',
  lastName: '',
  password: '',
  phone: '',
  registrationNumber: '',
  promotion: '',
  specialty: '',
  department: '',
  profilePicture: '',
};

function Icon({ name }) {
  if (name === 'search') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.2" />
        <path d="M20 20l-4.2-4.2" />
      </svg>
    );
  }

  if (name === 'export') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4v10" />
        <path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
        <path d="M5 18.5h14" />
      </svg>
    );
  }

  if (name === 'edit') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 19.5h4l10-10a2.1 2.1 0 0 0-3-3l-10 10-1 3Z" />
        <path d="m14 8 3 3" />
      </svg>
    );
  }

  if (name === 'trash') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 7h14" />
        <path d="M9 7V5h6v2" />
        <path d="M8 10v8M12 10v8M16 10v8" />
        <path d="M7 7l1 13h8l1-13" />
      </svg>
    );
  }

  if (name === 'bell') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4.5a4.8 4.8 0 0 0-4.8 4.8v2.1c0 1-.34 1.98-.95 2.78L4.8 16h14.4l-1.45-1.82a4.4 4.4 0 0 1-.95-2.78V9.3A4.8 4.8 0 0 0 12 4.5Z" />
        <path d="M9.9 18.2a2.1 2.1 0 0 0 4.2 0" />
      </svg>
    );
  }

  if (name === 'eye') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.8 12s3-5.2 8.2-5.2S20.2 12 20.2 12s-3 5.2-8.2 5.2S3.8 12 3.8 12Z" />
        <circle cx="12" cy="12" r="2.2" />
      </svg>
    );
  }

  if (name === 'teacher') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m4 8 8-4 8 4-8 4-8-4Z" />
        <path d="M7 10.5v4.2c1.3 1.4 3 2.1 5 2.1s3.7-.7 5-2.1v-4.2" />
      </svg>
    );
  }

  if (name === 'folder') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 7.5h5.2l1.6 2h8.2v7.8a2.2 2.2 0 0 1-2.2 2.2H6.7a2.2 2.2 0 0 1-2.2-2.2V7.5Z" />
        <path d="M4.5 7.5V6.8a2.2 2.2 0 0 1 2.2-2.2h2.6l1.6 2h6.4a2.2 2.2 0 0 1 2.2 2.2v.7" />
      </svg>
    );
  }

  if (name === 'settings') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 4.5v2M12 17.5v2M6.7 6.7l1.4 1.4M15.9 15.9l1.4 1.4M4.5 12h2M17.5 12h2M6.7 17.3l1.4-1.4M15.9 8.1l1.4-1.4" />
      </svg>
    );
  }

  if (name === 'check') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 12.5 3.5 3.5L18 7.5" />
      </svg>
    );
  }

  if (name === 'plus') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === 'spinner') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4a8 8 0 1 1-7.4 5" />
      </svg>
    );
  }

  if (name === 'next') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m9 6 6 6-6 6" />
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

function formatLabel(value, t) {
  const normalizedValue = String(value || '').toLowerCase();
  const labels = {
    student: t('roles.STUDENT'),
    teacher: t('roles.TEACHER'),
    scolarite: t('roles.SCOLARITE'),
    admin: t('roles.ADMIN'),
    active: t('common.active'),
    suspended: t('common.suspended'),
  };

  return labels[normalizedValue] || value || '';
}

function roleIs(user, roleName) {
  return String(user.role || '').toLowerCase() === String(roleName || '').toLowerCase();
}

function getAvatarTone(user) {
  if (user.avatarTone) {
    return user.avatarTone;
  }

  if (user.accountStatus === 'suspended') {
    return 'slate';
  }

  if (user.role === 'teacher') {
    return 'violet';
  }

  if (user.role === 'admin') {
    return 'amber';
  }

  if (user.role === 'scolarite') {
    return 'teal';
  }

  return 'blue';
}

function getYearValueFromPromotion(promotion) {
  return PROMOTION_TO_YEAR[String(promotion || '').toUpperCase()] || null;
}

function getRoleSectionMeta(role, t) {
  const normalizedRole = String(role || '').toLowerCase();

  if (!normalizedRole) {
    return {
      title: t('userManagement.accountDetailsTitle'),
      subtitle: t('userManagement.accountDetailsSubtitle'),
      badge: t('userManagement.roleRequired'),
    };
  }

  if (normalizedRole === 'teacher') {
    return {
      title: t('userManagement.teachingDetails'),
      subtitle: t('userManagement.teachingSubtitle'),
      badge: t('userManagement.teacherActive'),
    };
  }

  if (normalizedRole === 'scolarite') {
    return {
      title: t('userManagement.schoolOfficeDetails'),
      subtitle: t('userManagement.schoolOfficeSubtitle'),
      badge: t('userManagement.scolariteActive'),
    };
  }

  if (normalizedRole === 'admin') {
    return {
      title: t('userManagement.administrativeDetails'),
      subtitle: t('userManagement.administrativeSubtitle'),
      badge: t('userManagement.adminActive'),
    };
  }

  return {
    title: t('userManagement.academicDetails'),
    subtitle: t('userManagement.studentSubtitle'),
    badge: t('userManagement.studentActive'),
  };
}

function studentHasSpecialty(promotion) {
  return promotion === '2CS' || promotion === '3CS';
}

function normalizeSpecialty(value) {
  if (!value) {
    return '';
  }

  return studentSpecialties.find(
    (specialty) => specialty.toLowerCase() === String(value).toLowerCase()
  ) || '';
}

function getStudentPromotion(user) {
  if (promotionOptions.includes(user.promotion)) {
    return user.promotion;
  }

  return '';
}

function isCompletedValue(value) {
  return String(value || '').trim() !== '';
}

function countCompletedValues(values) {
  return values.filter((value) => isCompletedValue(value)).length;
}

function getSetupProgress(role, values) {
  const normalizedRole = String(role || '').toLowerCase();
  if (!normalizedRole) {
    return 0;
  }

  const completedCommonFields = countCompletedValues([
    values.firstName,
    values.lastName,
    values.password,
    values.phone,
  ]);

  if (normalizedRole === 'student') {
    const completedStudentFields = countCompletedValues([
      values.registrationNumber,
      values.promotion,
    ]);
    const specialtyProgress = studentHasSpecialty(values.promotion)
      ? countCompletedValues([values.specialty])
      : isCompletedValue(values.promotion)
        ? 1
        : 0;

    return Math.min(100, 30 + (completedCommonFields + completedStudentFields + specialtyProgress) * 10);
  }

  if (role === 'teacher') {
    return Math.min(100, 30 + (completedCommonFields + countCompletedValues([
      values.department,
    ])) * 10);
  }

  if (role === 'scolarite') {
    return Math.min(100, 30 + completedCommonFields * 10);
  }

  if (role === 'admin') {
    return Math.min(100, 30 + completedCommonFields * 10);
  }

  return Math.min(100, 30 + completedCommonFields * 10);
}

function getPhoneError(value, t) {
  const trimmedValue = String(value || '').trim();

  if (!trimmedValue) {
    return '';
  }

  if (!ALGERIAN_PHONE_REGEX.test(trimmedValue)) {
    return t('userManagement.phoneError');
  }

  return '';
}

function getPasswordError(value, isEditing, t) {
  const trimmedValue = String(value || '').trim();

  if (!trimmedValue && !isEditing) {
    return t('userManagement.passwordRequired');
  }

  if (trimmedValue && trimmedValue.length < 6) {
    return t('userManagement.passwordTooShort');
  }

  return '';
}

function normalizeIdValue(value) {
  return String(value || '').trim().toUpperCase();
}

function getRequiredFieldLabels(t) {
  return {
    firstName: t('userManagement.fieldLabels.firstName'),
    lastName: t('userManagement.fieldLabels.lastName'),
    password: t('userManagement.fieldLabels.password'),
    phone: t('userManagement.fieldLabels.phone'),
    registrationNumber: t('userManagement.fieldLabels.registrationNumber'),
    promotion: t('userManagement.fieldLabels.promotion'),
    specialty: t('userManagement.fieldLabels.specialty'),
    department: t('userManagement.fieldLabels.department'),
  };
}

function getRequiredFieldNames(role, values, isEditing) {
  const normalizedRole = String(role || '').toLowerCase();
  const commonFields = isEditing
    ? ['firstName', 'lastName', 'phone']
    : ['firstName', 'lastName', 'password', 'phone'];

  if (normalizedRole === 'student') {
    return [
      ...commonFields,
      'registrationNumber',
      'promotion',
      ...(studentHasSpecialty(values.promotion) ? ['specialty'] : []),
    ];
  }

  if (normalizedRole === 'teacher') {
    return [...commonFields, 'department'];
  }

  if (normalizedRole === 'scolarite') {
    return commonFields;
  }

  if (normalizedRole === 'admin') {
    return commonFields;
  }

  return commonFields;
}

function validateFormFields(role, values, isEditing, users = [], editingUser = null, t) {
  const errors = {};
  const requiredFieldLabels = getRequiredFieldLabels(t);
  const requiredFieldNames = getRequiredFieldNames(role, values, isEditing);

  console.log('Validation starting for role:', role);
  console.log('Required field names:', requiredFieldNames);
  console.log('Current form values:', values);

  requiredFieldNames.forEach((fieldName) => {
    const fieldValue = values[fieldName];
    const isCompleted = isCompletedValue(fieldValue);
    console.log(`Checking field "${fieldName}": value="${fieldValue}", isCompleted=${isCompleted}`);
    
    if (!isCompleted) {
      errors[fieldName] = `${requiredFieldLabels[fieldName]} ${t('userManagement.requiredSuffix')}`;
      console.error(`VALIDATION ERROR - ${fieldName}: ${requiredFieldLabels[fieldName]} ${t('userManagement.requiredSuffix')}`);
    }
  });

  const passwordError = getPasswordError(values.password, isEditing, t);
  const phoneError = getPhoneError(values.phone, t);

  if (passwordError) {
    errors.password = passwordError;
  }

  if (phoneError) {
    errors.phone = phoneError;
  }

  const normalizedRole = String(role || '').toLowerCase();

  if (normalizedRole === 'student' && isCompletedValue(values.registrationNumber)) {
    const duplicateUser = users.find(
      (user) =>
        user.id !== editingUser?.id
        && String(user.role || '').toLowerCase() === 'student'
        && normalizeIdValue(user.idNumber || '') === normalizeIdValue(values.registrationNumber)
    );

    if (duplicateUser) {
      errors.registrationNumber = t('userManagement.registrationDuplicate');
    }
  }

  console.log('Validation complete. Errors found:', Object.keys(errors).length > 0 ? errors : 'NONE');
  return errors;
}

function buildFormValuesFromUser(user) {
  if (roleIs(user, 'student')) {
    const promotion = getStudentPromotion(user);

    return {
      ...initialFormState,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      registrationNumber: user.idNumber || '',
      promotion,
      specialty: studentHasSpecialty(promotion)
        ? normalizeSpecialty(user.specialty || user.specialization)
        : '',
      profilePicture: user.profilePicture || user.profile_picture || '',
    };
  }

  return {
    ...initialFormState,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    department: user.department || '',
    profilePicture: user.profilePicture || user.profile_picture || '',
  };
}

export default function UserManagementPage({
  initialSearchQuery = '',
  onInitialSearchApplied,
  initialViewMode = '',
  onInitialViewModeApplied,
  initialCreateRole = '',
  lockCreateRole = false,
  initialEditUserId = '',
  onCloseFormView,
}) {
  const { t } = useAppPreferences();
  const { users, isLoading, error, addUser, updateUser, deleteUser, fetchAllUsers } = useUsers();
  const { addNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('directory');
  const [selectedRole, setSelectedRole] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formValues, setFormValues] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rowsPerPage = 10;
  const isEditing = editingUser !== null;
  const normalizedInitialCreateRole = String(initialCreateRole || '').toLowerCase();
  const visibleRoleOptions = lockCreateRole && normalizedInitialCreateRole
    ? roleOptions.filter((role) => role.id === normalizedInitialCreateRole)
    : roleOptions;

  useEffect(() => {
    fetchAllUsers().catch((err) => {
      console.error('Failed to fetch users:', err);
    });
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    if (!normalizedQuery) {
      return true;
    }

    return [
      user.name,
      user.email,
      user.role,
      user.idNumber,
      user.department,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + rowsPerPage);
  const rangeStart = filteredUsers.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = filteredUsers.length === 0 ? 0 : startIndex + paginatedUsers.length;
  const roleSectionMeta = getRoleSectionMeta(selectedRole, t);
  const formTitle = isEditing ? t('userManagement.formEditUser') : t('userManagement.formAddNewUser');
  const formBreadcrumb = isEditing
    ? t('userManagement.breadcrumbModify')
    : t('userManagement.breadcrumbCreate');
  const progressStep = isEditing
    ? t('userManagement.stepUpdate')
    : selectedRole
      ? t('userManagement.stepComplete')
      : t('userManagement.stepRole');
  const roleSubtitle = isEditing
    ? t('userManagement.roleSubtitleEdit')
    : t('userManagement.roleSubtitleCreate');
  const submitLabel = isEditing ? t('common.saveChanges') : t('userManagement.createAccount');
  const setupProgress = getSetupProgress(selectedRole, formValues);
  const canSubmitForm = Boolean(selectedRole) && !isSubmitting && !isLoading;
  const emptyUsersMessage = normalizedQuery
    ? t('userManagement.noSearchResults')
    : t('userManagement.noUsers');

  function getFieldClass(name, baseClass = 'create-input') {
    return formErrors[name] ? `${baseClass} create-input--invalid` : baseClass;
  }

  function renderFieldError(name) {
    return formErrors[name]
      ? <span className="create-field-error">{formErrors[name]}</span>
      : null;
  }

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!initialSearchQuery) {
      return;
    }

    setSearchQuery(initialSearchQuery);
    setCurrentPage(1);
    onInitialSearchApplied?.();
  }, [initialSearchQuery, onInitialSearchApplied]);

  useEffect(() => {
    if (!initialViewMode) {
      return;
    }

    if (initialViewMode === 'create') {
      setEditingUser(null);
      setSelectedRole(normalizedInitialCreateRole);
      setFormValues(initialFormState);
      setFormErrors({});
      setShowPassword(false);
      setViewMode('create');
    }

    if (initialViewMode === 'directory') {
      setViewMode('directory');
      setEditingUser(null);
      setSelectedRole('');
      setFormValues(initialFormState);
      setFormErrors({});
      setShowPassword(false);
    }

    onInitialViewModeApplied?.();
  }, [initialViewMode, normalizedInitialCreateRole, onInitialViewModeApplied]);

  useEffect(() => {
    if (initialViewMode !== 'edit' || !initialEditUserId) {
      return;
    }

    const userToEdit = users.find((user) => String(user.id) === String(initialEditUserId));

    if (!userToEdit) {
      return;
    }

    setEditingUser(userToEdit);
    setSelectedRole(String(userToEdit.role || '').toLowerCase());
    setFormValues(buildFormValuesFromUser(userToEdit));
    setFormErrors({});
    setShowPassword(false);
    setViewMode('edit');
  }, [initialEditUserId, initialViewMode, users]);

  function handleSearchChange(event) {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  }

  function handleDeleteUser(user) {
    if (window.confirm(`${t('userManagement.confirmDeletePrefix')} ${user.name}?`)) {
      return deleteUser(user.id)
        .then(() => {
          addNotification({
            icon: <Icon name="trash" />,
            title: t('userManagement.userRemoved'),
            sub: `${user.name} - ${formatLabel(user.role, t)}`,
          });
        })
        .catch((err) => {
          addNotification({
          icon: <Icon name="bell" />,
            title: t('userManagement.failedDelete'),
            sub: err?.response?.data?.error || error || t('userManagement.errorOccurred'),
          });
        });
    }

    return Promise.resolve();
  }

  function handleOpenCreateView() {
    setEditingUser(null);
    setSelectedRole(normalizedInitialCreateRole);
    setFormValues(initialFormState);
    setFormErrors({});
    setShowPassword(false);
    setViewMode('create');
  }

  function handleOpenEditView(user) {
    setEditingUser(user);
    setSelectedRole(String(user.role || '').toLowerCase());
    setFormValues(buildFormValuesFromUser(user));
    setFormErrors({});
    setShowPassword(false);
    setViewMode('edit');
  }

  function handleCloseFormView() {
    if (onCloseFormView) {
      onCloseFormView();
      return;
    }

    setViewMode('directory');
    setEditingUser(null);
    setSelectedRole(normalizedInitialCreateRole);
    setFormValues(initialFormState);
    setFormErrors({});
    setShowPassword(false);
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    const nextFormValues = name === 'promotion'
      ? {
          ...formValues,
          promotion: value,
          specialty: studentHasSpecialty(value) ? formValues.specialty : '',
        }
      : { ...formValues, [name]: value };

    setFormValues(nextFormValues);

    if (Object.keys(formErrors).length > 0) {
      setFormErrors(validateFormFields(selectedRole, nextFormValues, isEditing, users, editingUser, t));
    }
  }

  function handleRoleChange(role) {
    const nextFormValues = { ...formValues };
    setSelectedRole(role);
    setFormValues(nextFormValues);
    setFormErrors({});
  }

  function handleProfilePictureChange(file) {
    if (!file) {
      return;
    }

    if (!String(file.type || '').startsWith('image/')) {
      setFormErrors((currentErrors) => ({
        ...currentErrors,
        profilePicture: t('userManagement.invalidImageFile'),
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormValues((currentValues) => ({
        ...currentValues,
        profilePicture: typeof reader.result === 'string' ? reader.result : '',
      }));
      setFormErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };
        delete nextErrors.profilePicture;
        return nextErrors;
      });
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmitForm() {
    if (!selectedRole) {
      console.warn('No role selected');
      return;
    }

    console.log('Form submission started for role:', selectedRole);
    console.log('Current form values at submission:', formValues);
    
    const accountErrors = validateFormFields(selectedRole, formValues, isEditing, users, editingUser, t);

    if (Object.keys(accountErrors).length > 0) {
      console.warn('FORM VALIDATION FAILED - Errors:', accountErrors);
      setFormErrors(accountErrors);
      console.warn('Form submission BLOCKED due to validation errors');
      return;
    }

    console.log('Form validation PASSED - proceeding with submission');
    setIsSubmitting(true);

    try {
      const userData = {
        firstName: formValues.firstName.trim(),
        lastName: formValues.lastName.trim(),
        phone: formValues.phone.trim(),
        role: selectedRole.toUpperCase(),
        avatarUrl: formValues.profilePicture || editingUser?.profilePicture || editingUser?.profile_picture || '',
      };

      if (!isEditing) {
        userData.password = formValues.password.trim();
      } else {
        userData.email = editingUser?.email || '';
      }

      const normalizedRole = String(selectedRole || '').toLowerCase();

      if (normalizedRole === 'student') {
        userData.registration_number = formValues.registrationNumber.trim();
        userData.promotion = formValues.promotion;
        userData.year = getYearValueFromPromotion(formValues.promotion);
        userData.department = getStudentDepartmentFromPromotion(formValues.promotion);
        
        if (studentHasSpecialty(formValues.promotion)) {
          userData.speciality = formValues.specialty.trim();
        } else {
          userData.speciality = 'N/A';
        }
        
        console.log('Student fields:', {
          registration_number: userData.registration_number,
          year: userData.year,
          department: userData.department,
          speciality: userData.speciality || 'Not required for this promotion'
        });
      }

      if (normalizedRole === 'teacher') {
        userData.field = formValues.department.trim();
        userData.department = formValues.department.trim();
      }

      console.log('User data being submitted:', userData);

      if (isEditing) {
        console.log('Updating existing user:', editingUser.id);
        await updateUser(editingUser.id, userData);
        addNotification({
          icon: <Icon name="edit" />,
          title: t('userManagement.userUpdated'),
          sub: `${userData.firstName} ${userData.lastName}`,
        });
      } else {
        console.log('Creating new user');
        const createdUser = await addUser(userData);
        addNotification({
          icon: <Icon name="student" />,
          title: t('userManagement.newUserCreated'),
          sub: `${userData.firstName} ${userData.lastName}`,
        });

        setSearchQuery(createdUser?.name || '');
        setCurrentPage(1);
      }

      handleCloseFormView();
    } catch (err) {
      console.error('Form submission error - Full error:', err);
      console.error('Form submission error - Response data:', err.response?.data);
      
      let errorMsg = t('userManagement.failedSave');
      let fieldErrors = {};
      
      if (err.response?.data) {
        const responseData = err.response.data;
        
        if (typeof responseData === 'string' && responseData.includes('IntegrityError')) {
          console.log('Detected Django IntegrityError HTML response');
          const integrityErrorMatch = responseData.match(/<pre class="exception_value">([^<]+)<\/pre>/);
          if (integrityErrorMatch) {
            const errorText = integrityErrorMatch[1];
            console.error('Extracted IntegrityError:', errorText);
            
            if (errorText.includes('Duplicate entry') && errorText.includes('registration_number')) {
              const regNumberMatch = errorText.match(/Duplicate entry '([^']+)' for key 'accounts_studentprofile\.registration_number'/);
              if (regNumberMatch) {
                errorMsg = t('userManagement.registrationDuplicate');
                fieldErrors.registrationNumber = t('userManagement.registrationDuplicate');
              } else {
                errorMsg = t('userManagement.registrationDuplicate');
                fieldErrors.registrationNumber = t('userManagement.registrationDuplicate');
              }
            } else {
              errorMsg = t('userManagement.failedSave');
            }
          } else {
            errorMsg = t('userManagement.failedSave');
          }
        }
        else if (responseData.error) {
          errorMsg = responseData.error;
        }
        
        else if (responseData.details && typeof responseData.details === 'object') {
          console.log('Backend field details:', responseData.details);
          Object.keys(responseData.details).forEach(field => {
            const fieldError = responseData.details[field];
            if (Array.isArray(fieldError) && fieldError.length > 0) {
              const errorText = fieldError[0];
              fieldErrors[field] = errorText;
              console.error(`Field error - ${field}:`, errorText);
              errorMsg = `${field}: ${errorText}`;
            } else if (typeof fieldError === 'string') {
              fieldErrors[field] = fieldError;
              console.error(`Field error - ${field}:`, fieldError);
              errorMsg = `${field}: ${fieldError}`;
            }
          });
        }
        else if (typeof responseData === 'object' && !Array.isArray(responseData)) {
          Object.keys(responseData).forEach(field => {
            if (field !== 'error' && field !== 'detail') {
              const fieldError = responseData[field];
              if (Array.isArray(fieldError)) {
                fieldErrors[field] = fieldError[0];
                errorMsg = `${field}: ${fieldError[0]}`;
              } else if (typeof fieldError === 'string') {
                fieldErrors[field] = fieldError;
                errorMsg = `${field}: ${fieldError}`;
              }
            }
          });
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      console.error('Final error message:', errorMsg);
      console.error('All field errors:', fieldErrors);
      
      addNotification({
        icon: <Icon name="bell" />,
        title: t('userManagement.errorSavingUser'),
        sub: errorMsg,
      });
      
      setFormErrors({ submit: errorMsg, ...fieldErrors });
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderRoleSpecificFields() {
    if (!selectedRole) {
      return (
        <div className="create-role-placeholder">
          {t('userManagement.chooseRoleFirst')}
        </div>
      );
    }

    const normalizedRole = selectedRole.toLowerCase();

    if (normalizedRole === 'teacher') {
      return (
        <>
          <label className="create-field">
            <span className="create-field-label">{t('userManagement.department')}</span>
            <input
              type="text"
              name="department"
              className={getFieldClass('department')}
              placeholder={t('userManagement.departmentPlaceholder')}
              value={formValues.department}
              onChange={handleFieldChange}
              aria-invalid={Boolean(formErrors.department)}
            />
            {renderFieldError('department')}
          </label>
        </>
      );
    }

    if (normalizedRole === 'scolarite') {
      return (
        <div className="create-role-placeholder">
          {t('userManagement.noAdditionalScolarite')}
        </div>
      );
    }

    if (normalizedRole === 'admin') {
      return (
        <div className="create-role-placeholder">
          {t('userManagement.noAdditionalAdmin')}
        </div>
      );
    }

    return (
      <>
        <label className="create-field">
          <span className="create-field-label">{t('userManagement.registrationNumber')}</span>
          <input
            type="text"
            name="registrationNumber"
            className={getFieldClass('registrationNumber')}
            placeholder={t('userManagement.registrationPlaceholder')}
            value={formValues.registrationNumber}
            onChange={handleFieldChange}
            aria-invalid={Boolean(formErrors.registrationNumber)}
          />
          {renderFieldError('registrationNumber')}
        </label>
        <label className="create-field">
          <span className="create-field-label">{t('userManagement.promotionYear')}</span>
          <select
            name="promotion"
            className={getFieldClass('promotion', 'create-input create-select')}
            value={formValues.promotion}
            onChange={handleFieldChange}
            aria-invalid={Boolean(formErrors.promotion)}
          >
            <option value="">{t('userManagement.selectPromotionYear')}</option>
            {promotionOptions.map((promotion) => (
              <option key={promotion} value={promotion}>
                {promotion}
              </option>
            ))}
          </select>
          {renderFieldError('promotion')}
        </label>
        <label className="create-field">
          <span className="create-field-label">{t('userManagement.specialty')}</span>
          <select
            name="specialty"
            className={getFieldClass('specialty', 'create-input create-select')}
            value={formValues.specialty}
            onChange={handleFieldChange}
            disabled={!studentHasSpecialty(formValues.promotion)}
            aria-invalid={Boolean(formErrors.specialty)}
          >
            <option value="">
              {studentHasSpecialty(formValues.promotion)
                ? t('userManagement.selectSpecialty')
                : t('userManagement.noSpecialtyBefore2cs')}
            </option>
            {studentSpecialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
          {renderFieldError('specialty')}
        </label>
      </>
    );
  }

  if (viewMode === 'edit' && editingUser) {
    return (
      <UserEditPage
        user={editingUser}
        roleOptions={roleOptions}
        promotionOptions={promotionOptions}
        studentSpecialties={studentSpecialties}
        selectedRole={selectedRole}
        formValues={formValues}
        formErrors={formErrors}
        isSubmitting={isSubmitting}
        onBack={handleCloseFormView}
        onRoleChange={handleRoleChange}
        onFieldChange={handleFieldChange}
        onSubmit={handleSubmitForm}
        onDelete={
          roleIs(editingUser, 'student')
            ? async () => {
                await handleDeleteUser(editingUser);
                handleCloseFormView();
              }
            : undefined
        }
        onProfilePictureChange={handleProfilePictureChange}
        studentHasSpecialty={studentHasSpecialty}
      />
    );
  }

  if (viewMode === 'create') {
    return (
      <>
        <section className="create-topbar">
          <div className="create-topbar-copy">
            <button
              type="button"
              className="create-back-btn"
              onClick={handleCloseFormView}
              aria-label={t('userManagement.backToUsersManagement')}
            >
              <Icon name="back" />
            </button>
            <div>
              <h1 className="create-title">{formTitle}</h1>
              <p className="create-breadcrumb">{formBreadcrumb}</p>
            </div>
          </div>

          <div className="create-topbar-tools">
            <button type="button" className="create-tool-btn" aria-label={t('userManagement.notifications')}>
              <Icon name="bell" />
            </button>
            <span className="create-admin-pill">AD</span>
          </div>
        </section>

        <div className="page-body create-page-body">
          <section className="create-progress">
            <div className="create-progress-copy">
              <p className="create-progress-label">{t('userManagement.setupProgress')}</p>
              <p className="create-progress-step">{progressStep}</p>
            </div>
            <span className="create-progress-value">{setupProgress}%</span>
          </section>
          <div className="create-progress-track">
            <span
              className="create-progress-bar"
              style={{ width: `${setupProgress}%` }}
            />
          </div>

          <section className="create-card">
            <div className="create-card-header">
              <h2 className="create-card-title">{t('userManagement.userRole')}</h2>
              <p className="create-card-subtitle">{roleSubtitle}</p>
            </div>

            <div className="create-role-grid">
              {visibleRoleOptions.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  className={`create-role-card ${selectedRole === role.id ? 'create-role-card--active' : ''}`}
                  onClick={() => {
                    if (!lockCreateRole) {
                      handleRoleChange(role.id);
                    }
                  }}
                  aria-pressed={selectedRole === role.id}
                >
                  <span className="create-role-icon"><Icon name={role.icon} /></span>
                  <span className="create-role-label">{t(`roles.${role.id.toUpperCase()}`)}</span>
                  {selectedRole === role.id && (
                    <span className="create-role-check"><Icon name="check" /></span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="create-card">
            <div className="create-card-header">
              <h2 className="create-card-title">{t('userManagement.personalAccountTitle')}</h2>
              <p className="create-card-subtitle">{t('userManagement.personalAccountSubtitle')}</p>
            </div>

            <div className="create-form-grid">
              <label className="create-field">
                <span className="create-field-label">{t('userManagement.firstName')}</span>
                <input
                  type="text"
                  name="firstName"
                  className={getFieldClass('firstName')}
                  placeholder={t('userManagement.firstName')}
                  value={formValues.firstName}
                  onChange={handleFieldChange}
                  aria-invalid={Boolean(formErrors.firstName)}
                />
                {renderFieldError('firstName')}
              </label>

              <label className="create-field">
                <span className="create-field-label">{t('userManagement.lastName')}</span>
                <input
                  type="text"
                  name="lastName"
                  className={getFieldClass('lastName')}
                  placeholder={t('userManagement.lastName')}
                  value={formValues.lastName}
                  onChange={handleFieldChange}
                  aria-invalid={Boolean(formErrors.lastName)}
                />
                {renderFieldError('lastName')}
              </label>

              {!isEditing && (
                <label className="create-field">
                  <span className="create-field-label">{t('userManagement.temporaryPassword')}</span>
                  <span className="create-input-shell">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className={getFieldClass('password')}
                      placeholder="********"
                      value={formValues.password}
                      onChange={handleFieldChange}
                      aria-invalid={Boolean(formErrors.password)}
                    />
                    <button
                      type="button"
                      className="create-input-toggle"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? t('userManagement.hidePassword') : t('userManagement.showPassword')}
                    >
                      <Icon name="eye" />
                    </button>
                  </span>
                  {renderFieldError('password')}
                </label>
              )}

              <label className="create-field">
                <span className="create-field-label">{t('userManagement.phoneNumber')}</span>
                <input
                  type="text"
                  name="phone"
                  className={getFieldClass('phone')}
                  placeholder="0XXXXXXXXX or +213XXXXXXXXX"
                  value={formValues.phone}
                  onChange={handleFieldChange}
                  aria-invalid={Boolean(formErrors.phone)}
                />
                {renderFieldError('phone')}
              </label>
            </div>
          </section>

          <section className="create-card">
            <div className="create-card-header create-card-header--split">
              <div>
                <h2 className="create-card-title">{roleSectionMeta.title}</h2>
                <p className="create-card-subtitle">{roleSectionMeta.subtitle}</p>
              </div>
              <span className="create-role-badge">{roleSectionMeta.badge}</span>
            </div>

            <div className="create-form-grid create-form-grid--details">
              {renderRoleSpecificFields()}
            </div>
          </section>

          <div className="create-actions">
            <button
              type="button"
              className="create-cancel-btn"
              onClick={handleCloseFormView}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="create-submit-btn"
              onClick={handleSubmitForm}
              disabled={!canSubmitForm}
            >
              {isSubmitting ? t('common.saving') : submitLabel}
              <span className="users-btn-icon">
                <Icon name={isSubmitting ? 'spinner' : (isEditing ? 'check' : 'plus')} />
              </span>
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <section className="users-topbar">
        <div className="users-topbar-copy">
          <h1 className="users-title">{t('userManagement.pageTitle')}</h1>
          <p className="users-subtitle">{t('userManagement.pageSubtitle')}</p>
        </div>
        <div className="users-topbar-actions">
          <button
            type="button"
            className="users-btn users-btn--secondary"
            onClick={() => exportUsersToCsv(filteredUsers)}
          >
            <span className="users-btn-icon"><Icon name="export" /></span>
            {t('userManagement.exportList')}
          </button>
          <button
            type="button"
            className="users-btn users-btn--primary"
            onClick={handleOpenCreateView}
          >
            <span className="users-btn-icon"><Icon name="plus" /></span>
            {t('userManagement.addNewUser')}
          </button>
        </div>
      </section>

      <div className="page-body users-page-body">
        <section className="users-search-panel">
          <label className="users-search" htmlFor="user-directory-search">
            <span className="users-search-icon"><Icon name="search" /></span>
            <input
              id="user-directory-search"
              type="text"
              className="users-search-input"
              placeholder={t('userManagement.searchPlaceholder')}
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <span className="users-search-shortcut">CTRL K</span>
          </label>
        </section>

        <section className="users-card">
          <div className="users-table-scroll">
            <table className="users-table">
              <thead>
                <tr>
                  <th>{t('userManagement.userInfo')}</th>
                  <th>{t('userManagement.idNumber')}</th>
                  <th>{t('userManagement.role')}</th>
                  <th>{t('userManagement.department')}</th>
                  <th>{t('userManagement.status')}</th>
                  <th>{t('userManagement.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td className="users-empty" colSpan={6}>
                      {emptyUsersMessage}
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="users-identity">
                          <span className={`users-avatar users-avatar--${getAvatarTone(user)}`}>
                            {user.profilePicture ? (
                              <img
                                src={user.profilePicture.startsWith('/') ? `http://127.0.0.1:8000${user.profilePicture}` : user.profilePicture}
                                alt={user.name}
                                className="users-avatar-image"
                              />
                            ) : (
                              user.initials
                            )}
                          </span>
                          <div className="users-identity-copy">
                            <span className="users-name">{user.name}</span>
                            <span className="users-email">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="users-id-number">{user.idNumber}</td>
                      <td>
                        <span className={`users-role users-role--${user.role}`}>
                          {formatLabel(user.role, t)}
                        </span>
                      </td>
                      <td className="users-department">{user.department || '-'}</td>
                      <td>
                        <span className={`users-status users-status--${user.accountStatus}`}>
                          <span className="users-status-dot" />
                          {formatLabel(user.accountStatus, t)}
                        </span>
                      </td>
                      <td>
                        <div className="users-row-actions">
                          <button
                            type="button"
                            className="users-icon-btn"
                            aria-label={`${t('userManagement.editUser')} ${user.name}`}
                            onClick={() => handleOpenEditView(user)}
                          >
                            <Icon name="edit" />
                          </button>
                          <button
                            type="button"
                            className="users-icon-btn users-icon-btn--danger"
                            aria-label={`${t('userManagement.deleteUser')} ${user.name}`}
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Icon name="trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="users-card-footer">
            <p className="users-results">
              {t('userManagement.showing')} <strong>{rangeStart}-{rangeEnd}</strong> {t('userManagement.of')} <strong>{filteredUsers.length}</strong> {t('userManagement.users')}
            </p>

            <div className="users-pagination">
              <button
                type="button"
                className="users-page-btn"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                aria-label={t('common.previousPage')}
              >
                <Icon name="back" />
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`users-page-btn ${page === currentPage ? 'users-page-btn--active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className="users-page-btn"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                aria-label={t('common.nextPage')}
              >
                <Icon name="next" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}


