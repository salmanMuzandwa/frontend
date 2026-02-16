import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { handleApiError, showErrorNotification, showSuccessNotification } from '../utils/errorHandler';
import {
    Container, Typography, Paper, Button, Box, Grid, FormControl,
    InputLabel, Select, TextField, CircularProgress, Alert, MenuItem
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';

const EditContribution = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [contribution, setContribution] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

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

    const typesContribution = [
        { value: 'mensuelle', label: 'Mensuelle' },
        { value: 'hebdomadaire', label: 'Hebdomadaire' },
        { value: 'annuelle', label: 'Annuelle' },
        { value: 'speciale', label: 'Spéciale' }
    ];

    const natures = [
        { value: 'financiere', label: 'Financière' },
        { value: 'materielle', label: 'Matérielle' },
        { value: 'service', label: 'Service' },
        { value: 'competence', label: 'Compétence' }
    ];

    useEffect(() => {
        const loadData = async () => {
            try {
                await Promise.all([
                    fetchContribution(),
                    fetchMembers()
                ]);
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
            }
        };
        loadData();
    }, [id, token]);

    const fetchContribution = async () => {
        try {
            const response = await api.get(`/contributions/${id}`);
            const contributionData = response.data;
            setContribution(contributionData);

            // Pré-remplir le formulaire avec les données existantes
            setFormData({
                donateur_type: contributionData.membre_id ? 'membre' : 'externe',
                membre_id: contributionData.membre_id || '',
                donateur_nom: contributionData.donateur_nom || '',
                donateur_prenom: contributionData.donateur_prenom || '',
                donateur_email: contributionData.donateur_email || '',
                donateur_telephone: contributionData.donateur_telephone || '',
                type_contribution: contributionData.type_contribution || 'mensuelle',
                montant: contributionData.montant || '',
                devise: contributionData.devise || 'USD',
                description: contributionData.description || '',
                date_contribution: contributionData.date_contribution ?
                    new Date(contributionData.date_contribution).toISOString().split('T')[0] :
                    new Date().toISOString().split('T')[0],
                nature: contributionData.nature || 'financiere',
                statut: contributionData.statut || 'recu',
                reference: contributionData.reference || ''
            });

            setError(null);
        } catch (error) {
            const errorMessage = handleApiError(error, 'fetchContribution');
            setError(errorMessage);
            showErrorNotification(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const response = await api.get('/members');
            setMembers(response.data || []);
        } catch (err) {
            console.error("Erreur de chargement des membres:", err);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Préparation du payload pour l'API
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

            const response = await api.put(`/contributions/${id}`, payload);

            showSuccessNotification('Contribution modifiée avec succès!');
            navigate('/contributions');

        } catch (error) {
            const errorMessage = handleApiError(error, 'handleSubmit');
            setError(errorMessage);
            showErrorNotification(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error && !contribution) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/contributions')}
                    sx={{ mt: 2 }}
                >
                    Retour aux contributions
                </Button>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/contributions')}
                    sx={{ mr: 2 }}
                >
                    Retour
                </Button>
                <Typography variant="h4" component="h1">
                    Modifier la Contribution
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Type de donateur</InputLabel>
                                <Select
                                    value={formData.donateur_type}
                                    label="Type de donateur"
                                    onChange={(e) => handleInputChange('donateur_type', e.target.value)}
                                >
                                    <MenuItem value="membre">Membre de l'association</MenuItem>
                                    <MenuItem value="externe">Donateur externe</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            {formData.donateur_type === 'membre' ? (
                                <FormControl fullWidth required>
                                    <InputLabel>Membre</InputLabel>
                                    <Select
                                        value={formData.membre_id}
                                        onChange={(e) => handleInputChange('membre_id', e.target.value)}
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
                                    onChange={(e) => handleInputChange('donateur_nom', e.target.value)}
                                    required
                                    fullWidth
                                />
                            )}
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Prénom du donateur"
                                value={formData.donateur_prenom}
                                onChange={(e) => handleInputChange('donateur_prenom', e.target.value)}
                                fullWidth
                            />
                        </Grid>

                        {formData.donateur_type === 'externe' && (
                            <>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Email du donateur (optionnel)"
                                        type="email"
                                        value={formData.donateur_email}
                                        onChange={(e) => handleInputChange('donateur_email', e.target.value)}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Téléphone du donateur (optionnel)"
                                        value={formData.donateur_telephone}
                                        onChange={(e) => handleInputChange('donateur_telephone', e.target.value)}
                                        fullWidth
                                    />
                                </Grid>
                            </>
                        )}

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Type de Contribution</InputLabel>
                                <Select
                                    value={formData.type_contribution}
                                    onChange={(e) => handleInputChange('type_contribution', e.target.value)}
                                    label="Type de Contribution"
                                >
                                    {typesContribution.map(type => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Nature</InputLabel>
                                <Select
                                    value={formData.nature}
                                    onChange={(e) => handleInputChange('nature', e.target.value)}
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
                                onChange={(e) => handleInputChange('montant', e.target.value)}
                                required={formData.nature === 'financiere'}
                                fullWidth
                                helperText={formData.nature === 'financiere' ? 'Entrez le montant en Francs congolais' : 'Décrivez la valeur matérielle ou le service'}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Description"
                                multiline
                                rows={3}
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                fullWidth
                                helperText="Décrivez en détail la contribution (objet du don, type de service, etc.)"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Date de Contribution"
                                type="date"
                                value={formData.date_contribution}
                                onChange={(e) => handleInputChange('date_contribution', e.target.value)}
                                fullWidth
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Statut</InputLabel>
                                <Select
                                    value={formData.statut}
                                    onChange={(e) => handleInputChange('statut', e.target.value)}
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
                                onChange={(e) => handleInputChange('reference', e.target.value)}
                                fullWidth
                                helperText="Numéro de reçu, référence de transaction, etc."
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={<Save />}
                                    disabled={submitting || (formData.donateur_type === 'membre' && !formData.membre_id) || (formData.donateur_type === 'externe' && !formData.donateur_nom) || (formData.nature === 'financiere' && !formData.montant)}
                                    sx={{ bgcolor: '#19d279', '&:hover': { bgcolor: '#12a85e' } }}
                                >
                                    {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/contributions')}
                                >
                                    Annuler
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Container>
    );
};

export default EditContribution;
