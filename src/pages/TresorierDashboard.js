// src/pages/TresorierDashboard.js

import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Paper, Box, CircularProgress, Alert, List, ListItem, ListItemText, Avatar, Chip, Button, Card, CardContent } from '@mui/material';
import { AttachMoney, People, TrendingUp, AccountBalance, Healing } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../utils/urlHelper';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Composant pour les cartes de KPI
const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: color || 'primary.main', width: 56, height: 56 }}>
                <Icon sx={{ color: 'white', fontSize: 28 }} />
            </Avatar>
            <Box>
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
            </Box>
        </CardContent>
    </Card>
);

const TresorierDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [recentCasSociaux, setRecentCasSociaux] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTresorierData = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                const userData = storedUser ? JSON.parse(storedUser) : null;
                const token = userData?.token;

                if (!token) {
                    setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
                    return;
                }

                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };

                // Récupérer les statistiques du dashboard
                const statsResponse = await axios.get(getApiUrl('/dashboard/stats'), config);
                const data = statsResponse.data || {};
                setStats(data);

                // Récupérer les transactions récentes
                const transactionsResponse = await axios.get(getApiUrl('/contributions?limit=5'), config);
                setRecentTransactions(transactionsResponse.data || []);

                // Récupérer les cas sociaux récents
                const casSociauxResponse = await axios.get(getApiUrl('/cas-sociaux'), config);
                setRecentCasSociaux(casSociauxResponse.data || []);

            } catch (err) {
                console.error('Erreur lors du chargement des données:', err);
                setError('Erreur lors du chargement des données. Veuillez réessayer.');
            } finally {
                setLoading(false);
            }
        };

        fetchTresorierData();
    }, []);

    const handleQuickAction = (action) => {
        switch (action) {
            case 'add-contribution':
                navigate('/contributions');
                break;
            case 'manage-cas-sociaux':
                navigate('/cas-sociaux');
                break;
            default:
                break;
        }
    };

    // Préparer les données pour les graphiques
    const transactionsData = stats?.contributionsEvolution || [];



    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom>
                Tableau de Bord - Trésorerie
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Gestion financière et suivi des transactions
            </Typography>

            {/* Cartes de KPI principales */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Trésorerie"
                        value={`${stats?.tresorerie || 0} $`}
                        icon={AccountBalance}
                        color="#4caf50"
                        subtitle="Transactions - Assistances"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Transactions"
                        value={`${stats?.totalContributions || 0} $`}
                        icon={People}
                        color="#2196f3"
                        subtitle="Année en cours"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Assistances"
                        value={`${stats?.totalAssistances || 0} $`}
                        icon={AttachMoney}
                        color="#ff9800"
                        subtitle="Année en cours"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Taux Participation"
                        value={`${stats?.tauxParticipation || 0}%`}
                        icon={TrendingUp}
                        color="#9c27b0"
                    />
                </Grid>
            </Grid>

            {/* Actions rapides */}
            <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                    Actions Rapides
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <Button
                            variant="contained"
                            startIcon={<AttachMoney />}
                            fullWidth
                            onClick={() => handleQuickAction('add-contribution')}
                            sx={{ py: 2, bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: '#f5f5f5' } }}
                        >
                            Ajouter Transaction
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Button
                            variant="outlined"
                            startIcon={<Healing />}
                            fullWidth
                            onClick={() => handleQuickAction('manage-cas-sociaux')}
                            sx={{ py: 2, borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                        >
                            Cas Sociaux
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Graphiques et listes */}
            <Grid container spacing={3}>
                {/* Graphique des transactions par mois */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, height: '400px' }}>
                        <Typography variant="h6" gutterBottom>
                            Évolution des Transactions (6 derniers mois)
                        </Typography>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={transactionsData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${value} $`, 'Montant']} />
                                <Legend />
                                <Bar dataKey="contributions" fill="#4caf50" name="Transactions" />
                                <Bar dataKey="assistances" fill="#f44336" name="Assistances" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Transactions récentes */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Transactions Récentes
                        </Typography>
                        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                            {recentTransactions.slice(0, 5).map((transaction) => (
                                <ListItem key={transaction.id} divider>
                                    <Avatar
                                        src={transaction.photo_url ? (transaction.photo_url.startsWith('http') || transaction.photo_url.startsWith('data:') ? transaction.photo_url : `getProfilePhotoUrl(transaction.photo_url)`) : undefined}
                                        sx={{ mr: 2, bgcolor: 'primary.main', width: 40, height: 40 }}
                                    >
                                        {transaction.nom?.charAt(0)}{transaction.prenom?.charAt(0)}
                                    </Avatar>
                                    <ListItemText
                                        primary={`${transaction.membre_code || 'N/A'} - ${transaction.nom || ''} ${transaction.prenom || ''}`}
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="primary">
                                                    {transaction.montant} {transaction.devise || '$'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(transaction.date_contribution).toLocaleDateString('fr-FR')} - {transaction.type_contribution}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                    <Chip
                                        label={transaction.statut}
                                        size="small"
                                        color={transaction.statut === 'recu' ? 'success' : 'default'}
                                    />
                                </ListItem>
                            ))}
                            {recentTransactions.length === 0 && (
                                <ListItem>
                                    <ListItemText primary="Aucune transaction récente" />
                                </ListItem>
                            )}
                        </List>
                    </Paper>
                </Grid>

                {/* Cas sociaux récents */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Cas Sociaux Récents
                        </Typography>
                        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                            {recentCasSociaux.slice(0, 5).map((cas) => (
                                <ListItem key={cas.id_cas} divider>
                                    <Avatar
                                        src={cas.photo_url ? (cas.photo_url.startsWith('http') || cas.photo_url.startsWith('data:') ? cas.photo_url : `getProfilePhotoUrl(cas.photo_url)`) : undefined}
                                        sx={{ mr: 2, bgcolor: 'secondary.main', width: 40, height: 40 }}
                                    >
                                        {cas.nom?.charAt(0)}{cas.prenom?.charAt(0)}
                                    </Avatar>
                                    <ListItemText
                                        primary={`${cas.nom} ${cas.prenom}`}
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {cas.type_cas}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(cas.date_creation).toLocaleDateString('fr-FR')}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                    <Chip
                                        label={cas.statut}
                                        size="small"
                                        color={
                                            cas.statut === 'Résolu' ? 'success' :
                                                cas.statut === 'En cours' ? 'warning' : 'default'
                                        }
                                    />
                                </ListItem>
                            ))}
                            {recentCasSociaux.length === 0 && (
                                <ListItem>
                                    <ListItemText primary="Aucun cas social récent" />
                                </ListItem>
                            )}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default TresorierDashboard;
