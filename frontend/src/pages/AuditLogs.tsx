/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    TextField,
    InputAdornment,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Pagination,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Divider,
    Stack
} from '@mui/material';
import {
    Search as SearchIcon,
    GetApp as DownloadIcon,
    FilterList as FilterListIcon,
    InfoOutlined as InfoIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';
import { formatCompactNumber } from '../utils/currency';

interface AuditLog {
    id: string;
    action: string;
    entity: string;
    entityId?: string;
    description: string;
    ipAddress: string;
    timestamp: string;
    userId?: string;
    metadata?: {
        statusType?: 'success' | 'danger' | 'info' | 'warning';
        statusColor?: string;
        [key: string]: any;
    };
}

const AuditLogs: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const permissions = useRoleBasedAccess();
    const canView = permissions.canViewAuditLogs;

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    // Filters & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('ALL');
    const [entityFilter, setEntityFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const res = await fetch(`${API_URL}/admin/audit-logs?t=${Date.now()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setLogs(data.logs || []);
                } else {
                    console.error('Failed to fetch logs:', res.status, res.statusText);
                }
            } catch (error) {
                console.error(error);
                setLogs([]);
            } finally {
                setLoading(false);
            }
        }
        if (user && canView) fetchLogs();
    }, [user, canView]);

    const handleExportCSV = () => {
        if (!logs.length) return;

        const headers = ['Timestamp', 'Action', 'Entity', 'Description', 'IP Address'];
        const csvContent = [
            headers.join(','),
            ...filteredLogs.map(log =>
                `"${new Date(log.timestamp).toISOString()}","${log.action}","${log.entity}","${log.description.replace(/"/g, '""')}","${log.ipAddress || 'N/A'}"`
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getActionColor = (log: AuditLog) => {
        if (log.metadata?.statusType) {
            return log.metadata.statusType === 'danger' ? 'error' : log.metadata.statusType;
        }
        const action = log.action.toUpperCase();
        switch (action) {
            case 'CREATE': case 'POST': case 'LOGIN': case 'BULK_CREATE': return 'success';
            case 'UPDATE': case 'PUT': case 'PATCH': return 'info';
            case 'DELETE': case 'BULK_DELETE': return 'error';
            default: return 'default';
        }
    }

    const formatLogDescription = (log: AuditLog) => {
        // Backend now handles smart message formatting in the description field.
        return log.description;
    };

    // Handlers
    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    // Derived Data
    const uniqueActions = useMemo(() => Array.from(new Set(logs.map(l => l.action.toUpperCase()))), [logs]);
    const uniqueEntities = useMemo(() => Array.from(new Set(logs.map(l => l.entity.toUpperCase()))), [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch =
                log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.ipAddress && log.ipAddress.includes(searchTerm));

            const matchesAction = actionFilter === 'ALL' || log.action.toUpperCase() === actionFilter;
            const matchesEntity = entityFilter === 'ALL' || log.entity.toUpperCase() === entityFilter;

            return matchesSearch && matchesAction && matchesEntity;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [logs, searchTerm, actionFilter, entityFilter]);

    const paginatedLogs = useMemo(() => {
        const startIndex = (page - 1) * rowsPerPage;
        return filteredLogs.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredLogs, page, rowsPerPage]);

    const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);

    // Reset page to 1 if filters change and page is out of bounds
    useEffect(() => {
        setPage(1);
    }, [searchTerm, actionFilter, entityFilter]);

    if (!canView && user?.role?.toUpperCase() !== 'ADMIN') {
        return (
            <Box sx={{ p: 5, textAlign: 'center' }}>
                <Paper sx={{ p: 5, borderRadius: 3 }}>
                    <Typography variant="h5" color="error">Access Denied</Typography>
                    <Typography color="text.secondary" sx={{ mt: 2 }}>You do not have permission to view audit logs.</Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.02em', mb: 0.5, color: 'text.primary' }}>
                        Audit Trail
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Monitor and secure your organizational activities
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportCSV}
                    disabled={filteredLogs.length === 0}
                    sx={{ borderRadius: 2, px: 3, py: 1, textTransform: 'none', fontWeight: 600, boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)' }}
                >
                    Export CSV
                </Button>
            </Box>

            {/* Filters Bar */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center', border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }} elevation={0}>
                <TextField
                    placeholder="Search logs, IPs, or descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="small"
                    fullWidth
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                    }}
                />

                <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
                    <FormControl size="small" sx={{ minWidth: { xs: '50%', md: 160 } }}>
                        <InputLabel>Action</InputLabel>
                        <Select
                            value={actionFilter}
                            label="Action"
                            onChange={(e) => setActionFilter(e.target.value)}
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value="ALL">All Actions</MenuItem>
                            {uniqueActions.map(action => (
                                <MenuItem key={action} value={action}>{action}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: { xs: '50%', md: 160 } }}>
                        <InputLabel>Entity</InputLabel>
                        <Select
                            value={entityFilter}
                            label="Entity"
                            onChange={(e) => setEntityFilter(e.target.value)}
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value="ALL">All Entities</MenuItem>
                            {uniqueEntities.map(entity => (
                                <MenuItem key={entity} value={entity}>{entity}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            {/* Table */}
            <Paper sx={{ width: '100%', mb: 2, borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }} elevation={0}>
                <TableContainer>
                    <Table sx={{ minWidth: 800 }}>
                        <TableHead sx={{ bgcolor: 'background.default' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Timestamp</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Action</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Entity</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Description</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>IP Address</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : paginatedLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.6 }}>
                                            <FilterListIcon sx={{ fontSize: 48, mb: 2 }} />
                                            <Typography variant="h6">No logs found</Typography>
                                            <Typography variant="body2">Try adjusting your filters or search term.</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedLogs.map((log) => (
                                    <TableRow key={log.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                        <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                                            {new Date(log.timestamp).toLocaleString(undefined, {
                                                year: 'numeric', month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={log.action.toUpperCase().replace('_', ' ')}
                                                color={getActionColor(log) as any}
                                                size="small"
                                                variant="filled"
                                                sx={{ 
                                                    fontWeight: 700, 
                                                    px: 1, 
                                                    letterSpacing: '0.02em', 
                                                    borderRadius: '6px',
                                                    ...(log.metadata?.statusColor && {
                                                        bgcolor: log.metadata.statusColor,
                                                        color: '#fff'
                                                    })
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>{log.entity}</TableCell>
                                        <TableCell sx={{ color: 'text.primary', maxWidth: 400 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" sx={{ flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {formatLogDescription(log)}
                                                </Typography>
                                                {log.metadata && (
                                                    <IconButton size="small" onClick={() => setSelectedLog(log)} sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
                                                        <InfoIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                            {log.ipAddress || 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {!loading && filteredLogs.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                        <Typography variant="body2" color="text.secondary">
                            Showing {((page - 1) * rowsPerPage) + 1} to {Math.min(page * rowsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
                        </Typography>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={handlePageChange}
                            color="primary"
                            shape="rounded"
                            showFirstButton
                            showLastButton
                        />
                    </Box>
                )}
            </Paper>

            {/* Metadata Detail Dialog */}
            <Dialog 
                open={Boolean(selectedLog)} 
                onClose={() => setSelectedLog(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3, p: 1 }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">Activity Details</Typography>
                    <IconButton onClick={() => setSelectedLog(null)} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    {selectedLog && (
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Description</Typography>
                                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>{selectedLog.description}</Typography>
                            </Box>

                            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>System Metadata</Typography>
                                <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                    {Object.entries(selectedLog.metadata || {}).map(([key, value]) => (
                                        key !== 'description' && (
                                            <Box key={key}>
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ textTransform: 'capitalize' }}>
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </Typography>
                                                <Typography variant="body2" fontWeight="600">
                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                </Typography>
                                            </Box>
                                        )
                                    ))}
                                </Box>
                            </Box>

                            <Divider />
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">Entity</Typography>
                                    <Typography variant="body2" fontWeight="600">{selectedLog.entity} ({selectedLog.entityId || 'N/A'})</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" color="text.secondary" display="block">IP Address</Typography>
                                    <Typography variant="body2" fontWeight="600">{selectedLog.ipAddress || 'Unknown'}</Typography>
                                </Box>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default AuditLogs;
