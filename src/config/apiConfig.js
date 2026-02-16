// Configuration des URLs pour l'hébergement sur InfinityFree
// Ce fichier gère les URLs de l'API et du frontend en fonction de l'environnement

const getApiUrl = () => {
    // Utilise uniquement le chemin relatif
    return '/api';
};

const getFrontendUrl = () => {
    // Utilise uniquement le chemin relatif
    return '/';
};

const getUploadsUrl = () => {
    // Utilise uniquement le chemin relatif
    return '/uploads';
};

// Configuration exportée
export const API_CONFIG = {
    API_URL: getApiUrl(),
    FRONTEND_URL: getFrontendUrl(),
    UPLOADS_URL: getUploadsUrl(),
    ENVIRONMENT: process.env.NODE_ENV || 'development'
};

// Fonctions utilitaires
export const getFullApiUrl = (endpoint) => {
    const baseUrl = API_CONFIG.API_URL;
    return endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
};

export const getFullUploadsUrl = (filename) => {
    const baseUrl = API_CONFIG.UPLOADS_URL;
    return filename ? `${baseUrl}/${filename}` : baseUrl;
};

export default API_CONFIG;
