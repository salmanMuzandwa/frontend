import api from './config';

const membresApi = {
    // Récupérer tous les membres
    getAll: async () => {
        try {
            const response = await api.get('/members');
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des membres:', error);
            throw error;
        }
    },

    // Récupérer un membre par son ID
    getById: async (id) => {
        try {
            const response = await api.get(`/members/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération du membre ${id}:`, error);
            throw error;
        }
    },

    // Créer un nouveau membre
    create: async (membreData) => {
        try {
            console.log('📤 Envoi des données du membre:', membreData);
            const response = await api.post('/members', membreData);

            if (!response.data) {
                throw new Error('Réponse vide du serveur');
            }

            console.log('✅ Réponse de création de membre:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la création du membre:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            // Propager une erreur plus détaillée
            const apiError = new Error(error.response?.data?.message || 'Erreur lors de la création du membre');
            apiError.status = error.response?.status || 500;
            apiError.data = error.response?.data;
            throw apiError;
        }
    },

    // Mettre à jour un membre existant
    update: async (id, membreData) => {
        try {
            const response = await api.put(`/members/${id}`, membreData);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la mise à jour du membre ${id}:`, error);
            throw error;
        }
    },

    // Supprimer un membre
    delete: async (id) => {
        try {
            const response = await api.delete(`/members/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la suppression du membre ${id}:`, error);
            throw error;
        }
    },

    // Rechercher des membres
    search: async (query) => {
        try {
            const response = await api.get('/members/search', { params: { q: query } });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la recherche des membres:', error);
            throw error;
        }
    }
};

export default membresApi;
