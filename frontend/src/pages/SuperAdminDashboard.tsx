/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
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
    Button,
    Chip,
    CircularProgress,
    Tabs,
    Tab,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Business as OrgIcon,
    ContactSupport as LeadIcon,
    PlayCircleOutline as DemoIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Security as SecurityIcon,
    ConfirmationNumber as TicketIcon,
} from '@mui/icons-material';
import { superAdminService } from '../services/superAdminService';
import { format } from 'date-fns';
import { formatCompactCurrency, formatCompactNumber } from '../utils/currency';

interface Stats {
    totalBills: number;
    totalRevenue: number;
    totalUsers: number;
    totalLeads: number;
    totalDemoRequests: number;
    newLeads: number;
    pendingDemos: number;
}

const SuperAdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [demos, setDemos] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setIsRefreshing(true);
        try {
            const statsRes = await superAdminService.getStats();
            setStats(statsRes.stats);

            if (activeTab === 0) {
                const orgsRes = await superAdminService.getOrganizations();
                setOrganizations(orgsRes.organizations);
            } else if (activeTab === 1) {
                const leadsRes = await superAdminService.getLeads(searchTerm);
                setLeads(leadsRes.leads);
            } else if (activeTab === 2) {
                const demosRes = await superAdminService.getDemoRequests(searchTerm);
                setDemos(demosRes.demoRequests);
            }
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to load super admin data:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [activeTab, searchTerm]);

    useEffect(() => {
        setSearchTerm('');
        loadData();
    }, [activeTab]); // Reset search when switching tabs, then loadData (loadData depends on activeTab and searchTerm)

    // Auto-refresh interval (30 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            loadData(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [loadData]);

    const handleUpdateLead = async (id: string, status: string) => {
        try {
            await superAdminService.updateLeadStatus(id, status);
            loadData(true);
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateDemo = async (id: string, status: string) => {
        try {
            await superAdminService.updateDemoStatus(id, status);
            loadData(true);
        } catch (e) {
            console.error(e);
        }
    };

    const renderStats = () => {
        if (!stats) return null;

        const cards = [
            { label: 'New Tickets', value: stats.newLeads, icon: <TicketIcon color="warning" />, color: '#fffbe6' },
            { label: 'Pending Demo Requests', value: stats.pendingDemos, icon: <DemoIcon color="error" />, color: '#fff1f0' },
        ];

        return (
            <Box sx={{
                display: 'flex',
                gap: 3,
                mb: 4
            }}>
                {cards.map((card, index) => (
                    <Card key={index} sx={{ bgcolor: card.color, borderRadius: 3, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.05)', minWidth: 240 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {card.icon}
                                <Typography variant="body2" sx={{ ml: 1, fontWeight: 600, color: 'text.secondary' }}>
                                    {card.label}
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                {card.value}
                            </Typography>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        );
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                        <SecurityIcon sx={{ mr: 1.5, fontSize: 35 }} /> System Control Panel
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Platform Management & Lead Handling
                        </Typography>
                        <Typography variant="caption" sx={{ ml: 2, px: 1, py: 0.5, bgcolor: '#f1f5f9', borderRadius: 1.5, color: '#64748b' }}>
                            Last updated: {format(lastUpdated, 'HH:mm:ss')}
                        </Typography>
                        {isRefreshing && (
                            <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                                <CircularProgress size={12} thickness={6} />
                                <Typography variant="caption" sx={{ ml: 0.5, color: 'primary.main', fontWeight: 600 }}>Syncing...</Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon sx={{ animation: isRefreshing ? 'spin 2s linear infinite' : 'none' }} />}
                    onClick={() => loadData()}
                    disabled={isRefreshing}
                    sx={{
                        borderRadius: 2,
                        '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' }
                        }
                    }}
                >
                    Refresh Data
                </Button>
            </Box>

            {renderStats()}

            <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}
                >
                    <Tab label="Active Organizations" icon={<OrgIcon />} iconPosition="start" />
                    <Tab label="Support Tickets" icon={<TicketIcon />} iconPosition="start" />
                    <Tab label="Demo Requests" icon={<DemoIcon />} iconPosition="start" />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {activeTab === 0 && (
                        <>
                            <Box sx={{ mb: 3 }}>
                                <TextField
                                    placeholder="Search organizations..."
                                    fullWidth
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                            </Box>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                            <TableCell sx={{ fontWeight: 700 }}>Company / Organization</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Admin Email</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="center">Bill Count</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="center">Total Revenue</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Onboarded</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                                    <CircularProgress size={24} />
                                                </TableCell>
                                            </TableRow>
                                        ) : organizations.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                                    No organizations found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            organizations
                                                .filter(org =>
                                                    org.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    org.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                                )
                                                .map((org) => (
                                                    <TableRow key={org.id} hover>
                                                        <TableCell>
                                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{org.companyName || 'Unknown Business'}</Typography>
                                                            <Typography variant="caption" color="text.secondary">ID: {org.id.substring(0, 8)}...</Typography>
                                                        </TableCell>
                                                        <TableCell>{org.email}</TableCell>
                                                         <TableCell align="center">
                                                            <Chip label={formatCompactNumber(org.billCount)} size="small" color="primary" sx={{ fontWeight: 700, minWidth: 50 }} />
                                                         </TableCell>
                                                         <TableCell align="center" sx={{ fontWeight: 700, color: 'success.main' }}>
                                                            {formatCompactCurrency(org.totalRevenue)}
                                                         </TableCell>
                                                        <TableCell>{format(new Date(org.createdAt), 'dd MMM yyyy')}</TableCell>
                                                        <TableCell>
                                                            <Chip label="ACTIVE" size="small" variant="outlined" color="success" sx={{ fontWeight: 700, fontSize: 10 }} />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}

                    {activeTab === 1 && (
                        <>
                            <Box sx={{ mb: 3 }}>
                                <TextField
                                    placeholder="Search leads by name, email, phone or message..."
                                    fullWidth
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && loadData()}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                            </Box>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Contact Info</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Message</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                                    <CircularProgress size={24} />
                                                </TableCell>
                                            </TableRow>
                                        ) : leads.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                                    No leads found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            leads.map((lead) => (
                                                <TableRow key={lead.id} hover>
                                                    <TableCell>{format(new Date(lead.createdAt), 'dd MMM HH:mm')}</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>{lead.name}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">{lead.email}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{lead.phone || 'No Phone'}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ maxWidth: 300 }}>
                                                        <Typography variant="body2" noWrap sx={{ cursor: 'help' }} title={lead.message}>
                                                            {lead.message || '-'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={lead.status}
                                                            size="small"
                                                            color={lead.status === 'NEW' ? 'error' : 'info'}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip title="Mark Contacted">
                                                            <IconButton onClick={() => handleUpdateLead(lead.id, 'CONTACTED')} color="primary">
                                                                <CheckIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Spam/Lost">
                                                            <IconButton onClick={() => handleUpdateLead(lead.id, 'LOST')} color="error">
                                                                <CancelIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}

                    {activeTab === 2 && (
                        <>
                            <Box sx={{ mb: 3 }}>
                                <TextField
                                    placeholder="Search demo requests by name, company, email or phone..."
                                    fullWidth
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && loadData()}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                            </Box>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Company</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                                    <CircularProgress size={24} />
                                                </TableCell>
                                            </TableRow>
                                        ) : demos.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                                    No demo requests found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            demos.map((demo) => (
                                                <TableRow key={demo.id} hover>
                                                    <TableCell>{format(new Date(demo.createdAt), 'dd MMM HH:mm')}</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>{demo.name}</TableCell>
                                                    <TableCell>{demo.companyName || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">{demo.email}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{demo.phone || 'No Phone'}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={demo.status}
                                                            size="small"
                                                            variant="filled"
                                                            color={demo.status === 'PENDING' ? 'warning' : 'success'}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            disabled={demo.status === 'COMPLETED'}
                                                            onClick={() => handleUpdateDemo(demo.id, 'SCHEDULED')}
                                                            sx={{ mr: 1, textTransform: 'none', borderRadius: 2 }}
                                                        >
                                                            Schedule
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            disabled={demo.status === 'COMPLETED'}
                                                            onClick={() => handleUpdateDemo(demo.id, 'COMPLETED')}
                                                            sx={{ textTransform: 'none', borderRadius: 2 }}
                                                        >
                                                            Done
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default SuperAdminDashboard;
