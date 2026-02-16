// src/pages/ForgotPassword.js

import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Box, Alert, CircularProgress, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tokenInfo, setTokenInfo] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setEmail(e.target.value);
        if (error) setError('');
        if (success) setSuccess('');
        if (tokenInfo) setTokenInfo(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setError('L\'email est requis');
            return;
        }

        // Validation simple de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Veuillez entrer une adresse email valide');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        setTokenInfo(null);

        try {
            const response = await axios.post('/api/forgot-password', { email });

            if (response.data.resetToken) {
                // Mode développement - afficher le token
                setTokenInfo(response.data);
                setSuccess('Token de réinitialisation généré (mode développement)');
            } else {
                // Mode production
                setSuccess('Si cet email existe dans notre système, un lien de réinitialisation sera envoyé.');
            }

            setEmail('');

        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Erreur lors de la demande de réinitialisation. Veuillez réessayer.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTestReset = () => {
        if (tokenInfo && tokenInfo.resetLink) {
            // Rediriger vers la page de réinitialisation avec le token
            window.location.href = tokenInfo.resetLink;
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Mot de passe oublié
                </Typography>

                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
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

                {tokenInfo && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Box>
                            <Typography variant="body2" gutterBottom>
                                <strong>Mode Développement:</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                Token: {tokenInfo.resetToken}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Lien: {tokenInfo.resetLink}
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleTestReset}
                                sx={{ mt: 1 }}
                            >
                                Tester la réinitialisation
                            </Button>
                        </Box>
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Adresse email"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
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
                        {loading ? <CircularProgress size={24} /> : 'Envoyer le lien de réinitialisation'}
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

export default ForgotPassword;
