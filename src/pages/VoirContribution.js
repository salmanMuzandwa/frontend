import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Box, CircularProgress, Alert, Button,
    Card, CardContent, Grid, Divider, Chip, TextField, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { ArrowBack, Edit, Delete, Print, VolunteerActivism, Handshake, CardGiftcard } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const VoirContribution = () => {
    const [contribution, setContribution] = useState(null);
    const [member, setMember] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editValues, setEditValues] = useState({
        montant: '',
        devise: 'USD',
        nom: '',
        prenom: '',
        email: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchContribution = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/contributions/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = response.data;
                setContribution(data);
                // Charger les infos du membre si disponible
                if (data?.membre_id) {
                    try {
                        const memberResponse = await axios.get(`/api/members/${data.membre_id}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        const m = memberResponse.data || null;
                        setMember(m);
                        if (m) {
                            setEditValues(prev => ({
                                ...prev,
                                nom: m.nom || '',
                                prenom: m.prenom || '',
                                email: m.email || ''
                            }));
                        }
                    } catch (memberErr) {
                        console.error("Erreur lors du chargement du membre:", memberErr);
                        setMember(null);
                    }
                } else {
                    setMember(null);
                }
                // Initialiser les champs éditables côté contribution
                setEditValues(prev => ({
                    ...prev,
                    montant: data?.montant || '',
                    devise: data?.devise || 'USD'
                }));
                setError(null);
            } catch (err) {
                console.error("Erreur lors du chargement de la contribution:", err);
                setError("Impossible de charger les détails de la contribution");
                setContribution(null);
            } finally {
                setLoading(false);
            }
        };

        if (token && id) {
            fetchContribution();
        }
    }, [token, id]);

    const handleEditChange = (field, value) => {
        setEditValues(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!contribution) return;
        setSaving(true);
        try {
            const contributionId = contribution.id_contribution || contribution.id;

            // Mettre à jour contribution (montant + devise)
            await axios.put(`/api/contributions/${contributionId}`, {
                montant: editValues.montant,
                devise: editValues.devise
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Mettre à jour le membre (nom/prenom/email) si disponible
            if (member?.id) {
                await axios.put(`/api/members/${member.id}`, {
                    nom: editValues.nom,
                    prenom: editValues.prenom,
                    email: editValues.email,
                    telephone: member.telephone || null,
                    profession: member.profession || null,
                    role: member.role || 'membre',
                    photo_url: member.photo_url || null
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }

            // Mettre à jour l’état local pour refléter les changements
            setContribution(prev => prev ? {
                ...prev,
                montant: editValues.montant,
                devise: editValues.devise
            } : prev);
            setMember(prev => prev ? {
                ...prev,
                nom: editValues.nom,
                prenom: editValues.prenom,
                email: editValues.email
            } : prev);

            setEditMode(false);
        } catch (err) {
            console.error("Erreur lors de la sauvegarde des modifications:", err);
            alert("Erreur lors de la sauvegarde des modifications");
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString('fr-FR');
    };

    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleString('fr-FR');
    };

    const getStatutColor = (statut) => {
        switch (statut) {
            case 'recu': return 'success';
            case 'en_attente': return 'warning';
            case 'annule': return 'error';
            default: return 'default';
        }
    };

    const getStatutLabel = (statut) => {
        switch (statut) {
            case 'recu': return 'Reçu';
            case 'en_attente': return 'En attente';
            case 'annule': return 'Annulé';
            default: return statut;
        }
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
        const types = {
            'mensuelle': { label: 'Mensuelle', icon: <CardGiftcard />, color: '#ff6b6b' },
            'hebdomadaire': { label: 'Hebdomadaire', icon: <VolunteerActivism />, color: '#45b7d1' },
            'annuelle': { label: 'Annuelle', icon: <Handshake />, color: '#4ecdc4' },
            'speciale': { label: 'Spéciale', icon: <CardGiftcard />, color: '#f9ca24' }
        };
        const key = normalizeType(type);
        return types[key] || { label: type || 'Inconnu', icon: <CardGiftcard />, color: '#666' };
    };

    const getDeviseLabel = (devise) => {
        if (!devise) return '';
        if (devise === 'CDF') return 'FC';
        return '$';
    };

    const getNatureLabel = (nature) => {
        const natures = {
            'financiere': 'Financière',
            'materielle': 'Matérielle',
            'service': 'Service',
            'competence': 'Compétence'
        };
        return natures[nature] || nature;
    };

    const printRecu = () => {
        const printWindow = window.open('', '_blank');
        const typeInfo = getTypeInfo(contribution?.type_contribution);

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reçu de Contribution - LJMDI</title>
                <style>
                    @page {
                        size: A6;
                        margin: 10mm;
                    }
                    body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
                    .header { text-align: center; margin-bottom: 40px; }
                    .header h1 { color: #19d279; margin-bottom: 10px; }
                    .header p { color: #666; }
                    .contribution-info { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                    .info-item { margin-bottom: 15px; }
                    .info-label { font-weight: bold; color: #333; margin-bottom: 5px; }
                    .info-value { color: #666; }
                    .footer { text-align: center; margin-top: 50px; color: #666; }
                    .statut { padding: 8px 16px; border-radius: 20px; text-align: center; font-weight: bold; }
                    .statut.recu { background: #d4edda; color: #155724; }
                    .statut.en_attente { background: #fff3cd; color: #856404; }
                    .statut.annule { background: #f8d7da; color: #721c24; }
                    .type-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: #f0f0f0; border-radius: 20px; margin-bottom: 20px; }
                    .montant { font-size: 32px; font-weight: bold; color: #19d279; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Reçu de Contribution</h1>
                    <p>Ligue des Jeunes Musulmans pour le Développement Intégral</p>
                </div>
                
                <div class="contribution-info">
                    <div class="info-item">
                        <div class="info-label">Numéro de Contribution</div>
                        <div class="info-value">#${contribution?.id_contribution || contribution?.id || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Date d'émission</div>
                        <div class="info-value">${formatDate(new Date())}</div>
                    </div>
                    <div class="type-badge">
                        ${typeInfo.icon} ${typeInfo.label}
                    </div>
                </div>
                
                <div class="info-grid">
                    <div>
                        <h3>Informations du Contributeur</h3>
                        <div class="info-item">
                            <div class="info-label">Nom Complet</div>
                            <div class="info-value">${member ? `${member.nom} ${member.prenom}` : ''}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">ID Membre interne</div>
                            <div class="info-value">${member ? member.id_membre : ''}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Email</div>
                            <div class="info-value">${member ? (member.email || '') : ''}</div>
                        </div>
                    </div>
                    
                    <div>
                        <h3>Détails de la Contribution</h3>
                        <div class="info-item">
                            <div class="info-label">Nature</div>
                            <div class="info-value">${getNatureLabel(contribution?.nature)}</div>
                        </div>
                        ${contribution?.nature === 'financiere' && contribution?.montant ? `
                        <div class="montant">${contribution.montant} ${getDeviseLabel(contribution.devise)}</div>
                        ` : ''}
                        <div class="info-item">
                            <div class="info-label">Date de Contribution</div>
                            <div class="info-value">${formatDateTime(contribution?.date_paiement || contribution?.date_creation)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Statut</div>
                            <div class="statut ${contribution?.statut}">${getStatutLabel(contribution?.statut)}</div>
                        </div>
                    </div>
                </div>
                
                ${contribution?.description ? `
                <div>
                    <h3>Description</h3>
                    <div class="info-item">
                        <div class="info-value" style="white-space: pre-wrap;">${contribution.description}</div>
                    </div>
                </div>
                ` : ''}
                
                ${contribution?.reference ? `
                <div>
                    <h3>Référence</h3>
                    <div class="info-item">
                        <div class="info-value">${contribution.reference}</div>
                    </div>
                </div>
                ` : ''}
                
                ${contribution?.cree_par_nom ? `
                <div style="margin-top: 30px;">
                    <h3>Enregistré par</h3>
                    <div class="info-item">
                        <div class="info-value">${contribution.cree_par_nom} ${contribution.cree_par_prenom}</div>
                    </div>
                </div>
                ` : ''}
                
                <div class="footer">
                    <p>Merci pour votre précieuse contribution au développement de notre communauté!</p>
                    <p>Ce reçu a été généré le ${formatDateTime(new Date())}</p>
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

    if (loading) {
        return (
            <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error || !contribution) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error || "Transaction non trouvée"}</Alert>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/contributions')}
                    sx={{ mt: 2 }}
                >
                    Retour à la liste
                </Button>
            </Container>
        );
    }

    const typeInfo = getTypeInfo(contribution.type_contribution);

    return (
        <Container sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/contributions')}
                    sx={{ mr: 2 }}
                >
                    Retour
                </Button>
                <Typography variant="h4" component="h1">
                    {editMode ? 'Modifier la Contribution' : 'Détails de la Contribution'}
                </Typography>
                <Box sx={{ ml: 'auto' }}>
                    {!editMode && (
                        <Button
                            variant="contained"
                            onClick={() => setEditMode(true)}
                            sx={{ ml: 2 }}
                        >
                            Modifier
                        </Button>
                    )}
                    {editMode && (
                        <>
                            <Button
                                variant="outlined"
                                sx={{ mr: 1 }}
                                onClick={() => setEditMode(false)}
                                disabled={saving}
                            >
                                Annuler
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                Enregistrer
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    {/* Informations principales */}
                    <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    {typeInfo.icon}
                                    <span style={{ marginLeft: 8 }}>Informations de la Contribution</span>
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Numéro de Contribution
                                    </Typography>
                                    <Typography variant="h5" sx={{ color: '#19d279', fontWeight: 'bold' }}>
                                        #{contribution.id_contribution || contribution.id}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Type de Contribution
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        <Chip
                                            icon={typeInfo.icon}
                                            label={typeInfo.label}
                                            sx={{ bgcolor: typeInfo.color, color: 'white' }}
                                        />
                                    </Box>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Nature
                                    </Typography>
                                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                                        {getNatureLabel(contribution.nature)}
                                    </Typography>
                                </Box>

                                {contribution.nature === 'financiere' && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Montant
                                        </Typography>
                                        {editMode ? (
                                            <Grid container spacing={1}>
                                                <Grid item xs={7}>
                                                    <TextField
                                                        fullWidth
                                                        type="number"
                                                        value={editValues.montant}
                                                        onChange={(e) => handleEditChange('montant', e.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={5}>
                                                    <FormControl fullWidth>
                                                        <InputLabel>Devise</InputLabel>
                                                        <Select
                                                            value={editValues.devise}
                                                            label="Devise"
                                                            onChange={(e) => handleEditChange('devise', e.target.value)}
                                                        >
                                                            <MenuItem value="USD">Dollar américain ($)</MenuItem>
                                                            <MenuItem value="CDF">Franc congolais (FC)</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                            </Grid>
                                        ) : (
                                            <Typography variant="h4" sx={{ color: '#19d279', fontWeight: 'bold' }}>
                                                {contribution.montant} {getDeviseLabel(contribution.devise)}
                                            </Typography>
                                        )}
                                    </Box>
                                )}

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Statut
                                    </Typography>
                                    <Chip
                                        label={getStatutLabel(contribution.statut)}
                                        color={getStatutColor(contribution.statut)}
                                        size="small"
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Informations du membre */}
                    <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Informations du Contributeur
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Nom Complet
                                    </Typography>
                                    {editMode ? (
                                        <Grid container spacing={1}>
                                            <Grid item xs={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Nom"
                                                    value={editValues.nom}
                                                    onChange={(e) => handleEditChange('nom', e.target.value)}
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Prénom"
                                                    value={editValues.prenom}
                                                    onChange={(e) => handleEditChange('prenom', e.target.value)}
                                                />
                                            </Grid>
                                        </Grid>
                                    ) : (
                                        <Typography variant="h6">
                                            {member ? `${member.nom} ${member.prenom}` : ''}
                                        </Typography>
                                    )}
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        ID Membre interne
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontFamily: 'monospace', color: '#666' }}>
                                        {member ? member.id_membre : ''}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Email
                                    </Typography>
                                    {editMode ? (
                                        <TextField
                                            fullWidth
                                            type="email"
                                            label="Email"
                                            value={editValues.email}
                                            onChange={(e) => handleEditChange('email', e.target.value)}
                                        />
                                    ) : (
                                        <Typography variant="body1">
                                            {member ? (member.email || '') : ''}
                                        </Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Description et détails */}
                    <Grid item xs={12}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Détails de la Contribution
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="body2" color="text.secondary">
                                            Date de Contribution
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatDateTime(contribution.date_paiement || contribution.date_creation)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="body2" color="text.secondary">
                                            Date d'Enregistrement
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatDateTime(contribution.date_creation)}
                                        </Typography>
                                    </Grid>
                                    {contribution.reference && (
                                        <Grid item xs={12} md={4}>
                                            <Typography variant="body2" color="text.secondary">
                                                Référence
                                            </Typography>
                                            <Typography variant="body1">
                                                {contribution.reference}
                                            </Typography>
                                        </Grid>
                                    )}
                                    {contribution.cree_par_nom && (
                                        <Grid item xs={12} md={4}>
                                            <Typography variant="body2" color="text.secondary">
                                                Enregistré par
                                            </Typography>
                                            <Typography variant="body1">
                                                {contribution.cree_par_nom} {contribution.cree_par_prenom}
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>

                                {contribution.description && (
                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Description
                                        </Typography>
                                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                                            {contribution.description}
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Actions */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/contributions')}
                    >
                        Retour à la liste
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Print />}
                        onClick={printRecu}
                        color="primary"
                    >
                        Imprimer le Reçu
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default VoirContribution;
