// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
// import AdminDashboard from './pages/AdminDashboard'; // Utilisé dynamiquement
// import TresorierDashboard from './pages/TresorierDashboard'; // Utilisé dynamiquement
// import MembreDashboard from './pages/MembreDashboard'; // Utilisé dynamiquement
import Membres from './pages/Membres';
import AjouterMembre from './pages/AjouterMembre';
import VoirMembre from './pages/VoirMembre';
import ModifierMembre from './pages/ModifierMembre';
import RegistrationRequests from './pages/RegistrationRequests';
import Contributions from './pages/Contributions';
import VoirContribution from './pages/VoirContribution';
import EditContribution from './pages/EditContribution';
import Presences from './pages/Presences';
import AjouterPresence from './pages/AjouterPresence';
import Activites from './pages/Activites';
import Documents from './pages/Documents';
import Rapports from './pages/Rapports';
import CasSociaux from './pages/CasSociaux';
import Profil from './pages/Profil';
import ChangePassword from './pages/ChangePassword';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Debug API context
import api from './api/axiosConfig';
console.log("VERSION DU CODE: 2.1 - BASE URL API:", api.defaults.baseURL);

function App() {
    return (
        <Router>
            <Routes>
                {/* Route de connexion - Non Protégée */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/" element={<Navigate replace to="/dashboard" />} />

                {/* Routes Protégées (Nécessite connexion) */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<Layout />}>
                        {/* Pages protégées avec permission */}
                        <Route path="/dashboard" element={<ProtectedRoute requiredPermission="dashboard"><Dashboard /></ProtectedRoute>} />
                        <Route path="/membres" element={<ProtectedRoute requiredPermission="membres"><Membres /></ProtectedRoute>} />
                        <Route path="/membres/ajouter" element={<ProtectedRoute requiredPermission="membres"><AjouterMembre /></ProtectedRoute>} />
                        <Route path="/membres/:id" element={<ProtectedRoute requiredPermission="membres"><VoirMembre /></ProtectedRoute>} />
                        <Route path="/membres/:id/modifier" element={<ProtectedRoute requiredPermission="membres"><ModifierMembre /></ProtectedRoute>} />
                        <Route path="/registration-requests" element={<ProtectedRoute requiredPermission="membres"><RegistrationRequests /></ProtectedRoute>} />
                        <Route path="/contributions" element={<ProtectedRoute requiredPermission="contributions"><Contributions /></ProtectedRoute>} />
                        <Route path="/contributions/:id" element={<ProtectedRoute requiredPermission="contributions"><VoirContribution /></ProtectedRoute>} />
                        <Route path="/contributions/edit/:id" element={<ProtectedRoute requiredPermission="contributions"><EditContribution /></ProtectedRoute>} />
                        <Route path="/presences" element={<ProtectedRoute requiredPermission="presences"><Presences /></ProtectedRoute>} />
                        <Route path="/presences/ajouter" element={<ProtectedRoute requiredPermission="presences"><AjouterPresence /></ProtectedRoute>} />
                        <Route path="/presences/:id/modifier" element={<ProtectedRoute requiredPermission="presences"><AjouterPresence /></ProtectedRoute>} />
                        <Route path="/activites" element={<ProtectedRoute requiredPermission="activites"><Activites /></ProtectedRoute>} />
                        <Route path="/documents" element={<ProtectedRoute requiredPermission="documents"><Documents /></ProtectedRoute>} />
                        <Route path="/rapports" element={<ProtectedRoute requiredPermission="rapports"><Rapports /></ProtectedRoute>} />
                        <Route path="/cas-sociaux" element={<ProtectedRoute requiredPermission="cas_sociaux"><CasSociaux /></ProtectedRoute>} />
                        <Route path="/profil" element={<ProtectedRoute requiredPermission="profil"><Profil /></ProtectedRoute>} />
                        <Route path="/change-password" element={<ProtectedRoute requiredPermission="profil"><ChangePassword /></ProtectedRoute>} />
                    </Route>
                </Route>

                {/* Route 404/Catch-all */}
                <Route path="*" element={<Navigate replace to="/dashboard" />} />
            </Routes>
        </Router>
    );
}

export default App;

