// src/components/ProtectedRoute.js

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ requiredPermission, children }) => {
    const { isAuthenticated, loading, hasPermission } = useAuth();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
        // Redirection vers le dashboard si l'utilisateur est connecté mais n'a pas la permission
        return <Navigate to="/dashboard" replace />;
    }

    // If children were passed directly (pattern used in App.js), render them.
    // Otherwise use <Outlet /> for nested routes.
    return children ? children : <Outlet />;
};

export default ProtectedRoute;
