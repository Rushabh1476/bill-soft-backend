import React, { useState, useCallback } from 'react';
import {
    Box,
    Button,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Slider,
    IconButton,
    ToggleButton,
    ToggleButtonGroup,
    Stack,
    Tooltip,
} from '@mui/material';
import {
    Close as CloseIcon,
    Crop as CropIcon,
    Square as SquareIcon,
    Rectangle as RectangleIcon,
    CropFree as FreeIcon
} from '@mui/icons-material';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../utils/imageCrop';

interface Area {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface UniversalImageCropperProps {
    open: boolean;
    imageSrc: string | null;
    onClose: () => void;
    onCropComplete: (croppedBlob: Blob, previewUrl: string) => void;
    title?: string;
    initialAspect?: number;
    lockAspect?: boolean;
    showGuides?: boolean;
}

const UniversalImageCropper: React.FC<UniversalImageCropperProps> = ({
    open,
    imageSrc,
    onClose,
    onCropComplete,
    title = "Edit Image",
    initialAspect = 1,
    lockAspect = false,
    showGuides = false
}) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [aspect, setAspect] = useState<number | undefined>(initialAspect);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onRotationChange = (rotation: number) => {
        setRotation(rotation);
    };

    const handleAspectChange = (_e: any, newAspect: number | null) => {
        if (newAspect !== null) {
            setAspect(newAspect === 0 ? undefined : newAspect);
        }
    };

    const handleCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleConfirm = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setIsProcessing(true);
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
            const previewUrl = URL.createObjectURL(croppedBlob);
            onCropComplete(croppedBlob, previewUrl);
        } catch (e) {
            console.error('Failed to crop image', e);
        } finally {
            setIsProcessing(false);
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '20px',
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
                }
            }}
        >
            <DialogTitle sx={{
                m: 0,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <CropIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                        {title}
                    </Typography>
                </Stack>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{
                p: 0,
                bgcolor: '#1a1a1a',
                position: 'relative',
                height: '500px',
                // Conditional Centering Guides
                ...(showGuides && {
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '50%',
                        left: '10%',
                        right: '10%',
                        height: '1px',
                        bgcolor: 'rgba(255, 0, 0, 0.4)',
                        zIndex: 10,
                        pointerEvents: 'none'
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        left: '50%',
                        top: '10%',
                        bottom: '10%',
                        width: '1px',
                        bgcolor: 'rgba(255, 0, 0, 0.4)',
                        zIndex: 10,
                        pointerEvents: 'none'
                    }
                })
            }}>
                {imageSrc && (
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspect}
                        onCropChange={onCropChange}
                        onRotationChange={onRotationChange}
                        onCropComplete={handleCropComplete}
                        onZoomChange={onZoomChange}
                        showGrid={!showGuides} // Hide grid if custom guides are used
                    />
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, flexDirection: 'column', gap: 2 }}>
                <Box sx={{ width: '100%' }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
                        Aspect Ratio
                    </Typography>
                    <ToggleButtonGroup
                        value={aspect === undefined ? 0 : aspect}
                        exclusive
                        onChange={handleAspectChange}
                        size="small"
                        disabled={lockAspect}
                        fullWidth
                        sx={{
                            '& .MuiToggleButton-root': {
                                borderRadius: '8px',
                                border: '1px solid',
                                borderColor: 'divider',
                                m: 0.5,
                            }
                        }}
                    >
                        <ToggleButton value={1}>
                            <Tooltip title="Square (1:1)">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <SquareIcon fontSize="small" />
                                    <Typography variant="caption">1:1</Typography>
                                </Stack>
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value={4 / 5}>
                            <Tooltip title="Portrait (4:5)">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <RectangleIcon fontSize="small" sx={{ transform: 'rotate(90deg)' }} />
                                    <Typography variant="caption">4:5</Typography>
                                </Stack>
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value={16 / 9}>
                            <Tooltip title="Landscape (16:9)">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <RectangleIcon fontSize="small" />
                                    <Typography variant="caption">16:9</Typography>
                                </Stack>
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value={3 / 1}>
                            <Tooltip title="Wide (3:1)">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <RectangleIcon fontSize="small" sx={{ transform: 'scaleX(1.5)' }} />
                                    <Typography variant="caption">3:1</Typography>
                                </Stack>
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value={0}>
                            <Tooltip title="Free Ratio">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <FreeIcon fontSize="small" />
                                    <Typography variant="caption">Free</Typography>
                                </Stack>
                            </Tooltip>
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                <Stack direction="row" spacing={4} sx={{ width: '100%', alignItems: 'center' }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">Zoom</Typography>
                        <Slider
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            size="small"
                            onChange={(_e, v) => setZoom(v as number)}
                            valueLabelDisplay="auto"
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">Rotation</Typography>
                        <Slider
                            value={rotation}
                            min={0}
                            max={360}
                            step={1}
                            size="small"
                            onChange={(_e, v) => setRotation(v as number)}
                            valueLabelDisplay="auto"
                        />
                    </Box>
                </Stack>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', gap: 2, mt: 1 }}>
                    <Button onClick={onClose} variant="text" sx={{ borderRadius: '10px', px: 3 }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        variant="contained"
                        disabled={isProcessing}
                        startIcon={isProcessing ? null : <CropIcon />}
                        sx={{
                            borderRadius: '10px',
                            px: 4,
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                        }}
                    >
                        {isProcessing ? 'Cropping...' : 'Confirm Crop'}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default UniversalImageCropper;
