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
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
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
    }
};