import api from '../api/axios.js';

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'user_info';

export const authService = {

    async login(email, password) {
        try {
            const response = await api.post('accounts/login/', {
                email, 
                password
            });
            if (response.status === 200) {
                this.setSession(response.data);
            }
            return response.data;

        } catch (error) {
            console.error("Login Error:", error.response);
            throw error;
        }
    },

    setSession(data) {
        localStorage.setItem(TOKEN_KEY, data.access);
        localStorage.setItem(REFRESH_KEY, data.refresh);
        const userData = {
            ...data.user,
            must_change_password: data.must_change_password,
        };
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
    },

    async logout() {
        try{
            await api.post('accounts/logout/', {
                refresh: localStorage.getItem(REFRESH_KEY)
            });
        } catch (error) {
            console.error("Logout Error:", error.response);
        }finally{
        this.clearSession();
        }
    },

    clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(USER_KEY);
    },

    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    getUser() {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    async updateMe(userData) {
        try {
            const response = await api.patch('accounts/me/', userData);
            if (response.status === 200) {
                const currentSessionUser = this.getUser();
                this.setSession({
                    access: this.getToken(),
                    refresh: localStorage.getItem(REFRESH_KEY),
                    user: response.data.user,
                    must_change_password: currentSessionUser.must_change_password
                });
            }
            return response.data;
        } catch (error) {
            console.error("Update Me Error:", error.response);
            throw error;
        }
    },

    async updateProfilePicture(file) {
        try {
            const formData = new FormData();
            formData.append('profile_picture', file);
            const response = await api.put('accounts/me/picture/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.status === 200) {
                const currentSessionUser = this.getUser();
                const updatedUser = {
                    ...currentSessionUser,
                    profile_picture: response.data.profile_picture
                };
                localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
            }
            return response.data;
        } catch (error) {
            console.error("Update Profile Picture Error:", error.response);
            throw error;
        }
    }
};