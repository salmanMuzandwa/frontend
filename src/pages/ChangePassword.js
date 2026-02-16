// src/pages/ChangePassword.js

import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Box, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const ChangePassword = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { token } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Effacer les messages d'erreur quand l'utilisateur tape
        if (error) setError('');
        if (success) setSuccess('');
    };

    const validateForm = () => {
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setError('Tous les champs sont requis');
            return false;
        }

        if (formData.newPassword.length < 6) {
            setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
            return false;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Les nouveaux mots de passe ne correspondent pas');
            return false;
        }

        if (formData.currentPassword === formData.newPassword) {
            setError('Le nouveau mot de passe doit être différent du mot de passe actuel');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await axios.put('/api/user/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setSuccess('Mot de passe modifié avec succès !');

            // Réinitialiser le formulaire
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            // Rediriger vers le profil après 2 secondes
            setTimeout(() => {
                navigate('/profil');
            }, 2000);

        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Erreur lors de la modification du mot de passe. Veuillez réessayer.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Modifier mon mot de passe
                </Typography>

                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    Pour des raisons de sécurité, vous seul pouvez modifier votre mot de passe.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="currentPassword"
                        label="Mot de passe actuel"
                        type="password"
                        id="currentPassword"
                        autoComplete="current-password"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        disabled={loading}
                    />

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="newPassword"
                        label="Nouveau mot de passe"
                        type="password"
                        id="newPassword"
                        autoComplete="new-password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        disabled={loading}
                        helperText="Minimum 6 caractères"
                    />

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Confirmer le nouveau mot de passe"
                        type="password"
                        id="confirmPassword"
                        autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Modifier mon mot de passe'}
                    </Button>

                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => navigate('/profil')}
                        disabled={loading}
                    >
                        Annuler
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default ChangePassword;
