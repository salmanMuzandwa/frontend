import axios from 'axios';

// Utiliser REACT_APP_API_URL si disponible, sinon fallback sur la logique existante
let API_URL = process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

// Robustesse : s'assurer que l'URL se termine par /api si c'est une URL absolue
if (API_URL && API_URL.startsWith('http') && !API_URL.includes('/api')) {
    API_URL = API_URL.endsWith('/') ? `${API_URL}api` : `${API_URL}/api`;
}

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000, // Augmenté pour Render (cold starts)
    headers: {
        'Content-Type': 'application/json'
    }
});

console.log('Axios Initialized with baseURL:', API_URL);
if (!process.env.REACT_APP_API_URL && process.env.NODE_ENV === 'production') {
    console.warn('ATTENTION: REACT_APP_API_URL n\'est pas défini. L\'API risque de ne pas être jointe.');
}

// INTERCEPTEUR DE REQUÊTE : Injecter le token automatiquement
api.interceptors.request.use(
    (config) => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const { token } = JSON.parse(storedUser);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                    console.log('Token injecté automatiquement par l\'intercepteur');
                } else {
                    console.warn('Token trouvé mais vide dans localStorage');
                }
            } catch (error) {
                console.error('Erreur parsing localStorage user:', error);
            }
        } else {
            console.warn('Aucun utilisateur trouvé dans localStorage');
        }
        return config;
    },
    (error) => {
        console.error('Erreur dans l\'intercepteur de requête:', error);
        return Promise.reject(error);
    }
);

// INTERCEPTEUR DE RÉPONSE : Gérer les erreurs globalement
api.interceptors.response.use(
    (response) => {
        console.log(`Réponse réussie: ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
    },
    (error) => {
        // Gestion des erreurs HTTP
        if (error.response) {
            const { status, data } = error.response;

            switch (status) {
                case 401:
                    console.warn('Session expirée ou Token invalide (401)');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    break;
                case 403:
                    console.error('Accès interdit (403):', data?.message || 'Permission refusée');
                    break;
                case 404:
                    console.error('Ressource non trouvée (404):', error.config.url);
                    break;
                case 500:
                    console.error('Erreur serveur (500):', data?.message || 'Erreur interne');
                    break;
                default:
                    console.error(`Erreur HTTP ${status}:`, data?.message || 'Erreur inconnue');
            }
        } else if (error.request) {
            console.error('Erreur réseau - pas de réponse du serveur:', error.message);
        } else {
            console.error('Erreur de configuration de la requête:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;
