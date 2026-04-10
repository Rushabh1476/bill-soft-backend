import React, { useState, useEffect } from 'react';
import { useAppTheme } from '../../contexts/ThemeContext';
import {
    Box,
    Typography,
    IconButton,
    CircularProgress,
    Snackbar,
    Alert
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../../config/api';

const THEME_COLORS = ['#3b82f6', '#2e7d32', '#d32f2f', '#ed6c02', '#9c27b0'];


/**
 * BrandingSettings component handles system branding and visual customization
 */
const BrandingSettings: React.FC = () => {
    const [selectedColor, setSelectedColor] = useState('#3b82f6');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { setPrimaryColor } = useAppTheme();

    const [notification, setNotification] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error';
    }>({ open: false, message: '', severity: 'success' });

    // Fetch saved branding from database on mount
    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const res = await axios.get(`${API_URL}/admin/settings/invoice-preferences`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.data?.primaryColor) {
                    setSelectedColor(res.data.data.primaryColor);
                }
            } catch (err) {
                console.error('[Branding] Failed to load brand color');
            } finally {
                setLoading(false);
            }
        };
        fetchBranding();
    }, []);



    const handleColorClick = async (color: string) => {
        try {
            // Optimistic UI update
            setPrimaryColor(color);
            setSelectedColor(color);
            document.documentElement.style.setProperty('--primary-color', color);
            localStorage.setItem('brandColor', color);
            window.dispatchEvent(new CustomEvent('branding-updated', { detail: { color } }));

            setSaving(true);
            const token = localStorage.getItem('authToken');

            // Persist to database (Use the consolidated invoice-preferences route for reliability)
            await axios.put(`${API_URL}/admin/settings/invoice-preferences`, {
                preferences: { primaryColor: color }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('[Branding] Successfully saved color:', color);
        } catch (err) {
            console.error('[Branding] Failed to save color to database');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>;

    return (
        <Box sx={{ px: 1, py: 2 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    System Branding {saving && <CircularProgress size={12} sx={{ ml: 1 }} />}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Customize how BillSoft looks for your organization. Changes save automatically.
                </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Primary Theme Color
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                    {THEME_COLORS.map((color) => (
                        <IconButton
                            key={color}
                            onClick={() => handleColorClick(color)}
                            disabled={saving}
                            sx={{
                                width: 48,
                                height: 48,
                                backgroundColor: color,
                                border: selectedColor === color ? '3px solid #fff' : 'none',
                                outline: selectedColor === color ? `2px solid ${color}` : 'none',
                                '&:hover': {
                                    backgroundColor: color,
                                    opacity: 0.9,
                                },
                            }}
                        />
                    ))}
                </Box>
            </Box>

            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={() => setNotification({ ...notification, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={notification.severity} variant="filled" sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default BrandingSettings;
