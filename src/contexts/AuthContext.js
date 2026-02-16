// src/contexts/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../api/axiosConfig';

// Configuration des permissions
const rolePermissions = {
    'admin': ['dashboard', 'charge_de_discipline', 'presences', 'activites', 'membres', 'profil', 'contributions', 'documents', 'rapports', 'cas_sociaux'],
    'tresorier': ['dashboard', 'contributions', 'cas_sociaux', 'profil'],
    'secretaire': ['membres', 'documents', 'presences', 'activites', 'profil'],
    'charge_de_discipline': ['presences', 'activites', 'profil', 'documents'],
    'membre': ['profil', 'contributions'],
    'guest': [],
};

// Création du contexte
const AuthContext = createContext({
    isAuthenticated: false,
    user: null,
    login: () => Promise.resolve(),
    logout: () => { },
    loading: true,
    hasPermission: () => false,
    token: null,
    updateUser: () => { }
});

// Hook personnalisé
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth doit être utilisé au sein d\'un AuthProvider');
    }
    return context;
};

// Provider du contexte
export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const { user, token } = JSON.parse(storedUser);
                return {
                    user,
                    token,
                    isAuthenticated: !!user,
                    loading: false
                };
            }
        } catch (error) {
            console.error('Erreur lors de la lecture du localStorage:', error);
            localStorage.removeItem('user');
        }
        return { user: null, token: null, isAuthenticated: false, loading: false };
    });

    const [loading, setLoading] = useState(authState.loading);

    useEffect(() => {
        setLoading(false);
    }, []); // Correction: dépendance vide pour exécution unique au montage

    // Fonction de connexion
    const login = async (email, password) => {
        try {
            setLoading(true);
            console.log('AuthContext - Tentative de connexion avec:', { email, password }); // Debug

            const response = await api.post('/login', { email, password });
            const { user, token } = response.data;

            console.log('AuthContext - Réponse du serveur:', response.data); // Debug

            if (!user || !token) {
                throw new Error('Données de connexion invalides');
            }

            const newAuthState = {
                user,
                token,
                isAuthenticated: true,
                loading: false
            };

            setAuthState(newAuthState);

            try {
                localStorage.setItem('user', JSON.stringify({ user, token }));
            } catch (storageError) {
                console.warn('Impossible de sauvegarder dans localStorage:', storageError);
            }

            return response.data;
        } catch (error) {
            console.error('Erreur de connexion:', error);
            logout();
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Fonction de déconnexion
    const logout = () => {
        try {
            localStorage.removeItem('user');
        } catch (error) {
            console.warn('Erreur lors du nettoyage du localStorage:', error);
        }

        setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false
        });

        setLoading(false);
    };

    // Fonction pour mettre à jour les données utilisateur
    const updateUser = (updatedUserData) => {
        try {
            const newUserState = {
                ...authState,
                user: updatedUserData
            };

            setAuthState(newUserState);

            // Mettre à jour le localStorage avec les nouvelles données utilisateur
            localStorage.setItem('user', JSON.stringify({
                user: updatedUserData,
                token: authState.token
            }));

            console.log('Utilisateur mis à jour dans le contexte et localStorage:', updatedUserData);
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        }
    };

    // Vérification des permissions
    const hasPermission = (permission) => {
        if (!authState.user || !authState.user.role) {
            return false;
        }
        const userPermissions = rolePermissions[authState.user.role] || [];
        return userPermissions.includes(permission);
    };

    const value = {
        ...authState,
        login,
        logout,
        hasPermission,
        loading,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export default AuthContext;
