/* eslint-disable */
import React, { useState, useEffect } from 'react';
import {
    CloudUpload as UploadIcon,
    CheckCircle as SuccessIcon,
    Business as BusinessIcon,
    FormatAlignLeft as AlignLeftIcon,
    FormatAlignCenter as AlignCenterIcon,
    FormatAlignRight as AlignRightIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';
import {
    Box,
    Button,
    Typography,
    Avatar,
    CircularProgress,
    Alert,
    ToggleButton,
    ToggleButtonGroup,
    Paper,
    Stack,
    Slider,
} from '@mui/material';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { resolveFileUrl } from '../../utils/url';
import UniversalImageCropper from '../common/UniversalImageCropper';

/**
 * LogoUpload Component
 * Mirrors the screenshot UI exactly:
 *  - Logo preview + Alignment toggle + Change Logo / Remove buttons
 *  - "Adjust Logo on Bill" panel: Logo Size, Horizontal Position, Vertical Position sliders
 *  - "Apply Adjustments to Bill" button
 */
const LogoUpload: React.FC = () => {
    const { user, updateProfile } = useAuth();
    const [preview, setPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [logoPosition, setLogoPosition] = useState<string>('left');

    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [originalFileName, setOriginalFileName] = useState('');

    // Fine-tune settings
    const [logoWidth, setLogoWidth] = useState<number>(100);
    const [logoOffsetX, setLogoOffsetX] = useState<number>(0);
    const [logoOffsetY, setLogoOffsetY] = useState<number>(0);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    useEffect(() => {
        setPreview(user?.logoUrl ? resolveFileUrl(user.logoUrl) : null);
        if (user?.logoPosition) {
            setLogoPosition(user.logoPosition);
        }
        if (user?.logoWidth) {
            setLogoWidth(user.logoWidth);
        }
        if ((user as any)?.logoOffsetX !== undefined) {
            setLogoOffsetX((user as any).logoOffsetX);
        }
        if (user?.logoOffsetY !== undefined) {
            setLogoOffsetY(user.logoOffsetY);
        }
    }, [user?.logoUrl, user?.logoPosition, user?.logoWidth, (user as any)?.logoOffsetX, user?.logoOffsetY]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setStatus({ type: 'error', message: 'File is too large. Max limit is 10MB.' });
            return;
        }

        setOriginalFileName(file.name);
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImageSrc(reader.result as string);
            setIsCropping(true);
        });
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    const handleCropComplete = async (croppedBlob: Blob, previewUrl: string) => {
        setIsLoading(true);
        setPreview(previewUrl);
        setStatus({ type: 'info', message: 'Uploading and processing logo...' });

        try {
            const croppedFile = new File([croppedBlob], originalFileName || 'logo.png', {
                type: 'image/png'
            });

            const response = await authAPI.uploadLogo(croppedFile, logoPosition);

            updateProfile({
                logoUrl: response.logoUrl,
                logoPosition: logoPosition
            });

            setStatus({
                type: 'success',
                message: 'Brand identity updated successfully!'
            });

            setTimeout(() => setStatus(null), 5000);
        } catch (error: any) {
            console.error('[LogoUpload] Process failed:', error);
            setStatus({ type: 'error', message: error.response?.data?.error || 'Failed to sync logo.' });
        } finally {
            setIsLoading(false);
            setImageSrc(null);
        }
    };

    const handleRemoveLogo = async () => {
        try {
            setIsLoading(true);
            await updateProfile({ logoUrl: null });
            setPreview(null);
            setStatus({ type: 'success', message: 'Logo removed successfully.' });
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            setStatus({ type: 'error', message: 'Failed to remove logo.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            await authAPI.updateLogoSettings({
                position: logoPosition,
                width: logoWidth,
                offsetX: logoOffsetX,
                offsetY: logoOffsetY
            });
            updateProfile({
                logoPosition,
                logoWidth,
                logoOffsetX,
                logoOffsetY
            });
            setStatus({ type: 'success', message: 'Logo layout updated successfully!' });
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            console.error('Failed to update logo settings:', error);
            setStatus({ type: 'error', message: 'Failed to update logo layout.' });
        } finally {
            setIsSavingSettings(false);
        }
    };

    return (
        <Paper elevation={0} sx={{
            p: 3,
            borderRadius: '16px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
        }}>
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h6" fontWeight="700">Logo &amp; Branding</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Customize how your brand appears on generated invoices and documents.
                    </Typography>
                </Box>

                {status && (
                    <Alert severity={status.type} sx={{ borderRadius: '12px' }}>
                        {status.message}
                    </Alert>
                )}

                {/* ── Top row: logo preview + alignment + buttons ── */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 4, flexWrap: 'wrap' }}>
                    {/* Logo preview */}
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            src={preview || undefined}
                            variant="rounded"
                            sx={{
                                width: 140,
                                height: 140,
                                border: '2px dashed',
                                borderColor: preview ? 'primary.main' : 'divider',
                                padding: preview ? '4px' : 0,
                                bgcolor: 'background.paper',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {!preview && <BusinessIcon sx={{ fontSize: 60, color: 'text.disabled' }} />}
                        </Avatar>
                        {isLoading && (
                            <Box sx={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: 'background.paper',
                                opacity: 0.8,
                                borderRadius: '4px'
                            }}>
                                <CircularProgress size={32} />
                            </Box>
                        )}
                    </Box>

                    {/* Alignment + buttons */}
                    <Box sx={{ flex: 1, minWidth: '280px' }}>
                        <Typography variant="subtitle2" gutterBottom fontWeight="600">
                            Alignment on Documents
                        </Typography>
                        <ToggleButtonGroup
                            value={logoPosition}
                            exclusive
                            onChange={(_e, val) => val && setLogoPosition(val)}
                            fullWidth
                            size="small"
                            sx={{ mb: 2 }}
                        >
                            <ToggleButton value="left" sx={{ py: 1 }}>
                                <AlignLeftIcon sx={{ mr: 1 }} fontSize="small" /> Left
                            </ToggleButton>
                            <ToggleButton value="center" sx={{ py: 1 }}>
                                <AlignCenterIcon sx={{ mr: 1 }} fontSize="small" /> Center
                            </ToggleButton>
                            <ToggleButton value="right" sx={{ py: 1 }}>
                                <AlignRightIcon sx={{ mr: 1 }} fontSize="small" /> Right
                            </ToggleButton>
                        </ToggleButtonGroup>

                        {/* Change Logo button — full width */}
                        <Button
                            component="label"
                            variant="contained"
                            startIcon={<UploadIcon />}
                            disabled={isLoading}
                            fullWidth
                            sx={{ borderRadius: '10px', mb: 1 }}
                        >
                            {preview ? 'Change Logo' : 'Choose Image'}
                            <input type="file" hidden accept="image/*" onChange={handleFileSelect} />
                        </Button>

                        {/* Remove button — show only when logo exists */}
                        {preview && (
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleRemoveLogo}
                                disabled={isLoading}
                                fullWidth
                                sx={{ borderRadius: '10px', mb: 1 }}
                            >
                                Remove
                            </Button>
                        )}

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Supported formats: PNG, JPG, WEBP. Max size: 10MB.
                        </Typography>
                    </Box>
                </Box>

                {/* ── Adjust Logo on Bill panel (always visible once logo is present) ── */}
                <Box sx={{
                    p: 3,
                    bgcolor: 'action.hover',
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderStyle: 'dashed'
                }}>
                    <Stack spacing={3}>
                        {/* Panel header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SettingsIcon color="primary" fontSize="small" />
                            <Typography variant="subtitle2" fontWeight="700">Adjust Logo on Bill</Typography>
                        </Box>

                        {/* Sliders row 1: Logo Size + Horizontal Position */}
                        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {/* Logo Size (Width) */}
                            <Box sx={{ flex: 1, minWidth: '200px' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="caption" fontWeight="600">Logo Size (Width)</Typography>
                                    <Typography variant="caption" color="primary.main">{logoWidth}px</Typography>
                                </Box>
                                <Slider
                                    value={logoWidth}
                                    min={40}
                                    max={300}
                                    step={5}
                                    onChange={(_e, val) => setLogoWidth(val as number)}
                                    size="small"
                                />
                            </Box>

                            {/* Horizontal Position (X Offset) */}
                            <Box sx={{ flex: 1, minWidth: '200px' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="caption" fontWeight="600">Horizontal Position (X Offset)</Typography>
                                    <Typography variant="caption" color="primary.main">{logoOffsetX}px</Typography>
                                </Box>
                                <Slider
                                    value={logoOffsetX}
                                    min={-200}
                                    max={200}
                                    step={2}
                                    onChange={(_e, val) => setLogoOffsetX(val as number)}
                                    size="small"
                                />
                            </Box>
                        </Box>

                        {/* Sliders row 2: Vertical Position */}
                        <Box sx={{ maxWidth: '50%', minWidth: '200px' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" fontWeight="600">Vertical Position (Offset)</Typography>
                                <Typography variant="caption" color="primary.main">{logoOffsetY}px</Typography>
                            </Box>
                            <Slider
                                value={logoOffsetY}
                                min={-20}
                                max={100}
                                step={2}
                                onChange={(_e, val) => setLogoOffsetY(val as number)}
                                size="small"
                            />
                        </Box>

                        {/* Apply button */}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSaveSettings}
                            disabled={isSavingSettings}
                            startIcon={isSavingSettings ? <CircularProgress size={20} color="inherit" /> : <SuccessIcon />}
                            sx={{
                                borderRadius: '10px',
                                alignSelf: 'flex-start',
                                px: 4
                            }}
                        >
                            {isSavingSettings ? 'Saving...' : 'Apply Adjustments to Bill'}
                        </Button>
                    </Stack>
                </Box>
            </Stack>

            <UniversalImageCropper
                open={isCropping}
                imageSrc={imageSrc}
                title="Adjust Your Logo"
                showGuides={true}
                onClose={() => setIsCropping(false)}
                onCropComplete={handleCropComplete}
                initialAspect={3 / 1}
            />
        </Paper>
    );
};

export default LogoUpload;
