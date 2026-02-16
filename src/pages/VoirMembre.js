import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Box, CircularProgress, Alert, Button,
    Card, CardContent, Grid, Divider, Chip
} from '@mui/material';
import { ArrowBack, Edit, Email, Phone, Work, Person, CalendarToday, Badge } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import PhotoUpload from '../components/PhotoUpload';

const VoirMembre = () => {
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString('fr-FR');
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'error';
            case 'tresorier': return 'warning';
            case 'secretaire': return 'info';
            default: return 'success';
        }
    };

    const getRoleLabel = (role) => {
        switch (role) {
            case 'admin': return 'Administrateur';
            case 'tresorier': return 'Trésorier';
            case 'secretaire': return 'Secrétaire';
            default: return 'Membre';
        }
    };

    const handlePhotoChange = (photoUrl) => {
        // Mettre à jour l'aperçu local
        setMember(prev => ({
            ...prev,
            photo_url: photoUrl
        }));

        // Optionnel: Sauvegarder immédiatement la photo dans la base de données
        // Pour l'instant, on attend la sauvegarde complète via le bouton modifier
    };

    if (loading) {
        return (
            <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error || !member) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error || "Membre non trouvé"}</Alert>
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
                    Détails du Membre
                </Typography>
            </Box>

            <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    {/* Photo de profil et informations principales */}
                    <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Person sx={{ mr: 1 }} />
                                    Profil & Informations
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                                    <PhotoUpload
                                        currentPhoto={member.photo_url}
                                        onPhotoChange={handlePhotoChange}
                                        size={100}
                                        editable={false}
                                    />
                                    <Box>
                                        <Typography variant="h5" gutterBottom>
                                            {member.nom} {member.prenom}
                                        </Typography>
                                        <Chip
                                            label={getRoleLabel(member.role)}
                                            color={getRoleColor(member.role)}
                                            size="small"
                                            icon={<Badge />}
                                        />
                                    </Box>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        ID Membre
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontFamily: 'monospace', color: '#666' }}>
                                        {/* Préférence à un identifiant métier s'il existe, sinon ID technique */}
                                        {member.member_id || `M-${member.id_membre || member.id}`}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Date d'Adhésion
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDate(member.date_creation)}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Coordonnées */}
                    <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Email sx={{ mr: 1 }} />
                                    Coordonnées
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Email
                                    </Typography>
                                    <Typography variant="body1">
                                        {member.email}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Téléphone
                                    </Typography>
                                    <Typography variant="body1">
                                        {member.telephone || 'Non spécifié'}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Profession
                                    </Typography>
                                    <Typography variant="body1">
                                        {member.profession || 'Non spécifiée'}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Informations système */}
                    <Grid item xs={12}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CalendarToday sx={{ mr: 1 }} />
                                    Informations Système
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="body2" color="text.secondary">
                                            ID Interne
                                        </Typography>
                                        <Typography variant="body1">
                                            #{member.id_membre || member.id}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="body2" color="text.secondary">
                                            Statut Photo
                                        </Typography>
                                        <Typography variant="body1">
                                            {member.photo_url ? 'Photo disponible' : 'Aucune photo'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Actions */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/membres')}
                    >
                        Retour à la liste
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => navigate(`/membres/${member.id}/modifier`)}
                        sx={{ bgcolor: '#19d279', '&:hover': { bgcolor: '#12a85e' } }}
                    >
                        Modifier
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default VoirMembre;
