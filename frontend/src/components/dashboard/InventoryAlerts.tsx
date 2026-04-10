
import React, { useEffect, useState } from 'react';
import {
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Box,
    CircularProgress,
    Badge,
    Button,
    Drawer,
    IconButton,
    Divider,
    useTheme
} from '@mui/material';
import { Warning as WarningIcon, Event as EventIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config/api';

const InventoryAlerts: React.FC = () => {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState<any>({ lowStock: [], expiringSoon: [] });
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const token = localStorage.getItem('authToken');
                // Cache buster for real-time accuracy
                const res = await fetch(`${API_URL}/inventory/alerts?t=${Date.now()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAlerts(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();

        const handleUpdate = () => {
            // Tiny delay to ensure SQLite write is readable
            setTimeout(fetchAlerts, 300);
        };

        window.addEventListener('inventory-updated', handleUpdate);
        window.addEventListener('bill-created', handleUpdate);
        window.addEventListener('refresh-notifications', handleUpdate);

        const interval = setInterval(fetchAlerts, 45000);

        return () => {
            window.removeEventListener('inventory-updated', handleUpdate);
            window.removeEventListener('bill-created', handleUpdate);
            window.removeEventListener('refresh-notifications', handleUpdate);
            clearInterval(interval);
        };
    }, []);

    const [expanded, setExpanded] = useState(false);

    if (loading) return <CircularProgress size={20} />;

    if (alerts.lowStock.length === 0 && alerts.expiringSoon.length === 0) return null;

    const totalAlerts = alerts.lowStock.length + alerts.expiringSoon.length;

    return (
        <Box sx={{ mb: 3 }}>
            <Badge badgeContent={totalAlerts} color="error" sx={{ '& .MuiBadge-badge': { right: 5, top: 4 } }}>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<WarningIcon />}
                    onClick={() => setExpanded(true)}
                    sx={{
                        fontWeight: 'bold',
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3,
                        py: 1.5,
                        backgroundColor: isDarkMode ? 'rgba(211, 47, 47, 0.1)' : 'error.lighter',
                        borderColor: 'error.main'
                    }}
                >
                    Stock Alerts
                </Button>
            </Badge>

            <Drawer
                anchor="right"
                open={expanded}
                onClose={() => setExpanded(false)}
                sx={{
                    '& .MuiBackdrop-root': {
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(3px)'
                    },
                    '& .MuiDrawer-paper': {
                        width: { xs: '100%', sm: 400 },
                        bgcolor: 'background.default',
                    }
                }}
            >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: isDarkMode ? 'rgba(211, 47, 47, 0.2)' : 'error.lighter', borderBottom: '1px solid', borderColor: isDarkMode ? 'rgba(211, 47, 47, 0.3)' : 'error.light' }}>
                    <Typography variant="h6" fontWeight="bold" color="error.dark" display="flex" alignItems="center">
                        <WarningIcon color="error" sx={{ mr: 1 }} />
                        Low Stock Inventory History
                    </Typography>
                    <IconButton onClick={() => setExpanded(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Divider />

                <Box sx={{ p: 2, overflowY: 'auto' }}>
                    <Box display="flex" flexDirection="column" gap={3}>
                        {alerts.lowStock.length > 0 && (
                            <Box flex={1} minWidth={{ xs: '100%', sm: 300 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                    <Typography variant="subtitle2" color="error.main" fontWeight="bold">
                                        Low Stock Items
                                    </Typography>
                                </Box>
                                <List dense sx={{ px: 0 }}>
                                    {alerts.lowStock.map((item: any) => (
                                        <ListItem
                                            key={item.id}
                                            sx={{
                                                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : theme.palette.background.paper,
                                                borderRadius: 2,
                                                mb: 1,
                                                border: '1px solid',
                                                borderColor: 'error.light',
                                                px: { xs: 1.5, sm: 2 },
                                                py: { xs: 1.5, sm: 1 },
                                                display: 'flex',
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                alignItems: { xs: 'stretch', sm: 'center' },
                                                gap: { xs: 1.5, sm: 0 }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
                                                <ListItemIcon sx={{ minWidth: { xs: 28, sm: 30 } }}>
                                                    <WarningIcon fontSize="small" color="error" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={<Typography variant="body2" fontWeight="bold" noWrap>{item.name}</Typography>}
                                                    secondary={<Typography variant="caption" color="text.secondary">{`Stock: ${item.stock} (Min: ${item.minStockLevel || 10})`}</Typography>}
                                                    sx={{ m: 0 }}
                                                />
                                            </Box>
                                            <Button
                                                size="small"
                                                color="error"
                                                variant="outlined"
                                                onClick={() => {
                                                    setExpanded(false);
                                                    navigate('/products', { state: { searchProduct: item.name, triggerEditId: item.id } });
                                                }}
                                                sx={{
                                                    height: { xs: 36, sm: 28 },
                                                    fontSize: { xs: '0.8rem', sm: '0.7rem' },
                                                    fontWeight: 'bold',
                                                    textTransform: 'none',
                                                    borderRadius: 1.5,
                                                    width: { xs: '100%', sm: 'auto' },
                                                    minWidth: { sm: 80 }
                                                }}
                                            >
                                                Restock
                                            </Button>
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}

                        {alerts.expiringSoon.length > 0 && (
                            <Box flex={1} minWidth={{ xs: '100%', sm: 300 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                    <Typography variant="subtitle2" color="warning.dark" fontWeight="bold">
                                        Expiring Soon
                                    </Typography>
                                </Box>
                                <List dense sx={{ px: 0 }}>
                                    {alerts.expiringSoon.slice(0, 5).map((item: any) => (
                                        <ListItem
                                            key={item.id}
                                            sx={{
                                                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white',
                                                borderRadius: 2,
                                                mb: 1,
                                                border: '1px solid',
                                                borderColor: 'warning.light',
                                                px: { xs: 1.5, sm: 2 },
                                                py: { xs: 1.5, sm: 1 },
                                                alignItems: 'center'
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: { xs: 24, sm: 30 } }}>
                                                <EventIcon fontSize="small" color="warning" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={<Typography variant="body2" fontWeight="bold" noWrap>{item.name}</Typography>}
                                                secondary={<Typography variant="caption" color="text.secondary">{`Exp: ${new Date(item.expiryDate).toLocaleDateString()}`}</Typography>}
                                                sx={{ m: 0 }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Drawer>
        </Box>
    );
};

export default InventoryAlerts;
