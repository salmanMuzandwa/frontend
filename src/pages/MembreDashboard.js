// src/pages/MembreDashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Grid, Paper, Box, CircularProgress, List, ListItem, ListItemText, Avatar, Chip, Button, Card, CardContent, LinearProgress, Badge } from '@mui/material';
import { EventAvailable, HowToReg, CalendarToday, TrendingUp, Star, EmojiEvents, AccessTime, LocationOn, Group, CheckCircle, Cancel } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getApiUrl, getProfilePhotoUrl } from '../utils/urlHelper';

// Composant pour les cartes de KPI avec animations
const StatCard = ({ title, value, icon: Icon, color, subtitle, progress }) => (
    <Card sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 25px ${color}20`
        }
    }}>
        <CardContent sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{
                bgcolor: color || 'primary.main',
                width: 56,
                height: 56,
                boxShadow: `0 4px 15px ${color}40`
            }}>
                <Icon sx={{ color: 'white', fontSize: 28 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
                <Typography variant="h4" component="div" fontWeight="bold" color={color || 'primary.main'}>
                    {value}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" color="text.secondary">
                        {subtitle}
                    </Typography>
                )}
                {progress !== undefined && (
                    <Box sx={{ mt: 1 }}>
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: `${color}20`,
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: color,
                                    borderRadius: 3
                                }
                            }}
                        />
                        <Typography variant="caption" color={color} sx={{ mt: 0.5, display: 'block' }}>
                            {progress}% d'assiduité
                        </Typography>
                    </Box>
                )}
            </Box>
        </CardContent>
    </Card>
);

// Composant pour les cartes d'activités
const ActivityCard = ({ activity, onParticipate }) => (
    <Card sx={{
        mb: 2,
        transition: 'transform 0.2s ease',
        '&:hover': {
            transform: 'translateX(4px)'
        }
    }}>
        <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {activity.titre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {activity.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption">
                                {new Date(activity.date_debut).toLocaleDateString('fr-FR')}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption">
                                {new Date(activity.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption">
                                {activity.lieu}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                <Chip
                    label={activity.type}
                    size="small"
                    color="primary"
                    variant="outlined"
                />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Group sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                        Participants non spécifié
                    </Typography>
                </Box>
                {new Date(activity.date_debut) >= new Date() && (
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => onParticipate(activity.id_activite)}
                        startIcon={<HowToReg />}
                    >
                        Participer
                    </Button>
                )}
            </Box>
        </CardContent>
    </Card>
);

const MembreDashboard = () => {
    const [userStats, setUserStats] = useState(null);
    const [upcomingActivities, setUpcomingActivities] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const navigate = useNavigate();

    const fetchMembreData = useCallback(async () => {
        console.log('Démarrage du chargement du dashboard membre...');
        setLoading(true);

        try {
            const storedUser = localStorage.getItem('user');
            console.log('Utilisateur stocké:', storedUser);

            const userData = storedUser ? JSON.parse(storedUser) : null;
            console.log('Données utilisateur parsées:', userData);

            const token = userData?.token;
            console.log('Token disponible:', !!token);

            if (!token) {
                console.error('Token manquant');
                setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
                setLoading(false);
                return;
            }

            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            // 1. Récupérer les informations de l'utilisateur
            let currentInfo = null;
            try {
                console.log('Récupération du profil utilisateur...');
                const userResponse = await axios.get(getApiUrl('/user/profile'), config);
                console.log('Réponse profil:', userResponse.data);
                currentInfo = userResponse.data;
                setUserInfo(currentInfo);
            } catch (err) {
                console.error('Erreur profil:', err);
                // Continuer même si le profil échoue
            }

            // 2. Récupérer les activités à venir
            let upcoming = [];
            try {
                console.log('Récupération des activités...');
                const activitiesResponse = await axios.get(getApiUrl('/activites'), config);
                console.log('Réponse activités:', activitiesResponse.data);
                const allActivities = activitiesResponse.data || [];

                // Filtrer les activités à venir (dans le futur)
                upcoming = allActivities
                    .filter(activity => new Date(activity.date_debut) >= new Date())
                    .sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut))
                    .slice(0, 5);

                console.log('Activités à venir filtrées:', upcoming);
                setUpcomingActivities(upcoming);
            } catch (err) {
                console.warn('Impossible de charger les activités:', err);
                setUpcomingActivities([]);
            }

            // 3. Récupérer l'historique des présences
            try {
                console.log('Récupération des présences pour membre ID:', userData.user.id);
                const presencesResponse = await axios.get(getApiUrl(`/presences?membre_id=${userData.user.id}`), config);
                console.log('Réponse présences:', presencesResponse.data);
                const presences = presencesResponse.data || [];

                // Calculer les statistiques de présence
                const totalPresences = presences.length;
                const presentCount = presences.filter(p => p.statut === 'Présent').length;
                const attendanceRate = totalPresences > 0 ? Math.round((presentCount / totalPresences) * 100) : 0;

                // Préparer les données pour le graphique mensuel
                const monthlyData = presences.reduce((acc, presence) => {
                    const date = new Date(presence.date_heure);
                    const monthYear = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });

                    if (!acc[monthYear]) {
                        acc[monthYear] = { month: monthYear, present: 0, absent: 0, total: 0 };
                    }

                    if (presence.statut === 'Présent') {
                        acc[monthYear].present++;
                    } else {
                        acc[monthYear].absent++;
                    }
                    acc[monthYear].total++;

                    return acc;
                }, {});

                const chartData = Object.values(monthlyData).slice(-6);

                const stats = {
                    totalPresences: totalPresences,
                    presentCount: presentCount,
                    attendanceRate: attendanceRate,
                    monthlyData: chartData,
                    upcomingCount: upcoming.length // Utiliser la variable locale 'upcoming'
                };

                console.log('Statistiques calculées:', stats);
                setUserStats(stats);
                setAttendanceHistory(presences.slice(0, 10));

            } catch (err) {
                console.warn('Impossible de charger les présences:', err);
                setUserStats({
                    totalPresences: 0,
                    presentCount: 0,
                    attendanceRate: 0,
                    monthlyData: [],
                    upcomingCount: upcoming.length // Utiliser la variable locale 'upcoming'
                });
            }

        } catch (err) {
            console.error('Erreur générale lors du chargement des données:', err);
            setError('Erreur lors du chargement de vos données. Veuillez réessayer.');
        } finally {
            console.log('Chargement terminé, setLoading(false)');
            setLoading(false);
        }
    }, []); // Supprimer navigate des dépendances de useCallback

    useEffect(() => {
        fetchMembreData();
    }, [fetchMembreData]);

    const handleParticipate = (activityId) => {
        // Logique pour s'inscrire à une activité
        console.log('Participation à l\'activité:', activityId);
        // Ici vous pourriez appeler une API pour s'inscrire
    };

    const handleQuickAction = (action) => {
        switch (action) {
            case 'view-activities':
                navigate('/activites');
                break;
            case 'view-presences':
                navigate('/presences');
                break;
            case 'edit-profile':
                navigate('/profil');
                break;
            default:
                break;
        }
    };

    // Données pour le graphique de présence
    const presenceData = userStats?.monthlyData || [];

    // Données pour le graphique circulaire
    const presencePieData = [
        { name: 'Présent', value: userStats?.presentCount || 0, color: '#4caf50' },
        { name: 'Absent', value: (userStats?.totalPresences || 0) - (userStats?.presentCount || 0), color: '#f44336' }
    ];

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress size={60} />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <Typography variant="h6" color="error" textAlign="center">
                        {error}
                    </Typography>
                </Box>
            </Container>
        );
    }

    // Afficher le dashboard même avec des données minimales
    console.log('Affichage du dashboard avec:', { userStats, userInfo, upcomingActivities, attendanceHistory });

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
                    Tableau de Bord Personnel
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Avatar
                        src={userInfo?.photo_url ? (userInfo.photo_url.startsWith('http') || userInfo.photo_url.startsWith('data:') ? userInfo.photo_url : getProfilePhotoUrl(userInfo.photo_url)) : undefined}
                        sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem' }}
                    >
                        {userInfo?.nom?.charAt(0)}{userInfo?.prenom?.charAt(0)}
                    </Avatar>
                    <Typography variant="subtitle1" color="text.secondary">
                        Bienvenue {userInfo?.prenom || 'Membre'} {userInfo?.nom || ''} - Suivi de vos activités et présences
                    </Typography>
                </Box>
                <Badge
                    badgeContent={userStats?.attendanceRate || 0}
                    color="primary"
                    sx={{ mt: 1 }}
                >
                    <EmojiEvents sx={{ fontSize: 40, color: 'gold' }} />
                </Badge>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                    Taux d'assiduité général
                </Typography>
            </Box >

            {/* Cartes de KPI principales */}
            < Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Présences"
                        value={userStats?.totalPresences || 0}
                        icon={HowToReg}
                        color="#4caf50"
                        subtitle="Depuis votre adhésion"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Présences Confirmées"
                        value={userStats?.presentCount || 0}
                        icon={CheckCircle}
                        color="#2196f3"
                        subtitle="Effectives"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Activités à Venir"
                        value={userStats?.upcomingCount || 0}
                        icon={EventAvailable}
                        color="#ff9800"
                        subtitle="Cette semaine"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Assiduité"
                        value={`${userStats?.attendanceRate || 0}%`}
                        icon={TrendingUp}
                        color="#9c27b0"
                        progress={userStats?.attendanceRate || 0}
                    />
                </Grid>
            </Grid >

            {/* Message d'information si aucune donnée */}
            {
                (!userStats || userStats.totalPresences === 0) && (
                    <Paper sx={{ p: 3, mb: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Bienvenue dans votre espace personnel !
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Commencez à participer aux activités pour voir vos statistiques de présence ici.
                        </Typography>
                    </Paper>
                )
            }

            {/* Actions rapides */}
            <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                    Actions Rapides
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <Button
                            variant="contained"
                            startIcon={<EventAvailable />}
                            fullWidth
                            onClick={() => handleQuickAction('view-activities')}
                            sx={{ py: 2, bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: '#f5f5f5' } }}
                        >
                            Voir les Activités
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Button
                            variant="outlined"
                            startIcon={<HowToReg />}
                            fullWidth
                            onClick={() => handleQuickAction('view-presences')}
                            sx={{ py: 2, borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                        >
                            Historique Présences
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Button
                            variant="outlined"
                            startIcon={<Star />}
                            fullWidth
                            onClick={() => handleQuickAction('edit-profile')}
                            sx={{ py: 2, borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                        >
                            Mon Profil
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Graphiques et activités - afficher même avec données vides */}
            <Grid container spacing={3}>
                {/* Graphique d'évolution des présences */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, height: '400px' }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                            Évolution de vos Présences (6 derniers mois)
                        </Typography>
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={presenceData.length > 0 ? presenceData : [{ month: 'Aucune donnée', present: 0, absent: 0 }]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                <Line type="monotone" dataKey="present" stroke="#4caf50" name="Présent" strokeWidth={3} />
                                <Line type="monotone" dataKey="absent" stroke="#f44336" name="Absent" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Graphique circulaire de présence */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, height: '400px' }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                            Répartition des Présences
                        </Typography>
                        <ResponsiveContainer width="100%" height="85%">
                            <PieChart>
                                <Pie
                                    data={presencePieData.some(d => d.value > 0) ? presencePieData : [{ name: 'Aucune donnée', value: 1, color: '#ccc' }]}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {(presencePieData.some(d => d.value > 0) ? presencePieData : [{ name: 'Aucune donnée', value: 1, color: '#ccc' }]).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Activités à venir */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, maxHeight: '500px', overflow: 'auto' }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                            Activités à Venir
                        </Typography>
                        {upcomingActivities.length > 0 ? (
                            upcomingActivities.map((activity) => (
                                <ActivityCard
                                    key={activity.id_activite}
                                    activity={activity}
                                    onParticipate={handleParticipate}
                                />
                            ))
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <EventAvailable sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="body1" color="text.secondary">
                                    Aucune activité à venir
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Revenez plus tard pour voir les nouvelles activités
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Historique récent des présences */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, maxHeight: '500px', overflow: 'auto' }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                            Historique Récent des Présences
                        </Typography>
                        <List>
                            {attendanceHistory.length > 0 ? (
                                attendanceHistory.map((presence) => (
                                    <ListItem key={presence.id} divider>
                                        <Avatar sx={{ mr: 2, bgcolor: presence.statut === 'Présent' ? '#4caf50' : '#f44336' }}>
                                            {presence.statut === 'Présent' ? <CheckCircle /> : <Cancel />}
                                        </Avatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body1" fontWeight="medium">
                                                        {presence.activite_titre || 'Activité'}
                                                    </Typography>
                                                    <Chip
                                                        label={presence.statut}
                                                        size="small"
                                                        color={presence.statut === 'Présent' ? 'success' : 'error'}
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {new Date(presence.date_heure).toLocaleDateString('fr-FR')} à {new Date(presence.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                    {presence.remarques && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                            {presence.remarques}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))
                            ) : (
                                <ListItem>
                                    <ListItemText
                                        primary="Aucune présence enregistrée"
                                        secondary="Participez aux activités pour commencer à construire votre historique."
                                    />
                                </ListItem>
                            )}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Container >
    );
};

export default MembreDashboard;
