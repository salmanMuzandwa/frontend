import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    Card,
    CardContent,
    Tabs,
    Tab,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Support as SupportIcon,
    AttachMoney as AttachMoneyIcon,
    LocalHospital as LocalHospitalIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { getApiUrl } from '../utils/urlHelper';

const typesCas = [
    { value: 'Maladie', label: 'Maladie' },
    { value: 'Décès', label: 'Décès' },
    { value: 'Accident', label: 'Accident' },
    { value: 'Mariage', label: 'Mariage' },
    { value: 'Naissance', label: 'Naissance' },
    { value: 'Autre', label: 'Autre' },
];

const statutsCas = [
    { value: 'Ouvert', label: 'Ouvert' },
    { value: 'En Cours', label: 'En Cours' },
    { value: 'Fermé', label: 'Fermé' },
];

const naturesAide = [
    { value: 'Financière', label: 'Aide Financière' },
    { value: 'Matérielle', label: 'Aide Matérielle' },
    { value: 'Médicale', label: 'Aide Médicale' },
    { value: 'Autre', label: 'Autre' },
];

function TabPanel({ children, value, index, ...other }) {
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

export default function CasSociaux() {
    const { token, hasPermission } = useAuth();
    const [casSociaux, setCasSociaux] = useState([]);
    const [assistances, setAssistances] = useState([]);
    const [membres, setMembres] = useState([]); // État pour la liste des membres
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [assistanceDialogOpen, setAssistanceDialogOpen] = useState(false);
    const [selectedCas, setSelectedCas] = useState(null);
    const [selectedAssistance, setSelectedAssistance] = useState(null);

    const [casFormData, setCasFormData] = useState({
        id_membre: '',
        type_cas: 'Maladie',
        description: '',
        statut: 'Ouvert'
    });

    const [assistanceFormData, setAssistanceFormData] = useState({
        id_cas: '',
        nature_aide: 'Financière',
        montant: '',
        description: '',
        date_assistance: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (token) {
            fetchInitialData();
        }
    }, [token]);

    const fetchInitialData = async () => {
        setLoading(true);
        await Promise.all([
            fetchCasSociaux(),
            fetchAssistances(),
            fetchMembres()
        ]);
        setLoading(false);
    };

    const fetchCasSociaux = async () => {
        try {
            const response = await axios.get(getApiUrl('/cas-sociaux'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCasSociaux(response.data || []);
        } catch (err) {
            console.error('Erreur cas sociaux:', err);
        }
    };

    const fetchAssistances = async () => {
        try {
            const response = await axios.get(getApiUrl('/assistances'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAssistances(response.data || []);
        } catch (err) {
            console.error('Erreur assistances:', err);
        }
    };

    const fetchMembres = async () => {
        try {
            const response = await axios.get(getApiUrl('/members'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Gestion flexible du format de réponse (Tableau direct ou objet avec propriété membres)
            const data = Array.isArray(response.data) ? response.data : (response.data.membres || []);
            setMembres(data);
        } catch (err) {
            console.error('Erreur membres:', err);
        }
    };

    const handleOpenCasDialog = (cas = null) => {
        if (cas) {
            setSelectedCas(cas);
            setCasFormData({
                id_membre: cas.id_membre,
                type_cas: cas.type_cas,
                description: cas.description,
                statut: cas.statut
            });
        } else {
            setSelectedCas(null);
            setCasFormData({ id_membre: '', type_cas: 'Maladie', description: '', statut: 'Ouvert' });
        }
        setDialogOpen(true);
    };

    const handleCloseCasDialog = () => {
        setDialogOpen(false);
        setSelectedCas(null);
    };

    const handleOpenAssistanceDialog = (cas = null, assistance = null) => {
        if (assistance) {
            setSelectedAssistance(assistance);
            setAssistanceFormData({
                ...assistance,
                date_assistance: assistance.date_assistance.split('T')[0]
            });
        } else {
            setSelectedAssistance(null);
            setAssistanceFormData({
                id_cas: cas ? cas.id_cas : '',
                nature_aide: 'Financière',
                montant: '',
                description: '',
                date_assistance: new Date().toISOString().split('T')[0]
            });
        }
        setAssistanceDialogOpen(true);
    };

    const handleCloseAssistanceDialog = () => {
        setAssistanceDialogOpen(false);
        setSelectedAssistance(null);
    };

    const handleSubmitCas = async (e) => {
        e.preventDefault();
        try {
            if (selectedCas) {
                await axios.put(getApiUrl(`/cas-sociaux/${selectedCas.id_cas}`), casFormData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                alert('Cas social modifié avec succès');
            } else {
                await axios.post(getApiUrl('/cas-sociaux'), casFormData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                alert('Cas social créé avec succès');
            }
            fetchCasSociaux();
            handleCloseCasDialog();
        } catch (err) {
            console.error('Sauvegarde cas échouée', err);
            alert('Erreur lors de la sauvegarde du cas social');
        }
    };

    const handleSubmitAssistance = async (e) => {
        e.preventDefault();
        try {
            if (selectedAssistance) {
                await axios.put(getApiUrl(`/assistances/${selectedAssistance.id_assistance}`), assistanceFormData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                alert('Assistance modifiée avec succès');
            } else {
                await axios.post(getApiUrl('/assistances'), assistanceFormData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                alert('Assistance créée avec succès');
            }
            fetchAssistances();
            handleCloseAssistanceDialog();
        } catch (err) {
            console.error('Sauvegarde assistance échouée', err);
            alert('Erreur lors de la sauvegarde de l\'assistance');
        }
    };

    const handleDeleteCas = async (id) => {
        if (window.confirm('Supprimer ce cas ?')) {
            await axios.delete(getApiUrl(`/cas-sociaux/${id}`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCasSociaux();
        }
    };

    const handleDeleteAssistance = async (id) => {
        if (window.confirm('Supprimer cette assistance ?')) {
            try {
                await axios.delete(getApiUrl(`/assistances/${id}`), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                fetchAssistances();
            } catch (err) {
                console.error('Suppression assistance échouée', err);
                alert('Erreur lors de la suppression de l\'assistance');
            }
        }
    };

    const getStatutColor = (s) => s === 'Ouvert' ? 'warning' : s === 'En Cours' ? 'info' : 'success';

    if (loading) return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Cas Sociaux</Typography>
                {hasPermission('cas_sociaux') && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenCasDialog()}>
                        Nouveau Cas
                    </Button>
                )}
            </Box>

            <Paper>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                        <Tab label="Cas Sociaux" />
                        <Tab label="Assistances" />
                    </Tabs>
                    {tabValue === 1 && hasPermission('cas_sociaux') && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenAssistanceDialog()}>
                            Nouvelle Assistance
                        </Button>
                    )}
                </Box>

                <TabPanel value={tabValue} index={0}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Membre</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {casSociaux.map((cas) => {
                                    const membre = membres.find(m => m.id === cas.id_membre);
                                    return (
                                        <TableRow key={cas.id_cas}>
                                            <TableCell><Chip label={cas.type_cas} size="small" /></TableCell>
                                            <TableCell>{membre ? `${membre.nom} ${membre.prenom}` : 'Chargement...'}</TableCell>
                                            <TableCell><Chip label={cas.statut} color={getStatutColor(cas.statut)} size="small" /></TableCell>
                                            <TableCell>
                                                <IconButton onClick={() => handleOpenCasDialog(cas)}><EditIcon /></IconButton>
                                                <IconButton onClick={() => handleOpenAssistanceDialog(cas)}><AttachMoneyIcon /></IconButton>
                                                <IconButton onClick={() => handleDeleteCas(cas.id_cas)}><DeleteIcon /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nature Aide</TableCell>
                                    <TableCell>Montant</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {assistances.map((assistance) => (
                                    <TableRow key={assistance.id_assistance}>
                                        <TableCell><Chip label={assistance.nature_aide} size="small" /></TableCell>
                                        <TableCell>{assistance.montant ? `${assistance.montant} $` : 'N/A'}</TableCell>
                                        <TableCell>{assistance.description}</TableCell>
                                        <TableCell>{new Date(assistance.date_assistance).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleOpenAssistanceDialog(null, assistance)}><EditIcon /></IconButton>
                                            <IconButton onClick={() => handleDeleteAssistance(assistance.id_assistance)}><DeleteIcon /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>
            </Paper>

            {/* FORMULAIRE NOUVEAU CAS */}
            <Dialog open={dialogOpen} onClose={handleCloseCasDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedCas ? 'Modifier' : 'Nouveau Cas'}</DialogTitle>
                <form onSubmit={handleSubmitCas}>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <FormControl fullWidth required>
                                    <InputLabel>Membre</InputLabel>
                                    <Select
                                        value={casFormData.id_membre || ''}
                                        onChange={(e) => setCasFormData({ ...casFormData, id_membre: e.target.value })}
                                        label="Membre"
                                    >
                                        {membres.length > 0 ? (
                                            membres.map((m) => (
                                                <MenuItem key={m.id} value={m.id}>
                                                    {m.nom} {m.prenom}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled value="">Aucun membre disponible</MenuItem>
                                        )}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={casFormData.type_cas}
                                        onChange={(e) => setCasFormData({ ...casFormData, type_cas: e.target.value })}
                                        label="Type"
                                    >
                                        {typesCas.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Statut</InputLabel>
                                    <Select
                                        value={casFormData.statut}
                                        onChange={(e) => setCasFormData({ ...casFormData, statut: e.target.value })}
                                        label="Statut"
                                    >
                                        {statutsCas.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    multiline
                                    rows={3}
                                    value={casFormData.description}
                                    onChange={(e) => setCasFormData({ ...casFormData, description: e.target.value })}
                                    required
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseCasDialog}>Annuler</Button>
                        <Button type="submit" variant="contained">Enregistrer</Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* FORMULAIRE ASSISTANCE AUTONOME */}
            <Dialog open={assistanceDialogOpen} onClose={handleCloseAssistanceDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedAssistance ? 'Modifier' : 'Nouvelle Assistance'}</DialogTitle>
                <form onSubmit={handleSubmitAssistance}>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <FormControl fullWidth required>
                                    <InputLabel>Cas Social</InputLabel>
                                    <Select
                                        value={assistanceFormData.id_cas || ''}
                                        onChange={(e) => setAssistanceFormData({ ...assistanceFormData, id_cas: e.target.value })}
                                        label="Cas Social"
                                    >
                                        {casSociaux.length > 0 ? (
                                            casSociaux.map((cas) => {
                                                const membre = membres.find(m => m.id === cas.id_membre);
                                                return (
                                                    <MenuItem key={cas.id_cas} value={cas.id_cas}>
                                                        {cas.type_cas} - {membre ? `${membre.nom} ${membre.prenom}` : 'Membre inconnu'}
                                                    </MenuItem>
                                                );
                                            })
                                        ) : (
                                            <MenuItem disabled value="">Aucun cas disponible</MenuItem>
                                        )}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Nature Aide</InputLabel>
                                    <Select
                                        value={assistanceFormData.nature_aide}
                                        onChange={(e) => setAssistanceFormData({ ...assistanceFormData, nature_aide: e.target.value })}
                                        label="Nature Aide"
                                    >
                                        {naturesAide.map(n => <MenuItem key={n.value} value={n.value}>{n.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Montant ($)"
                                    type="number"
                                    value={assistanceFormData.montant}
                                    onChange={(e) => setAssistanceFormData({ ...assistanceFormData, montant: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    multiline
                                    rows={3}
                                    value={assistanceFormData.description}
                                    onChange={(e) => setAssistanceFormData({ ...assistanceFormData, description: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Date Assistance"
                                    type="date"
                                    value={assistanceFormData.date_assistance}
                                    onChange={(e) => setAssistanceFormData({ ...assistanceFormData, date_assistance: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseAssistanceDialog}>Annuler</Button>
                        <Button type="submit" variant="contained">Enregistrer</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    )
}
