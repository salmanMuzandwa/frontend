import axios from 'axios';
import { getApiUrl } from '../utils/urlHelper';

export const API_BASE_URL = getApiUrl('');

// Création d'une instance axios avec une configuration de base
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 secondes de timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
    (config) => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const { token } = JSON.parse(storedUser);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (e) {
                // ignore malformed storage
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs globales
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Erreurs 401 - Non autorisé
            if (error.response.status === 401) {
                // Rediriger vers la page de connexion
                if (window.location.pathname !== '/login') {
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            }

            // Autres erreurs
            return Promise.reject({
                message: error.response.data?.message || 'Une erreur est survenue',
                status: error.response.status,
                data: error.response.data,
            });
        } else if (error.request) {
            // La requête a été faite mais aucune réponse n'a été reçue
            return Promise.reject({
                message: 'Le serveur ne répond pas. Veuillez vérifier votre connexion internet.',
                isNetworkError: true,
            });
        } else {
            // Une erreur s'est produite lors de la configuration de la requête
            return Promise.reject({
                message: 'Erreur lors de la configuration de la requête',
                error: error.message,
            });
        }
    }
);

export default api;
