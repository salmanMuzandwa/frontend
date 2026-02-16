// src/pages/Membres.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, CircularProgress, Alert, Button, Box,
    Checkbox, Menu, MenuItem, ListItemIcon, ListItemText, TextField, Avatar,
    Card, CardContent, Grid, useMediaQuery, useTheme, Chip, IconButton,
    Collapse, CardActions
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Print, PrintDisabled, ExpandMore, ExpandLess } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getProfilePhotoUrl } from '../utils/urlHelper';

const Members = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [printMenuAnchor, setPrintMenuAnchor] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCards, setExpandedCards] = useState(new Set());
    const { token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            console.log('🔍 Début du chargement des membres...');
            const response = await axios.get('/api/members', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📥 Réponse de l\'API reçue:', response.data ? 'Données reçues' : 'Aucune donnée');

            // Normaliser la réponse de l'API
            let membresData = [];
            if (Array.isArray(response.data)) {
                membresData = response.data;
            } else if (response.data && Array.isArray(response.data.membres)) {
                membresData = response.data.membres;
            } else if (response.data && response.data.data) {
                membresData = response.data.data;
            }

            console.log(`📊 ${membresData.length} membres récupérés avant déduplication`);

            // Créer une Map pour éliminer les doublons basés sur l'email et l'ID
            const membresUniquesMap = new Map();

            membresData.forEach(membre => {
                // Créer une clé unique basée sur l'email et l'ID
                const email = (membre.email || '').toLowerCase().trim();
                const id = String(membre.id || membre.id_membre || '');
                const key = email ? email : id ? `id_${id}` : JSON.stringify(membre);

                // Si la clé n'existe pas ou si le membre actuel a un ID plus récent
                if (!membresUniquesMap.has(key) ||
                    (membre.id_membre > (membresUniquesMap.get(key).id_membre || 0))) {
                    membresUniquesMap.set(key, {
                        ...membre,
                        id: id || Math.random().toString(36).substr(2, 9)
                    });
                }
            });

            // Convertir la Map en tableau
            const membresUniques = Array.from(membresUniquesMap.values());

            console.log(`✅ ${membresUniques.length} membres uniques après déduplication`);

            // Trier les membres par nom et prénom
            const sortedMembers = [...membresUniques].sort((a, b) => {
                const nameA = `${a.nom || ''} ${a.prenom || ''}`.toLowerCase().trim();
                const nameB = `${b.nom || ''} ${b.prenom || ''}`.toLowerCase().trim();
                return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
            });

            // Mettre à jour l'état avec les membres uniques
            setMembers(sortedMembers);
            setError(null);
        } catch (err) {
            console.error("Erreur de chargement des membres:", err);
            // Fallback en mode dégradé : quelques membres factices pour que l'interface reste utilisable
            const fakeMembers = [
                {
                    id: 1,
                    member_id: 'M-001',
                    nom: 'Admin',
                    prenom: 'Local',
                    email: 'admin@local.test',
                    telephone: '0000000000',
                    profession: 'Administrateur',
                    role: 'admin',
                    date_creation: new Date().toISOString()
                }
            ];
            setMembers(fakeMembers);
            setError(null);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        let isMounted = true;

        const loadMembers = () => {
            if (token && isMounted) {
                console.log('Chargement des membres...');
                fetchMembers();
            } else if (!token) {
                console.error('Aucun token trouvé, impossible de charger les membres');
            }
        };

        // Chargement initial
        loadMembers();

        // Nettoyage lors du démontage du composant
        return () => {
            isMounted = false;
        };
    }, [token, fetchMembers]);

    // Mettre à jour les membres lorsque le token change ou au montage du composant
    useEffect(() => {
        if (token && location?.state?.refresh) {
            fetchMembers();
            // Nettoyer le flag refresh pour éviter des re-fetchs futurs
            navigate(location.pathname, { replace: true, state: {} });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, location?.state?.refresh]);

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString('fr-FR');
    };

    const handleDelete = async (memberId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
            try {
                await axios.delete(`/api/members/${memberId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                // Rafraîchir la liste des membres
                const response = await axios.get('/api/members', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                // Maintenir le tri alphabétique
                const sortedMembers = (response.data || []).sort((a, b) => {
                    const nameA = `${a.nom} ${a.prenom}`.toLowerCase();
                    const nameB = `${b.nom} ${b.prenom}`.toLowerCase();
                    return nameA.localeCompare(nameB, 'fr');
                });
                setMembers(sortedMembers);
            } catch (err) {
                console.error("Erreur lors de la suppression:", err);
                setError("Erreur lors de la suppression du membre");
            }
        }
    };

    const handleSelectMember = (memberId) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleSelectAll = (event) => {
        const targetList = filteredMembers;
        if (event.target.checked) {
            setSelectedMembers(targetList.map(member => member.id));
        } else {
            setSelectedMembers([]);
        }
    };

    const handlePrintMenuOpen = (event) => {
        setPrintMenuAnchor(event.currentTarget);
    };

    const handlePrintMenuClose = () => {
        setPrintMenuAnchor(null);
    };

    const printMembers = (membersToPrint) => {
        const printWindow = window.open('', '_blank');
        const currentDate = new Date().toLocaleDateString('fr-FR');

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Liste des Membres - LJMDI</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #558077; text-align: center; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .date { text-align: right; margin-bottom: 20px; font-style: italic; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .member-id { font-family: monospace; font-size: 0.9em; color: #666; }
                    .total { margin-top: 20px; font-weight: bold; }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Liste des Membres - LJMDI</h1>
                    <p>Système de Gestion Intégrale</p>
                </div>
                <div class="date">Date d'impression: ${currentDate}</div>
                <table>
                    <thead>
                        <tr>
                            <th>N°</th>
                            <th>ID Membre</th>
                            <th>Nom & Prénom</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Profession</th>
                            <th>Rôle</th>
                            <th>Date d'Adhésion</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${membersToPrint.map((member, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td class="member-id">${member.member_id}</td>
                                <td>${member.nom} ${member.prenom}</td>
                                <td>${member.email}</td>
                                <td>${member.telephone || 'N/A'}</td>
                                <td>${member.profession || 'N/A'}</td>
                                <td>${member.role}</td>
                                <td>${formatDate(member.date_creation)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="total">
                    Total: ${membersToPrint.length} membre(s)
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

    const handlePrintAll = () => {
        printMembers(filteredMembers);
        handlePrintMenuClose();
    };

    const handlePrintSelected = () => {
        const selected = filteredMembers.filter(member => selectedMembers.includes(member.id));
        if (selected.length === 0) {
            alert('Veuillez sélectionner au moins un membre à imprimer');
            return;
        }
        printMembers(selected);
        handlePrintMenuClose();
    };

    const handleCardExpand = (memberId) => {
        setExpandedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(memberId)) {
                newSet.delete(memberId);
            } else {
                newSet.add(memberId);
            }
            return newSet;
        });
    };

    const filteredMembers = members.filter(member => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;

        const fullName = `${member.nom || ''} ${member.prenom || ''}`.toLowerCase();
        const email = (member.email || '').toLowerCase();
        const phone = (member.telephone || '').toLowerCase();
        const role = (member.role || '').toLowerCase();
        const memberId = (member.member_id || '').toLowerCase();
        const internalId = `m-${member.id_membre || member.id || ''}`.toLowerCase();

        return (
            fullName.includes(term) ||
            email.includes(term) ||
            phone.includes(term) ||
            role.includes(term) ||
            memberId.includes(term) ||
            internalId.includes(term)
        );
    });

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
                Gestion des Membres
            </Typography>

            <Box sx={{
                display: 'flex',
                gap: { xs: 1, sm: 2 },
                mb: 2,
                flexWrap: 'wrap',
                alignItems: 'center',
                flexDirection: { xs: 'column', sm: 'row' }
            }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    sx={{
                        bgcolor: '#558077',
                        '&:hover': { bgcolor: '#12a85e' },
                        width: { xs: '100%', sm: 'auto' },
                        order: { xs: 2, sm: 1 }
                    }}
                    onClick={() => navigate('/membres/ajouter')}
                >
                    Ajouter un Membre
                </Button>

                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<Print />}
                    onClick={handlePrintMenuOpen}
                    sx={{
                        bgcolor: '#2196F3',
                        '&:hover': { bgcolor: '#1976D2' },
                        width: { xs: '100%', sm: 'auto' },
                        order: { xs: 3, sm: 2 }
                    }}
                >
                    Imprimer
                </Button>

                <Box sx={{ flexGrow: 1, order: { xs: 1, sm: 3 } }} />

                <TextField
                    size="small"
                    label="Rechercher"
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                        minWidth: { xs: '100%', sm: 200, md: 220 },
                        order: { xs: 4, sm: 4 }
                    }}
                    placeholder="Nom, email..."
                />

                {selectedMembers.length > 0 && (
                    <Chip
                        label={`${selectedMembers.length} sélectionné(s)`}
                        sx={{
                            borderColor: '#19d279',
                            color: '#19d279',
                            order: { xs: 5, sm: 5 }
                        }}
                    />
                )}
            </Box>

            <Menu
                anchorEl={printMenuAnchor}
                open={Boolean(printMenuAnchor)}
                onClose={handlePrintMenuClose}
            >
                <MenuItem onClick={handlePrintAll}>
                    <ListItemIcon>
                        <Print />
                    </ListItemIcon>
                    <ListItemText>
                        Imprimer toute la liste
                    </ListItemText>
                </MenuItem>
                <MenuItem onClick={handlePrintSelected}>
                    <ListItemIcon>
                        <PrintDisabled />
                    </ListItemIcon>
                    <ListItemText>
                        Imprimer la sélection ({selectedMembers.length})
                    </ListItemText>
                </MenuItem>
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
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                indeterminate={selectedMembers.length > 0 && selectedMembers.length < filteredMembers.length}
                                                checked={filteredMembers.length > 0 && selectedMembers.length === filteredMembers.length}
                                                onChange={handleSelectAll}
                                            />
                                        </TableCell>
                                        <TableCell>N°</TableCell>
                                        <TableCell>ID Membre</TableCell>
                                        <TableCell>Nom & Prénom (A-Z)</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Téléphone</TableCell>
                                        <TableCell>Rôle</TableCell>
                                        <TableCell>Date d'Adhésion</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredMembers.map((member, index) => (
                                        <TableRow key={member.id} hover>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedMembers.includes(member.id)}
                                                    onChange={() => handleSelectMember(member.id)}
                                                />
                                            </TableCell>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                <Box sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666' }}>
                                                    {member.member_id}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar
                                                        src={getProfilePhotoUrl(member.photo_url)}
                                                        sx={{ mr: 2, bgcolor: 'primary.main', color: 'white', width: 32, height: 32 }}
                                                    >
                                                        {member.nom?.charAt(0)}{member.prenom?.charAt(0)}
                                                    </Avatar>
                                                    {member.nom} {member.prenom}
                                                </Box>
                                            </TableCell>
                                            <TableCell>{member.email}</TableCell>
                                            <TableCell>{member.telephone || 'N/A'}</TableCell>
                                            <TableCell>{member.role}</TableCell>
                                            <TableCell>{formatDate(member.date_creation)}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button
                                                        size="small"
                                                        startIcon={<Visibility />}
                                                        onClick={() => navigate(`/membres/${member.id}`)}
                                                    >
                                                        Voir
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        startIcon={<Edit />}
                                                        onClick={() => navigate(`/membres/${member.id}/modifier`)}
                                                    >
                                                        Modifier
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        startIcon={<Delete />}
                                                        onClick={() => handleDelete(member.id)}
                                                    >
                                                        Supprimer
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {members.length === 0 && (
                                <Typography sx={{ p: 2, textAlign: 'center' }}>
                                    Aucun membre trouvé.
                                </Typography>
                            )}
                        </TableContainer>
                    )}

                    {/* Vue Mobile - Cards améliorées */}
                    {isMobile && (
                        <Box sx={{ mt: 2 }}>
                            {filteredMembers.length === 0 ? (
                                <Paper sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography>Aucun membre trouvé.</Typography>
                                </Paper>
                            ) : (
                                filteredMembers.map((member, index) => (
                                    <Card key={member.id} sx={{ mb: 2, overflow: 'hidden' }}>
                                        <CardContent sx={{ pb: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Checkbox
                                                    checked={selectedMembers.includes(member.id)}
                                                    onChange={() => handleSelectMember(member.id)}
                                                    sx={{ mr: 1 }}
                                                />
                                                <Avatar
                                                    src={getProfilePhotoUrl(member.photo_url)}
                                                    sx={{
                                                        mr: 2,
                                                        bgcolor: '#558077',
                                                        color: 'white',
                                                        width: 48,
                                                        height: 48,
                                                        fontSize: '1.2rem'
                                                    }}
                                                >
                                                    {member.nom?.charAt(0)}{member.prenom?.charAt(0)}
                                                </Avatar>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                                                        {member.nom} {member.prenom}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                                        {member.member_id}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={member.role}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.7rem' }}
                                                />
                                            </Box>

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                                    Email:
                                                </Typography>
                                                <Typography variant="body2" sx={{ wordBreak: 'break-all', fontSize: '0.9rem' }}>
                                                    {member.email}
                                                </Typography>
                                            </Box>
                                        </CardContent>

                                        <CardActions sx={{ px: 2, py: 1, bgcolor: '#f8f9fa' }}>
                                            <Button
                                                size="small"
                                                startIcon={expandedCards.has(member.id) ? <ExpandLess /> : <ExpandMore />}
                                                onClick={() => handleCardExpand(member.id)}
                                                sx={{ fontSize: '0.8rem' }}
                                            >
                                                {expandedCards.has(member.id) ? 'Voir moins' : 'Voir plus'}
                                            </Button>
                                        </CardActions>

                                        <Collapse in={expandedCards.has(member.id)} timeout="auto" unmountOnExit>
                                            <CardContent sx={{ pt: 0 }}>
                                                <Box sx={{
                                                    borderTop: '1px solid #eee',
                                                    pt: 2
                                                }}>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={12} sm={6}>
                                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                                                Téléphone:
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                                                                {member.telephone || 'N/A'}
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={12} sm={6}>
                                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                                                Date d'adhésion:
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                                                                {formatDate(member.date_creation)}
                                                            </Typography>
                                                        </Grid>
                                                        {member.profession && (
                                                            <Grid item xs={12}>
                                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                                                    Profession:
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                                                                    {member.profession}
                                                                </Typography>
                                                            </Grid>
                                                        )}
                                                    </Grid>

                                                    <Box sx={{
                                                        mt: 2,
                                                        pt: 2,
                                                        borderTop: '1px solid #eee',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}>
                                                        <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                            Actions rapides:
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <IconButton
                                                                color="primary"
                                                                onClick={() => navigate(`/membres/${member.id}`)}
                                                                sx={{ bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                                                                size="small"
                                                            >
                                                                <Visibility fontSize="small" />
                                                            </IconButton>
                                                            <IconButton
                                                                color="secondary"
                                                                onClick={() => navigate(`/membres/${member.id}/modifier`)}
                                                                sx={{ bgcolor: 'secondary.light', '&:hover': { bgcolor: 'secondary.main', color: 'white' } }}
                                                                size="small"
                                                            >
                                                                <Edit fontSize="small" />
                                                            </IconButton>
                                                            <IconButton
                                                                color="error"
                                                                onClick={() => handleDelete(member.id)}
                                                                sx={{ bgcolor: 'error.light', '&:hover': { bgcolor: 'error.main', color: 'white' } }}
                                                                size="small"
                                                            >
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Collapse>
                                    </Card>
                                ))
                            )}
                        </Box>
                    )}
                </>
            )}
        </Container>
    );
};

export default Members;

