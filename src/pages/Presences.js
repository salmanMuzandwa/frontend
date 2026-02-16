import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, CircularProgress, Alert, Button, Box,
    Checkbox, Menu, MenuItem, ListItemIcon, ListItemText, TextField, Avatar,
    Card, CardContent, Grid, Chip, IconButton, useMediaQuery, useTheme
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Print, PrintDisabled, Event, CheckCircle, Cancel, Schedule } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../utils/urlHelper';

const Presences = () => {
    const [presences, setPresences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPresences, setSelectedPresences] = useState([]);
    const [printMenuAnchor, setPrintMenuAnchor] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { token } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const fetchPresences = useCallback(async () => {
        try {
            if (!token) {
                setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
                return;
            }

            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            console.log('Récupération des présences avec token...');
            const response = await axios.get(getApiUrl('/presences'), config);

            const normalizedPresences = (response.data || []).map(p => ({
                id_presence: p.id_presence,
                id_membre: p.id_membre,
                id_activite: p.id_activite,
                statut: p.statut,
                date_heure: p.date_heure,
                remarques: p.remarques,
                membre_nom: p.membre_nom || 'Inconnu',
                membre_prenom: p.membre_prenom || '',
                activite_titre: p.activite_titre || 'Inconnue',
                activite_date: p.activite_date || ''
            }));

            setPresences(normalizedPresences);
            console.log('Présences normalisées:', normalizedPresences);
            setError(null);
        } catch (err) {
            console.error('Erreur lors du chargement des présences:', err);
            setError('Impossible de charger les présences. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchPresences();
    }, [fetchPresences]);

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedPresences(presences.map(p => p.id_presence));
        } else {
            setSelectedPresences([]);
        }
    };

    const handleSelectOne = (event, id) => {
        const selectedIndex = selectedPresences.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selectedPresences, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selectedPresences.slice(1));
        } else if (selectedIndex === selectedPresences.length - 1) {
            newSelected = newSelected.concat(selectedPresences.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selectedPresences.slice(0, selectedIndex),
                selectedPresences.slice(selectedIndex + 1)
            );
        }

        setSelectedPresences(newSelected);
    };

    const isSelected = (id) => selectedPresences.indexOf(id) !== -1;

    const filteredPresences = presences.filter(presence =>
        presence.membre_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        presence.membre_prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        presence.activite_titre?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddPresence = () => {
        navigate('/presences/ajouter');
    };

    const handleEditPresence = (presence) => {
        navigate(`/presences/${presence.id_presence}/modifier`, { state: { presence } });
    };

    const handleDeletePresence = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette présence ?')) {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };

                await axios.delete(getApiUrl(`/presences/${id}`), config);
                fetchPresences();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert('Erreur lors de la suppression de la présence');
            }
        }
    };

    const getStatutColor = (statut) => {
        switch (statut) {
            case 'Présent': return 'success';
            case 'Absent': return 'error';
            case 'Retard': return 'warning';
            default: return 'default';
        }
    };

    const getStatutIcon = (statut) => {
        switch (statut) {
            case 'Présent': return <CheckCircle />;
            case 'Absent': return <Cancel />;
            case 'Retard': return <Schedule />;
            default: return <Schedule />;
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

    const handlePrintPresences = () => {
        const printWindow = window.open('', '_blank');
        const printContent = filteredPresences.map(presence => `
            <tr>
                <td>${presence.membre_nom} ${presence.membre_prenom}</td>
                <td>${presence.activite_titre}</td>
                <td>${formatDate(presence.date_heure)}</td>
                <td>${presence.statut}</td>
                <td>${presence.remarques || '-'}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Liste des Présences - LJMDI</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f5f2; }
                        h1 { color: #558077; }
                    </style>
                </head>
                <body>
                    <h1>Liste des Présences - LJMDI</h1>
                    <p>Imprimé le: ${new Date().toLocaleString()}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Membre</th>
                                <th>Activité</th>
                                <th>Date/Heure</th>
                                <th>Statut</th>
                                <th>Remarques</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${printContent}
                        </tbody>
                    </table>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        setPrintMenuAnchor(null);
    };

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
            <Typography
                variant="h4"
                component="h1"
                gutterBottom
                fontWeight="bold"
                color="primary"
                sx={{
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                    textAlign: { xs: 'center', sm: 'left' }
                }}
            >
                Gestion des Présences
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 2, sm: 0 }
                }}>
                    <TextField
                        label="Rechercher..."
                        variant="outlined"
                        size={isMobile ? 'small' : 'medium'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{
                            minWidth: { xs: '100%', sm: 300 },
                            width: { xs: '100%', sm: 'auto' }
                        }}
                    />
                    <Box sx={{
                        display: 'flex',
                        gap: 1,
                        flexDirection: { xs: 'column', sm: 'row' },
                        width: { xs: '100%', sm: 'auto' }
                    }}>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleAddPresence}
                            sx={{
                                mr: { sm: 1 },
                                width: { xs: '100%', sm: 'auto' },
                                order: { xs: 2, sm: 1 }
                            }}
                        >
                            Ajouter une Présence
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={selectedPresences.length > 0 ? <Print /> : <PrintDisabled />}
                            onClick={(e) => setPrintMenuAnchor(e.currentTarget)}
                            disabled={selectedPresences.length === 0}
                            sx={{
                                width: { xs: '100%', sm: 'auto' },
                                order: { xs: 1, sm: 2 }
                            }}
                        >
                            Imprimer
                        </Button>
                        <Menu
                            anchorEl={printMenuAnchor}
                            open={Boolean(printMenuAnchor)}
                            onClose={() => setPrintMenuAnchor(null)}
                        >
                            <MenuItem onClick={handlePrintPresences}>
                                <ListItemIcon><Print /></ListItemIcon>
                                <ListItemText>Imprimer la sélection</ListItemText>
                            </MenuItem>
                        </Menu>
                    </Box>
                </Box>

                {/* Vue Desktop - Table */}
                {!isMobile && (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            indeterminate={selectedPresences.length > 0 && selectedPresences.length < filteredPresences.length}
                                            checked={filteredPresences.length > 0 && selectedPresences.length === filteredPresences.length}
                                            onChange={handleSelectAll}
                                        />
                                    </TableCell>
                                    <TableCell>Membre</TableCell>
                                    <TableCell>Activité</TableCell>
                                    <TableCell>Date/Heure</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell>Remarques</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredPresences.map((presence) => (
                                    <TableRow
                                        key={presence.id_presence}
                                        hover
                                        selected={isSelected(presence.id_presence)}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={isSelected(presence.id_presence)}
                                                onChange={(event) => handleSelectOne(event, presence.id_presence)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar sx={{ mr: 2, width: 32, height: 32, bgcolor: 'primary.main' }}>
                                                    {presence.membre_nom?.charAt(0)}{presence.membre_prenom?.charAt(0)}
                                                </Avatar>
                                                {presence.membre_nom} {presence.membre_prenom}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{presence.activite_titre}</TableCell>
                                        <TableCell>
                                            {formatDate(presence.date_heure)}
                                        </TableCell>
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    px: 1,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    backgroundColor: presence.statut === 'Présent' ? '#e8f5e8' :
                                                        presence.statut === 'Absent' ? '#ffebee' : '#fff3e0',
                                                    color: presence.statut === 'Présent' ? '#2e7d32' :
                                                        presence.statut === 'Absent' ? '#c62828' : '#ed6c02'
                                                }}
                                            >
                                                {presence.statut}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{presence.remarques || '-'}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    size="small"
                                                    startIcon={<Visibility />}
                                                    onClick={() => navigate(`/presences/${presence.id_presence}`)}
                                                >
                                                    Voir
                                                </Button>
                                                <Button
                                                    size="small"
                                                    startIcon={<Edit />}
                                                    onClick={() => handleEditPresence(presence)}
                                                >
                                                    Modifier
                                                </Button>
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    startIcon={<Delete />}
                                                    onClick={() => handleDeletePresence(presence.id_presence)}
                                                >
                                                    Supprimer
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Vue Mobile - Cards */}
                {isMobile && (
                    <Box sx={{ mt: 2 }}>
                        {filteredPresences.length === 0 && !loading && (
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="h6" color="textSecondary">
                                    Aucune présence trouvée
                                </Typography>
                            </Paper>
                        )}

                        {filteredPresences.map((presence) => (
                            <Card key={presence.id_presence} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Checkbox
                                            checked={isSelected(presence.id_presence)}
                                            onChange={(event) => handleSelectOne(event, presence.id_presence)}
                                            sx={{ mr: 1 }}
                                        />
                                        <Avatar
                                            sx={{
                                                mr: 2,
                                                bgcolor: 'primary.main',
                                                width: 40,
                                                height: 40
                                            }}
                                        >
                                            {presence.membre_nom?.charAt(0)}{presence.membre_prenom?.charAt(0)}
                                        </Avatar>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                                                {presence.membre_nom} {presence.membre_prenom}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(presence.date_heure)}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            icon={getStatutIcon(presence.statut)}
                                            label={presence.statut}
                                            color={getStatutColor(presence.statut)}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Box>

                                    <Grid container spacing={1}>
                                        <Grid item xs={12}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Event sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Activité:
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ ml: 3 }}>
                                                {presence.activite_titre}
                                            </Typography>
                                        </Grid>

                                        {presence.remarques && (
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Remarques:
                                                </Typography>
                                                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                                    {presence.remarques}
                                                </Typography>
                                            </Grid>
                                        )}
                                    </Grid>

                                    <Box sx={{
                                        display: 'flex',
                                        gap: 1,
                                        mt: 2,
                                        justifyContent: 'space-between'
                                    }}>
                                        <IconButton
                                            color="primary"
                                            onClick={() => navigate(`/presences/${presence.id_presence}`)}
                                            sx={{ flex: 1 }}
                                        >
                                            <Visibility />
                                        </IconButton>
                                        <IconButton
                                            color="info"
                                            onClick={() => handleEditPresence(presence)}
                                            sx={{ flex: 1 }}
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDeletePresence(presence.id_presence)}
                                            sx={{ flex: 1 }}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}

                {/* Message d'absence de résultats pour desktop */}
                {!isMobile && filteredPresences.length === 0 && !loading && (
                    <Box textAlign="center" py={4}>
                        <Typography variant="h6" color="textSecondary">
                            Aucune présence trouvée
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default Presences;
