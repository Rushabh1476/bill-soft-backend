import React, { useState, useEffect, useRef } from 'react';
import {
    IconButton,
    Badge,
    Typography,
    Box,
    Snackbar,
    Alert as MuiAlert,
    Drawer,
    Card,
    CardContent,
    CardActions,
    Button,
    Stack,
    useTheme
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Warning as WarningIcon,
    EventBusy as ExpiryIcon,
    CheckCircle as CheckCircleIcon,
    Receipt as ReceiptIcon,
    Close as CloseIcon,
    Inventory as InventoryIcon,
    Visibility as ViewIcon,
    AccessTime as TimeIcon,
    Person as PersonalIcon,
    ConfirmationNumber as TicketIcon,
    Build as ServiceIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config/api';

interface Alert {
    id: string;
    name: string;
    stock?: number;
    expiryDate?: string;
    amount?: number;
    date?: string;
    type: 'stock' | 'expiry' | 'bill' | 'service_ticket' | 'customer' | 'service';
}

const getRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

const NotificationCenter: React.FC = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const lastAlertCount = useRef(0);
    const navigate = useNavigate();
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    // Track read notification IDs locally so they never reappear
    const getReadIds = (): Set<string> => {
        try {
            const stored = localStorage.getItem('billsoft_read_notifications');
            return new Set(stored ? JSON.parse(stored) : []);
        } catch {
            return new Set();
        }
    };

    const addReadId = (id: string) => {
        const readIds = getReadIds();
        readIds.add(id);
        // Keep only last 500 IDs to avoid localStorage bloat
        const arr = Array.from(readIds).slice(-500);
        localStorage.setItem('billsoft_read_notifications', JSON.stringify(arr));
    };

    const fetchAlerts = async (forceRefresh = false) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const res = await fetch(`${API_URL}/inventory/alerts?t=${Date.now()}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                const readIds = getReadIds();
                const newAlerts: Alert[] = [];

                // Only use notifications and bills for the tray. 
                // data.lowStock is now reserved for the permanent Dashboard widget.
                if (Array.isArray(data.recentBills)) {
                    data.recentBills.forEach((b: any) => {
                        if (!readIds.has(b.id)) {
                            newAlerts.push({ ...b, type: 'bill' });
                        }
                    });
                }
                if (Array.isArray(data.notifications)) {
                    data.notifications.forEach((n: any) => {
                        if (!readIds.has(n.id) && !newAlerts.find(a => a.id === n.id)) {
                            newAlerts.push({ ...n });
                        }
                    });
                }
                if (Array.isArray(data.expiringSoon)) {
                    data.expiringSoon.forEach((p: any) => {
                        if (!readIds.has(p.id)) {
                            newAlerts.push({ ...p, type: 'expiry' });
                        }
                    });
                }

                newAlerts.sort((a, b) => {
                    const dateA = new Date(a.date || a.expiryDate || 0).getTime();
                    const dateB = new Date(b.date || b.expiryDate || 0).getTime();
                    return dateB - dateA;
                });

                if (newAlerts.length > lastAlertCount.current || forceRefresh) {
                    const latest = newAlerts[0];
                    if (latest && (newAlerts.length > lastAlertCount.current || forceRefresh)) {
                        setToastMessage(latest.name);
                        setToastOpen(true);
                    }
                }

                lastAlertCount.current = newAlerts.length;
                setAlerts([...newAlerts]);
            }
        } catch (error) {
            console.error("Failed to fetch alerts", error);
        }
    };

    useEffect(() => {
        fetchAlerts();
        const handleUpdate = () => setTimeout(() => fetchAlerts(true), 300);

        window.addEventListener('inventory-updated', handleUpdate);
        window.addEventListener('bill-created', handleUpdate);
        window.addEventListener('refresh-notifications', handleUpdate);

        const interval = setInterval(() => fetchAlerts(), 30000);

        return () => {
            window.removeEventListener('inventory-updated', handleUpdate);
            window.removeEventListener('bill-created', handleUpdate);
            window.removeEventListener('refresh-notifications', handleUpdate);
            clearInterval(interval);
        };
    }, []);

    const toggleDrawer = (open: boolean) => () => {
        setDrawerOpen(open);
    };

    const handleMarkAsRead = async (alert: Alert) => {
        try {
            const token = localStorage.getItem('authToken');
            // Persist locally so it never reappears
            addReadId(alert.id);
            // Remove from UI immediately
            setAlerts(prev => prev.filter(a => a.id !== alert.id));
            // Persist on backend
            if (alert.id) {
                await fetch(`${API_URL}/inventory/notifications/${alert.id}/read`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const handleAction = async (alert: Alert) => {
        setDrawerOpen(false);
        
        // Mark as read immediately on click
        await handleMarkAsRead(alert);

        if (alert.type === 'bill') {
            navigate(`/bills/view/${alert.id}`);
        } else if (alert.type === 'customer') {
            navigate('/customers');
        } else if (alert.type === 'service_ticket') {
            navigate('/service-tickets');
        } else if (alert.type === 'service') {
            navigate('/services');
        } else {
            navigate('/products');
        }
    };

    const handleMarkAllAsRead = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // 1. Persist all current alert IDs locally
        alerts.forEach(a => addReadId(a.id));

        // 2. Optimistic UI Update: Clear state instantly
        setAlerts([]);
        lastAlertCount.current = 0;
        
        // 2. Dispatch event to sync any other components immediately
        window.dispatchEvent(new Event('refresh-notifications'));

        // 3. Background API Call: Global Mark All Read
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            await fetch(`${API_URL}/inventory/notifications/mark-all-read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error("[Silent] Global mark-all-read failed", error);
        }

        // 4. Close Drawer only (removed navigation to dashboard as it's disruptive)
        setDrawerOpen(false);
    };

    return (
        <>
            <IconButton color="inherit" onClick={toggleDrawer(true)}>
                <Badge badgeContent={alerts.length} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={toggleDrawer(false)}
                PaperProps={{
                    sx: {
                        width: { xs: '100%', sm: 400 },
                        bgcolor: isDarkMode ? 'rgba(10, 10, 10, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(20px)',
                        backgroundImage: 'none',
                        boxShadow: isDarkMode ? '0 0 30px rgba(0,0,0,0.5)' : '0 0 30px rgba(0,0,0,0.1)',
                        borderLeft: '1px solid',
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column'
                    }
                }}
            >
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" fontWeight="bold">Active Alerts</Typography>
                    <IconButton onClick={toggleDrawer(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
                    {alerts.length === 0 ? (
                        <Box sx={{ height: '70%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
                            <CheckCircleIcon sx={{ fontSize: 60, mb: 2, color: 'success.main' }} />
                            <Typography variant="h6" gutterBottom>System Clean</Typography>
                            <Typography variant="body2" textAlign="center">No critical notifications at this moment.</Typography>
                        </Box>
                    ) : (
                        <Stack spacing={2}>
                            {alerts.map((alert) => (
                                <Card
                                    key={`${alert.type}-${alert.id}`}
                                    sx={{
                                        borderRadius: 3,
                                        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                                        border: '1px solid',
                                        borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                        boxShadow: 'none',
                                        transition: 'transform 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                                        }
                                    }}
                                >
                                    <CardContent sx={{ pb: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                            <Box sx={{
                                                p: 1,
                                                borderRadius: 2,
                                                bgcolor: alert.type === 'stock' ? 'warning.lighter' :
                                                    alert.type === 'expiry' ? 'error.lighter' :
                                                    alert.type === 'bill' ? 'primary.lighter' :
                                                    alert.type === 'customer' ? 'secondary.lighter' :
                                                    alert.type === 'service_ticket' ? 'info.lighter' : 'success.lighter',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {alert.type === 'stock' && <WarningIcon sx={{ color: 'warning.main' }} />}
                                                {alert.type === 'expiry' && <ExpiryIcon sx={{ color: 'error.main' }} />}
                                                {alert.type === 'bill' && <ReceiptIcon sx={{ color: 'primary.main' }} />}
                                                {alert.type === 'customer' && <PersonalIcon sx={{ color: 'secondary.main' }} />}
                                                {alert.type === 'service_ticket' && <TicketIcon sx={{ color: 'info.main' }} />}
                                                {alert.type === 'service' && <ServiceIcon sx={{ color: 'success.main' }} />}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.6 }}>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkAsRead(alert);
                                                    }}
                                                    sx={{ mr: 1, color: 'success.main', p: 0.5 }}
                                                    title="Mark as Read"
                                                >
                                                    <CheckCircleIcon fontSize="small" />
                                                </IconButton>
                                                <TimeIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                                <Typography variant="caption">{getRelativeTime(alert.date || alert.expiryDate)}</Typography>
                                            </Box>
                                        </Box>

                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            {alert.name}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary">
                                            {alert.type === 'stock' ? `Current stock is critically low (${alert.stock} units left).` :
                                                alert.type === 'bill' ? `New bill generated for ₹${alert.amount?.toLocaleString()}.` :
                                                alert.type === 'expiry' ? `One or more batches are expiring on ${new Date(alert.expiryDate!).toLocaleDateString()}.` :
                                                'Action may be required for this system update.'}
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{ p: 2, pt: 0 }}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            size="small"
                                            onClick={() => handleAction(alert)}
                                            startIcon={alert.type === 'stock' ? <InventoryIcon /> : <ViewIcon />}
                                            sx={{
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                bgcolor: alert.type === 'stock' ? 'warning.main' :
                                                    alert.type === 'expiry' ? 'error.main' :
                                                    alert.type === 'bill' ? 'primary.main' :
                                                    alert.type === 'customer' ? 'secondary.main' :
                                                    alert.type === 'service_ticket' ? 'info.main' : 'success.main',
                                                '&:hover': {
                                                    bgcolor: alert.type === 'stock' ? 'warning.dark' :
                                                        alert.type === 'expiry' ? 'error.dark' :
                                                        alert.type === 'bill' ? 'primary.dark' :
                                                        alert.type === 'customer' ? 'secondary.dark' :
                                                        alert.type === 'service_ticket' ? 'info.dark' : 'success.dark',
                                                }
                                            }}
                                        >
                                            {alert.type === 'stock' ? 'Restock Now' : 'View Details'}
                                        </Button>
                                    </CardActions>
                                </Card>
                            ))}
                        </Stack>
                    )}
                </Box>

                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}>
                    <Button
                        fullWidth
                        onClick={handleMarkAllAsRead}
                        sx={{ textTransform: 'none', fontWeight: 'bold' }}
                        disabled={alerts.length === 0}
                    >
                        Mark all as read
                    </Button>
                </Box>
            </Drawer>

            <Snackbar
                open={toastOpen}
                autoHideDuration={4000}
                onClose={() => setToastOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ mt: { xs: 1, sm: 8 } }}
            >
                <MuiAlert
                    onClose={() => setToastOpen(false)}
                    severity="info"
                    variant="filled"
                    sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
                >
                    {toastMessage}
                </MuiAlert>
            </Snackbar>
        </>
    );
};

export default NotificationCenter;
