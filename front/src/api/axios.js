import axios from 'axios';
import { authService } from '../services/authService.js';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/', // Your Django URL
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// 🛠️ The Interceptor: Automatically adds the token to every request
api.interceptors.request.use((config) => {
    const token = authService.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;