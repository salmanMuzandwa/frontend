// src/pages/Login.js

import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, CircularProgress, Alert, IconButton, InputAdornment, Link } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('admin@ljmdi.org');
    const [password, setPassword] = useState('adminpassword');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Récupérer les données du formulaire correctement
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email');
        const password = formData.get('password');

        console.log('Login.js - Données du formulaire:', { email, password }); // Debug

        try {
            const result = await login(email, password);

            // La réponse est toujours formatée avec success, user, token
            if (result && (result.success || result.user)) {
                navigate('/dashboard', { replace: true });
            } else {
                setError(result.message || 'Échec de la connexion. Veuillez vérifier vos identifiants.');
            }
        } catch (err) {
            console.error('Erreur de connexion:', err);
            setError(err.response?.data?.message || 'Échec de la connexion. Veuillez vérifier vos identifiants.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 4,
                    boxShadow: 3,
                    borderRadius: 2,
                    bgcolor: 'white'
                }}
            >
                <Box component="img" src="/assets/logo.png" alt="Logo" sx={{ height: 80, mb: 2 }} />
                <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                    Connexion LJMDI
                </Typography>

                <Alert severity="info" sx={{ mb: 2 }}>
                    <strong>Identifiants Admin :</strong><br />
                    Email : admin@ljmdi.org<br />
                    Mot de passe : adminpassword
                </Alert>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Adresse Email"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Mot de passe"
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleTogglePasswordVisibility}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Se connecter'}
                    </Button>
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Link
                            component="button"
                            variant="body2"
                            onClick={() => navigate('/forgot-password')}
                            type="button"
                            sx={{ cursor: 'pointer', display: 'block', mb: 1 }}
                        >
                            Mot de passe oublié ?
                        </Link>
                        <Link
                            component="button"
                            variant="body2"
                            onClick={() => navigate('/register')}
                            type="button"
                            sx={{ cursor: 'pointer' }}
                        >
                            Pas encore membre ? S'inscrire
                        </Link>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};

export default Login;

