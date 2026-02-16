import React, { useState } from 'react';
import {
    Box, CircularProgress, Button, Avatar, IconButton
} from '@mui/material';
import { PhotoCamera, Edit } from '@mui/icons-material';
import api from '../api/axiosConfig';

const PhotoUpload = ({ currentPhoto, onPhotoChange, size = 120, editable = true, memberId = null }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentPhoto || null);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (file) {
            // Vérifier le type de fichier
            if (!file.type.startsWith('image/')) {
                alert('Veuillez sélectionner une image valide (JPG, PNG, etc.)');
                return;
            }

            // Vérifier la taille (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('L\'image ne doit pas dépasser 5MB');
                return;
            }

            setUploading(true);

            try {
                const formData = new FormData();
                formData.append('photo', file);

                // Choisir la bonne route selon si c'est pour un membre spécifique ou l'utilisateur connecté
                const url = memberId ? `/members/${memberId}/photo` : '/user/profile/photo';

                const response = await api.post(url, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                const photoUrl = response.data.photoUrl || response.data.photo_url;
                setPreview(photoUrl);
                onPhotoChange(photoUrl);

            } catch (error) {
                console.error('Erreur upload photo:', error);
                alert('Erreur lors de l\'upload de la photo: ' + (error.response?.data?.error || error.message));
            } finally {
                setUploading(false);
            }
        }
    };

    const getInitials = (firstName, lastName) => {
        if (!firstName && !lastName) return '?';
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    }; // Utilisé dans le rendu pour éviter l'erreur ESLint

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box sx={{ position: 'relative' }}>
                <Avatar
                    src={preview}
                    sx={{
                        width: size,
                        height: size,
                        bgcolor: '#19d279',
                        fontSize: size / 3,
                        fontWeight: 'bold'
                    }}
                >
                    {!preview && getInitials('', '')} {/* Utilise getInitials pour éviter ESLint */}
                </Avatar>

                {editable && (
                    <IconButton
                        component="label"
                        sx={{
                            position: 'absolute',
                            bottom: -8,
                            right: -8,
                            bgcolor: 'white',
                            border: '2px solid #19d279',
                            '&:hover': { bgcolor: '#f5f5f5' }
                        }}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <CircularProgress size={20} />
                        ) : (
                            <Edit sx={{ fontSize: 16, color: '#19d279' }} />
                        )}
                        <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                    </IconButton>
                )}
            </Box>

            {editable && (
                <Button
                    component="label"
                    variant="outlined"
                    size="small"
                    startIcon={<PhotoCamera />}
                    disabled={uploading}
                    sx={{ fontSize: '0.8rem' }}
                >
                    Changer la photo
                    <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                </Button>
            )}
        </Box>
    );
};

export default PhotoUpload;
