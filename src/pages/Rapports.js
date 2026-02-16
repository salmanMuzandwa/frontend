import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TextField,
    Avatar,
    useMediaQuery,
    useTheme,
    Container
} from '@mui/material';
import {
    Assessment as AssessmentIcon,
    Download as DownloadIcon,
    Email as EmailIcon,
} from '@mui/icons-material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { getProfilePhotoUrl } from '../utils/urlHelper';
import api from '../api/axiosConfig';
import axios from 'axios';

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#0288d1', '#d32f2f'];

const formatDataForCharts = (rawData) => {
    if (!rawData) return null;

    const formatted = { ...rawData };

    // Gérer les données financières
    if (formatted.evolutionMensuelle) {
        formatted.evolutionMensuelle = formatted.evolutionMensuelle
            .map(item => ({
                ...item,
                recettes: Number(item.recettes) || 0,
                depenses: Number(item.depenses) || 0,
                solde: Number(item.solde) || 0
            }));
    }

    // Gérer les données de membres
    if (formatted.membresParRole) {
        formatted.membresParRole = formatted.membresParRole
            .map(item => ({
                ...item,
                count: Number(item.count) || 0,
                pourcentage: Number(item.pourcentage) || 0
            }));
    }

    if (formatted.evolutionMembres) {
        formatted.evolutionMembres = formatted.evolutionMembres
            .map(item => ({
                ...item,
                total: Number(item.total) || 0,
                nouveaux: Number(item.nouveaux) || 0,
                actifs: Number(item.actifs) || 0
            }));
    }

    // Gérer les données d'activités
    if (formatted.activitesByType) {
        formatted.activitesByType = formatted.activitesByType
            .map(item => ({
                ...item,
                count: Number(item.count) || 0,
                participation: Number(item.participation) || 0
            }));
    }

    // Gérer les données de présences
    if (formatted.presencesByMembre) {
        formatted.presencesByMembre = formatted.presencesByMembre
            .map(item => ({
                ...item,
                presences: Number(item.presences) || 0,
                absences: Number(item.absences) || 0,
                taux: Number(item.taux) || 0
            }));
    }

    if (formatted.evolutionPresences) {
        formatted.evolutionPresences = formatted.evolutionPresences
            .map(item => ({
                ...item,
                presences: Number(item.presences) || 0,
                absences: Number(item.absences) || 0,
                taux: Number(item.taux) || 0
            }));
    }

    // Gérer les données globales
    if (formatted.sections) {
        if (formatted.sections.financier?.evolution) {
            formatted.sections.financier.evolution = formatted.sections.financier.evolution
                .map(item => ({
                    ...item,
                    recettes: Number(item.recettes) || 0,
                    depenses: Number(item.depenses) || 0
                }));
        }

        if (formatted.sections.presences?.evolution) {
            formatted.sections.presences.evolution = formatted.sections.presences.evolution
                .map(item => ({
                    ...item,
                    taux: Number(item.taux) || 0
                }));
        }
    }

    // S'assurer que les nombres sont bien des nombres
    if (formatted.tauxParticipation !== undefined) {
        formatted.tauxParticipation = Number(formatted.tauxParticipation) || 0;
    }

    if (formatted.totalContributions !== undefined) {
        formatted.totalContributions = Number(formatted.totalContributions) || 0;
    }

    if (formatted.totalDepenses !== undefined) {
        formatted.totalDepenses = Number(formatted.totalDepenses) || 0;
    }

    if (formatted.solde !== undefined) {
        formatted.solde = Number(formatted.solde) || 0;
    }

    return formatted;
};

export default function Rapports() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rapportType, setRapportType] = useState('financier');
    const [periode, setPeriode] = useState('mois');
    const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0]);
    const [dateFin, setDateFin] = useState(new Date().toISOString().split('T')[0]);
    const [rapportData, setRapportData] = useState(null);
    const { hasPermission } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const typesRapport = [
        { value: 'financier', label: 'Rapport Financier' },
        { value: 'membres', label: 'Rapport des Membres' },
        { value: 'activites', label: 'Rapport des Activités' },
        { value: 'presences', label: 'Rapport des Présences' },
        { value: 'global', label: 'Rapport Global' },
    ];

    const periodes = [
        { value: 'semaine', label: 'Cette Semaine' },
        { value: 'mois', label: 'Ce Mois' },
        { value: 'trimestre', label: 'Ce Trimestre' },
        { value: 'annee', label: 'Cette Année' },
        { value: 'personnalise', label: 'Période Personnalisée' },
    ];

    useEffect(() => {
        if (periode !== 'personnalise') {
            const now = new Date();
            let debut, fin;

            switch (periode) {
                case 'semaine':
                    debut = new Date();
                    debut.setDate(now.getDate() - 7);
                    fin = new Date();
                    break;
                case 'mois':
                    debut = new Date(now.getFullYear(), now.getMonth(), 1);
                    fin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    break;
                case 'trimestre':
                    const currentMonth = now.getMonth();
                    const quarterStart = Math.floor(currentMonth / 3) * 3;
                    debut = new Date(now.getFullYear(), quarterStart, 1);
                    fin = new Date(now.getFullYear(), quarterStart + 3, 0);
                    break;
                case 'annee':
                    debut = new Date(now.getFullYear(), 0, 1);
                    fin = new Date(now.getFullYear(), 11, 31);
                    break;
                default:
                    debut = new Date();
                    debut.setDate(now.getDate() - 30);
                    fin = new Date();
            }

            setDateDebut(debut.toISOString().split('T')[0]);
            setDateFin(fin.toISOString().split('T')[0]);
        }
    }, [periode]);

    const generateRapport = useCallback(async () => {
        if (!hasPermission('rapports')) {
            setError('Vous n\'avez pas les permissions pour générer des rapports');
            return;
        }

        setLoading(true);
        setError('');
        setRapportData(null);

        try {
            const params = {
                type: rapportType,
                periode: periode,
                dateDebut,
                dateFin
            };

            const response = await api.get('/rapports/generate', { params });
            const formattedData = formatDataForCharts(response.data);
            setRapportData(formattedData);
        } catch (error) {
            console.error('Erreur lors de la génération du rapport:', error);
            setError('Erreur lors de la génération du rapport. Veuillez réessayer.');
            setRapportData(null);
        } finally {
            setLoading(false);
        }
    }, [hasPermission, rapportType, periode, dateDebut, dateFin]);

    const exportRapport = async (format) => {
        try {
            const params = {
                type: rapportType,
                periode: periode,
                dateDebut,
                dateFin,
                format: format
            };

            const response = await api.get('/rapports/export', {
                params,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `rapport_${rapportType}_${new Date().toISOString().split('T')[0]}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            setError('Erreur lors de l\'export du rapport');
        }
    };

    const sendRapportEmail = async () => {
        try {
            await api.post('/rapports/send-email', {
                type: rapportType,
                periode: periode,
                dateDebut,
                dateFin
            });
            alert('Rapport envoyé par email avec succès');
        } catch (error) {
            setError('Erreur lors de l\'envoi par email');
        }
    };

    useEffect(() => {
        if (hasPermission('rapports')) {
            generateRapport();
        }
    }, [hasPermission, generateRapport]);

    const renderFinancierRapport = () => (
        <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
            <Grid item xs={12} md={8}>
                <Card sx={{ height: '100%' }}>
                    <CardContent>
                        <Typography
                            variant="h6"
                            gutterBottom
                            color="primary"
                            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                        >
                            Évolution des Contributions
                        </Typography>
                        <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
                            <AreaChart data={rapportData?.contributionsEvolution || []}>
                                <defs>
                                    <linearGradient id="colorMontant" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="periode" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="montant" stroke="#1976d2" fillOpacity={1} fill="url(#colorMontant)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                    <CardContent>
                        <Typography
                            variant="h6"
                            gutterBottom
                            color="primary"
                            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                        >
                            Répartition des Dépenses
                        </Typography>
                        <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
                            <PieChart>
                                <Pie
                                    data={rapportData?.depensesRepartition || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={isMobile ? 40 : 60}
                                    outerRadius={isMobile ? 70 : 90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {(rapportData?.depensesRepartition || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography
                            variant="h6"
                            gutterBottom
                            color="primary"
                            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                        >
                            Résumé Financier
                        </Typography>
                        <TableContainer>
                            <Table sx={{ minWidth: { xs: 300, sm: 650 } }}>
                                <TableHead sx={{ bgcolor: 'action.hover' }}>
                                    <TableRow>
                                        <TableCell><b>Période</b></TableCell>
                                        <TableCell align="right"><b>Contributions</b></TableCell>
                                        <TableCell align="right"><b>Dépenses</b></TableCell>
                                        <TableCell align="right"><b>Solde</b></TableCell>
                                        <TableCell align="center"><b>Membres Actifs</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rapportData?.resumeFinancier?.map((row, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell>{row.periode}</TableCell>
                                            <TableCell align="right">
                                                <Typography color="success.main" variant="body2">{row.contributions} $</Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography color="error.main" variant="body2">{row.depenses} $</Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    label={`${row.solde} $`}
                                                    color={row.solde >= 0 ? 'success' : 'error'}
                                                    variant="filled"
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="center">{row.membresActifs}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(!rapportData?.resumeFinancier || rapportData.resumeFinancier.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">
                                                Aucune donnée financière pour cette période
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderMembresRapport = () => (
        <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
            <Grid item xs={12} md={8}>
                <Card sx={{ height: '100%' }}>
                    <CardContent>
                        <Typography
                            variant="h6"
                            gutterBottom
                            color="primary"
                            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                        >
                            Évolution des Adhésions
                        </Typography>
                        <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
                            <AreaChart data={rapportData?.adhesionsEvolution || []}>
                                <defs>
                                    <linearGradient id="colorMembres" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#2e7d32" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="periode" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="nouveauxMembres" stroke="#2e7d32" fillOpacity={1} fill="url(#colorMembres)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                    <CardContent>
                        <Typography
                            variant="h6"
                            gutterBottom
                            color="primary"
                            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                        >
                            Répartition par Rôle
                        </Typography>
                        <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
                            <PieChart>
                                <Pie
                                    data={rapportData?.statutsRepartition || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={isMobile ? 40 : 60}
                                    outerRadius={isMobile ? 70 : 90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {(rapportData?.statutsRepartition || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography
                            variant="h6"
                            gutterBottom
                            color="primary"
                            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                        >
                            Liste des Nouveaux Membres
                        </Typography>
                        <TableContainer>
                            <Table size={isMobile ? 'small' : 'medium'}>
                                <TableHead sx={{ bgcolor: 'action.hover' }}>
                                    <TableRow>
                                        <TableCell><b>Membre</b></TableCell>
                                        <TableCell><b>Email</b></TableCell>
                                        <TableCell><b>Role</b></TableCell>
                                        <TableCell align="right"><b>Date Adhésion</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rapportData?.listeMembres?.length > 0 ? (
                                        rapportData.listeMembres.map((membre, index) => (
                                            <TableRow key={index} hover>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Avatar
                                                            src={membre.photo_url ? (membre.photo_url.startsWith('http') || membre.photo_url.startsWith('data:') ? membre.photo_url : getProfilePhotoUrl(membre.photo_url)) : undefined}
                                                            sx={{ mr: 1, width: 32, height: 32, fontSize: '0.85rem', bgcolor: 'primary.main' }}
                                                        >
                                                            {membre.nom?.charAt(0)}{membre.prenom?.charAt(0)}
                                                        </Avatar>
                                                        <Typography variant="body2">{membre.nom} {membre.prenom}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{membre.email}</TableCell>
                                                <TableCell>
                                                    <Chip label={membre.role} size="small" variant="outlined" color="primary" />
                                                </TableCell>
                                                <TableCell align="right">{new Date(membre.date_creation).toLocaleDateString('fr-FR')}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">
                                                Aucun nouveau membre trouvé pour cette période
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderActivitesRapport = () => (
        <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
            <Grid item xs={12} md={7}>
                <Card sx={{ height: '100%' }}>
                    <CardContent>
                        <Typography
                            variant="h6"
                            gutterBottom
                            color="primary"
                            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                        >
                            Volume d'Activités par Type
                        </Typography>
                        <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
                            <BarChart data={rapportData?.activitesParType || []} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="type" type="category" width={isMobile ? 80 : 100} />
                                <Tooltip />
                                <Bar dataKey="nombre" fill="#ed6c02" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={5}>
                <Card sx={{ height: '100%' }}>
                    <CardContent>
                        <Typography
                            variant="h6"
                            gutterBottom
                            color="primary"
                            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                        >
                            Statistiques Rapides
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 2 }}>
                                <Typography
                                    variant="h3"
                                    align="center"
                                    sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
                                >
                                    {rapportData?.totalActivites || 0}
                                </Typography>
                                <Typography
                                    variant="h6"
                                    align="center"
                                    sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                                >
                                    Activités Totales
                                </Typography>
                            </Paper>
                            <Box sx={{ p: 1 }}>
                                {rapportData?.activitesParType?.map((row, index) => (
                                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, borderBottom: '1px solid #eee', pb: 0.5 }}>
                                        <Typography variant="body1">{row.type}</Typography>
                                        <Typography variant="body1"><b>{row.nombre}</b></Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography
                            variant="h6"
                            gutterBottom
                            color="primary"
                            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                        >
                            Historique des Activités de la Période
                        </Typography>
                        <TableContainer>
                            <Table size={isMobile ? 'small' : 'medium'}>
                                <TableHead sx={{ bgcolor: 'action.hover' }}>
                                    <TableRow>
                                        <TableCell><b>Titre</b></TableCell>
                                        <TableCell><b>Type</b></TableCell>
                                        <TableCell><b>Date</b></TableCell>
                                        <TableCell align="center"><b>Statut</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rapportData?.listeActivites?.length > 0 ? (
                                        rapportData.listeActivites.map((activite, index) => (
                                            <TableRow key={index} hover>
                                                <TableCell><b>{activite.titre}</b></TableCell>
                                                <TableCell>
                                                    <Chip label={activite.type} size="small" variant="outlined" />
                                                </TableCell>
                                                <TableCell>{new Date(activite.date_debut).toLocaleDateString('fr-FR')}</TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={activite.statut}
                                                        size="small"
                                                        color={activite.statut === 'Terminé' ? 'success' : 'primary'}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">
                                                Aucune activité trouvée pour cette période
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderPresencesRapport = () => (
        <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography
                            variant="h6"
                            gutterBottom
                            color="primary"
                            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                        >
                            Taux de Participation par Activité
                        </Typography>
                        <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
                            <BarChart data={rapportData?.tauxParticipation || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="activite" />
                                <YAxis unit="%" />
                                <Tooltip formatter={(value) => [`${value}%`, 'Taux']} />
                                <Bar dataKey="taux" fill="#9c27b0" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography
                            variant="h6"
                            gutterBottom
                            color="primary"
                            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                        >
                            Top 10 des Membres les plus Présents
                        </Typography>
                        <TableContainer>
                            <Table size={isMobile ? 'small' : 'medium'}>
                                <TableHead sx={{ bgcolor: 'action.hover' }}>
                                    <TableRow>
                                        <TableCell><b>Membre</b></TableCell>
                                        <TableCell align="center"><b>Taux</b></TableCell>
                                        <TableCell align="right"><b>Présences</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(rapportData?.classementMembres || []).slice(0, 10).map((membre, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar
                                                        src={membre.photo_url ? (membre.photo_url.startsWith('http') || membre.photo_url.startsWith('data:') ? membre.photo_url : getProfilePhotoUrl(membre.photo_url)) : undefined}
                                                        sx={{ mr: 1, width: 32, height: 32, fontSize: '0.85rem', bgcolor: 'primary.main' }}
                                                    >
                                                        {membre.nom?.charAt(0)}{membre.prenom?.charAt(0)}
                                                    </Avatar>
                                                    <Typography variant="body2">{membre.nom} {membre.prenom}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={`${membre.taux}%`}
                                                    color={membre.taux >= 80 ? 'success' : membre.taux >= 60 ? 'warning' : 'error'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">{membre.presences || membre.presentes}/{membre.total}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(!rapportData?.classementMembres || rapportData.classementMembres.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center">
                                                Aucune donnée de présence disponible
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderRapportContent = () => {
        if (loading) return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: { xs: 4, sm: 8 }
            }}>
                <CircularProgress size={60} />
                <Typography sx={{ mt: 2 }}>
                    Génération du rapport en cours...
                </Typography>
            </Box>
        );

        if (!rapportData) return (
            <Typography
                align="center"
                variant="h6"
                color="text.secondary"
                sx={{ mt: { xs: 6, sm: 10 } }}
            >
                Cliquez sur "Générer" pour visualiser les données.
            </Typography>
        );

        switch (rapportType) {
            case 'financier': return renderFinancierRapport();
            case 'membres': return renderMembresRapport();
            case 'activites': return renderActivitesRapport();
            case 'presences': return renderPresencesRapport();
            case 'global':
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 4, sm: 6 } }}>
                        <Box>
                            <Typography
                                variant="h5"
                                sx={{
                                    mb: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: { xs: '1.2rem', sm: '1.5rem' }
                                }}
                                color="primary"
                            >
                                <AssessmentIcon sx={{ mr: 1 }} /> Finances
                            </Typography>
                            {renderFinancierRapport()}
                        </Box>
                        <Box>
                            <Typography
                                variant="h5"
                                sx={{
                                    mb: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: { xs: '1.2rem', sm: '1.5rem' }
                                }}
                                color="primary"
                            >
                                <AssessmentIcon sx={{ mr: 1 }} /> Membres
                            </Typography>
                            {renderMembresRapport()}
                        </Box>
                        <Box>
                            <Typography
                                variant="h5"
                                sx={{
                                    mb: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: { xs: '1.2rem', sm: '1.5rem' }
                                }}
                                color="primary"
                            >
                                <AssessmentIcon sx={{ mr: 1 }} /> Activités
                            </Typography>
                            {renderActivitesRapport()}
                        </Box>
                        <Box>
                            <Typography
                                variant="h5"
                                sx={{
                                    mb: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: { xs: '1.2rem', sm: '1.5rem' }
                                }}
                                color="primary"
                            >
                                <AssessmentIcon sx={{ mr: 1 }} /> Présences
                            </Typography>
                            {renderPresencesRapport()}
                        </Box>
                    </Box>
                );
            default: return <Typography>Aucun rapport sélectionné</Typography>;
        }
    };

    if (!hasPermission('rapports')) {
        return <Alert severity="warning" sx={{ m: 2 }}>Vous n'avez pas les permissions pour accéder aux rapports.</Alert>;
    }

    return (
        <Container maxWidth="xl" sx={{ pb: 5 }}>
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
                    fontWeight="bold"
                    sx={{
                        fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                        textAlign: { xs: 'center', sm: 'left' }
                    }}
                >
                    Rapports et Statistiques
                </Typography>
                <Box sx={{
                    display: 'flex',
                    gap: 1,
                    flexDirection: { xs: 'column', sm: 'row' },
                    width: { xs: '100%', sm: 'auto' }
                }}>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => exportRapport('pdf')}
                        disabled={!rapportData}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                        PDF
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => exportRapport('excel')}
                        disabled={!rapportData}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                        Excel
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 4, borderRadius: 2 }}>
                <Grid container spacing={{ xs: 1, sm: 2 }} alignItems="center">
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                            <InputLabel>Type de Rapport</InputLabel>
                            <Select value={rapportType} onChange={(e) => setRapportType(e.target.value)} label="Type de Rapport">
                                {typesRapport.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                            <InputLabel>Période</InputLabel>
                            <Select value={periode} onChange={(e) => setPeriode(e.target.value)} label="Période">
                                {periodes.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    {periode === 'personnalise' && (
                        <>
                            <Grid item xs={12} sm={6} md={2}>
                                <TextField
                                    fullWidth
                                    label="Date Début"
                                    type="date"
                                    value={dateDebut}
                                    onChange={(e) => setDateDebut(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    size={isMobile ? 'small' : 'medium'}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <TextField
                                    fullWidth
                                    label="Date Fin"
                                    type="date"
                                    value={dateFin}
                                    onChange={(e) => setDateFin(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    size={isMobile ? 'small' : 'medium'}
                                />
                            </Grid>
                        </>
                    )}
                    <Grid item xs={12} sm={periode === 'personnalise' ? 12 : 6} md={periode === 'personnalise' ? 2 : 3}>
                        <Button
                            variant="contained"
                            onClick={generateRapport}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AssessmentIcon />}
                            fullWidth
                            sx={{
                                height: { xs: 48, sm: 56 },
                                bgcolor: '#19d279',
                                '&:hover': { bgcolor: '#12a85e' }
                            }}
                        >
                            {isMobile ? 'Générer' : 'Générer le Rapport'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Box sx={{ mt: 2 }}>
                {renderRapportContent()}
            </Box>
        </Container >
    );
}
