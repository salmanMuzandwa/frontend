// src/components/DashboardRouter.js

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import TresorierDashboard from '../pages/TresorierDashboard';
import MembreDashboard from '../pages/MembreDashboard';
import AdminDashboard from '../pages/AdminDashboard';

const DashboardRouter = () => {
    const { user } = useAuth();

    // Router selon le rôle de l'utilisateur
    switch (user?.role) {
        case 'tresorier':
            return <TresorierDashboard />;
        case 'membre':
            return <MembreDashboard />;
        case 'secretaire':
            return <AdminDashboard />; // Pour l'instant, utilise le dashboard admin
        case 'admin':
        default:
            return <AdminDashboard />;
    }
};

export default DashboardRouter;
