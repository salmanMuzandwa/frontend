import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Grid,
    Alert,
    CircularProgress
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { getApiUrl } from '../utils/urlHelper';

const AjouterPresence = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        id_membre: state?.presence?.id_membre || '',
        id_activite: state?.presence?.id_activite || '',
        statut: state?.presence?.statut || 'Présent',
        remarques: state?.presence?.remarques || ''
    });

    const [membres, setMembres] = useState([]);
    const [activites, setActivites] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };

                const [membresResponse, activitesResponse] = await Promise.all([
                    axios.get(getApiUrl('/members'), config),
                    axios.get(getApiUrl('/activites'), config)
                ]);

                // Correction 1: S'assurer que les données sont des tableaux et extraire les IDs correctement
                // Le backend renvoie parfois direct le tableau, parfois un objet { membres: [...] }
                const membresData = Array.isArray(membresResponse.data) ? membresResponse.data : (membresResponse.data.membres || []);
                const activitesData = Array.isArray(activitesResponse.data) ? activitesResponse.data : (activitesResponse.data.activites || []);

                // On filtre pour être sûr d'avoir des objets valides avec des IDs
                // IMPORTANT: Vérifier les noms de champs ID côté backend (id vs id_membre)
                // D'après routes/members.js, la réponse est SELECT * FROM membres, donc champ 'id' et non 'id_membre' si c'est la table membres
                // Mais wait, routes/members.js fait SELECT * FROM membres
                // Et la table membres a id (PK).
                // Donc côté frontend il faut utiliser 'id' !
                // Mais le Select value={formData.id_membre}

                // Adaptons les données pour le frontend pour être cohérent
                setMembres(membresData);
                setActivites(activitesData);
                setLoadingData(false);
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
                setError('Erreur lors du chargement des membres et activités');
                setLoadingData(false);
            }
        };

        if (token) {
            fetchData();
        }
    }, [token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const presenceData = {
                ...formData,
                date_heure: new Date().toISOString()
            };

            // Correction 2: Validation
            if (!formData.id_membre || !formData.id_activite) {
                setError("Veuillez sélectionner un membre et une activité.");
                setLoading(false);
                return;
            }

            console.log('Envoi données présence:', presenceData);

            if (state?.presence) {
                await axios.put(getApiUrl(`/presences/${state.presence.id}`), presenceData, config); // id vs id_presence
                setSuccess('Présence modifiée avec succès');
            } else {
                await axios.post(getApiUrl('/presences'), presenceData, config);
                setSuccess('Présence ajoutée avec succès');
            }

            setTimeout(() => {
                navigate('/presences');
            }, 1500);
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement:', error);
            setError(error.response?.data?.error || 'Erreur lors de l\'enregistrement de la présence');
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/presences');
    };

    if (loadingData) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mr: 2 }}>
                    Retour
                </Button>
                <Typography variant="h4" component="h1">
                    {state?.presence ? 'Modifier une Présence' : 'Ajouter une Présence'}
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel id="membre-label">Membre</InputLabel>
                                <Select
                                    labelId="membre-label"
                                    id="id_membre"
                                    name="id_membre"
                                    value={formData.id_membre}
                                    onChange={handleChange}
                                    label="Membre"
                                >
                                    {/* Correction 3: key unique et valeur par défaut */}
                                    <MenuItem value="" disabled>-- Sélectionner un membre --</MenuItem>
                                    {membres.map((membre) => (
                                        // use membre.id as value because DB uses id
                                        <MenuItem key={membre.id || membre.id_membre} value={membre.id || membre.id_membre}>
                                            {membre.nom} {membre.prenom}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel id="activite-label">Activité</InputLabel>
                                <Select
                                    labelId="activite-label"
                                    id="id_activite"
                                    name="id_activite"
                                    value={formData.id_activite}
                                    onChange={handleChange}
                                    label="Activité"
                                >
                                    <MenuItem value="" disabled>-- Sélectionner une activité --</MenuItem>
                                    {activites.map((activite) => (
                                        <MenuItem key={activite.id} value={activite.id}>
                                            {activite.titre}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel id="statut-label">Statut</InputLabel>
                                <Select
                                    labelId="statut-label"
                                    id="statut"
                                    name="statut"
                                    value={formData.statut}
                                    onChange={handleChange}
                                    label="Statut"
                                >
                                    <MenuItem value="Présent">Présent</MenuItem>
                                    <MenuItem value="Absent">Absent</MenuItem>
                                    <MenuItem value="Retard">Retard</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                id="remarques"
                                name="remarques"
                                label="Remarques"
                                multiline
                                rows={3}
                                value={formData.remarques}
                                onChange={handleChange}
                                placeholder="Ajouter des remarques..."
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                <Button variant="outlined" onClick={handleBack} disabled={loading}>
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                                    disabled={loading}
                                >
                                    {loading ? 'Enregistrement...' : (state?.presence ? 'Modifier' : 'Enregistrer')}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Container>
    );
};

export default AjouterPresence;
