// src/pages/AdminDashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Grid, Paper, Box, CircularProgress,
    Alert, List, ListItem, ListItemText, Avatar, Card, CardContent,
    Button, Divider, useTheme
} from '@mui/material';
import {
    People, AttachMoney, TrendingUp,
    Event, Notifications, Info, Sync
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl, getProfilePhotoUrl } from '../utils/urlHelper';

// Composant pour les cartes de statistiques
const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <Card sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        minHeight: { xs: 120, sm: 140, md: 160 }
    }}>
        <CardContent sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, sm: 2 },
            zIndex: 1,
            p: { xs: 2, sm: 3 }
        }}>
            <Avatar sx={{
                bgcolor: `${color}20`,
                color: color,
                width: { xs: 48, sm: 56 },
                height: { xs: 48, sm: 56 }
            }}>
                <Icon sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    variant="h4"
                    component="div"
                    fontWeight="bold"
                    sx={{
                        fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.125rem' },
                        lineHeight: 1.2,
                        wordBreak: 'break-word'
                    }}
                >
                    {value}
                </Typography>
                <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        lineHeight: 1.3
                    }}
                >
                    {title}
                </Typography>
                {subtitle && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            display: 'block',
                            mt: 0.5
                        }}
                    >
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </CardContent>
        <Box sx={{
            position: 'absolute',
            right: -20,
            bottom: -20,
            opacity: 0.1,
            transform: 'rotate(-20deg)',
            display: { xs: 'none', sm: 'block' }
        }}>
            <Icon sx={{ fontSize: 100, color: color }} />
        </Box>
    </Card>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentMembers, setRecentMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);
    const { token } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();

    // Synchronisation automatique depuis le frontend
    const syncData = useCallback(async () => {
        try {
            setSyncing(true);
            const response = await fetch(getApiUrl('/admin/sync'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            console.log('Synchronisation:', result);
            setLastSync(new Date());

            // Rafraîchir les données après synchronisation
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            // 1. Récupérer les statistiques globales
            const statsResponse = await axios.get(getApiUrl('/dashboard/stats'), config);
            setStats(statsResponse.data);

            // 2. Récupérer les membres récents
            const membersResponse = await axios.get(getApiUrl('/members'), config);
            const sortedMembers = (membersResponse.data || [])
                .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation))
                .slice(0, 5);
            setRecentMembers(sortedMembers);

            // Afficher une notification de succès
            alert('Synchronisation effectuée avec succès !');
        } catch (error) {
            console.error('Erreur de sync:', error);
            alert('Erreur lors de la synchronisation');
        } finally {
            setSyncing(false);
        }
    }, [token]);

    // Synchronisation automatique toutes les 5 minutes
    useEffect(() => {
        const syncInterval = setInterval(() => {
            if (token) {
                syncData();
            }
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(syncInterval);
    }, [token, syncData]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };

                // 1. Récupérer les statistiques globales
                const statsResponse = await axios.get(getApiUrl('/dashboard/stats'), config);
                setStats(statsResponse.data);

                // 2. Récupérer les membres récents
                const membersResponse = await axios.get(getApiUrl('/members'), config);
                // On prend les 5 plus récents (ceux avec les IDs les plus élevés ou dates les plus récentes)
                const sortedMembers = (membersResponse.data || [])
                    .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation))
                    .slice(0, 5);
                setRecentMembers(sortedMembers);

                setError(null);
            } catch (err) {
                console.error('Erreur lors du chargement du dashboard:', err);
                setError('Impossible de charger les données du tableau de bord.');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchDashboardData();
        }
    }, [token]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container
            maxWidth="xl"
            sx={{
                mt: { xs: 2, sm: 3, md: 4 },
                mb: { xs: 2, sm: 3, md: 4 },
                px: { xs: 2, sm: 3 }
            }}
        >
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                mb: { xs: 3, sm: 4 },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 2, sm: 0 }
            }}>
                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                    <>
                        <Typography
                            variant="h4"
                            component="h1"
                            fontWeight="bold"
                            gutterBottom
                            sx={{
                                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                                lineHeight: 1.2
                            }}
                        >
                            Tableau de Bord Administrateur
                        </Typography>
                        <Typography
                            variant="subtitle1"
                            color="text.secondary"
                            sx={{
                                fontSize: { xs: '0.95rem', sm: '1rem', md: '1.25rem' }
                            }}
                        >
                            Aperçu global de l'activité de LJMDI
                        </Typography>
                    </>
                </Box>
            </Box>

            {/* Cartes KPI */}
            <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Membres Totaux"
                        value={stats?.membresActifs || 0}
                        icon={People}
                        color={theme.palette.primary.main}
                        subtitle={`${stats?.nouveauxMembres || 0} ce mois-ci`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Trésorerie"
                        value={`${stats?.tresorerie?.toLocaleString() || 0} $`}
                        icon={AttachMoney}
                        color={theme.palette.success.main}
                        subtitle="Solde actuel"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Activités"
                        value={stats?.activitesMois || 0}
                        icon={Event}
                        color={theme.palette.warning.main}
                        subtitle={`${stats?.activitesAvenir || 0} à venir`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Participation"
                        value={`${stats?.tauxParticipation || 0}%`}
                        icon={TrendingUp}
                        color={theme.palette.info.main}
                        subtitle="Taux moyen"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={{ xs: 2, sm: 3 }}>
                {/* Graphique d'évolution */}
                <Grid item xs={12} lg={8}>
                    <Paper sx={{
                        p: { xs: 2, sm: 3 },
                        display: 'flex',
                        flexDirection: 'column',
                        height: { xs: 300, sm: 400 }
                    }}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            fontWeight="bold"
                            sx={{
                                fontSize: { xs: '1.1rem', sm: '1.25rem' }
                            }}
                        >
                            Évolution des Contributions
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.contributionsEvolution || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="mois"
                                    tick={{ fontSize: { xs: 10, sm: 12 } }}
                                />
                                <YAxis
                                    tick={{ fontSize: { xs: 10, sm: 12 } }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: 8,
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                    }}
                                    formatter={(value) => [`${value} $`, 'Montant']}
                                />
                                <Legend
                                    wrapperStyle={{
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                    }}
                                />
                                <Bar
                                    dataKey="montant"
                                    name="Contributions"
                                    fill={theme.palette.primary.main}
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Membres récents */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{
                        p: { xs: 2, sm: 3 },
                        display: 'flex',
                        flexDirection: 'column',
                        height: { xs: 300, sm: 400 }
                    }}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            fontWeight="bold"
                            sx={{
                                fontSize: { xs: '1.1rem', sm: '1.25rem' }
                            }}
                        >
                            Membres Récents
                        </Typography>
                        <List sx={{ flex: 1, overflow: 'auto' }}>
                            {recentMembers.map((member, index) => (
                                <React.Fragment key={member.id}>
                                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                        <Avatar
                                            src={getProfilePhotoUrl(member.photo_url)}
                                            sx={{
                                                mr: 2,
                                                width: { xs: 40, sm: 48 },
                                                height: { xs: 40, sm: 48 }
                                            }}
                                        >
                                            {member.nom?.charAt(0)}{member.prenom?.charAt(0)}
                                        </Avatar>
                                        <ListItemText
                                            primary={
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.primary"
                                                    sx={{
                                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    {member.nom} {member.prenom}
                                                </Typography>
                                            }
                                            secondary={
                                                <>
                                                    <Typography
                                                        component="span"
                                                        variant="caption"
                                                        color="text.primary"
                                                        sx={{
                                                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                                        }}
                                                    >
                                                        {member.role === 'admin' ? 'Administrateur' : 'Membre'}
                                                    </Typography>
                                                    {` — ${new Date(member.date_creation).toLocaleDateString('fr-FR')}`}
                                                </>
                                            }
                                        />
                                    </ListItem>
                                    {index < recentMembers.length - 1 && <Divider variant="inset" component="li" sx={{ ml: 7 }} />}
                                </React.Fragment>
                            ))}
                            {recentMembers.length === 0 && (
                                <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
                                    <Typography
                                        color="text.secondary"
                                        sx={{
                                            fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                        }}
                                    >
                                        Aucun membre récent
                                    </Typography>
                                </Box>
                            )}
                        </List>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => navigate('/membres')}
                            sx={{
                                mt: 2,
                                py: { xs: 1, sm: 1.5 }
                            }}
                        >
                            Voir tous les membres
                        </Button>
                    </Paper>
                </Grid>

                {/* Alertes et Notifications */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Notifications color="action" /> Alertes Système
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<Sync />}
                                onClick={syncData}
                                disabled={syncing}
                                sx={{ minWidth: 150 }}
                            >
                                {syncing ? (
                                    <>
                                        <CircularProgress size={16} sx={{ mr: 1 }} />
                                        Synchronisation...
                                    </>
                                ) : (
                                    'Synchroniser'
                                )}
                            </Button>
                        </Box>
                        {lastSync && (
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                Dernière synchronisation: {lastSync.toLocaleString('fr-FR')}
                            </Typography>
                        )}
                        <Box sx={{ mt: 2 }}>
                            {stats?.alertes && stats.alertes.length > 0 ? (
                                stats.alertes.map((alerte, index) => (
                                    <Alert
                                        key={index}
                                        severity={alerte.type === 'warning' ? 'warning' : alerte.type === 'error' ? 'error' : 'info'}
                                        sx={{ mb: 1 }}
                                    >
                                        {alerte.message}
                                    </Alert>
                                ))
                            ) : (
                                <Alert severity="success" icon={<Info />}>
                                    Tout fonctionne correctement. Aucune alerte en attente.
                                </Alert>
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container >
    );
};

export default AdminDashboard;
