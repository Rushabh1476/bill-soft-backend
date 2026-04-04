/* eslint-disable */
import React, { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Avatar,
    IconButton,
    Paper,
    Stack,
    Tooltip,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    AddPhotoAlternate as AddIcon
} from '@mui/icons-material';
import UniversalImageCropper from './UniversalImageCropper';

interface ImageUploadFieldProps {
    value?: string;
    onChange: (file: Blob, previewUrl: string) => void;
    onDelete?: () => void;
    label?: string;
    aspect?: number;
    showGuides?: boolean;
    helperText?: string;
    maxWidth?: number;
    maxHeight?: number;
    useCropper?: boolean;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
    value,
    onChange,
    onDelete,
    label = "Upload Image",
    aspect = 1,
    showGuides = false,
    helperText = "Recommendation: PNG or JPG. Max 5MB.",
    maxWidth = 200,
    maxHeight = 200,
    useCropper = true
}) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [originalFileName, setOriginalFileName] = useState("");

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setOriginalFileName(file.name);

        if (!useCropper) {
            const preview = URL.createObjectURL(file);
            onChange(file, preview);
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImageSrc(reader.result as string);
            setIsCropping(true);
        });
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    const handleCropSave = (croppedBlob: Blob, previewUrl: string) => {
        onChange(croppedBlob, previewUrl);
        setIsCropping(false);
        setImageSrc(null);
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: '12px',
                border: '2px dashed',
                borderColor: value ? 'primary.light' : 'divider',
                bgcolor: 'background.default',
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                },
                transition: 'all 0.2s ease-in-out'
            }}
        >
            <Stack spacing={2} alignItems="center" textAlign="center">
                <Box position="relative">
                    <Avatar
                        src={value || undefined}
                        variant="rounded"
                        sx={{
                            width: maxWidth,
                            height: maxHeight,
                            bgcolor: 'grey.100',
                            border: '1px solid',
                            borderColor: 'divider',
                            fontSize: 48,
                            boxShadow: value ? '0 8px 16px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        {!value && <AddIcon sx={{ fontSize: 60, color: 'text.disabled' }} />}
                    </Avatar>

                    {value && (
                        <Box sx={{
                            position: 'absolute',
                            top: -10,
                            right: -10,
                            display: 'flex',
                            gap: 0.5,
                            bgcolor: 'background.paper',
                            borderRadius: '20px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            p: 0.5
                        }}>
                            <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={onDelete}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <label htmlFor="image-reupload-input">
                                <Tooltip title="Change Image">
                                    <IconButton size="small" color="primary" component="span">
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <input id="image-reupload-input" type="file" hidden accept="image/*" onChange={handleFileSelect} />
                            </label>
                        </Box>
                    )}
                </Box>

                {!value ? (
                    <Box component="label" sx={{ width: '100%', cursor: 'pointer' }}>
                        <Typography variant="subtitle2" fontWeight="700">
                            {label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                            {helperText}
                        </Typography>
                        <Button
                            variant="contained"
                            component="span"
                            startIcon={<UploadIcon />}
                            size="small"
                            sx={{ borderRadius: '8px', px: 3 }}
                        >
                            Select Image
                        </Button>
                        <input type="file" hidden accept="image/*" onChange={handleFileSelect} />
                    </Box>
                ) : (
                    <Typography variant="caption" color="primary" fontWeight="bold">
                        Ready for Save
                    </Typography>
                )}
            </Stack>

            <UniversalImageCropper
                open={isCropping}
                imageSrc={imageSrc}
                onClose={() => setIsCropping(false)}
                onCropComplete={handleCropSave}
                initialAspect={aspect}
                showGuides={showGuides}
            />
        </Paper>
    );
};

export default ImageUploadField;
