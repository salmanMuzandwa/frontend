// src/pages/ResetPassword.js

import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, TextField, Button, Box, Alert, CircularProgress, Link } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const [token, setToken] = useState('');
    const [email, setEmail] = useState('');
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tokenValid, setTokenValid] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
            verifyToken(tokenFromUrl);
        } else {
            setError('Token de réinitialisation manquant');
            setVerifying(false);
        }
    }, [searchParams]);

    const verifyToken = async (tokenToVerify) => {
        try {
            const response = await axios.get(`/api/verify-reset-token/${tokenToVerify}`);
            setEmail(response.data.email);
            setTokenValid(true);
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Token invalide ou expiré');
            }
            setTokenValid(false);
        } finally {
            setVerifying(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
        if (success) setSuccess('');
    };

    const validateForm = () => {
        if (!formData.newPassword || !formData.confirmPassword) {
            setError('Tous les champs sont requis');
            return false;
        }

        if (formData.newPassword.length < 6) {
            setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
            return false;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
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
            await axios.post('/api/reset-password', {
                token: token,
                newPassword: formData.newPassword
            });

            setSuccess('Mot de passe réinitialisé avec succès !');

            // Réinitialiser le formulaire
            setFormData({
                newPassword: '',
                confirmPassword: ''
            });

            // Rediriger vers la page de login après 2 secondes
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Erreur lors de la réinitialisation du mot de passe. Veuillez réessayer.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <CircularProgress />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Vérification du token...
                    </Typography>
                </Paper>
            </Container>
        );
    }

    if (!tokenValid) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom align="center">
                        Token invalide
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Le lien de réinitialisation est invalide ou a expiré.
                        </Typography>
                        <Link
                            component="button"
                            variant="body2"
                            onClick={() => navigate('/forgot-password')}
                            type="button"
                            sx={{ cursor: 'pointer', mr: 2 }}
                        >
                            Demander un nouveau lien
                        </Link>
                        <Link
                            component="button"
                            variant="body2"
                            onClick={() => navigate('/login')}
                            type="button"
                            sx={{ cursor: 'pointer' }}
                        >
                            Retour à la connexion
                        </Link>
                    </Box>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Réinitialiser le mot de passe
                </Typography>

                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    Entrez votre nouveau mot de passe pour le compte : <strong>{email}</strong>
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
                        {loading ? <CircularProgress size={24} /> : 'Réinitialiser le mot de passe'}
                    </Button>

                    <Box sx={{ textAlign: 'center' }}>
                        <Link
                            component="button"
                            variant="body2"
                            onClick={() => navigate('/login')}
                            type="button"
                            sx={{ cursor: 'pointer' }}
                        >
                            Retour à la connexion
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default ResetPassword;
