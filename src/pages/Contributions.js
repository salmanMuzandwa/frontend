import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { handleApiError, showErrorNotification, showSuccessNotification } from '../utils/errorHandler';
import {
    Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, CircularProgress, Alert, Button, Box,
    Card, CardContent, Grid, Chip, IconButton, Menu, MenuItem, FormControl,
    InputLabel, Select, TextField, Dialog, DialogTitle, DialogContent,
    DialogActions, Avatar, useMediaQuery, useTheme
} from '@mui/material';
import { Add, Delete, Visibility, FilterList, Print, Refresh, VolunteerActivism, Handshake, CardGiftcard, Campaign, Edit, AccountBalance, TrendingUp, Payment, MonetizationOn } from '@mui/icons-material';

const Contributions = () => {
    const [contributions, setContributions] = useState([]);
    const [members, setMembers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Générer dynamiquement la liste des années (année actuelle - 2 jusqu'à année actuelle + 1)
    const generateYears = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = -2; i <= 1; i++) {
            years.push(currentYear + i);
        }
        return years;
    };

    const [filters, setFilters] = useState({
        annee: new Date().getFullYear(),
        type_contribution: '',
        membre_id: '',
        statut: ''
    });
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [formData, setFormData] = useState({
        donateur_type: 'membre',
        membre_id: '',
        donateur_nom: '',
        donateur_prenom: '',
        donateur_email: '',
        donateur_telephone: '',
        type_contribution: 'mensuelle',
        montant: '',
        devise: 'CDF',
        description: '',
        date_contribution: new Date().toISOString().split('T')[0],
        nature: 'financiere',
        statut: 'recu',
        reference: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const { token } = useAuth();
    const navigate = useNavigate();

    const typesContribution = [
        { value: 'mensuelle', label: 'Mensuelle', icon: <CardGiftcard />, color: '#ff6b6b' },
        { value: 'hebdomadaire', label: 'Hebdomadaire', icon: <VolunteerActivism />, color: '#45b7d1' },
        { value: 'annuelle', label: 'Annuelle', icon: <Handshake />, color: '#4ecdc4' },
        { value: 'speciale', label: 'Spéciale', icon: <Campaign />, color: '#f9ca24' }
    ];

    const natures = [
        { value: 'financiere', label: 'Financière' },
        { value: 'materielle', label: 'Matérielle' },
        { value: 'service', label: 'Service' },
        { value: 'competence', label: 'Compétence' }
    ];

    const fetchContributions = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const response = await api.get(`/contributions?${queryParams}`);
            setContributions(response.data || []);
            setError(null);
        } catch (error) {
            const errorMessage = handleApiError(error, 'fetchContributions');
            setError(errorMessage);
            showErrorNotification(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const fetchMembers = useCallback(async () => {
        try {
            const response = await api.get('/members');
            setMembers(response.data || []);
        } catch (err) {
            console.error("Erreur de chargement des membres:", err);
        }
    }, []); // Correction: useCallback pour éviter les re-rendus infinis

    const fetchStats = useCallback(async () => {
        try {
            const response = await api.get('/contributions/stats');
            setStats(response.data || {});
        } catch (err) {
            console.error("Erreur de chargement des statistiques:", err);
        }
    }, []); // Correction: useCallback pour éviter les re-rendus infinis

    useEffect(() => {
        const loadData = async () => {
            try {
                await Promise.all([
                    fetchContributions(),
                    fetchMembers(),
                    fetchStats()
                ]);
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
            }
        };
        loadData();
    }, [token, filters, fetchContributions, fetchMembers, fetchStats]); // Correction: ajout des dépendances manquantes

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAddContribution = async () => {
        setSubmitting(true);
        try {
            const payload = {
                membre_id: formData.donateur_type === 'membre' ? formData.membre_id : null,
                type_contribution: formData.type_contribution,
                nature: formData.nature,
                date_contribution: formData.date_contribution,
                statut: formData.statut,
                description: formData.description,
                reference: formData.reference,
                montant: formData.nature === 'financiere' ? (parseFloat(formData.montant) || 0) : null,
                devise: formData.nature === 'financiere' ? 'CDF' : null,
                donateur_nom: formData.donateur_type === 'externe' ? formData.donateur_nom : null,
                donateur_prenom: formData.donateur_type === 'externe' ? formData.donateur_prenom : null,
                donateur_email: formData.donateur_type === 'externe' ? formData.donateur_email : null,
                donateur_telephone: formData.donateur_type === 'externe' ? formData.donateur_telephone : null,
            };

            await api.post('/contributions', payload);
            setShowAddDialog(false);
            await fetchContributions();
            await fetchStats();
            showSuccessNotification('Transaction financière enregistrée avec succès!');

            setFormData({
                membre_id: '',
                type_contribution: 'mensuelle',
                montant: '',
                devise: 'CDF',
                description: '',
                date_contribution: new Date().toISOString().split('T')[0],
                nature: 'financiere',
                statut: 'recu',
                reference: '',
                donateur_type: 'membre',
                donateur_nom: '',
                donateur_prenom: '',
                donateur_email: '',
                donateur_telephone: ''
            });
        } catch (error) {
            const errorMessage = handleApiError(error, 'handleAddContribution');
            setError(errorMessage);
            showErrorNotification(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (contributionId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette transaction financière ?')) {
            try {
                await api.delete(`/contributions/${contributionId}`);
                setContributions(prev => prev.filter(c => (c.id_contribution || c.id) !== contributionId));
                fetchStats();
                showSuccessNotification('Transaction supprimée avec succès!');
            } catch (error) {
                const errorMessage = handleApiError(error, 'handleDelete');
                setError(errorMessage);
                showErrorNotification(errorMessage);
            }
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString('fr-FR');
    };

    const normalizeType = (type) => {
        if (!type) return '';
        return type
            .toString()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .toLowerCase();
    };

    const getTypeInfo = (type) => {
        const normalized = normalizeType(type);
        const typeInfo = typesContribution.find(t => t.value === normalized);
        return typeInfo || { label: type || 'Inconnu', icon: <CardGiftcard />, color: '#666' };
    };

    const getNatureLabel = (nature) => {
        const natureInfo = natures.find(n => n.value === nature);
        return natureInfo ? natureInfo.label : nature;
    };

    const formatMontant = (montant) => {
        if (!montant || montant === 0) return '0 FC';
        return `${parseFloat(montant).toLocaleString('fr-FR')} FC`;
    };

    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    const printContributions = () => {
        const printWindow = window.open('', '_blank');
        const currentDate = new Date().toLocaleDateString('fr-FR');

        const totauxParDevise = {};
        contributions.forEach(c => {
            if (c.nature === 'financiere' && c.montant) {
                const devise = c.devise || 'CDF';
                if (!totauxParDevise[devise]) {
                    totauxParDevise[devise] = 0;
                }
                totauxParDevise[devise] += parseFloat(c.montant);
            }
        });

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Relevé Financier - LJMDI</title>
                <style>
                    @page { size: A6; margin: 10mm; }
                    body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { margin: 0; color: #19d279; }
                    .header p { margin: 5px 0; color: #666; }
                    .date { text-align: right; margin-bottom: 20px; font-style: italic; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .total { margin-top: 10px; font-weight: bold; text-align: right; font-size: 11px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Relevé Financier - LJMDI</h1>
                    <p>Système de Gestion Financière</p>
                </div>
                <div class="date">Date d'impression: ${currentDate}</div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Membre/Donateur</th>
                            <th>Type</th>
                            <th>Nature</th>
                            <th>Montant</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${contributions.map(c => `
                            <tr>
                                <td>${escapeHtml(formatDate(c.date_contribution))}</td>
                                <td>${escapeHtml(c.membre_id ? `${c.nom || ''} ${c.prenom || ''}` : `${c.donateur_nom || ''} ${c.donateur_prenom || ''}`)}</td>
                                <td>${escapeHtml(getTypeInfo(c.type_contribution).label)}</td>
                                <td>${escapeHtml(getNatureLabel(c.nature))}</td>
                                <td>${c.nature === 'financiere' ? `${escapeHtml(c.montant || 0)} ${escapeHtml(c.devise || 'CDF')}` : '-'}</td>
                                <td><span style="color: ${c.statut === 'recu' ? 'green' : 'orange'}">${escapeHtml(c.statut)}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="total">
                    <strong>Totaux par devise:</strong><br>
                    ${Object.entries(totauxParDevise).map(([devise, montant]) =>
            `${montant.toFixed(2)} ${devise}`
        ).join(' | ')}
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    return (
        <Container sx={{ mt: { xs: 2, sm: 3, md: 4 } }}>
            <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                    textAlign: { xs: 'center', sm: 'left' }
                }}
            >
                Gestion Financière
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Suivi complet des revenus, dépenses et transactions financières de l'association
            </Typography>

            {/* Statistiques */}
            {stats && (
                <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    color="primary"
                                    sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}
                                >
                                    Revenus Année {stats.anneeActuelle}
                                </Typography>
                                <Typography variant="h4" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2.125rem' } }}>
                                    {stats.totauxParDevise ? (
                                        <Box>
                                            {stats.totauxParDevise.CDF && (
                                                <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>
                                                    {stats.totauxParDevise.CDF} CDF
                                                </Typography>
                                            )}
                                            {stats.totauxParDevise.USD && (
                                                <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>
                                                    {stats.totauxParDevise.USD} USD
                                                </Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        `${stats.totalAnnee} $`
                                    )}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    color="success"
                                    sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}
                                >
                                    Total Transactions
                                </Typography>
                                <Typography variant="h4" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2.125rem' } }}>
                                    {stats.totalContributions}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    color="info.main"
                                    sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}
                                >
                                    Entrées Financières
                                </Typography>
                                <Typography variant="h4" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2.125rem' } }}>
                                    {stats.donsParDevise ? (
                                        <Box>
                                            {stats.donsParDevise.CDF && (
                                                <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>
                                                    {stats.donsParDevise.CDF} CDF
                                                </Typography>
                                            )}
                                            {stats.donsParDevise.USD && (
                                                <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>
                                                    {stats.donsParDevise.USD} USD
                                                </Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        `${stats.totalDons} $`
                                    )}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    color="warning.main"
                                    sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}
                                >
                                    Services & Bénévolat
                                </Typography>
                                <Typography variant="h4" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2.125rem' } }}>
                                    {stats.totalBenevolat}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Actions */}
            <Box sx={{
                display: 'flex',
                gap: { xs: 1, sm: 2 },
                mb: 2,
                flexWrap: 'wrap',
                flexDirection: { xs: 'column', sm: 'row' }
            }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={() => setShowAddDialog(true)}
                    sx={{
                        bgcolor: '#19d279',
                        '&:hover': { bgcolor: '#12a85e' },
                        width: { xs: '100%', sm: 'auto' },
                        order: { xs: 2, sm: 1 }
                    }}
                >
                    Ajouter une Transaction
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                    sx={{
                        width: { xs: '100%', sm: 'auto' },
                        order: { xs: 3, sm: 2 }
                    }}
                >
                    Filtrer
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={printContributions}
                    sx={{
                        width: { xs: '100%', sm: 'auto' },
                        order: { xs: 4, sm: 3 }
                    }}
                >
                    Imprimer
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={fetchContributions}
                    sx={{
                        width: { xs: '100%', sm: 'auto' },
                        order: { xs: 5, sm: 4 }
                    }}
                >
                    Actualiser
                </Button>
            </Box>

            {/* Menu des filtres */}
            <Menu
                anchorEl={filterMenuAnchor}
                open={Boolean(filterMenuAnchor)}
                onClose={() => setFilterMenuAnchor(null)}
                PaperProps={{
                    sx: {
                        width: { xs: '90vw', sm: 300 },
                        maxWidth: 300
                    }
                }}
            >
                <Box sx={{ p: 2, minWidth: 250 }}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Année</InputLabel>
                        <Select
                            value={filters.annee}
                            onChange={(e) => handleFilterChange('annee', e.target.value)}
                            label="Année"
                            size={isMobile ? 'small' : 'medium'}
                        >
                            {generateYears().map(year => (
                                <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Type de Contribution</InputLabel>
                        <Select
                            value={filters.type_contribution}
                            onChange={(e) => handleFilterChange('type_contribution', e.target.value)}
                            label="Type de Contribution"
                            size={isMobile ? 'small' : 'medium'}
                        >
                            <MenuItem value="">Tous</MenuItem>
                            {typesContribution.map(type => (
                                <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Statut</InputLabel>
                        <Select
                            value={filters.statut}
                            onChange={(e) => handleFilterChange('statut', e.target.value)}
                            label="Statut"
                            size={isMobile ? 'small' : 'medium'}
                        >
                            <MenuItem value="">Tous</MenuItem>
                            <MenuItem value="recu">Reçu</MenuItem>
                            <MenuItem value="en_attente">En attente</MenuItem>
                            <MenuItem value="annule">Annulé</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Menu>

            {loading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

            {!loading && !error && (
                <>
                    {/* Vue Desktop - Table */}
                    {!isMobile && (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Membre</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Nature</TableCell>
                                        <TableCell>Montant/Valeur</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {contributions.map((contribution) => {
                                        const typeInfo = getTypeInfo(contribution.type_contribution);
                                        const rowId = contribution.id_contribution || contribution.id;
                                        return (
                                            <TableRow key={rowId} hover>
                                                <TableCell>{formatDate(contribution.date_contribution)}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar sx={{ width: 32, height: 32, bgcolor: typeInfo.color }}>
                                                            {typeInfo.icon}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                {contribution.nom || contribution.donateur_nom || 'N/A'} {contribution.prenom || contribution.donateur_prenom || ''}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {contribution.email || contribution.donateur_email || 'N/A'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        {typeInfo.icon}
                                                        <Typography variant="body2">
                                                            {typeInfo.label}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{getNatureLabel(contribution.nature)}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="bold" color="primary">
                                                        {contribution.nature === 'financiere' ? formatMontant(contribution.montant) : (contribution.montant || 'N/A')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {contribution.description || 'N/A'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => navigate(`/contributions/edit/${rowId}`)}
                                                        >
                                                            <Edit />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigate(`/contributions/${rowId}`)}
                                                        >
                                                            <Visibility />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDelete(rowId)}
                                                        >
                                                            <Delete />
                                                        </IconButton>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {/* Vue Mobile - Cards */}
                    {isMobile && (
                        <Box sx={{ mt: 2 }}>
                            {contributions.length === 0 ? (
                                <Paper sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography>Aucune contribution trouvée.</Typography>
                                </Paper>
                            ) : (
                                contributions.map((contribution) => {
                                    const typeInfo = getTypeInfo(contribution.type_contribution);
                                    const rowId = contribution.id_contribution || contribution.id;
                                    return (
                                        <Card key={rowId} sx={{ mb: 2 }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <Avatar
                                                        sx={{
                                                            mr: 2,
                                                            bgcolor: typeInfo.color,
                                                            width: 40,
                                                            height: 40
                                                        }}
                                                    >
                                                        {typeInfo.icon}
                                                    </Avatar>
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                                                            {contribution.nom || contribution.donateur_nom || 'N/A'} {contribution.prenom || contribution.donateur_prenom || ''}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {formatDate(contribution.date_contribution)}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={typeInfo.label}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                </Box>

                                                <Grid container spacing={1}>
                                                    <Grid item xs={12}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Nature:
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {getNatureLabel(contribution.nature)}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Montant/Valeur:
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight="bold" color="primary">
                                                            {contribution.nature === 'financiere' ? formatMontant(contribution.montant) : (contribution.montant || 'N/A')}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Description:
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                                            {contribution.description || 'N/A'}
                                                        </Typography>
                                                    </Grid>
                                                    {contribution.email && (
                                                        <Grid item xs={12}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Email:
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                                                {contribution.email}
                                                            </Typography>
                                                        </Grid>
                                                    )}
                                                </Grid>

                                                <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'space-between' }}>
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => navigate(`/contributions/edit/${rowId}`)}
                                                        sx={{ flex: 1 }}
                                                    >
                                                        <Edit />
                                                    </IconButton>
                                                    <IconButton
                                                        color="info"
                                                        onClick={() => navigate(`/contributions/${rowId}`)}
                                                        sx={{ flex: 1 }}
                                                    >
                                                        <Visibility />
                                                    </IconButton>
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => handleDelete(rowId)}
                                                        sx={{ flex: 1 }}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </Box>
                    )}
                </>
            )}

            {/* Dialog d'ajout de contribution */}
            <Dialog
                open={showAddDialog}
                onClose={() => setShowAddDialog(false)}
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
                    Nouvelle Transaction Financière
                </DialogTitle>
                <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
                    <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                                <InputLabel>Type de donateur</InputLabel>
                                <Select
                                    value={formData.donateur_type}
                                    label="Type de donateur"
                                    onChange={(e) => setFormData(prev => ({ ...prev, donateur_type: e.target.value, membre_id: '' }))}
                                >
                                    <MenuItem value="membre">Membre de l'association</MenuItem>
                                    <MenuItem value="externe">Donateur externe</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            {formData.donateur_type === 'membre' ? (
                                <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                                    <InputLabel>Membre</InputLabel>
                                    <Select
                                        value={formData.membre_id}
                                        onChange={(e) => setFormData(prev => ({ ...prev, membre_id: e.target.value }))}
                                        label="Membre"
                                    >
                                        {members.map(member => (
                                            <MenuItem key={member.id} value={member.id}>
                                                {member.nom} {member.prenom} ({member.member_id || `#${member.id}`})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            ) : (
                                <TextField
                                    label="Nom du donateur"
                                    value={formData.donateur_nom}
                                    onChange={(e) => setFormData(prev => ({ ...prev, donateur_nom: e.target.value }))}
                                    required
                                    fullWidth
                                    size={isMobile ? 'small' : 'medium'}
                                />
                            )}
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Prénom du donateur"
                                value={formData.donateur_prenom}
                                onChange={(e) => setFormData(prev => ({ ...prev, donateur_prenom: e.target.value }))}
                                fullWidth
                                size={isMobile ? 'small' : 'medium'}
                            />
                        </Grid>
                        {formData.donateur_type === 'externe' && (
                            <>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Email du donateur (optionnel)"
                                        type="email"
                                        value={formData.donateur_email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, donateur_email: e.target.value }))}
                                        fullWidth
                                        size={isMobile ? 'small' : 'medium'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Téléphone du donateur (optionnel)"
                                        value={formData.donateur_telephone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, donateur_telephone: e.target.value }))}
                                        fullWidth
                                        size={isMobile ? 'small' : 'medium'}
                                    />
                                </Grid>
                            </>
                        )}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                                <InputLabel>Type de Contribution</InputLabel>
                                <Select
                                    value={formData.type_contribution}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type_contribution: e.target.value }))}
                                    label="Type de Contribution"
                                >
                                    {typesContribution.map(type => (
                                        <MenuItem key={type.value} value={type.value}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {type.icon}
                                                {type.label}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                                <InputLabel>Nature</InputLabel>
                                <Select
                                    value={formData.nature}
                                    onChange={(e) => setFormData(prev => ({ ...prev, nature: e.target.value }))}
                                    label="Nature"
                                >
                                    {natures.map(nature => (
                                        <MenuItem key={nature.value} value={nature.value}>
                                            {nature.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Montant (FC)"
                                type={formData.nature === 'financiere' ? 'number' : 'text'}
                                value={formData.montant}
                                onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
                                required={formData.nature === 'financiere'}
                                fullWidth
                                size={isMobile ? 'small' : 'medium'}
                                helperText={formData.nature === 'financiere' ? 'Entrez le montant en Francs congolais' : 'Décrivez la valeur matérielle ou le service'}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Description"
                                multiline
                                rows={isMobile ? 2 : 3}
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                fullWidth
                                size={isMobile ? 'small' : 'medium'}
                                helperText="Décrivez en détail la contribution (objet du don, type de service, etc.)"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Date de Contribution"
                                type="date"
                                value={formData.date_contribution}
                                onChange={(e) => setFormData(prev => ({ ...prev, date_contribution: e.target.value }))}
                                fullWidth
                                size={isMobile ? 'small' : 'medium'}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                                <InputLabel>Statut</InputLabel>
                                <Select
                                    value={formData.statut}
                                    onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value }))}
                                    label="Statut"
                                >
                                    <MenuItem value="recu">Reçu</MenuItem>
                                    <MenuItem value="en_attente">En attente</MenuItem>
                                    <MenuItem value="annule">Annulé</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Référence"
                                value={formData.reference}
                                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                                fullWidth
                                size={isMobile ? 'small' : 'medium'}
                                helperText="Numéro de reçu, référence de transaction, etc."
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
                    <Button
                        onClick={() => setShowAddDialog(false)}
                        size={isMobile ? 'small' : 'medium'}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleAddContribution}
                        variant="contained"
                        disabled={submitting || (formData.donateur_type === 'membre' && !formData.membre_id) || (formData.donateur_type === 'externe' && !formData.donateur_nom) || (formData.nature === 'financiere' && !formData.montant)}
                        sx={{ bgcolor: '#19d279', '&:hover': { bgcolor: '#12a85e' } }}
                        size={isMobile ? 'small' : 'medium'}
                    >
                        {submitting ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Contributions;
