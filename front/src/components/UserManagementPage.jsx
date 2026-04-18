import { useEffect, useState } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { useUsers } from '../context/UsersContext';
import { useDirectoryUsers } from '../context/DirectoryUsersContext';
import './UserManagementPage.css';

const SEARCH_ICON = '\u{1F50D}';
const EXPORT_ICON = '\u2193';
const EDIT_ICON = '\u270E';
const DELETE_ICON = '\u{1F5D1}';
const PREV_ICON = '\u2039';
const NEXT_ICON = '\u203A';
const BACK_ICON = '\u2190';
const BELL_ICON = '\u{1F514}';
const CHECK_ICON = '\u2713';
const EYE_ICON = '\u{1F441}';

const roleOptions = [
  { id: 'student', label: 'Student', icon: '\u{1F464}' },
  { id: 'teacher', label: 'Teacher', icon: '\u{1F393}' },
  { id: 'scolarite', label: 'Scolarite', icon: '\u{1F4DA}' },
  { id: 'admin', label: 'Admin', icon: '\u2699' },
];

const studentSpecialties = ['ISI', 'SIW', 'IASD', 'CyberSecurity'];
const promotionOptions = ['1CPI', '2CPI', '1CS', '2CS', '3CS'];
const ESI_SBA_EMAIL_REGEX = /^[^@\s]+@esi-sba\.dz$/i;
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
};

function exportUsersToCsv(users) {
  const headers = ['Name', 'Email', 'ID Number', 'Role', 'Department', 'Status'];
  const rows = users.map((user) => [
    user.name,
    user.email,
    user.idNumber,
    formatLabel(user.role),
    user.department,
    formatLabel(user.accountStatus),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'user_directory.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function formatLabel(value) {
  const labels = {
    student: 'Student',
    teacher: 'Teacher',
    scolarite: 'Scolarite',
    admin: 'Admin',
    active: 'Active',
    suspended: 'Suspended',
  };

  return labels[value] || value || '';
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

function buildInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return (parts[0] || 'NU').slice(0, 2).toUpperCase();
}

function buildGeneratedEmail(name) {
  return `${name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')}@esi-sba.dz`;
}

function getRoleSectionMeta(role) {
  const normalizedRole = String(role || '').toLowerCase();

  if (!normalizedRole) {
    return {
      title: 'Account Details',
      subtitle: 'Choose a role to unlock the fields below',
      badge: 'Role Required',
    };
  }

  if (normalizedRole === 'teacher') {
    return {
      title: 'Teaching Details',
      subtitle: 'Specific fields for the Teacher role',
      badge: 'Teacher Active',
    };
  }

  if (normalizedRole === 'scolarite') {
    return {
      title: 'School Office Details',
      subtitle: 'Specific fields for the Scolarite role',
      badge: 'Scolarite Active',
    };
  }

  if (normalizedRole === 'admin') {
    return {
      title: 'Administrative Details',
      subtitle: 'Specific fields for the Admin role',
      badge: 'Admin Active',
    };
  }

  return {
    title: 'Academic Details',
    subtitle: 'Specific fields for the Student role',
    badge: 'Student Active',
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

  if (promotionOptions.includes(user.module)) {
    return user.module;
  }

  if (normalizeSpecialty(user.specialization || user.department)) {
    return '2CS';
  }

  return '1CPI';
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

function getPhoneError(value) {
  const trimmedValue = String(value || '').trim();

  if (!trimmedValue) {
    return '';
  }

  if (!ALGERIAN_PHONE_REGEX.test(trimmedValue)) {
    return 'Phone number must use 0XXXXXXXXX or +213XXXXXXXXX.';
  }

  return '';
}

function getPasswordError(value, isEditing) {
  const trimmedValue = String(value || '').trim();

  if (!trimmedValue && !isEditing) {
    return 'Temporary password is required for new users.';
  }

  if (trimmedValue && trimmedValue.length < 6) {
    return 'Temporary password must be at least 6 characters.';
  }

  return '';
}

function normalizeIdValue(value) {
  return String(value || '').trim().toUpperCase();
}

function buildUserManagementSearchAction(userName) {
  return {
    type: 'open-user-management-search',
    userName,
  };
}

function getRequiredFieldLabels() {
  return {
    firstName: 'First name',
    lastName: 'Last name',
    password: 'Temporary password',
    phone: 'Phone number',
    registrationNumber: 'Registration number',
    promotion: 'Promotion / year',
    specialty: 'Specialty',
    department: 'Department',
  };
}

function getIdFieldName(role) {
  const normalizedRole = String(role || '').toLowerCase();

  if (normalizedRole === 'student') {
    return 'registrationNumber';
  }

  if (normalizedRole === 'scolarite') {
    return 'serviceUnit';
  }

  if (normalizedRole === 'teacher' || normalizedRole === 'admin') {
    return 'employeeId';
  }

  return '';
}

function getFormIdValue(role, values) {
  const normalizedRole = String(role || '').toLowerCase();

  if (normalizedRole === 'student') {
    return values.registrationNumber;
  }

  if (normalizedRole === 'scolarite') {
    return values.serviceUnit;
  }

  if (normalizedRole === 'teacher' || normalizedRole === 'admin') {
    return values.employeeId;
  }

  return '';
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

function validateFormFields(role, values, isEditing, users = [], editingUser = null) {
  const errors = {};
  const requiredFieldLabels = getRequiredFieldLabels();
  const requiredFieldNames = getRequiredFieldNames(role, values, isEditing);

  console.log('Validation starting for role:', role);
  console.log('Required field names:', requiredFieldNames);
  console.log('Current form values:', values);

  requiredFieldNames.forEach((fieldName) => {
    const fieldValue = values[fieldName];
    const isCompleted = isCompletedValue(fieldValue);
    console.log(`Checking field "${fieldName}": value="${fieldValue}", isCompleted=${isCompleted}`);
    
    if (!isCompleted) {
      errors[fieldName] = `${requiredFieldLabels[fieldName]} is required.`;
      console.error(`VALIDATION ERROR - ${fieldName}: ${requiredFieldLabels[fieldName]} is required.`);
    }
  });

  const passwordError = getPasswordError(values.password, isEditing);
  const phoneError = getPhoneError(values.phone);

  if (passwordError) {
    errors.password = passwordError;
  }

  if (phoneError) {
    errors.phone = phoneError;
  }

  const normalizedRole = String(role || '').toLowerCase();

  // For students, check for duplicate registration number
  if (normalizedRole === 'student' && isCompletedValue(values.registrationNumber)) {
    const duplicateUser = users.find(
      (user) =>
        user.id !== editingUser?.id
        && String(user.role || '').toLowerCase() === 'student'
        && normalizeIdValue(user.idNumber || '') === normalizeIdValue(values.registrationNumber)
    );

    if (duplicateUser) {
      errors.registrationNumber = 'Registration number is already used by another student.';
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
        ? normalizeSpecialty(user.specialization || user.department)
        : '',
    };
  }

  return {
    ...initialFormState,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    department: user.department || '',
  };
}

export default function UserManagementPage({ initialSearchQuery = '', onInitialSearchApplied }) {
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

  // Fetch all users on component mount
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
    ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + rowsPerPage);
  const rangeStart = filteredUsers.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = filteredUsers.length === 0 ? 0 : startIndex + paginatedUsers.length;
  const roleSectionMeta = getRoleSectionMeta(selectedRole);
  const formTitle = isEditing ? 'Edit User' : 'Add New User';
  const formBreadcrumb = isEditing
    ? 'Users Management > Modify User'
    : 'Users Management > Create User';
  const progressStep = isEditing
    ? 'Step 1: Update Account Information'
    : selectedRole
      ? 'Step 2: Complete Account Information'
      : 'Step 1: Account Role Selection';
  const roleSubtitle = isEditing
    ? 'You can update the account type if this user needs a different role.'
    : 'Select the type of account you want to create';
  const submitLabel = isEditing ? 'Save Changes' : 'Create Account';
  const setupProgress = getSetupProgress(selectedRole, formValues);
  const canSubmitForm = Boolean(selectedRole) && !isSubmitting && !isLoading;
  const emptyUsersMessage = normalizedQuery
    ? 'No users match your search.'
    : 'No users added yet.';

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

  function handleSearchChange(event) {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  }

  function handleDeleteUser(user) {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      deleteUser(user.id)
        .then(() => {
          addNotification({
            icon: '\u{1F5D1}',
            title: 'User removed',
            sub: `${user.name} - ${formatLabel(user.role)}`,
          });
        })
        .catch((err) => {
          addNotification({
            icon: '⚠️',
            title: 'Failed to delete user',
            sub: error || 'An error occurred',
          });
        });
    }
  }

  function handleOpenCreateView() {
    setEditingUser(null);
    setSelectedRole('');
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
    setViewMode('create');
  }

  function handleCloseFormView() {
    setViewMode('directory');
    setEditingUser(null);
    setSelectedRole('');
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
      setFormErrors(validateFormFields(selectedRole, nextFormValues, isEditing, users, editingUser));
    }
  }

  function handleRoleChange(role) {
    const nextFormValues = { ...formValues };
    setSelectedRole(role);
    setFormValues(nextFormValues);
    setFormErrors({});
  }

  async function handleSubmitForm() {
    if (!selectedRole) {
      console.warn('No role selected');
      return;
    }

    console.log('Form submission started for role:', selectedRole);
    console.log('Current form values at submission:', formValues);
    
    const accountErrors = validateFormFields(selectedRole, formValues, isEditing, users, editingUser);

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
      };

      // Add password only for new users
      if (!isEditing) {
        userData.password = formValues.password.trim();
      }

      const normalizedRole = String(selectedRole || '').toLowerCase();

      // Add role-specific fields - MUST MATCH BACKEND SCHEMA
      if (normalizedRole === 'student') {
        // Backend expects: registration_number, year, speciality
        userData.registration_number = formValues.registrationNumber.trim();
        userData.year = 1; // TODO: Map from promotion to year (1CPI/2CPI=1, 1CS/2CS/3CS=2-4)
        
        // Speciality is required by backend for all students
        if (studentHasSpecialty(formValues.promotion)) {
          userData.speciality = formValues.specialty.trim();
        } else {
          userData.speciality = 'N/A'; // Default value for promotions that don't have specialties
        }
        
        console.log('Student fields:', {
          registration_number: userData.registration_number,
          year: userData.year,
          speciality: userData.speciality || 'Not required for this promotion'
        });
      }

      if (normalizedRole === 'teacher') {
        // Backend expects: field, department
        userData.field = formValues.department.trim();
        userData.department = formValues.department.trim();
      }

      console.log('User data being submitted:', userData);

      if (isEditing) {
        console.log('Updating existing user:', editingUser.id);
        await updateUser(editingUser.id, userData);
        addNotification({
          icon: '\u270E',
          title: 'User updated successfully',
          sub: `${userData.firstName} ${userData.lastName}`,
        });
      } else {
        console.log('Creating new user');
        await addUser(userData);
        addNotification({
          icon: '\u{1F465}',
          title: 'New user created successfully',
          sub: `${userData.firstName} ${userData.lastName}`,
        });
      }

      handleCloseFormView();
    } catch (err) {
      console.error('Form submission error - Full error:', err);
      console.error('Form submission error - Response data:', err.response?.data);
      
      // Handle different error response formats
      let errorMsg = 'Failed to save user';
      let fieldErrors = {};
      
      if (err.response?.data) {
        const responseData = err.response.data;
        
        // Check if response is HTML (Django debug error page)
        if (typeof responseData === 'string' && responseData.includes('IntegrityError')) {
          console.log('Detected Django IntegrityError HTML response');
          // Extract error message from HTML
          const integrityErrorMatch = responseData.match(/<pre class="exception_value">([^<]+)<\/pre>/);
          if (integrityErrorMatch) {
            const errorText = integrityErrorMatch[1];
            console.error('Extracted IntegrityError:', errorText);
            
            // Parse specific integrity errors
            if (errorText.includes('Duplicate entry') && errorText.includes('registration_number')) {
              const regNumberMatch = errorText.match(/Duplicate entry '([^']+)' for key 'accounts_studentprofile\.registration_number'/);
              if (regNumberMatch) {
                errorMsg = `Registration number '${regNumberMatch[1]}' is already in use.`;
                fieldErrors.registrationNumber = 'This registration number is already taken.';
              } else {
                errorMsg = 'Registration number is already in use.';
                fieldErrors.registrationNumber = 'This registration number is already taken.';
              }
            } else {
              errorMsg = 'Database integrity error occurred.';
            }
          } else {
            errorMsg = 'Database error occurred while saving.';
          }
        }
        // Check for error message at top level
        else if (responseData.error) {
          errorMsg = responseData.error;
        }
        
        // Check for field-level errors in 'details' object (Django custom format)
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
        // Check for field-level errors at top level (standard DRF format)
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
        icon: '⚠️',
        title: 'Error saving user',
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
          Choose a user role first, then the matching fields will appear here.
        </div>
      );
    }

    const normalizedRole = selectedRole.toLowerCase();

    if (normalizedRole === 'teacher') {
      return (
        <>
          <label className="create-field">
            <span className="create-field-label">Department</span>
            <input
              type="text"
              name="department"
              className={getFieldClass('department')}
              placeholder="Mathematics, English, etc."
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
          No additional fields required for Scolarite role.
        </div>
      );
    }

    if (normalizedRole === 'admin') {
      return (
        <div className="create-role-placeholder">
          No additional fields required for Admin role.
        </div>
      );
    }

    // Student role
    return (
      <>
        <label className="create-field">
          <span className="create-field-label">Registration Number</span>
          <input
            type="text"
            name="registrationNumber"
            className={getFieldClass('registrationNumber')}
            placeholder="2024/0001"
            value={formValues.registrationNumber}
            onChange={handleFieldChange}
            aria-invalid={Boolean(formErrors.registrationNumber)}
          />
          {renderFieldError('registrationNumber')}
        </label>
        <label className="create-field">
          <span className="create-field-label">Promotion / Year</span>
          <select
            name="promotion"
            className={getFieldClass('promotion', 'create-input create-select')}
            value={formValues.promotion}
            onChange={handleFieldChange}
            aria-invalid={Boolean(formErrors.promotion)}
          >
            <option value="">Select promotion / year</option>
            {promotionOptions.map((promotion) => (
              <option key={promotion} value={promotion}>
                {promotion}
              </option>
            ))}
          </select>
          {renderFieldError('promotion')}
        </label>
        <label className="create-field">
          <span className="create-field-label">Specialty</span>
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
                ? 'Select a specialty'
                : 'No specialty before 2CS'}
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

  if (viewMode === 'create') {
    return (
      <>
        <section className="create-topbar">
          <div className="create-topbar-copy">
            <button
              type="button"
              className="create-back-btn"
              onClick={handleCloseFormView}
              aria-label="Back to Users Management"
            >
              {BACK_ICON}
            </button>
            <div>
              <h1 className="create-title">{formTitle}</h1>
              <p className="create-breadcrumb">{formBreadcrumb}</p>
            </div>
          </div>

          <div className="create-topbar-tools">
            <button type="button" className="create-tool-btn" aria-label="Notifications">
              {BELL_ICON}
            </button>
            <span className="create-admin-pill">AD</span>
          </div>
        </section>

        <div className="page-body create-page-body">
          <section className="create-progress">
            <div className="create-progress-copy">
              <p className="create-progress-label">Setup Progress</p>
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
              <h2 className="create-card-title">User Role</h2>
              <p className="create-card-subtitle">{roleSubtitle}</p>
            </div>

            <div className="create-role-grid">
              {roleOptions.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  className={`create-role-card ${selectedRole === role.id ? 'create-role-card--active' : ''}`}
                  onClick={() => handleRoleChange(role.id)}
                  aria-pressed={selectedRole === role.id}
                >
                  <span className="create-role-icon">{role.icon}</span>
                  <span className="create-role-label">{role.label}</span>
                  {selectedRole === role.id && (
                    <span className="create-role-check">{CHECK_ICON}</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="create-card">
            <div className="create-card-header">
              <h2 className="create-card-title">Personal &amp; Account Information</h2>
              <p className="create-card-subtitle">General contact details and authentication</p>
            </div>

            <div className="create-form-grid">
              <label className="create-field">
                <span className="create-field-label">First Name</span>
                <input
                  type="text"
                  name="firstName"
                  className={getFieldClass('firstName')}
                  placeholder="e.g. Jean"
                  value={formValues.firstName}
                  onChange={handleFieldChange}
                  aria-invalid={Boolean(formErrors.firstName)}
                />
                {renderFieldError('firstName')}
              </label>

              <label className="create-field">
                <span className="create-field-label">Last Name</span>
                <input
                  type="text"
                  name="lastName"
                  className={getFieldClass('lastName')}
                  placeholder="e.g. Dupont"
                  value={formValues.lastName}
                  onChange={handleFieldChange}
                  aria-invalid={Boolean(formErrors.lastName)}
                />
                {renderFieldError('lastName')}
              </label>

              {!isEditing && (
                <label className="create-field">
                  <span className="create-field-label">Temporary Password</span>
                  <span className="create-input-shell">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className={getFieldClass('password')}
                      placeholder="temporaryPass123"
                      value={formValues.password}
                      onChange={handleFieldChange}
                      aria-invalid={Boolean(formErrors.password)}
                    />
                    <button
                      type="button"
                      className="create-input-toggle"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {EYE_ICON}
                    </button>
                  </span>
                  {renderFieldError('password')}
                </label>
              )}

              <label className="create-field">
                <span className="create-field-label">Phone Number</span>
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
              Cancel
            </button>
            <button
              type="button"
              className="create-submit-btn"
              onClick={handleSubmitForm}
              disabled={!canSubmitForm}
            >
              {isSubmitting ? 'Saving...' : submitLabel}
              <span className="users-btn-icon">{isSubmitting ? '⏳' : (isEditing ? CHECK_ICON : '+')}</span>
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
          <h1 className="users-title">User Management</h1>
          <p className="users-subtitle">DIRECTORY CONTROL PANEL</p>
        </div>
        <div className="users-topbar-actions">
          <button
            type="button"
            className="users-btn users-btn--secondary"
            onClick={() => exportUsersToCsv(filteredUsers)}
          >
            <span className="users-btn-icon">{EXPORT_ICON}</span>
            Export List
          </button>
          <button
            type="button"
            className="users-btn users-btn--primary"
            onClick={handleOpenCreateView}
          >
            <span className="users-btn-icon">+</span>
            Add New User
          </button>
        </div>
      </section>

      <div className="page-body users-page-body">
        <section className="users-search-panel">
          <label className="users-search" htmlFor="user-directory-search">
            <span className="users-search-icon">{SEARCH_ICON}</span>
            <input
              id="user-directory-search"
              type="text"
              className="users-search-input"
              placeholder="Search by name, email, department or ID number..."
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
                  <th>User Info</th>
                  <th>ID Number</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
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
                            {user.initials}
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
                          {formatLabel(user.role)}
                        </span>
                      </td>
                      <td className="users-department">{user.department || '-'}</td>
                      <td>
                        <span className={`users-status users-status--${user.accountStatus}`}>
                          <span className="users-status-dot" />
                          {formatLabel(user.accountStatus)}
                        </span>
                      </td>
                      <td>
                        <div className="users-row-actions">
                          <button
                            type="button"
                            className="users-icon-btn"
                            aria-label={`Edit ${user.name}`}
                            onClick={() => handleOpenEditView(user)}
                          >
                            {EDIT_ICON}
                          </button>
                          <button
                            type="button"
                            className="users-icon-btn users-icon-btn--danger"
                            aria-label={`Delete ${user.name}`}
                            onClick={() => handleDeleteUser(user)}
                          >
                            {DELETE_ICON}
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
              Showing <strong>{rangeStart}-{rangeEnd}</strong> of <strong>{filteredUsers.length}</strong> users
            </p>

            <div className="users-pagination">
              <button
                type="button"
                className="users-page-btn"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                {PREV_ICON}
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
                aria-label="Next page"
              >
                {NEXT_ICON}
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
