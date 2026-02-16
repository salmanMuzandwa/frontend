import React, { useEffect, useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import { Description as DescriptionIcon, Refresh as RefreshIcon, Visibility as VisibilityIcon, Upload as UploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../api/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { SERVER_BASE_URL } from '../utils/urlHelper';

const Documents = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [documentType, setDocumentType] = useState('');
    const [documentTitle, setDocumentTitle] = useState('');
    const [uploading, setUploading] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingDocument, setDeletingDocument] = useState(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [viewingDocument, setViewingDocument] = useState(null);
    const { token } = useAuth();

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/documents');
            const data = response.data || [];
            setDocuments(Array.isArray(data) ? data : (data.documents || []));
            setError(null);
        } catch (err) {
            console.error('Erreur lors du chargement des documents :', err);
            setError('Erreur lors du chargement des documents');
            setDocuments([]); // Ne pas utiliser de données factices
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    const handleFileChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
            // Définir le titre par défaut comme le nom du fichier sans l'extension
            const fileName = event.target.files[0].name;
            const titleWithoutExt = fileName.lastIndexOf('.') > 0 ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
            setDocumentTitle(titleWithoutExt);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !documentType || !documentTitle) {
            setError('Veuillez sélectionner un fichier, un type et un titre');
            return;
        }

        const formData = new FormData();
        formData.append('fichier', selectedFile);
        formData.append('titre', documentTitle);
        formData.append('type', documentType);

        setUploading(true);
        try {
            const response = await api.post('/documents/upload', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Mettre à jour la liste des documents
            setDocuments([response.data, ...documents]);
            setUploadOpen(false);
            setSelectedFile(null);
            setDocumentTitle('');
            setDocumentType('');
        } catch (err) {
            console.error('Erreur lors du téléversement du document :', err);
            setError('Erreur lors du téléversement du document');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteClick = (document) => {
        setDeletingDocument(document);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingDocument) return;

        setUploading(true);
        setError(null);

        try {
            const documentId = deletingDocument.id_document || deletingDocument.id;
            console.log('Tentative de suppression du document ID:', documentId);

            await api.delete(`/documents/${documentId}`);

            console.log('Document supprimé avec succès');

            // Mettre à jour la liste des documents
            setDocuments(prevDocuments =>
                prevDocuments.filter(doc =>
                    (doc.id_document || doc.id) !== documentId
                )
            );

            setDeleteOpen(false);
            setDeletingDocument(null);

            // Afficher un message de succès
            setError('Document supprimé avec succès');
            setTimeout(() => setError(null), 3000);

        } catch (err) {
            console.error('Erreur lors de la suppression du document :', err);

            let errorMessage = 'Erreur lors de la suppression du document';
            if (err.response) {
                errorMessage = err.response.data?.message || errorMessage;
                console.error('Détails de l\'erreur:', err.response.status, err.response.data);
            }

            setError(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const handleView = async (document) => {
        if (document.fichier_url) {
            // Construire l'URL complète du fichier
            const fileUrl = document.fichier_url.startsWith('/')
                ? `${SERVER_BASE_URL}${document.fichier_url}`
                : `${SERVER_BASE_URL}/${document.fichier_url}`;

            // Ouvrir le fichier dans un nouvel onglet
            window.open(fileUrl, '_blank', 'noopener,noreferrer');
        } else {
            setError('Ce document n\'a pas de fichier associé');
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleDownload = async (document) => {
        try {
            const response = await api.get(`/documents/${document.id_document || document.id}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                responseType: 'blob'
            });

            // Créer un lien de téléchargement
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', document.titre || document.nom || 'document');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Erreur lors du téléchargement du document :', err);
            setError('Erreur lors du téléchargement du document');
        }
    };

    return (
        <>
            <Container sx={{ mt: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4">
                        Gestion des Documents
                    </Typography>
                    <Box display="flex" gap={1}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<UploadIcon />}
                            onClick={() => setUploadOpen(true)}
                        >
                            Ajouter un document
                        </Button>
                        <IconButton color="primary" onClick={fetchDocuments}>
                            <RefreshIcon />
                        </IconButton>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Paper>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nom</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {documents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <Typography variant="body2" color="text.secondary">
                                                Aucun document trouvé.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    documents.map((doc) => (
                                        <TableRow key={doc.id_document || doc.id || doc._id}>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <DescriptionIcon fontSize="small" />
                                                    <Typography variant="body2">{doc.titre || doc.nom || 'Sans titre'}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{doc.type_document || doc.type || doc.categorie || 'N/A'}</TableCell>
                                            <TableCell>
                                                {doc.date_creation
                                                    ? new Date(doc.date_creation).toLocaleDateString('fr-FR')
                                                    : doc.date || 'N/A'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={() => handleView(doc)}>
                                                    <VisibilityIcon />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleDeleteClick(doc)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Container>

            {/* Boîte de dialogue de téléversement */}
            <Dialog open={uploadOpen} onClose={() => !uploading && setUploadOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Ajouter un nouveau document</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<UploadIcon />}
                        >
                            Sélectionner un fichier
                            <input
                                type="file"
                                hidden
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                            />
                        </Button>
                        {selectedFile && (
                            <Typography variant="body2" color="text.secondary">
                                Fichier sélectionné : {selectedFile.name}
                            </Typography>
                        )}

                        <TextField
                            label="Titre du document"
                            fullWidth
                            value={documentTitle}
                            onChange={(e) => setDocumentTitle(e.target.value)}
                            required
                        />

                        <FormControl fullWidth required>
                            <InputLabel>Type de document</InputLabel>
                            <Select
                                value={documentType}
                                label="Type de document"
                                onChange={(e) => setDocumentType(e.target.value)}
                            >
                                <MenuItem value="Statut">Statut</MenuItem>
                                <MenuItem value="PV">PV</MenuItem>
                                <MenuItem value="Rapport">Rapport</MenuItem>
                                <MenuItem value="Autre">Autre</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUploadOpen(false)} disabled={uploading}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleUpload}
                        variant="contained"
                        color="primary"
                        disabled={!selectedFile || !documentType || !documentTitle || uploading}
                    >
                        {uploading ? 'Téléversement...' : 'Téléverser'}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={deleteOpen} onClose={() => !uploading && setDeleteOpen(false)}>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>Êtes-vous sûr de vouloir supprimer "{deletingDocument?.titre}" ?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)}>Annuler</Button>
                    <Button onClick={handleDelete} color="error">Supprimer</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Documents;
