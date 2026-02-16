// src/utils/urlHelper.js

// URL de base de l'API
export const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// URL de base du serveur (pour les images et autres ressources)
export const SERVER_BASE_URL = (API_BASE_URL).replace(/\/api$/, '');

// Helper pour construire les URLs API
export const getApiUrl = (endpoint) => {
    // Si API_BASE_URL est une URL absolue, on construit l'URL complète
    if (API_BASE_URL.startsWith('http')) {
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const base = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
        return `${base}${normalizedEndpoint}`;
    }

    // Sinon on utilise le chemin relatif
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API_BASE_URL}${normalizedEndpoint}`;
};

export const getProfilePhotoUrl = (photoUrl) => {
    if (!photoUrl) return undefined;

    // Si c'est déjà une URL absolue ou du Base64, on la retourne telle quelle
    if (photoUrl.startsWith('http') || photoUrl.startsWith('data:')) {
        return photoUrl;
    }

    // En production, utiliser le chemin relatif
    if (window.location.hostname !== 'localhost') {
        const normalizedPath = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
        return normalizedPath.startsWith('/uploads') ? normalizedPath : `/uploads${normalizedPath}`;
    }

    // En développement, construire l'URL à partir de l'URL de base du serveur
    const normalizedPath = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
    return `${SERVER_BASE_URL}${normalizedPath}`;
};
