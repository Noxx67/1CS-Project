import { createContext, useContext, useState } from 'react';
import { usersService } from '../services/usersService.js';
import { TEMP_FRONTEND_PREVIEW_MODE } from '../config/previewMode.js';
import { getLocalUserData, mergeLocalUserData } from '../services/userLocalDataService.js';
import { getPreviewUsers, savePreviewUsers } from '../services/previewUsersService.js';
import { buildUserEmail } from '../utils/userEmail.js';
import { getStudentDepartmentFromPromotion } from '../utils/studentDepartment.js';

const UsersContext = createContext(null);
const PROMOTION_TO_YEAR = {
  '1CPI': 1,
  '2CPI': 2,
  '1CS': 3,
  '2CS': 4,
  '3CS': 5,
};
const YEAR_TO_PROMOTION = Object.fromEntries(
  Object.entries(PROMOTION_TO_YEAR).map(([promotion, year]) => [String(year), promotion])
);

// Helper to get initials from any user name
function buildInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

function getNumericYearFromPromotion(promotion) {
  return PROMOTION_TO_YEAR[String(promotion || '').toUpperCase()] || null;
}

function getPromotionFromYear(year) {
  return YEAR_TO_PROMOTION[String(year || '')] || '';
}

function normalizeRole(role) {
  return String(role || '').toLowerCase();
}

function buildPreviewUserId() {
  return `preview-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildNormalizedPreviewUser(userId, userData, existingUser = null) {
  const firstName = userData.firstName?.trim() || existingUser?.firstName || '';
  const lastName = userData.lastName?.trim() || existingUser?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const role = normalizeRole(userData.role || existingUser?.role);
  const promotion = userData.promotion || existingUser?.promotion || getPromotionFromYear(userData.year);
  const year = getNumericYearFromPromotion(promotion) || userData.year || existingUser?.year || null;
  const studentDepartment = getStudentDepartmentFromPromotion(promotion);
  const department = role === 'student'
    ? studentDepartment
    : (
      userData.department?.trim()
      || userData.field?.trim()
      || existingUser?.department
      || ''
    );
  const specialty = userData.speciality && userData.speciality !== 'N/A'
    ? userData.speciality.trim()
    : existingUser?.specialty || '';
  const email = buildUserEmail(firstName, lastName) || userData.email || existingUser?.email || '';
  const dateJoined = existingUser?.dateJoined || existingUser?.date_joined || new Date().toISOString();
  const profilePicture = userData.avatarUrl || existingUser?.profilePicture || existingUser?.profile_picture || '';

  return {
    id: userId,
    email,
    firstName,
    lastName,
    name: fullName,
    initials: buildInitials(fullName || 'Preview User'),
    phone: userData.phone?.trim() || existingUser?.phone || '',
    role,
    accountStatus: existingUser?.accountStatus || 'active',
    idNumber: role === 'student'
      ? (userData.registration_number?.trim() || existingUser?.idNumber || '')
      : (existingUser?.idNumber || ''),
    promotion: role === 'student' ? promotion : '',
    year: role === 'student' ? year : null,
    specialty: role === 'student' ? specialty : '',
    specialization: role === 'student' ? specialty : '',
    department: role === 'student' || role === 'teacher' ? department : '',
    is_active: existingUser?.is_active ?? true,
    must_change_password: existingUser?.must_change_password ?? (role !== 'admin'),
    date_joined: dateJoined,
    dateJoined,
    last_login: existingUser?.last_login || null,
    profile_picture: profilePicture,
    profilePicture,
  };
}

function buildLocalUserDetails(userData) {
  const normalizedRole = String(userData.role || '').toUpperCase();
  const localDetails = {
    registrationNumber: '',
    promotion: '',
    specialty: '',
    department: '',
  };

  if (Object.prototype.hasOwnProperty.call(userData, 'avatarUrl')) {
    localDetails.avatarUrl = userData.avatarUrl;
  }

  if (normalizedRole === 'STUDENT') {
    localDetails.registrationNumber = userData.registration_number || '';
    localDetails.promotion = userData.promotion || getPromotionFromYear(userData.year);
    localDetails.department = getStudentDepartmentFromPromotion(localDetails.promotion);
    localDetails.specialty = userData.speciality && userData.speciality !== 'N/A'
      ? userData.speciality
      : '';
    return localDetails;
  }

  if (normalizedRole === 'TEACHER') {
    localDetails.department = userData.department || '';
  }

  return localDetails;
}

// Helper to normalize user data from backend response
function normalizeUserData(backendUser) {
  const localUserData = getLocalUserData(backendUser.id);
  const fullName = `${backendUser.first_name} ${backendUser.last_name}`.trim();
  const normalizedRole = normalizeRole(backendUser.role);
  const promotion = localUserData.promotion || getPromotionFromYear(backendUser.year);
  const studentDepartment = getStudentDepartmentFromPromotion(promotion);
  const profilePicture = localUserData.avatarUrl || backendUser.profile_picture || '';

  return {
    id: backendUser.id,
    email: backendUser.email,
    firstName: backendUser.first_name,
    lastName: backendUser.last_name,
    name: fullName,
    initials: buildInitials(fullName),
    phone: backendUser.phone || '',
    role: normalizedRole,
    accountStatus: backendUser.is_active ? 'active' : 'suspended',
    idNumber: localUserData.registrationNumber || backendUser.registration_number || '',
    promotion,
    year: getNumericYearFromPromotion(promotion) || backendUser.year || null,
    specialty: localUserData.specialty || backendUser.speciality || '',
    specialization: localUserData.specialty || backendUser.speciality || '',
    department: normalizedRole === 'student'
      ? (localUserData.department || backendUser.department || studentDepartment || '')
      : (localUserData.department || backendUser.department || backendUser.field || ''),
    is_active: backendUser.is_active,
    must_change_password: backendUser.must_change_password,
    date_joined: backendUser.date_joined,
    dateJoined: backendUser.date_joined,
    last_login: backendUser.last_login,
    profile_picture: profilePicture,
    profilePicture,
  };
}

export function UsersProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================================
  // FETCH ALL USERS
  // ============================================================
  async function fetchAllUsers(filters = {}) {
    setIsLoading(true);
    setError(null);
    try {
      if (TEMP_FRONTEND_PREVIEW_MODE) {
        const previewUsers = getPreviewUsers();
        setUsers(previewUsers);
        return previewUsers;
      }

      console.log('UsersContext: Fetching all users with filters:', filters);
      const response = await usersService.getAllUsers(filters);
      console.log('UsersContext: Response received:', response);
      console.log('UsersContext: Response.users:', response.users);
      const normalizedUsers = response.users.map(normalizeUserData);
      console.log('UsersContext: Normalized users:', normalizedUsers);
      setUsers(normalizedUsers);
      console.log('UsersContext: Users state updated, count:', normalizedUsers.length);
      return normalizedUsers;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch users';
      setError(errorMessage);
      console.error('Fetch All Users Error:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  // ============================================================
  // FETCH ONE USER (Search/Filter for a particular user)
  // ============================================================
  async function fetchOneUser(userId) {
    setIsLoading(true);
    setError(null);
    try {
      if (TEMP_FRONTEND_PREVIEW_MODE) {
        const previewUser = getPreviewUsers().find((user) => user.id === userId);
        if (!previewUser) {
          throw new Error('User not found');
        }
        return previewUser;
      }

      const response = await usersService.getOneUser(userId);
      const normalizedUser = normalizeUserData(response);
      return normalizedUser;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch user';
      setError(errorMessage);
      console.error('Fetch One User Error:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  // ============================================================
  // ADD USER (Create new user via API)
  // Email is auto-generated from first-name initials + family name
  // ============================================================
  async function addUser(userData) {
    setIsLoading(true);
    setError(null);
    try {
      if (TEMP_FRONTEND_PREVIEW_MODE) {
        const previewUser = buildNormalizedPreviewUser(buildPreviewUserId(), userData);
        const nextUsers = [previewUser, ...getPreviewUsers()];

        mergeLocalUserData(previewUser.id, buildLocalUserDetails({
          ...userData,
          email: previewUser.email,
        }));
        savePreviewUsers(nextUsers);
        setUsers(nextUsers);
        return previewUser;
      }

      const autoGeneratedEmail = buildUserEmail(userData.firstName, userData.lastName);

      console.log('Context: Creating user with email:', autoGeneratedEmail);
      console.log('Context: User data to pass to service:', userData);

      // Pass ALL userData including role-specific fields
      const response = await usersService.addUser({
        email: autoGeneratedEmail,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone || '',
        role: userData.role,
        password: userData.password, // Include password for new users
        // Include all role-specific fields
        registration_number: userData.registration_number,
        year: userData.year,
        speciality: userData.speciality,
        field: userData.field,
        department: userData.department,
      });

      console.log('Context: API response:', response);

      if (!response || !response.user) {
        throw new Error('Invalid response from server - missing user data');
      }

      mergeLocalUserData(response.user.id, buildLocalUserDetails({
        ...userData,
        email: autoGeneratedEmail,
      }));
      const normalizedUser = normalizeUserData(response.user);
      console.log('Context: Normalized user:', normalizedUser);
      
      setUsers((prev) => [normalizedUser, ...prev]);
      return normalizedUser;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create user';
      setError(errorMessage);
      console.error('Add User Error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  // ============================================================
  // UPDATE USER
  // Email is regenerated from the current first name + family name
  // ============================================================
  async function updateUser(userId, userData) {
    setIsLoading(true);
    setError(null);
    try {
      if (TEMP_FRONTEND_PREVIEW_MODE) {
        const currentUsers = getPreviewUsers();
        const existingUser = currentUsers.find((user) => user.id === userId);
        const previewUser = buildNormalizedPreviewUser(userId, userData, existingUser);
        const nextUsers = currentUsers.map((user) => (user.id === userId ? previewUser : user));

        mergeLocalUserData(userId, buildLocalUserDetails({
          ...userData,
          email: previewUser.email,
        }));
        savePreviewUsers(nextUsers);
        setUsers(nextUsers);
        return previewUser;
      }

      const generatedEmail = buildUserEmail(userData.firstName, userData.lastName);

      const response = await usersService.updateUser(userId, {
        email: generatedEmail,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone || '',
        role: userData.role,
        // Include all role-specific fields
        registration_number: userData.registration_number,
        year: userData.year,
        promotion: userData.promotion,
        speciality: userData.speciality,
        field: userData.field,
        department: userData.department,
        avatarUrl: userData.avatarUrl,
      });

      mergeLocalUserData(userId, buildLocalUserDetails({
        ...userData,
        email: generatedEmail,
      }));
      const normalizedUser = normalizeUserData(response.user);
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? normalizedUser : user))
      );
      return normalizedUser;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update user';
      setError(errorMessage);
      console.error('Update User Error:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  // ============================================================
  // DELETE USER
  // ============================================================
  async function deleteUser(userId) {
    setIsLoading(true);
    setError(null);
    try {
      if (TEMP_FRONTEND_PREVIEW_MODE) {
        const nextUsers = getPreviewUsers().filter((user) => user.id !== userId);
        savePreviewUsers(nextUsers);
        setUsers(nextUsers);
        return;
      }

      await usersService.deleteUser(userId);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to delete user';
      setError(errorMessage);
      console.error('Delete User Error:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  // ============================================================
  // RESET USER PASSWORD
  // ============================================================
  async function resetUserPassword(userId, newPassword) {
    setIsLoading(true);
    setError(null);
    try {
      if (TEMP_FRONTEND_PREVIEW_MODE) {
        return {
          message: `Preview mode: password reset simulated for ${userId}.`,
          new_password: newPassword,
        };
      }

      const response = await usersService.resetUserPassword(userId, newPassword);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to reset password';
      setError(errorMessage);
      console.error('Reset Password Error:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  const value = {
    // State
    users,
    isLoading,
    error,
    // Functions
    fetchAllUsers,
    fetchOneUser,
    addUser,
    updateUser,
    deleteUser,
    resetUserPassword,
  };

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
}
