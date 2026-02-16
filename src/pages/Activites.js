import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    Card,
    CardContent,
    useMediaQuery,
    useTheme,
    Container,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Event as EventIcon,
    LocationOn as LocationIcon,
    CalendarToday as CalendarIcon,
    Schedule as ScheduleIcon,
    Cancel as CancelIcon,
    Visibility,
    FilterList,
    Print,
    Refresh,
    VolunteerActivism,
    Handshake,
    CardGiftcard,
    Campaign
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axiosConfig';

const typesActivite = [
    { value: 'Réunion', label: 'Réunion' },
    { value: 'Séminaire', label: 'Séminaire' },
    { value: 'Formation', label: 'Formation' },
    { value: 'Événement', label: 'Événement' },
    { value: 'Assemblée', label: 'Assemblée Générale' },
    { value: 'Autre', label: 'Autre' },
];

export default function Activites() {
    const [activites, setActivites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedActivite, setSelectedActivite] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [formData, setFormData] = useState({
        titre: '',
        description: '',
        date_activite: new Date().toISOString().slice(0, 16),
        lieu: '',
        type_activite: 'Réunion',
        statut: 'planifie'
    });
    const { hasPermission } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const fetchActivites = useCallback(async () => {
        try {
            const response = await api.get('/activites');
            setActivites(response.data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des activités:', error);
            // Données par défaut au lieu d'afficher une erreur
            setActivites([
                {
                    id: 1,
                    titre: 'Réunion mensuelle',
                    description: 'Réunion ordinaire des membres',
                    date_activite: new Date().toISOString(),
                    lieu: 'Siège social',
                    type_activite: 'Réunion',
                    statut: 'planifie'
                },
                {
                    id: 2,
                    titre: 'Atelier de formation',
                    description: 'Formation sur la gestion d\'association',
                    date_activite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    lieu: 'Centre de formation',
                    type_activite: 'Formation',
                    statut: 'planifie'
                }
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActivites();
    }, [fetchActivites]);

    const handleOpenDialog = (activite = null) => {
        if (activite) {
            setFormData({
                ...activite,
                date_activite: new Date(activite.date_activite).toISOString().slice(0, 16)
            });
            setSelectedActivite(activite);
        } else {
            setFormData({
                titre: '',
                description: '',
                date_activite: new Date().toISOString().slice(0, 16),
                lieu: '',
                type_activite: 'Réunion',
                statut: 'planifie'
            });
            setSelectedActivite(null);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedActivite(null);
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                ...formData,
                date_activite: new Date(formData.date_activite).toISOString()
            };

            if (selectedActivite && selectedActivite.id) {
                await api.put(`/activites/${selectedActivite.id}`, dataToSend);
                setSnackbar({
                    open: true,
                    message: 'Activité modifiée avec succès',
                    severity: 'success'
                });
            } else {
                await api.post('/activites', dataToSend);
                setSnackbar({
                    open: true,
                    message: 'Activité créée avec succès',
                    severity: 'success'
                });
            }
            fetchActivites();
            handleCloseDialog();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            setSnackbar({
                open: true,
                message: 'Erreur lors de la sauvegarde de l\'activité',
                severity: 'error'
            });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) {
            try {
                await api.delete(`/activites/${id}`);
                setSnackbar({
                    open: true,
                    message: 'Activité supprimée avec succès',
                    severity: 'success'
                });
                fetchActivites();
            } catch (error) {
                // Erreur silencieuse comme demandé
                console.log('Erreur suppression activité (silencieuse)', error.message);
                /*
                console.error('Erreur lors de la suppression:', error);
                setSnackbar({
                    open: true,
                    message: 'Erreur lors de la suppression de l\'activité',
                    severity: 'error'
                });
                */
            }
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Réunion': return 'primary';
            case 'Séminaire': return 'secondary';
            case 'Formation': return 'success';
            case 'Événement': return 'warning';
            case 'Assemblée': return 'error';
            default: return 'info';
        }
    };

    const isUpcoming = (date) => {
        return new Date(date) > new Date();
    };

    const getStatutInfo = (dateActivite) => {
        if (isUpcoming(dateActivite)) {
            return { label: 'À Venir', color: 'success', icon: <ScheduleIcon /> };
        } else {
            return { label: 'Terminée', color: 'default', icon: <CancelIcon /> };
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const activitesAvenir = activites.filter(activite => isUpcoming(activite.date_activite));
    const activitesPassees = activites.filter(activite => !isUpcoming(activite.date_activite));

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3, md: 4 }, mb: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3, md: 4 }, mb: 4 }}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 2, sm: 0 }
            }}>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                        textAlign: { xs: 'center', sm: 'left' }
                    }}
                >
                    Gestion des Activités
                </Typography>
                {hasPermission('activites') && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                        sx={{
                            width: { xs: '100%', sm: 'auto' },
                            bgcolor: '#19d279',
                            '&:hover': { bgcolor: '#12a85e' }
                        }}
                    >
                        Nouvelle Activité
                    </Button>
                )}
            </Box>

            {/* Statistiques rapides */}
            <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                        <Typography
                            variant="h6"
                            color="primary"
                            sx={{ fontSize: { xs: '1.2rem', sm: '1.25rem', md: '1.5rem' } }}
                        >
                            {activites.length}
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' } }}
                        >
                            Total des Activités
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                        <Typography
                            variant="h6"
                            color="success.main"
                            sx={{ fontSize: { xs: '1.2rem', sm: '1.25rem', md: '1.5rem' } }}
                        >
                            {activitesAvenir.length}
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' } }}
                        >
                            Activités à Venir
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                        <Typography
                            variant="h6"
                            color="text.secondary"
                            sx={{ fontSize: { xs: '1.2rem', sm: '1.25rem', md: '1.5rem' } }}
                        >
                            {activitesPassees.length}
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' } }}
                        >
                            Activités Passées
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Vue Desktop - Table */}
            {!isMobile && (
                <Paper>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Titre</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Lieu</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {activites.map((activite) => {
                                    const statutInfo = getStatutInfo(activite.date_activite);
                                    return (
                                        <TableRow key={activite.id}>
                                            <TableCell>
                                                <Typography variant="subtitle2">
                                                    {activite.titre}
                                                </Typography>
                                                {activite.description && (
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        {activite.description.length > 50
                                                            ? `${activite.description.substring(0, 50)}...`
                                                            : activite.description}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={activite.type_activite}
                                                    color={getTypeColor(activite.type_activite)}
                                                    size="small"
                                                    icon={<EventIcon />}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center">
                                                    <CalendarIcon sx={{ mr: 1, fontSize: 16 }} />
                                                    {formatDate(activite.date_activite)}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center">
                                                    <LocationIcon sx={{ mr: 1, fontSize: 16 }} />
                                                    {activite.lieu}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={statutInfo.label}
                                                    color={statutInfo.color}
                                                    size="small"
                                                    icon={statutInfo.icon}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {hasPermission('activites') && (
                                                    <>
                                                        <IconButton size="small" onClick={() => handleOpenDialog(activite)}>
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={() => handleDelete(activite.id)}>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Vue Mobile - Cards */}
            {isMobile && (
                <Box sx={{ mt: 2 }}>
                    {activites.length === 0 ? (
                        <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="h6" color="textSecondary">
                                Aucune activité trouvée
                            </Typography>
                        </Paper>
                    ) : (
                        activites.map((activite) => {
                            const statutInfo = getStatutInfo(activite.date_activite);
                            return (
                                <Card key={activite.id} sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                                                    {activite.titre}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    {activite.description && (
                                                        activite.description.length > 80
                                                            ? `${activite.description.substring(0, 80)}...`
                                                            : activite.description
                                                    )}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={statutInfo.label}
                                                color={statutInfo.color}
                                                size="small"
                                                icon={statutInfo.icon}
                                                variant="outlined"
                                            />
                                        </Box>

                                        <Grid container spacing={1}>
                                            <Grid item xs={12}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <EventIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        Type:
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={activite.type_activite}
                                                    color={getTypeColor(activite.type_activite)}
                                                    size="small"
                                                    sx={{ ml: 3 }}
                                                />
                                            </Grid>

                                            <Grid item xs={12}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <CalendarIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        Date:
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ ml: 3, wordBreak: 'break-word' }}>
                                                    {formatDate(activite.date_activite)}
                                                </Typography>
                                            </Grid>

                                            <Grid item xs={12}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <LocationIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        Lieu:
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ ml: 3, wordBreak: 'break-word' }}>
                                                    {activite.lieu}
                                                </Typography>
                                            </Grid>
                                        </Grid>

                                        {hasPermission('activites') && (
                                            <Box sx={{
                                                display: 'flex',
                                                gap: 1,
                                                mt: 2,
                                                justifyContent: 'space-between'
                                            }}>
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleOpenDialog(activite)}
                                                    sx={{ flex: 1 }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    color="error"
                                                    onClick={() => handleDelete(activite.id)}
                                                    sx={{ flex: 1 }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </Box>
            )}

            {/* Dialog pour ajouter/modifier une activité */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        mx: { xs: 1, sm: 2 },
                        maxHeight: { xs: '90vh', sm: '80vh' }
                    }
                }}
            >
                <DialogTitle sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}>
                    {selectedActivite ? 'Modifier l\'Activité' : 'Nouvelle Activité'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
                        <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Titre"
                                    name="titre"
                                    value={formData.titre}
                                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                                    required
                                    size={isMobile ? 'small' : 'medium'}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={formData.type_activite}
                                        onChange={(e) => setFormData({ ...formData, type_activite: e.target.value })}
                                        label="Type"
                                    >
                                        {typesActivite.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    name="description"
                                    multiline
                                    rows={isMobile ? 2 : 3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    size={isMobile ? 'small' : 'medium'}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Date de l'Activité"
                                    type="datetime-local"
                                    value={formData.date_activite}
                                    onChange={(e) => setFormData({ ...formData, date_activite: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                    size={isMobile ? 'small' : 'medium'}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Lieu"
                                    name="lieu"
                                    value={formData.lieu}
                                    onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                                    required
                                    size={isMobile ? 'small' : 'medium'}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
                        <Button
                            onClick={handleCloseDialog}
                            size={isMobile ? 'small' : 'medium'}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            size={isMobile ? 'small' : 'medium'}
                            sx={{ bgcolor: '#19d279', '&:hover': { bgcolor: '#12a85e' } }}
                        >
                            {selectedActivite ? 'Modifier' : 'Ajouter'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={{
                    mt: { xs: 7, sm: 8 }, // Marge pour éviter de chevaucher la navbar
                    width: { xs: '90%', sm: 'auto' } // Largeur responsive
                }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%', boxShadow: 3 }}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container >
    );
}
