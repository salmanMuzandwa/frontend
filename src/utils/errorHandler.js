// Gestion centralisée des erreurs avec notifications utilisateur
export const handleApiError = (error, context = '') => {
    let message = 'Une erreur est survenue';

    if (error.response) {
        // Erreur serveur avec réponse
        const { status, data } = error.response;

        switch (status) {
            case 400:
                message = data?.message || 'Requête invalide';
                console.error(`Erreur 400 - ${context}:`, data);
                break;
            case 401:
                message = 'Session expirée. Veuillez vous reconnecter';
                console.warn(`Erreur 401 - ${context}: Session expirée`);
                break;
            case 403:
                message = 'Accès refusé';
                console.error(`Erreur 403 - ${context}:`, data?.message);
                break;
            case 404:
                message = 'Ressource non trouvée';
                console.error(`Erreur 404 - ${context}:`, error.config.url);
                break;
            case 500:
                message = 'Erreur serveur. Veuillez réessayer plus tard';
                console.error(`Erreur 500 - ${context}:`, data?.message);
                break;
            default:
                message = data?.message || `Erreur HTTP ${status}`;
                console.error(`Erreur ${status} - ${context}:`, data);
        }
    } else if (error.request) {
        // Erreur réseau
        message = 'Problème de connexion. Vérifiez votre réseau';
        console.error(`Erreur réseau - ${context}:`, error.message);
    } else {
        // Erreur de configuration
        message = error.message || 'Erreur inconnue';
        console.error(`Erreur configuration - ${context}:`, error.message);
    }

    return message;
};

// Fonction pour afficher les erreurs (à adapter avec votre système de notification)
export const showErrorNotification = (message) => {
    // Pour l'instant, utiliser console.error
    // TODO: Intégrer avec react-toastify ou autre système de notification
    console.error('Notification erreur:', message);

    // Option: Afficher dans une alerte simple pour le développement
    if (process.env.NODE_ENV === 'development') {
        // alert(message); // Décommenter pour le débogage
    }
};

export const showSuccessNotification = (message) => {
    console.log('Notification succès:', message);
    // TODO: Intégrer avec react-toastify ou autre système de notification
};

export const showInfoNotification = (message) => {
    console.info('Notification info:', message);
    // TODO: Intégrer avec react-toastify ou autre système de notification
};
