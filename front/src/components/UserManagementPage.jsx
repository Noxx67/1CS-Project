import { useEffect, useState } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { useStudents } from '../context/StudentsContext';
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
  fullName: '',
  email: '',
  password: '',
  phone: '',
  registrationNumber: '',
  promotion: '',
  specialty: '',
  department: '',
  employeeId: '',
  officeName: '',
  serviceUnit: '',
  accessLevel: '',
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
  if (!role) {
    return {
      title: 'Account Details',
      subtitle: 'Choose a role to unlock the fields below',
      badge: 'Role Required',
    };
  }

  if (role === 'teacher') {
    return {
      title: 'Teaching Details',
      subtitle: 'Specific fields for the Teacher role',
      badge: 'Teacher Active',
    };
  }

  if (role === 'scolarite') {
    return {
      title: 'School Office Details',
      subtitle: 'Specific fields for the Scolarite role',
      badge: 'Scolarite Active',
    };
  }

  if (role === 'admin') {
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
  if (!role) {
    return 0;
  }

  const completedCommonFields = countCompletedValues([
    values.fullName,
    values.email,
    values.password,
    values.phone,
  ]);

  if (role === 'student') {
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
      values.employeeId,
      values.department,
      values.officeName,
    ])) * 10);
  }

  if (role === 'scolarite') {
    return Math.min(100, 30 + (completedCommonFields + countCompletedValues([
      values.serviceUnit,
      values.department,
      values.accessLevel,
    ])) * 10);
  }

  if (role === 'admin') {
    return Math.min(100, 30 + (completedCommonFields + countCompletedValues([
      values.employeeId,
      values.accessLevel,
      values.department,
    ])) * 10);
  }

  return Math.min(100, 30 + completedCommonFields * 10);
}

function getEmailError(value) {
  const trimmedValue = String(value || '').trim();

  if (!trimmedValue) {
    return '';
  }

  if (!ESI_SBA_EMAIL_REGEX.test(trimmedValue)) {
    return 'Email address must end with @esi-sba.dz.';
  }

  return '';
}

function getPasswordError(value, isEditing) {
  const trimmedValue = String(value || '').trim();

  if (!trimmedValue) {
    return '';
  }

  if (trimmedValue.length < 6) {
    return 'Temporary password must be at least 6 characters.';
  }

  return '';
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

function getFieldError(name, value, isEditing) {
  if (name === 'email') {
    return getEmailError(value);
  }

  if (name === 'password') {
    return getPasswordError(value, isEditing);
  }

  if (name === 'phone') {
    return getPhoneError(value);
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
    fullName: 'Full name',
    email: 'Email address',
    password: 'Temporary password',
    phone: 'Phone number',
    registrationNumber: 'Registration number',
    promotion: 'Promotion / year',
    specialty: 'Specialty',
    department: 'Department',
    employeeId: 'Employee ID',
    officeName: 'Office / Grade',
    serviceUnit: 'Service unit',
    accessLevel: 'Access level',
  };
}

function getIdFieldName(role) {
  if (role === 'student') {
    return 'registrationNumber';
  }

  if (role === 'scolarite') {
    return 'serviceUnit';
  }

  if (role === 'teacher' || role === 'admin') {
    return 'employeeId';
  }

  return '';
}

function getFormIdValue(role, values) {
  if (role === 'student') {
    return values.registrationNumber;
  }

  if (role === 'scolarite') {
    return values.serviceUnit;
  }

  if (role === 'teacher' || role === 'admin') {
    return values.employeeId;
  }

  return '';
}

function getRequiredFieldNames(role, values, isEditing) {
  const commonFields = isEditing
    ? ['fullName', 'email', 'phone']
    : ['fullName', 'email', 'password', 'phone'];

  if (role === 'student') {
    return [
      ...commonFields,
      'registrationNumber',
      'promotion',
      ...(studentHasSpecialty(values.promotion) ? ['specialty'] : []),
    ];
  }

  if (role === 'teacher') {
    return [...commonFields, 'employeeId', 'department', 'officeName'];
  }

  if (role === 'scolarite') {
    return [...commonFields, 'serviceUnit', 'department', 'accessLevel'];
  }

  if (role === 'admin') {
    return [...commonFields, 'employeeId', 'accessLevel', 'department'];
  }

  return commonFields;
}

function validateFormFields(role, values, isEditing, users = [], editingUser = null) {
  const errors = {};
  const requiredFieldLabels = getRequiredFieldLabels();
  const requiredFieldNames = getRequiredFieldNames(role, values, isEditing);

  requiredFieldNames.forEach((fieldName) => {
    if (!isCompletedValue(values[fieldName])) {
      errors[fieldName] = `${requiredFieldLabels[fieldName]} is required.`;
    }
  });

  const emailError = getEmailError(values.email);
  const passwordError = getPasswordError(values.password, isEditing);
  const phoneError = getPhoneError(values.phone);

  if (emailError) {
    errors.email = emailError;
  }

  if (passwordError) {
    errors.password = passwordError;
  }

  if (phoneError) {
    errors.phone = phoneError;
  }

  const idFieldName = getIdFieldName(role);
  const normalizedIdValue = normalizeIdValue(getFormIdValue(role, values));

  if (idFieldName && normalizedIdValue) {
    const duplicateUser = users.find(
      (user) =>
        user.id !== editingUser?.id
        && normalizeIdValue(user.idNumber) === normalizedIdValue
    );

    if (duplicateUser) {
      errors[idFieldName] = `${requiredFieldLabels[idFieldName]} is already used by another user.`;
    }
  }

  return errors;
}

function buildFormValuesFromUser(user) {
  if (user.role === 'student') {
    const promotion = getStudentPromotion(user);

    return {
      ...initialFormState,
      fullName: user.name || '',
      email: user.email || '',
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
    fullName: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    department: user.department || '',
    employeeId: user.employeeId || user.idNumber || '',
    officeName: user.officeName || '',
    serviceUnit: user.serviceUnit || user.idNumber || '',
    accessLevel: user.accessLevel || 'Level 1',
  };
}

export default function UserManagementPage({ initialSearchQuery = '', onInitialSearchApplied }) {
  const { students, deleteStudent, addStudent, updateStudent } = useStudents();
  const { directoryUsers, setDirectoryUsers } = useDirectoryUsers();
  const { addNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('directory');
  const [selectedRole, setSelectedRole] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formValues, setFormValues] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const rowsPerPage = 10;
  const isEditing = editingUser !== null;

  const studentUsers = students.map((student) => ({
    ...student,
    source: 'student',
    role: student.role ?? 'student',
    department: student.department ?? student.specialization ?? '',
    accountStatus: student.accountStatus ?? 'active',
  }));

  const allUsers = studentUsers.length > 0
    ? [studentUsers[0], ...directoryUsers, ...studentUsers.slice(1)]
    : [...directoryUsers];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredUsers = allUsers.filter((user) => {
    if (!normalizedQuery) {
      return true;
    }

    return [
      user.name,
      user.email,
      user.idNumber,
      user.department,
      user.role,
      user.accountStatus,
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
  const canSubmitForm = Boolean(selectedRole);
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
    if (user.source === 'student') {
      deleteStudent(user.id);
      addNotification({
        icon: '\u{1F5D1}',
        title: 'User removed from directory',
        sub: `${user.name} - Student`,
        action: buildUserManagementSearchAction(user.name),
      });
      return;
    }

    setDirectoryUsers((current) => current.filter((entry) => entry.id !== user.id));
    addNotification({
      icon: '\u{1F5D1}',
      title: 'User removed from directory',
      sub: `${user.name} - ${formatLabel(user.role)}`,
      action: buildUserManagementSearchAction(user.name),
    });
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
    setSelectedRole(user.role);
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
      setFormErrors(validateFormFields(selectedRole, nextFormValues, isEditing, allUsers, editingUser));
    }
  }

  function handleRoleChange(role) {
    const nextFormValues = role === 'student'
      ? {
          ...formValues,
          registrationNumber:
            formValues.registrationNumber
            || formValues.employeeId
            || formValues.serviceUnit
            || editingUser?.idNumber
            || '',
        }
      : {
          ...formValues,
          employeeId:
            formValues.employeeId
            || formValues.registrationNumber
            || editingUser?.idNumber
            || '',
          serviceUnit:
            formValues.serviceUnit
            || formValues.employeeId
            || formValues.registrationNumber
            || editingUser?.idNumber
            || '',
        };

    setSelectedRole(role);
    setFormValues(nextFormValues);
    setFormErrors({});
  }

  function handleSubmitForm() {
    if (!selectedRole) {
      return;
    }

    const accountErrors = validateFormFields(selectedRole, formValues, isEditing, allUsers, editingUser);

    if (Object.keys(accountErrors).length > 0) {
      setFormErrors(accountErrors);
      return;
    }

    const safeName = formValues.fullName.trim() || `${formatLabel(selectedRole)} User`;
    const safeEmail = formValues.email.trim() || buildGeneratedEmail(safeName);

    if (selectedRole === 'student') {
      const hasSpecialty = studentHasSpecialty(formValues.promotion);
      const specialty = hasSpecialty ? normalizeSpecialty(formValues.specialty.trim()) : '';
      const department = hasSpecialty
        ? specialty
        : formValues.promotion.trim();

      const studentPayload = {
        name: safeName,
        email: safeEmail,
        idNumber: formValues.registrationNumber.trim() || editingUser?.idNumber || '',
        department,
        specialization: department,
        promotion: formValues.promotion,
        module: formValues.promotion,
        phone: formValues.phone.trim(),
        accountStatus: editingUser?.accountStatus || 'active',
        avatarTone: editingUser?.avatarTone || 'blue',
      };

      if (isEditing) {
        if (editingUser.source !== 'student') {
          setDirectoryUsers((current) => current.filter((user) => user.id !== editingUser.id));
          addStudent(studentPayload);
          addNotification({
            icon: '\u270E',
            title: 'User updated',
            sub: `${safeName} - Student profile updated`,
            action: buildUserManagementSearchAction(safeName),
          });
          handleCloseFormView();
          return;
        }

        updateStudent(editingUser.id, studentPayload);
        addNotification({
          icon: '\u270E',
          title: 'User updated',
          sub: `${safeName} - Student profile updated`,
          action: buildUserManagementSearchAction(safeName),
        });
        handleCloseFormView();
        return;
      }

      addStudent(studentPayload);
      addNotification({
        icon: '\u{1F465}',
        title: 'New user created',
        sub: `${safeName} - Student account added`,
        action: buildUserManagementSearchAction(safeName),
      });
      handleCloseFormView();
      return;
    }

    const department = formValues.department.trim()
      || (selectedRole === 'teacher'
        ? 'Academic Staff'
        : selectedRole === 'scolarite'
          ? 'School Office'
          : 'Administration');
    const idNumber = formValues.employeeId.trim()
      || formValues.serviceUnit.trim()
      || editingUser?.idNumber
      || `USR-${Date.now().toString().slice(-6)}`;
    const staffPayload = {
      id: editingUser?.source === 'student' ? `staff-${Date.now()}` : editingUser?.id || `staff-${Date.now()}`,
      initials: buildInitials(safeName),
      name: safeName,
      email: safeEmail,
      phone: formValues.phone.trim(),
      idNumber,
      employeeId: formValues.employeeId.trim(),
      officeName: formValues.officeName.trim(),
      serviceUnit: formValues.serviceUnit.trim(),
      accessLevel: formValues.accessLevel,
      role: selectedRole,
      department,
      accountStatus: editingUser?.accountStatus || 'active',
      avatarTone: getAvatarTone({
        role: selectedRole,
        accountStatus: editingUser?.accountStatus || 'active',
      }),
    };

    if (isEditing) {
      if (editingUser.source === 'student') {
        deleteStudent(editingUser.id);
        setDirectoryUsers((current) => [staffPayload, ...current]);
        addNotification({
          icon: '\u270E',
          title: 'User updated',
          sub: `${safeName} - ${formatLabel(selectedRole)} profile updated`,
          action: buildUserManagementSearchAction(safeName),
        });
        handleCloseFormView();
        return;
      }

      setDirectoryUsers((current) =>
        current.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                role: selectedRole,
                name: safeName,
                initials: buildInitials(safeName),
                email: safeEmail,
                phone: formValues.phone.trim(),
                department,
                idNumber,
                employeeId: formValues.employeeId.trim(),
                officeName: formValues.officeName.trim(),
                serviceUnit: formValues.serviceUnit.trim(),
                accessLevel: formValues.accessLevel,
                avatarTone: getAvatarTone({ role: selectedRole, accountStatus: user.accountStatus }),
              }
            : user
        )
      );
      addNotification({
        icon: '\u270E',
        title: 'User updated',
        sub: `${safeName} - ${formatLabel(selectedRole)} profile updated`,
        action: buildUserManagementSearchAction(safeName),
      });
      handleCloseFormView();
      return;
    }

    setDirectoryUsers((current) => [
      {
        ...staffPayload,
        accountStatus: 'active',
        avatarTone: getAvatarTone({ role: selectedRole, accountStatus: 'active' }),
      },
      ...current,
    ]);
    addNotification({
      icon: '\u{1F465}',
      title: 'New user created',
      sub: `${safeName} - ${formatLabel(selectedRole)} account added`,
      action: buildUserManagementSearchAction(safeName),
    });
    handleCloseFormView();
  }

  function renderRoleSpecificFields() {
    if (!selectedRole) {
      return (
        <div className="create-role-placeholder">
          Choose a user role first, then the matching fields will appear here.
        </div>
      );
    }

    if (selectedRole === 'teacher') {
      return (
        <>
              <label className="create-field">
                <span className="create-field-label">Employee ID</span>
                <input
                  type="text"
                  name="employeeId"
                  className={getFieldClass('employeeId')}
                  placeholder="T-992384"
                  value={formValues.employeeId}
                  onChange={handleFieldChange}
                  aria-invalid={Boolean(formErrors.employeeId)}
                />
                {renderFieldError('employeeId')}
              </label>
              <label className="create-field">
                <span className="create-field-label">Department</span>
                <input
                  type="text"
                  name="department"
                  className={getFieldClass('department')}
                  placeholder="Artificial Intelligence"
                  value={formValues.department}
                  onChange={handleFieldChange}
                  aria-invalid={Boolean(formErrors.department)}
                />
                {renderFieldError('department')}
              </label>
              <label className="create-field">
                <span className="create-field-label">Office / Grade</span>
                <input
                  type="text"
                  name="officeName"
                  className={getFieldClass('officeName')}
                  placeholder="B-204"
                  value={formValues.officeName}
                  onChange={handleFieldChange}
                  aria-invalid={Boolean(formErrors.officeName)}
                />
                {renderFieldError('officeName')}
              </label>
        </>
      );
    }

    if (selectedRole === 'scolarite') {
      return (
        <>
              <label className="create-field">
                <span className="create-field-label">Service Unit</span>
                <input
                  type="text"
                  name="serviceUnit"
                  className={getFieldClass('serviceUnit')}
                  placeholder="SC-Desk-02"
                  value={formValues.serviceUnit}
                  onChange={handleFieldChange}
                  aria-invalid={Boolean(formErrors.serviceUnit)}
                />
                {renderFieldError('serviceUnit')}
              </label>
              <label className="create-field">
                <span className="create-field-label">Department</span>
                <input
                  type="text"
                  name="department"
                  className={getFieldClass('department')}
                  placeholder="School Office"
                  value={formValues.department}
                  onChange={handleFieldChange}
                  aria-invalid={Boolean(formErrors.department)}
                />
                {renderFieldError('department')}
              </label>
              <label className="create-field">
                <span className="create-field-label">Access Level</span>
                <select
                  name="accessLevel"
                  className={getFieldClass('accessLevel', 'create-input create-select')}
                  value={formValues.accessLevel}
                  onChange={handleFieldChange}
                  aria-invalid={Boolean(formErrors.accessLevel)}
                >
                  <option value="">Select access level</option>
                  <option>Level 1</option>
                  <option>Level 2</option>
                  <option>Level 3</option>
                </select>
                {renderFieldError('accessLevel')}
              </label>
        </>
      );
    }

    if (selectedRole === 'admin') {
      return (
        <>
              <label className="create-field">
                <span className="create-field-label">Admin ID</span>
                <input
                  type="text"
                  name="employeeId"
                  className={getFieldClass('employeeId')}
                  placeholder="ADM-0045"
                  value={formValues.employeeId}
                  onChange={handleFieldChange}
                  aria-invalid={Boolean(formErrors.employeeId)}
                />
                {renderFieldError('employeeId')}
              </label>
              <label className="create-field">
                <span className="create-field-label">Access Level</span>
                <select
                  name="accessLevel"
                  className={getFieldClass('accessLevel', 'create-input create-select')}
                  value={formValues.accessLevel}
                  onChange={handleFieldChange}
                  aria-invalid={Boolean(formErrors.accessLevel)}
                >
                  <option value="">Select access level</option>
                  <option>Level 1</option>
                  <option>Level 2</option>
                  <option>Level 3</option>
                </select>
                {renderFieldError('accessLevel')}
              </label>
              <label className="create-field">
                <span className="create-field-label">Department</span>
                <input
                  type="text"
                  name="department"
                  className={getFieldClass('department')}
                  placeholder="Administration"
                  value={formValues.department}
                  onChange={handleFieldChange}
                  aria-invalid={Boolean(formErrors.department)}
                />
                {renderFieldError('department')}
              </label>
        </>
      );
    }

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
                <span className="create-field-label">Full Name</span>
                <input
                  type="text"
                  name="fullName"
                  className={getFieldClass('fullName')}
                  placeholder="e.g. Jean Dupont"
                  value={formValues.fullName}
                  onChange={handleFieldChange}
                  aria-invalid={Boolean(formErrors.fullName)}
                />
                {renderFieldError('fullName')}
              </label>

              <label className="create-field">
                <span className="create-field-label">Email Address</span>
                <input
                  type="email"
                  name="email"
                  className={getFieldClass('email')}
                  placeholder="email@esi-sba.dz"
                  value={formValues.email}
                  onChange={handleFieldChange}
                  aria-invalid={Boolean(formErrors.email)}
                />
                {renderFieldError('email')}
              </label>

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
            >
              Cancel
            </button>
            <button
              type="button"
              className="create-submit-btn"
              onClick={handleSubmitForm}
              disabled={!canSubmitForm}
            >
              {submitLabel}
              <span className="users-btn-icon">{isEditing ? CHECK_ICON : '+'}</span>
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
