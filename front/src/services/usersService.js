import api from '../api/axios.js';

export const usersService = {
    async addUser(userData) {
        try {
            const payloadData = {
                email: userData.email,
                first_name: userData.firstName,
                last_name: userData.lastName,
                phone: userData.phone || '',
                role: userData.role,
            };

            if (userData.password) {
                payloadData.password = userData.password;
            }

            if (userData.role === 'STUDENT') {
                payloadData.registration_number = userData.registration_number || '';
                payloadData.year = userData.year || 1;
                payloadData.speciality = userData.speciality || '';
                payloadData.group = userData.group || '';
            }

            if (userData.role === 'TEACHER') {
                payloadData.field = userData.field || '';
                payloadData.department = userData.department || '';
            }

            const response = await api.post('accounts/users/', payloadData);

            if (response.status === 201) {
                return response.data;
            }

            throw new Error(`Unexpected response status: ${response.status}`);
        } catch (error) {
            console.error("Add User Error:", error.response?.data || error.message);
            throw error;
        }
    },

    async getAllUsers(filters = {}) {
        try {
            const params = new URLSearchParams();

            if (filters.role) {
                params.append('role', filters.role);
            }
            if (filters.is_active !== undefined) {
                params.append('is_active', filters.is_active);
            }

            const queryString = params.toString();
            const endpoint = queryString
                ? `accounts/users/?${queryString}`
                : 'accounts/users/';

            const response = await api.get(endpoint);

            if (response.status === 200) {
                return response.data;
            }

            throw new Error(`Unexpected response status: ${response.status}`);
        } catch (error) {
            console.error("Get All Users Error:", error.response?.data || error.message);
            throw error;
        }
    },

    async getOneUser(userId) {
        try {
            const response = await api.get(`accounts/users/${userId}/`);

            if (response.status === 200) {
                return response.data;
            }

            throw new Error(`Unexpected response status: ${response.status}`);
        } catch (error) {
            console.error("Get One User Error:", error.response?.data || error.message);
            throw error;
        }
    },

    async updateUser(userId, userData) {
        try {
            const payloadData = {
                email: userData.email,
                first_name: userData.firstName,
                last_name: userData.lastName,
                phone: userData.phone || '',
                role: userData.role,
            };

            if (userData.role === 'STUDENT') {
                payloadData.registration_number = userData.registration_number || '';
                payloadData.year = userData.year || 1;
                payloadData.speciality = userData.speciality || '';
                payloadData.group = userData.group || '';
            }

            if (userData.role === 'TEACHER') {
                payloadData.field = userData.field || '';
                payloadData.department = userData.department || '';
            }

            const response = await api.put(`accounts/users/${userId}/`, payloadData);

            if (response.status === 200) {
                return response.data;
            }

            throw new Error(`Unexpected response status: ${response.status}`);
        } catch (error) {
            console.error("Update User Error:", error.response?.data || error.message);
            throw error;
        }
    },

    async deleteUser(userId) {
        try {
            const response = await api.delete(`accounts/users/${userId}/`);

            if (response.status === 200) {
                return response.data;
            }

            throw new Error(`Unexpected response status: ${response.status}`);
        } catch (error) {
            console.error("Delete User Error:", error.response?.data || error.message);
            throw error;
        }
    },

    async resetUserPassword(userId, newPassword) {
        try {
            const response = await api.post(
                `accounts/users/${userId}/reset-password/`,
                { new_password: newPassword }
            );

            if (response.status === 200) {
                return response.data;
            }

            throw new Error(`Unexpected response status: ${response.status}`);
        } catch (error) {
            console.error("Reset User Password Error:", error.response?.data || error.message);
            throw error;
        }
    },

    async createStudentProfile(studentData) {
    },

    async getStudentProfile(studentId) {
    },

    async updateStudentProfile(studentId, profileData) {
    },

    async createTeacherProfile(teacherData) {
    },

    async getTeacherProfile(teacherId) {
    },

    async updateTeacherProfile(teacherId, profileData) {
    },

    async createScolariteProfile(scolariteData) {
    },

    async getScolariteProfile(scolariteId) {
    },

    async updateScolariteProfile(scolariteId, profileData) {
    },
};
