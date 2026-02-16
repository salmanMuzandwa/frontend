// src/utils/axiosConfig.js
import axios from 'axios';

// Configuration d'Axios avec des limites augmentées
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '/api',
    timeout: 30000,
    maxContentLength: 50 * 1024 * 1024, // 50MB
    maxBodyLength: 50 * 1024 * 1024, // 50MB
    headers: {
        'Content-Type': 'application/json',
    }
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('user');
        if (token) {
            try {
                const { token: authToken } = JSON.parse(token);
                if (authToken) {
                    config.headers.Authorization = `Bearer ${authToken}`;
                }
            } catch (error) {
                console.warn('Erreur lecture token localStorage:', error);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expiré ou invalide
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
