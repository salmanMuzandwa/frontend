import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Box,
    Alert,
    CircularProgress,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Tooltip,
    useTheme,
    useMediaQuery,
    Grid,
    Card,
    CardContent,
    CardActions
} from '@mui/material';
import {
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Work as WorkIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axiosConfig';

const RegistrationRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const { hasPermission } = useAuth();
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        if (hasPermission('membres')) {
            fetchRequests();
        } else {
            setError('Vous n\'avez pas les permissions pour accéder à cette page.');
            setLoading(false);
        }
    }, [hasPermission]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/registration-requests');
            setRequests(response.data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des demandes:', error);
            setError('Erreur lors du chargement des demandes d\'inscription.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId) => {
        try {
            setActionLoading(true);
            setError('');
            setSuccess('');

            await api.post(`/registration-requests/${requestId}/approve`);

            setSuccess('Demande approuvée avec succès! Le compte utilisateur a été créé.');
            fetchRequests(); // Recharger la liste

        } catch (error) {
            console.error('Erreur lors de l\'approbation:', error);
            setError(error.response?.data?.message || 'Erreur lors de l\'approbation de la demande.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectDialogOpen = (request) => {
        setSelectedRequest(request);
        setRejectionReason('');
        setRejectDialogOpen(true);
        setError('');
        setSuccess('');
    };

    const handleReject = async () => {
        if (!selectedRequest) return;

        try {
            setActionLoading(true);
            setError('');
            setSuccess('');

            await api.post(`/registration-requests/${selectedRequest.id}/reject`, {
                reason: rejectionReason || 'Demande rejetée par l\'administrateur'
            });

            setSuccess('Demande rejetée avec succès.');
            setRejectDialogOpen(false);
            fetchRequests(); // Recharger la liste

        } catch (error) {
            console.error('Erreur lors du rejet:', error);
            setError(error.response?.data?.message || 'Erreur lors du rejet de la demande.');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusChip = (status) => {
        const statusConfig = {
            pending: { color: 'warning', label: 'En attente' },
            approved: { color: 'success', label: 'Approuvée' },
            rejected: { color: 'error', label: 'Rejetée' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        return <Chip label={config.label} color={config.color} size="small" />;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!hasPermission('membres')) {
        return (
            <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 } }}>
                <Alert severity="error">
                    Vous n'avez pas les permissions pour accéder à cette page.
                </Alert>
            </Container>
        );
    }

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 }, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 } }}>
            <Paper sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant={isSmallMobile ? "h5" : "h4"} component="h1" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    Demandes d'inscription
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    Gérez les demandes d'inscription des nouveaux membres en attente de validation.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

                {/* Affichage Desktop */}
                {!isMobile ? (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell><strong>Nom</strong></TableCell>
                                    <TableCell><strong>Email</strong></TableCell>
                                    <TableCell><strong>Téléphone</strong></TableCell>
                                    <TableCell><strong>Profession</strong></TableCell>
                                    <TableCell><strong>Date</strong></TableCell>
                                    <TableCell><strong>Statut</strong></TableCell>
                                    <TableCell align="center"><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {requests.length > 0 ? (
                                    requests.map((request) => (
                                        <TableRow key={request.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {request.prenom} {request.nom}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <EmailIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                                                    <Typography variant="body2">{request.email}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <PhoneIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                                                    <Typography variant="body2">{request.telephone || 'Non spécifié'}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <WorkIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                                                    <Typography variant="body2">{request.profession || 'Non spécifiée'}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {formatDate(request.created_at)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusChip(request.status)}
                                            </TableCell>
                                            <TableCell align="center">
                                                {request.status === 'pending' && (
                                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                        <Tooltip title="Approuver">
                                                            <IconButton
                                                                color="success"
                                                                onClick={() => handleApprove(request.id)}
                                                                disabled={actionLoading}
                                                                size="small"
                                                            >
                                                                <ApproveIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Rejeter">
                                                            <IconButton
                                                                color="error"
                                                                onClick={() => handleRejectDialogOpen(request)}
                                                                disabled={actionLoading}
                                                                size="small"
                                                            >
                                                                <RejectIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                )}
                                                {request.status === 'approved' && (
                                                    <Chip label="Compte créé" color="success" size="small" />
                                                )}
                                                {request.status === 'rejected' && (
                                                    <Tooltip title={request.rejection_reason}>
                                                        <Chip label="Rejetée" color="error" size="small" />
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                                                Aucune demande d'inscription en attente.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    /* Affichage Mobile */
                    <Box>
                        {requests.length > 0 ? (
                            <Grid container spacing={2}>
                                {requests.map((request) => (
                                    <Grid item xs={12} sm={6} key={request.id}>
                                        <Card variant="outlined" sx={{ height: '100%' }}>
                                            <CardContent sx={{ pb: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                                    <Typography variant="h6" component="div" sx={{ fontSize: '1.1rem' }}>
                                                        {request.prenom} {request.nom}
                                                    </Typography>
                                                </Box>
                                                
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <EmailIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                                                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                                        {request.email}
                                                    </Typography>
                                                </Box>
                                                
                                                {request.telephone && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <PhoneIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                                                        <Typography variant="body2">
                                                            {request.telephone}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                
                                                {request.profession && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <WorkIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                                                        <Typography variant="body2">
                                                            {request.profession}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatDate(request.created_at)}
                                                    </Typography>
                                                    {getStatusChip(request.status)}
                                                </Box>
                                            </CardContent>
                                            
                                            <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
                                                {request.status === 'pending' && (
                                                    <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                                                        <Button
                                                            variant="contained"
                                                            color="success"
                                                            size="small"
                                                            onClick={() => handleApprove(request.id)}
                                                            disabled={actionLoading}
                                                            startIcon={<ApproveIcon />}
                                                            sx={{ flex: 1 }}
                                                        >
                                                            Approuver
                                                        </Button>
                                                        <Button
                                                            variant="outlined"
                                                            color="error"
                                                            size="small"
                                                            onClick={() => handleRejectDialogOpen(request)}
                                                            disabled={actionLoading}
                                                            startIcon={<RejectIcon />}
                                                            sx={{ flex: 1 }}
                                                        >
                                                            Rejeter
                                                        </Button>
                                                    </Box>
                                                )}
                                                {request.status === 'approved' && (
                                                    <Box sx={{ width: '100%' }}>
                                                        <Chip label="Compte créé" color="success" size="small" sx={{ width: '100%' }} />
                                                    </Box>
                                                )}
                                                {request.status === 'rejected' && (
                                                    <Box sx={{ width: '100%' }}>
                                                        <Tooltip title={request.rejection_reason}>
                                                            <Chip label="Rejetée" color="error" size="small" sx={{ width: '100%' }} />
                                                        </Tooltip>
                                                    </Box>
                                                )}
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Aucune demande d'inscription en attente.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Dialogue de rejet */}
                <Dialog 
                    open={rejectDialogOpen} 
                    onClose={() => setRejectDialogOpen(false)} 
                    maxWidth="sm" 
                    fullWidth
                    fullScreen={isSmallMobile}
                >
                    <DialogTitle>Rejeter la demande d'inscription</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Vous êtes sur le point de rejeter la demande d'inscription de :
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" sx={{ mb: 2 }}>
                            {selectedRequest?.prenom} {selectedRequest?.nom} ({selectedRequest?.email})
                        </Typography>
                        <TextField
                            fullWidth
                            label="Raison du rejet (optionnel)"
                            multiline
                            rows={isSmallMobile ? 4 : 3}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Expliquez pourquoi vous rejetez cette demande..."
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button 
                            onClick={() => setRejectDialogOpen(false)} 
                            disabled={actionLoading}
                            sx={{ minWidth: { xs: 80, sm: 100 } }}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleReject}
                            color="error"
                            variant="contained"
                            disabled={actionLoading}
                            sx={{ minWidth: { xs: 80, sm: 100 } }}
                        >
                            {actionLoading ? <CircularProgress size={20} /> : 'Rejeter'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Paper>
        </Container>
    );
};

export default RegistrationRequests;
