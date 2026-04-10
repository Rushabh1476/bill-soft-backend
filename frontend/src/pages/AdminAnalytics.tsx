import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Button,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Paper,
    Divider,
} from '@mui/material';
import {
    TrendingUp as UserGrowthIcon,
    CurrencyRupee as RevenueIcon,
    ListAlt as LogsIcon,
    PeopleAlt as ActiveSessionsIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';

const mockGrowthData = [
    { name: 'Jan', users: 400 },
    { name: 'Feb', users: 600 },
    { name: 'Mar', users: 800 },
    { name: 'Apr', users: 1000 },
    { name: 'May', users: 1400 },
    { name: 'Jun', users: 1800 },
];

const mockLogs = [
    { id: 1, user: 'Admin User', action: 'Update System Settings', time: '2024-02-03 14:20:00' },
    { id: 2, user: 'Jane Smith', action: 'Create New Bill #INV-1002', time: '2024-02-03 14:15:22' },
    { id: 3, user: 'John Doe', action: 'User Login', time: '2024-02-03 14:10:05' },
    { id: 4, user: 'Admin User', action: 'Modify Invoice Template', time: '2024-02-03 13:45:10' },
    { id: 5, user: 'Bob Wilson', action: 'Exported Revenue Report', time: '2024-02-03 13:12:44' },
];

const AdminAnalytics: React.FC = () => {
    const navigate = useNavigate();
    const permissions = useRoleBasedAccess();

    if (!permissions.canViewAdminPanel) {
        return (
            <Box sx={{ p: 5, textAlign: 'center', mt: 10 }}>
                <Paper sx={{ p: 5, borderRadius: 3 }}>
                    <Typography variant="h5" color="error">Access Denied</Typography>
                    <Typography color="text.secondary" sx={{ mt: 2 }}>You do not have permission to view system analytics.</Typography>
                    <Button sx={{ mt: 3 }} variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin')}
                    sx={{ borderRadius: 2 }}
                >
                    Back
                </Button>
                <Box>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                        System Analytics
                    </Typography>
                </Box>
            </Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="body1" color="text.secondary">
                    Overview of user growth, revenue metrics, and system activity logs.
                </Typography>
            </Box>

            {/* Analytics Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <RevenueIcon color="success" sx={{ mr: 1 }} />
                                <Typography variant="subtitle2" color="text.secondary">Total Revenue</Typography>
                            </Box>
                            <Typography variant="h5" fontWeight="bold">₹24,50,000</Typography>
                            <Typography variant="caption" color="success.main">+12% from last month</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <ActiveSessionsIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="subtitle2" color="text.secondary">Active Sessions</Typography>
                            </Box>
                            <Typography variant="h5" fontWeight="bold">42</Typography>
                            <Typography variant="caption" color="text.secondary">Users currently online</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <UserGrowthIcon color="info" sx={{ mr: 1 }} />
                                <Typography variant="subtitle2" color="text.secondary">Pending Bills</Typography>
                            </Box>
                            <Typography variant="h5" fontWeight="bold">128</Typography>
                            <Typography variant="caption" color="warning.main">Action required</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <LogsIcon color="secondary" sx={{ mr: 1 }} />
                                <Typography variant="subtitle2" color="text.secondary">System Logs</Typography>
                            </Box>
                            <Typography variant="h5" fontWeight="bold">1,240</Typography>
                            <Typography variant="caption" color="text.secondary">Last 24 hours</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* User Growth Chart */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                                User Growth Chart
                            </Typography>
                            <Box sx={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer>
                                    <LineChart data={mockGrowthData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="users"
                                            stroke="#1976d2"
                                            strokeWidth={3}
                                            dot={{ r: 6 }}
                                            activeDot={{ r: 8 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* System Activity Logs */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Recent Activity Logs
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box sx={{ maxHeight: 380, overflow: 'auto' }}>
                                <Table size="small">
                                    <TableBody>
                                        {mockLogs.map((log) => (
                                            <TableRow key={log.id} sx={{ '& td': { border: 0, py: 1.5 } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {log.user}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {log.action}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                        {log.time.split(' ')[1]}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminAnalytics;
