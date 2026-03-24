import api from '../api/axios.js';

export const usersService = {
    
    // ============================================================
    // CREATE USER (Admin only)
    // POST /api/accounts/users/
    // ============================================================
    async addUser(userData) {
        try {
            const payloadData = {
                email: userData.email,
                first_name: userData.firstName,
                last_name: userData.lastName,
                phone: userData.phone || '',
                role: userData.role,
            };

            // Include password only if provided (new users)
            if (userData.password) {
                payloadData.password = userData.password;
            }

            // Add student-specific fields if role is student
            if (userData.role === 'STUDENT') {
                payloadData.registration_number = userData.registration_number || '';
                payloadData.year = userData.year || 1;
                payloadData.speciality = userData.speciality || '';
            }

            // Add teacher-specific fields if role is teacher
            if (userData.role === 'TEACHER') {
                payloadData.field = userData.field || '';
                payloadData.department = userData.department || '';
            }

            // Debug: Add student-specific fields logging
            if (userData.role === 'STUDENT') {
                console.log('Student fields being sent:', {
                    registration_number: payloadData.registration_number,
                    year: payloadData.year,
                    speciality: payloadData.speciality
                });
            }

            console.log('Service: Sending user data to backend:', payloadData);

            const response = await api.post('accounts/users/', payloadData);

            console.log('Service: Backend response:', response);

            if (response.status === 201) {
                return response.data;
            }

            throw new Error(`Unexpected response status: ${response.status}`);

        } catch (error) {
            console.error("Add User Error - Full error object:", error);
            console.error("Add User Error - Response data:", error.response?.data);
            console.error("Add User Error - Response status:", error.response?.status);
            console.error("Add User Error - Response headers:", error.response?.headers);
            console.error("Add User Error - Message:", error.message);
            
            // Log all validation errors from backend
            if (error.response?.data && typeof error.response.data === 'object') {
                console.error("Backend validation errors:", JSON.stringify(error.response.data, null, 2));
            }
            
            throw error;
        }
    },

    // ============================================================
    // GET ALL USERS (Admin only)
    // GET /api/accounts/users/
    // Optional filters: role, is_active
    // ============================================================
    async getAllUsers(filters = {}) {
        try {
            const params = new URLSearchParams();
            
            // Apply optional filters
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
                return response.data; // { count, users }
            }

            throw new Error(`Unexpected response status: ${response.status}`);

        } catch (error) {
            console.error("Get All Users Error:", error.response?.data || error.message);
            throw error;
        }
    },

    // ============================================================
    // GET ONE USER (Admin only)
    // GET /api/accounts/users/<id>/
    // ============================================================
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

    // ============================================================
    // UPDATE USER (Admin only)
    // PUT /api/accounts/users/<id>/
    // ============================================================
    async updateUser(userId, userData) {
        try {
            const payloadData = {
                email: userData.email,
                first_name: userData.firstName,
                last_name: userData.lastName,
                phone: userData.phone || '',
                role: userData.role,
            };

            // Add student-specific fields if role is student
            if (userData.role === 'STUDENT') {
                payloadData.registration_number = userData.registration_number || '';
                payloadData.year = userData.year || 1;
                payloadData.speciality = userData.speciality || '';
            }

            // Add teacher-specific fields if role is teacher
            if (userData.role === 'TEACHER') {
                payloadData.field = userData.field || '';
                payloadData.department = userData.department || '';
            }

            console.log('Service: Updating user', userId, 'with data:', payloadData);

            const response = await api.put(`accounts/users/${userId}/`, payloadData);

            console.log('Service: Backend response:', response);

            if (response.status === 200) {
                return response.data;
            }

            throw new Error(`Unexpected response status: ${response.status}`);

        } catch (error) {
            console.error("Update User Error:", error.response?.data || error.message);
            throw error;
        }
    },

    // ============================================================
    // DELETE USER (Soft delete - Admin only)
    // DELETE /api/accounts/users/<id>/
    // ============================================================
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

    // ============================================================
    // RESET PASSWORD (Admin only)
    // POST /api/accounts/users/<id>/reset-password/
    // ============================================================
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

    // ============================================================
    // STUDENT PROFILE MANAGEMENT (Future implementation)
    // POST/GET/PUT /api/accounts/students/
    // ============================================================
    async createStudentProfile(studentData) {
        // TODO: Implement student profile creation
        // Expected endpoint structure: POST /api/accounts/students/
        // Expected fields: user_id, registration_number, year, speciality
    },

    async getStudentProfile(studentId) {
        // TODO: Implement get student profile
        // Expected endpoint: GET /api/accounts/students/<id>/
    },

    async updateStudentProfile(studentId, profileData) {
        // TODO: Implement update student profile
        // Expected endpoint: PUT /api/accounts/students/<id>/
    },

    // ============================================================
    // TEACHER PROFILE MANAGEMENT (Future implementation)
    // POST/GET/PUT /api/accounts/teachers/
    // ============================================================
    async createTeacherProfile(teacherData) {
        // TODO: Implement teacher profile creation
        // Expected endpoint structure: POST /api/accounts/teachers/
        // Expected fields: user_id, field, department
    },

    async getTeacherProfile(teacherId) {
        // TODO: Implement get teacher profile
        // Expected endpoint: GET /api/accounts/teachers/<id>/
    },

    async updateTeacherProfile(teacherId, profileData) {
        // TODO: Implement update teacher profile
        // Expected endpoint: PUT /api/accounts/teachers/<id>/
    },

    // ============================================================
    // SCOLARITE PROFILE MANAGEMENT (Future implementation)
    // POST/GET/PUT /api/accounts/scolarite/
    // Note: SCOLARITE is similar to other roles but has specific responsibilities
    // ============================================================
    async createScolariteProfile(scolariteData) {
        // TODO: Implement scolarite profile creation
        // Expected endpoint structure: POST /api/accounts/scolarite/
        // Define specific fields for scolarite role
    },

    async getScolariteProfile(scolariteId) {
        // TODO: Implement get scolarite profile
        // Expected endpoint: GET /api/accounts/scolarite/<id>/
    },

    async updateScolariteProfile(scolariteId, profileData) {
        // TODO: Implement update scolarite profile
        // Expected endpoint: PUT /api/accounts/scolarite/<id>/
    },
};
