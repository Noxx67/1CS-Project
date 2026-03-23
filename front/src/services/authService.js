const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'user_info';

export const authService = {
    setSession(data) {
        localStorage.setItem(TOKEN_KEY, data.access);
        localStorage.setItem(REFRESH_KEY, data.refresh);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        console.log("user on auth", data.user)
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