/**
 * ActivityCart — Slide-in drawer showing a user's chronological action history.
 * Used in the Admin Panel User Management table via "View Activity" button.
 */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import {
    Drawer, Box, Typography, IconButton, Divider,
    CircularProgress, Avatar, Chip, Alert
} from '@mui/material';
import {
    Close as CloseIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    History as HistoryIcon,
    Receipt as ReceiptIcon,
    People as PeopleIcon,
    Inventory as InventoryIcon,
    Assessment as ReportIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ActivityLog {
    id: string;
    action: string;
    entity: string;
    description: string;
    userName?: string;
    timestamp: string;
    ipAddress?: string;
}

interface ActivityCartProps {
    open: boolean;
    onClose: () => void;
    userId: string;       // Sub-user whose activity to show
    userName: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getActionIcon = (action: string) => {
    switch (action?.toUpperCase()) {
        case 'CREATE': return <AddIcon sx={{ fontSize: 14 }} />;
        case 'UPDATE': return <EditIcon sx={{ fontSize: 14 }} />;
        case 'DELETE': return <DeleteIcon sx={{ fontSize: 14 }} />;
        default: return <HistoryIcon sx={{ fontSize: 14 }} />;
    }
};

const getActionColor = (action: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (action?.toUpperCase()) {
        case 'CREATE': return 'success';
        case 'UPDATE': return 'warning';
        case 'DELETE': return 'error';
        default: return 'default';
    }
};

const getEntityIcon = (entity: string) => {
    const e = entity?.toLowerCase();
    if (e?.includes('bill') || e?.includes('invoice')) return <ReceiptIcon sx={{ fontSize: 16, color: '#6366f1' }} />;
    if (e?.includes('customer')) return <PeopleIcon sx={{ fontSize: 16, color: '#0ea5e9' }} />;
    if (e?.includes('product') || e?.includes('service')) return <InventoryIcon sx={{ fontSize: 16, color: '#10b981' }} />;
    if (e?.includes('report')) return <ReportIcon sx={{ fontSize: 16, color: '#f59e0b' }} />;
    if (e?.includes('setting')) return <SettingsIcon sx={{ fontSize: 16, color: '#8b5cf6' }} />;
    return <HistoryIcon sx={{ fontSize: 16, color: '#94a3b8' }} />;
};

const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const groupByDate = (logs: ActivityLog[]) => {
    const groups: { [date: string]: ActivityLog[] } = {};
    logs.forEach(log => {
        const d = new Date(log.timestamp);
        const key = d.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        if (!groups[key]) groups[key] = [];
        groups[key].push(log);
    });
    return Object.entries(groups);
};

// ─── Component ─────────────────────────────────────────────────────────────────

const ActivityCart: React.FC<ActivityCartProps> = ({ open, onClose, userId, userName }) => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchLogs = useCallback(async () => {
        if (!userId || !open) return;
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken');
            const res = await axios.get(`${API_URL}/admin/audit-logs?subUserId=${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(res.data.logs || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load activity history');
        } finally {
            setLoading(false);
        }
    }, [userId, open]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const grouped = groupByDate(logs);

    const initials = userName
        ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 420 },
                    background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                    borderLeft: '1px solid rgba(255,255,255,.08)',
                }
            }}
        >
            {/* Header */}
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <HistoryIcon sx={{ color: '#818cf8' }} />
                        <Typography variant="h6" fontWeight={700} color="white">Activity Log</Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,.5)', '&:hover': { color: 'white' } }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* User chip */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.2)' }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: '#6366f1', fontSize: '0.85rem', fontWeight: 700 }}>
                        {initials}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight={600} color="white">{userName}</Typography>
                        <Typography variant="caption" color="rgba(255,255,255,.45)">
                            {logs.length} action{logs.length !== 1 ? 's' : ''} recorded
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Content */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#818cf8' }} size={32} />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                ) : logs.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 10 }}>
                        <HistoryIcon sx={{ fontSize: 56, color: 'rgba(255,255,255,.15)', mb: 2 }} />
                        <Typography variant="subtitle1" color="rgba(255,255,255,.4)">No activity recorded yet</Typography>
                        <Typography variant="caption" color="rgba(255,255,255,.25)">
                            Actions performed by this user will appear here
                        </Typography>
                    </Box>
                ) : (
                    grouped.map(([date, dateLogs]) => (
                        <Box key={date} sx={{ mb: 3 }}>
                            {/* Date separator */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <Divider sx={{ flexGrow: 1, borderColor: 'rgba(255,255,255,.08)' }} />
                                <Typography variant="caption" color="rgba(255,255,255,.35)" sx={{ whiteSpace: 'nowrap', px: 1 }}>
                                    {date}
                                </Typography>
                                <Divider sx={{ flexGrow: 1, borderColor: 'rgba(255,255,255,.08)' }} />
                            </Box>

                            {/* Log entries */}
                            {dateLogs.map((log, idx) => (
                                <Box key={log.id}
                                    sx={{
                                        display: 'flex',
                                        gap: 1.5,
                                        mb: 0.5,
                                        '&:last-child': { mb: 0 },
                                        position: 'relative',
                                        '&::before': idx < dateLogs.length - 1 ? {
                                            content: '""',
                                            position: 'absolute',
                                            left: 15,
                                            top: 32,
                                            bottom: -8,
                                            width: 1,
                                            bgcolor: 'rgba(255,255,255,.08)',
                                        } : {}
                                    }}
                                >
                                    {/* Timeline dot */}
                                    <Box sx={{
                                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0, mt: 0.5,
                                        bgcolor: 'rgba(99,102,241,.15)',
                                        border: '1px solid rgba(99,102,241,.3)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {getEntityIcon(log.entity)}
                                    </Box>

                                    {/* Log detail */}
                                    <Box sx={{
                                        flex: 1, p: 1.5, borderRadius: 2,
                                        bgcolor: 'rgba(255,255,255,.04)',
                                        border: '1px solid rgba(255,255,255,.06)',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,.07)' },
                                        transition: 'background .15s'
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                                            <Typography variant="body2" color="rgba(255,255,255,.85)" sx={{ fontWeight: 500, lineHeight: 1.4 }}>
                                                {log.description}
                                            </Typography>
                                            <Chip
                                                label={log.action}
                                                size="small"
                                                icon={getActionIcon(log.action)}
                                                color={getActionColor(log.action)}
                                                variant="outlined"
                                                sx={{ fontSize: '0.65rem', height: 20, flexShrink: 0 }}
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                            <Typography variant="caption" color="rgba(255,255,255,.3)">
                                                {formatTimestamp(log.timestamp)}
                                            </Typography>
                                            {log.entity && (
                                                <>
                                                    <Typography variant="caption" color="rgba(255,255,255,.2)">·</Typography>
                                                    <Typography variant="caption" color="rgba(255,255,255,.3)" sx={{ textTransform: 'capitalize' }}>
                                                        {log.entity}
                                                    </Typography>
                                                </>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    ))
                )}
            </Box>
        </Drawer>
    );
};

export default ActivityCart;
