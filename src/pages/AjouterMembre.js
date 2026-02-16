import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Container, Typography, Paper, Box, TextField, Button,
    FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress, Grid
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import membresApi from '../api/membres';
import { useNavigate } from 'react-router-dom';
import PhotoUpload from '../components/PhotoUpload';

const AjouterMembre = () => {
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        profession: '',
        role: 'membre',
        password: 'password123',
        photo_url: '',
        adresse: '',
        statut: 'actif',
        date_adhesion: new Date().toISOString().split('T')[0],
        date_naissance: '',
        lieu_naissance: '',
        sexe: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhotoChange = (photoUrl) => {
        setFormData(prev => ({
            ...prev,
            photo_url: photoUrl
        }));
    };

    const validateForm = () => {
        if (!formData.nom.trim()) {
            setError('Le nom est requis');
            return false;
        }
        if (!formData.prenom.trim()) {
            setError('Le prénom est requis');
            return false;
        }
        if (!formData.email.trim()) {
            setError("L'email est requis");
            return false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            setError("Veuillez entrer un email valide");
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
        setError(null);
        setSuccess(null);

        try {
            // Préparer les données du membre
            const membreData = {
                ...formData
            };

            console.log('🔔 Tentative d\'ajout d\'un nouveau membre:', membreData);

            // Appeler l'API pour créer le membre
            const response = await membresApi.create(membreData);
            console.log('✅ Réponse du serveur:', response);

            // Vérifier si la réponse contient un message de succès
            if (response && (response.membre || response.message)) {
                setSuccess(response.message || 'Membre ajouté avec succès! Redirection...');

                // Réinitialiser le formulaire
                setFormData({
                    nom: '',
                    prenom: '',
                    email: '',
                    telephone: '',
                    profession: '',
                    role: 'membre',
                    password: 'password123',
                    photo_url: ''
                });

                // Rediriger vers la liste des membres après un court délai
                setTimeout(() => {
                    navigate('/membres', { replace: true, state: { refresh: true } });
                }, 1000);
            } else {
                // Si la réponse ne contient pas les données attendues
                console.warn('Réponse du serveur inattendue:', response);
                setError('Le serveur a répondu de manière inattendue. Le membre a peut-être été créé.');
                // Rediriger quand même vers la liste des membres
                setTimeout(() => {
                    navigate('/membres', { replace: true, state: { refresh: true } });
                }, 2000);
            }
        } catch (err) {
            console.error("Erreur lors de l'ajout du membre:", err);

            let errorMessage = "Erreur lors de l'ajout du membre";

            if (err.status === 400) {
                errorMessage = "Données invalides. Veuillez vérifier les informations saisies.";
            } else if (err.status === 401) {
                errorMessage = "Session expirée. Vous allez être redirigé vers la page de connexion...";
                setTimeout(() => logout(), 2000);
            } else if (err.status === 409) {
                errorMessage = "Un membre avec cet email existe déjà.";
            } else if (err.message) {
                errorMessage = err.message;
            } else if (err.isNetworkError) {
                errorMessage = "Impossible de se connecter au serveur. Vérifiez votre connexion Internet et réessayez.";
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/membres')}
                    sx={{ mr: 2 }}
                >
                    Retour
                </Button>
                <Typography variant="h4" component="h1">
                    Ajouter un Nouveau Membre
                </Typography>
            </Box>

            <Paper sx={{ p: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Photo de profil */}
                        <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Photo de Profil
                                </Typography>
                                <PhotoUpload
                                    currentPhoto={formData.photo_url}
                                    onPhotoChange={handlePhotoChange}
                                    size={120}
                                    editable={true}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                                    Formats acceptés: JPG, PNG, GIF<br />
                                    Taille maximale: 5MB
                                </Typography>
                            </Box>
                        </Grid>

                        {/* Informations personnelles */}
                        <Grid item xs={12} md={8}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                <TextField
                                    label="Nom"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleChange}
                                    required
                                    fullWidth
                                />
                                <TextField
                                    label="Prénom"
                                    name="prenom"
                                    value={formData.prenom}
                                    onChange={handleChange}
                                    required
                                    fullWidth
                                />
                                <TextField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    fullWidth
                                />
                                <TextField
                                    label="Téléphone"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleChange}
                                    fullWidth
                                />
                                <TextField
                                    label="Adresse"
                                    name="adresse"
                                    value={formData.adresse}
                                    onChange={handleChange}
                                    fullWidth
                                />
                                <TextField
                                    label="Profession"
                                    name="profession"
                                    value={formData.profession}
                                    onChange={handleChange}
                                    fullWidth
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Sexe</InputLabel>
                                    <Select
                                        name="sexe"
                                        value={formData.sexe}
                                        label="Sexe"
                                        onChange={handleChange}
                                    >
                                        <MenuItem value="M">Masculin</MenuItem>
                                        <MenuItem value="F">Féminin</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Date de Naissance"
                                    name="date_naissance"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.date_naissance}
                                    onChange={handleChange}
                                    fullWidth
                                />
                                <TextField
                                    label="Lieu de Naissance"
                                    name="lieu_naissance"
                                    value={formData.lieu_naissance}
                                    onChange={handleChange}
                                    fullWidth
                                />
                                <TextField
                                    label="Date d'Adhésion"
                                    name="date_adhesion"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.date_adhesion}
                                    onChange={handleChange}
                                    fullWidth
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Rôle</InputLabel>
                                    <Select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        label="Rôle"
                                    >
                                        <MenuItem value="membre">Membre</MenuItem>
                                        <MenuItem value="tresorier">Trésorier</MenuItem>
                                        <MenuItem value="secretaire">Secrétaire</MenuItem>
                                        <MenuItem value="admin">Administrateur</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel>Statut</InputLabel>
                                    <Select
                                        name="statut"
                                        value={formData.statut}
                                        onChange={handleChange}
                                        label="Statut"
                                    >
                                        <MenuItem value="actif">Actif</MenuItem>
                                        <MenuItem value="inactif">Inactif</MenuItem>
                                        <MenuItem value="suspendu">Suspendu</MenuItem>
                                        <MenuItem value="regular">Régulier</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/membres')}
                            disabled={loading}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            sx={{ bgcolor: '#19d279', '&:hover': { bgcolor: '#12a85e' } }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Ajouter le Membre'}
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default AjouterMembre;
