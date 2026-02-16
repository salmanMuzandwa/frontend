import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Avatar,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Divider,
    Chip,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import {
    Edit as EditIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    Work as WorkIcon,
    CalendarToday as CalendarIcon,
    AccountBalance as AccountBalanceIcon,
    CheckCircle as CheckCircleIcon,

    TrendingUp as TrendingUpIcon,
    Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getProfilePhotoUrl } from '../utils/urlHelper';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

export default function Profil() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        adresse: '',
        profession: ''
    });
    const [userStats, setUserStats] = useState(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef(null);
    const { user: authUser, updateUser } = useAuth();
    const navigate = useNavigate();

    const fetchUserData = useCallback(async () => {
        try {
            const response = await api.get('/user/profile');
            const updatedUser = { ...response.data };

            // Toujours conserver la photo_url existante si elle n'est pas dans la réponse
            const currentPhotoUrl = user?.photo_url || authUser?.photo_url;
            if (!updatedUser.photo_url && currentPhotoUrl) {
                updatedUser.photo_url = currentPhotoUrl;
                console.log('Photo_url conservée depuis les données locales:', currentPhotoUrl);
            }

            setUser(updatedUser);

            // Mettre à jour le contexte global seulement si nécessaire pour éviter les boucles
            // On vérifie si member_id ou d'autres champs clés ont changé
            if (updateUser && (
                (!authUser?.member_id && updatedUser.member_id) ||
                JSON.stringify(authUser) !== JSON.stringify(updatedUser)
            )) {
                updateUser(updatedUser);
            }

            setFormData({
                nom: response.data.nom || '',
                prenom: response.data.prenom || '',
                email: response.data.email || '',
                telephone: response.data.telephone || '',
                adresse: response.data.adresse || '',
                profession: response.data.profession || '',
                date_naissance: response.data.date_naissance || '',
                lieu_naissance: response.data.lieu_naissance || '',
                sexe: response.data.sexe || ''
            });
            setError('');
        } catch (error) {
            console.error('Erreur lors du chargement du profil:', error);
            // Ne pas afficher l'erreur si nous avons les données de base de authUser
            if (!authUser) {
                setError('Erreur lors du chargement du profil');
            }
        } finally {
            setLoading(false);
        }
    }, [user, authUser, updateUser]);

    const fetchUserStats = useCallback(async () => {
        try {
            const response = await api.get('/user/stats');
            setUserStats(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
            // Données par défaut en cas d'erreur
            setUserStats({
                totalContributions: 0,
                totalPresences: 0,
                tauxParticipation: 0,
                activitesParticipees: 0,
                activitesRecentess: []
            });
        }
    }, []);

    useEffect(() => {
        // Initialiser avec les données locales si disponibles
        if (authUser) {
            setUser(authUser);
            setFormData({
                nom: authUser.nom || '',
                prenom: authUser.prenom || '',
                email: authUser.email || '',
                telephone: authUser.telephone || '',
                adresse: authUser.adresse || '',
                profession: authUser.profession || '',
                date_naissance: authUser.date_naissance || '',
                lieu_naissance: authUser.lieu_naissance || '',
                sexe: authUser.sexe || ''
            });

            // Charger les stats en arrière-plan
            fetchUserStats();
        }

        // Toujours charger les données à jour du serveur une seule fois au montage
        // pour récupérer les champs manquants (comme member_id) et synchroniser
        fetchUserData();
    }, [authUser, fetchUserData, fetchUserStats]);

    const handleOpenDialog = () => {
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setFormData(user);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Nettoyer les données pour ne pas envoyer de champs null
        const cleanedFormData = Object.keys(formData).reduce((acc, key) => {
            if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
                acc[key] = formData[key];
            }
            return acc;
        }, {});

        try {
            const response = await api.put('/user/profile', cleanedFormData);
            const updatedUserData = response.data.user || cleanedFormData;
            setUser(updatedUserData);
            setDialogOpen(false);
            setSuccess('Profil mis à jour avec succès');
            setTimeout(() => setSuccess(''), 3000);

            // Synchroniser le contexte utilisateur avec updateUser
            if (updateUser && updatedUserData) {
                updateUser(updatedUserData);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            // Gestion améliorée des erreurs
            let errorMessage = 'Erreur lors de la mise à jour du profil';

            if (error.response) {
                // Erreur serveur avec réponse
                errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
                console.error('Détails de l\'erreur:', error.response.status, error.response.data);
            } else if (error.request) {
                // Erreur réseau
                errorMessage = 'Erreur de connexion au serveur';
                console.error('Erreur réseau:', error.request);
            } else {
                // Erreur de configuration
                errorMessage = error.message || errorMessage;
                console.error('Erreur de configuration:', error.message);
            }

            setError(errorMessage);
            setTimeout(() => setError(''), 5000);
        }
    };

    const getStatusColor = (statut) => {
        switch (statut) {
            case 'Actif': return 'success';
            case 'Inactif': return 'error';
            case 'Régulier': return 'info';
            default: return 'default';
        }
    };

    const handlePhotoButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handlePhotoChange = async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const formDataToSend = new FormData();
        formDataToSend.append('photo', file);

        try {
            setUploadingPhoto(true);
            setError('');
            const response = await api.post('/user/profile/photo', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const photoUrl = response.data?.photo_url || response.data?.photo || null;
            const normalizedPhotoUrl = getProfilePhotoUrl(photoUrl);
            const updatedUser = { ...user, photo_url: normalizedPhotoUrl };
            setUser(updatedUser);

            // Synchroniser le contexte utilisateur avec updateUser
            if (updateUser && normalizedPhotoUrl) {
                updateUser({ ...authUser, photo_url: normalizedPhotoUrl });
                console.log('Contexte utilisateur mis à jour avec la nouvelle photo:', normalizedPhotoUrl);
            }

            setSuccess('Photo de profil mise à jour avec succès');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la photo de profil:', error);

            // Gestion améliorée des erreurs
            let errorMessage = 'Erreur lors de la mise à jour de la photo de profil';

            if (error.response) {
                errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
                console.error('Détails de l\'erreur photo:', error.response.status, error.response.data);
            } else if (error.request) {
                errorMessage = 'Erreur de connexion lors de l\'upload de la photo';
                console.error('Erreur réseau photo:', error.request);
            } else {
                errorMessage = error.message || errorMessage;
                console.error('Erreur configuration photo:', error.message);
            }

            setError(errorMessage);
            setTimeout(() => setError(''), 5000);
        } finally {
            setUploadingPhoto(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'Administrateur': return 'error';
            case 'Président': return 'error';
            case 'Secrétaire Général': return 'primary';
            case 'Trésorier': return 'success';
            case 'Chargé de Discipline': return 'warning';
            case 'Membre': return 'default';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography>Chargement...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Mon Profil
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Informations personnelles */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Avatar
                                src={getProfilePhotoUrl(user?.photo_url) || ''}
                                sx={{
                                    width: 120,
                                    height: 120,
                                    fontSize: 48,
                                    mx: 'auto',
                                    mb: 2,
                                    bgcolor: 'primary.main'
                                }}
                            >
                                {!user?.photo_url && (
                                    <>
                                        {user?.nom?.charAt(0)}{user?.prenom?.charAt(0)}
                                    </>
                                )}
                            </Avatar>

                            <Typography variant="h5" gutterBottom>
                                {user?.nom} {user?.prenom}
                            </Typography>

                            <Chip
                                label={user?.role}
                                color={getRoleColor(user?.role)}
                                sx={{ mb: 1 }}
                            />

                            <Chip
                                label={user?.statut}
                                color={getStatusColor(user?.statut)}
                                sx={{ ml: 1 }}
                            />

                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handlePhotoChange}
                                />
                                <Button
                                    variant="outlined"
                                    onClick={handlePhotoButtonClick}
                                    disabled={uploadingPhoto}
                                >
                                    {uploadingPhoto ? 'Chargement...' : 'Changer la photo'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={handleOpenDialog}
                                >
                                    Modifier le Profil
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<LockIcon />}
                                    onClick={() => navigate('/change-password')}
                                    sx={{ mt: 1 }}
                                >
                                    Modifier mon mot de passe
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Détails du profil */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Informations Personnelles
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <EmailIcon sx={{ mr: 2, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Email
                                            </Typography>
                                            <Typography variant="body1">
                                                {user?.email}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <PhoneIcon sx={{ mr: 2, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Téléphone
                                            </Typography>
                                            <Typography variant="body1">
                                                {user?.telephone || 'Non renseigné'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <AccountBalanceIcon sx={{ mr: 2, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                ID Membre
                                            </Typography>
                                            <Typography variant="body1">
                                                {user?.member_id || 'Non attribué'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <LocationIcon sx={{ mr: 2, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Adresse
                                            </Typography>
                                            <Typography variant="body1">
                                                {user?.adresse || 'Non renseignée'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <WorkIcon sx={{ mr: 2, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Profession
                                            </Typography>
                                            <Typography variant="body1">
                                                {user?.profession || 'Non renseignée'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <CalendarIcon sx={{ mr: 2, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Né(e) le
                                            </Typography>
                                            <Typography variant="body1">
                                                {user?.date_naissance ? new Date(user.date_naissance).toLocaleDateString('fr-FR') : 'Non renseignée'}
                                                {user?.lieu_naissance && ` à ${user.lieu_naissance}`}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <CheckCircleIcon sx={{ mr: 2, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Sexe
                                            </Typography>
                                            <Typography variant="body1">
                                                {user?.sexe === 'M' ? 'Masculin' : user?.sexe === 'F' ? 'Féminin' : 'Non renseigné'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <CalendarIcon sx={{ mr: 2, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Date d'Adhésion
                                            </Typography>
                                            <Typography variant="body1">
                                                {user?.date_adhesion ? new Date(user.date_adhesion).toLocaleDateString('fr-FR') : 'Non renseignée'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Statistiques personnelles */}
                {userStats && (
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Mes Statistiques
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box display="flex" alignItems="center">
                                            <AccountBalanceIcon sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
                                            <Box>
                                                <Typography variant="h6" color="primary">
                                                    {userStats.totalContributions || 0} $
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Total Contributions
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box display="flex" alignItems="center">
                                            <CheckCircleIcon sx={{ mr: 2, color: 'success.main', fontSize: 40 }} />
                                            <Box>
                                                <Typography variant="h6" color="success.main">
                                                    {userStats.totalPresences || 0}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Présences
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box display="flex" alignItems="center">
                                            <TrendingUpIcon sx={{ mr: 2, color: 'info.main', fontSize: 40 }} />
                                            <Box>
                                                <Typography variant="h6" color="info.main">
                                                    {userStats.tauxParticipation || 0}%
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Taux Participation
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box display="flex" alignItems="center">
                                            <CalendarIcon sx={{ mr: 2, color: 'warning.main', fontSize: 40 }} />
                                            <Box>
                                                <Typography variant="h6" color="warning.main">
                                                    {userStats.activitesParticipees || 0}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Activités Participées
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Activités récentes */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Activités Récentes
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <List>
                                {userStats?.activitesRecentess?.map((activite, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            <CheckCircleIcon color="success" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={activite.titre}
                                            secondary={`${activite.date} - ${activite.statut}`}
                                        />
                                    </ListItem>
                                ))}
                                {(!userStats?.activitesRecentess || userStats.activitesRecentess.length === 0) && (
                                    <ListItem>
                                        <ListItemText primary="Aucune activité récente" />
                                    </ListItem>
                                )}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Dialog pour modifier le profil */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>Modifier le Profil</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Nom"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Prénom"
                                    name="prenom"
                                    value={formData.prenom}
                                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Téléphone"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Adresse"
                                    name="adresse"
                                    multiline
                                    rows={2}
                                    value={formData.adresse}
                                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Profession"
                                    name="profession"
                                    value={formData.profession}
                                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Sexe</InputLabel>
                                    <Select
                                        name="sexe"
                                        value={formData.sexe}
                                        label="Sexe"
                                        onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
                                    >
                                        <MenuItem value="M">Masculin</MenuItem>
                                        <MenuItem value="F">Féminin</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Date de Naissance"
                                    name="date_naissance"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.date_naissance ? formData.date_naissance.split('T')[0] : ''}
                                    onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Lieu de Naissance"
                                    name="lieu_naissance"
                                    value={formData.lieu_naissance}
                                    onChange={(e) => setFormData({ ...formData, lieu_naissance: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Annuler</Button>
                        <Button type="submit" variant="contained">
                            Sauvegarder
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
