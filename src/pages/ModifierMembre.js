import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Box, CircularProgress, Alert, Button,
    TextField, FormControl, InputLabel, Select, MenuItem, Grid
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import PhotoUpload from '../components/PhotoUpload';

const ModifierMembre = () => {
    const [member, setMember] = useState(null);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        profession: '',
        role: 'membre',
        photo_url: ''
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMember = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/members/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setMember(response.data);
                setFormData({
                    nom: response.data.nom ?? '',
                    prenom: response.data.prenom ?? '',
                    email: response.data.email ?? '',
                    telephone: response.data.telephone ?? '',
                    profession: response.data.profession ?? '',
                    adresse: response.data.adresse ?? '',
                    role: response.data.role ?? 'membre',
                    statut: response.data.statut ?? 'actif',
                    date_adhesion: response.data.date_adhesion ?? '',
                    date_naissance: response.data.date_naissance ?? '',
                    lieu_naissance: response.data.lieu_naissance ?? '',
                    sexe: response.data.sexe ?? '',
                    photo_url: response.data.photo_url ?? ''
                });
                setError(null);
            } catch (err) {
                console.error("Erreur lors du chargement du membre:", err);
                setError("Impossible de charger les détails du membre");
                setMember(null);
            } finally {
                setLoading(false);
            }
        };

        if (token && id) {
            fetchMember();
        }
    }, [token, id]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await axios.put(`/api/members/${id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setSuccess('Membre modifié avec succès!');
            setMember(response.data.member);
        } catch (err) {
            console.error("Erreur lors de la modification du membre:", err);
            setError(err.response?.data?.message || "Erreur lors de la modification du membre");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error && !member) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/membres')}
                    sx={{ mt: 2 }}
                >
                    Retour à la liste
                </Button>
            </Container>
        );
    }

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
                    Modifier le Membre
                </Typography>
            </Box>

            <Paper sx={{ p: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                {member && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            ID Membre: <span style={{ fontFamily: 'monospace' }}>{member.member_id}</span>
                        </Typography>
                    </Box>
                )}

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
                                    memberId={id}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                                    Formats acceptés: JPG, PNG, GIF<br />
                                    Taille maximale: 5MB
                                </Typography>
                            </Box>
                        </Grid>

                        {/* Informations personnelles */}
                        <Grid item xs={12} md={8}>
                            <Typography variant="subtitle1" gutterBottom>
                                Informations Personnelles
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Nom"
                                        name="nom"
                                        value={formData.nom}
                                        onChange={handleChange}
                                        required
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Prénom"
                                        name="prenom"
                                        value={formData.prenom}
                                        onChange={handleChange}
                                        required
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        fullWidth
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Coordonnées et rôle */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                Coordonnées & Rôle
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Téléphone"
                                        name="telephone"
                                        value={formData.telephone}
                                        onChange={handleChange}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Adresse"
                                        name="adresse"
                                        value={formData.adresse}
                                        onChange={handleChange}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Profession"
                                        name="profession"
                                        value={formData.profession}
                                        onChange={handleChange}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
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
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Date de Naissance"
                                        name="date_naissance"
                                        type="date"
                                        InputLabelProps={{ shrink: true }}
                                        value={formData.date_naissance ? formData.date_naissance.split('T')[0] : ''}
                                        onChange={handleChange}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Lieu de Naissance"
                                        name="lieu_naissance"
                                        value={formData.lieu_naissance}
                                        onChange={handleChange}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Date d'Adhésion"
                                        name="date_adhesion"
                                        type="date"
                                        InputLabelProps={{ shrink: true }}
                                        value={formData.date_adhesion ? formData.date_adhesion.split('T')[0] : ''}
                                        onChange={handleChange}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
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
                                </Grid>
                                <Grid item xs={12} md={6}>
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
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/membres')}
                            disabled={submitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={submitting}
                            startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
                            sx={{ bgcolor: '#19d279', '&:hover': { bgcolor: '#12a85e' } }}
                        >
                            {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default ModifierMembre;
