import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    Grid,
    InputAdornment,
    IconButton
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Person,
    Email,
    Phone,
    Work
} from '@mui/icons-material';
import axios from 'axios';

const Register = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        profession: '',
        password: '',
        confirmPassword: ''
    });

    const steps = ['Informations personnelles', 'Coordonnées', 'Sécurité'];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
        if (success) setSuccess('');
    };

    const validateStep = (step) => {
        switch (step) {
            case 0:
                if (!formData.nom || !formData.prenom) {
                    setError('Veuillez remplir votre nom et prénom');
                    return false;
                }
                if (formData.nom.length < 2 || formData.prenom.length < 2) {
                    setError('Le nom et le prénom doivent contenir au moins 2 caractères');
                    return false;
                }
                break;
            case 1:
                if (!formData.email || !formData.telephone) {
                    setError('Veuillez remplir votre email et téléphone');
                    return false;
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.email)) {
                    setError('Veuillez entrer une adresse email valide');
                    return false;
                }
                if (formData.telephone.length < 8) {
                    setError('Le numéro de téléphone doit contenir au moins 8 caractères');
                    return false;
                }
                break;
            case 2:
                if (!formData.password || !formData.confirmPassword) {
                    setError('Veuillez définir un mot de passe');
                    return false;
                }
                if (formData.password.length < 6) {
                    setError('Le mot de passe doit contenir au moins 6 caractères');
                    return false;
                }
                if (formData.password !== formData.confirmPassword) {
                    setError('Les mots de passe ne correspondent pas');
                    return false;
                }
                break;
            default:
                return false;
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(activeStep)) {
            setActiveStep((prevStep) => prevStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep(2)) {
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post('/api/register', {
                nom: formData.nom.trim(),
                prenom: formData.prenom.trim(),
                email: formData.email.trim().toLowerCase(),
                telephone: formData.telephone.trim(),
                profession: formData.profession.trim(),
                password: formData.password
            });

            setSuccess(response.data.message || 'Votre demande d\'inscription a été soumise avec succès! Un administrateur va valider votre compte.');

            // Réinitialiser le formulaire
            setFormData({
                nom: '',
                prenom: '',
                email: '',
                telephone: '',
                profession: '',
                password: '',
                confirmPassword: ''
            });
            setActiveStep(0);

            // Rediriger vers la page de connexion après 3 secondes
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Erreur lors de l\'inscription. Veuillez réessayer.');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="Nom"
                                name="nom"
                                value={formData.nom}
                                onChange={handleInputChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="Prénom"
                                name="prenom"
                                value={formData.prenom}
                                onChange={handleInputChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Profession"
                                name="profession"
                                value={formData.profession}
                                onChange={handleInputChange}
                                placeholder="Ex: Ingénieur, Enseignant, Étudiant..."
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Work />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                );
            case 1:
                return (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                label="Adresse Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                label="Numéro de Téléphone"
                                name="telephone"
                                value={formData.telephone}
                                onChange={handleInputChange}
                                placeholder="Ex: +243 123 456 789"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Phone />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                );
            case 2:
                return (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                label="Mot de passe"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleInputChange}
                                helperText="Minimum 6 caractères"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                label="Confirmer le mot de passe"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                            />
                        </Grid>
                    </Grid>
                );
            default:
                return null;
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Demande d'inscription LJMDI
                </Typography>

                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    Remplissez ce formulaire pour demander votre adhésion. Votre compte sera validé par un administrateur.
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

                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    {renderStepContent(activeStep)}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                        <Button
                            disabled={activeStep === 0}
                            onClick={handleBack}
                            variant="outlined"
                        >
                            Précédent
                        </Button>

                        {activeStep === steps.length - 1 ? (
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                sx={{ bgcolor: '#19d279', '&:hover': { bgcolor: '#12a85e' } }}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Soumettre la demande'}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNext}
                                variant="contained"
                                sx={{ bgcolor: '#19d279', '&:hover': { bgcolor: '#12a85e' } }}
                            >
                                Suivant
                            </Button>
                        )}
                    </Box>
                </Box>

                <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        Vous avez déjà un compte ?{' '}
                        <Button
                            variant="text"
                            onClick={() => navigate('/login')}
                            sx={{ textTransform: 'none', p: 0, ml: 0.5 }}
                        >
                            Se connecter
                        </Button>
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default Register;
