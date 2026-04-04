import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    LinearProgress,
    Divider,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Switch,
    FormControlLabel,
    Stack,
    Paper,
} from '@mui/material';
import {
    CreditCard as BillingIcon,
    ArrowBack as ArrowBackIcon,
    CheckCircle as ActiveIcon,
    Stars as PremiumIcon,
    Settings as FeatureIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';

const SubscriptionManagement: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const permissions = useRoleBasedAccess();
    const canView = permissions.canViewSubscription;
    const subscription = {
        plan: 'Professional Plan',
        status: 'Active',
        billingCycle: 'Monthly',
        nextRenewal: 'March 15, 2024',
        amount: '₹4,999/month',
        usageCurrent: 850,
        usageLimit: 1000,
        features: [
            { id: 'inv', name: 'Invoice Customization', enabled: true },
            { id: 'multi', name: 'Multi-User Access', enabled: true },
            { id: 'api', name: 'API Integration', enabled: false },
            { id: 'bulk', name: 'Bulk SMS/Email', enabled: true },
            { id: 'reports', name: 'Advanced Analytics', enabled: true },
        ]
    };

    if (!canView && user?.role?.toUpperCase() !== 'ADMIN') {
        return (
            <Box sx={{ p: 5, textAlign: 'center', mt: 10 }}>
                <Paper sx={{ p: 5, borderRadius: 3 }}>
                    <Typography variant="h5" color="error">Access Denied</Typography>
                    <Typography color="text.secondary" sx={{ mt: 2 }}>You do not have permission to view subscription details.</Typography>
                    <Button sx={{ mt: 3 }} variant="outlined" onClick={() => navigate('/admin')}>Back to Admin</Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin')}
                    sx={{ borderRadius: 2 }}
                >
                    Back
                </Button>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <BillingIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" fontWeight="bold">
                        Subscription & Plans
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Current Plan Overview */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card sx={{ borderRadius: 4, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                <Typography variant="h6" fontWeight="bold">Current Plan</Typography>
                                <Chip
                                    icon={<ActiveIcon />}
                                    label={subscription.status}
                                    color="success"
                                    variant="outlined"
                                />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                <Box sx={{
                                    p: 2,
                                    bgcolor: 'primary.light',
                                    borderRadius: 3,
                                    color: 'primary.main',
                                    display: 'flex'
                                }}>
                                    <PremiumIcon sx={{ fontSize: 40 }} />
                                </Box>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold">{subscription.plan}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Perfect for medium-sized businesses
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ mb: 3 }} />

                            <Stack spacing={2.5}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography color="text.secondary">Billing Cycle</Typography>
                                    <Typography fontWeight="600">{subscription.billingCycle}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography color="text.secondary">Next Renewal</Typography>
                                    <Typography fontWeight="600">{subscription.nextRenewal}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography color="text.secondary">Monthly Total</Typography>
                                    <Typography fontWeight="bold" color="primary">{subscription.amount}</Typography>
                                </Box>
                            </Stack>

                            <Box sx={{ mt: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" fontWeight="600">Monthly Invoices</Typography>
                                    <Typography variant="body2">{subscription.usageCurrent} / {subscription.usageLimit}</Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={(subscription.usageCurrent / subscription.usageLimit) * 100}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                            </Box>

                            <Button fullWidth variant="contained" sx={{ mt: 4, py: 1.5, borderRadius: 3 }}>
                                Upgrade Plan
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Feature Management */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Card sx={{ borderRadius: 4, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                <FeatureIcon color="primary" />
                                <Typography variant="h6" fontWeight="bold">Feature Management</Typography>
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Enable or disable specific modules for your organization. Some features require a plan upgrade.
                            </Typography>

                            <TableContainer component={Box}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Feature Name</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {subscription.features.map((feature) => (
                                            <TableRow key={feature.id}>
                                                <TableCell>{feature.name}</TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={feature.enabled ? 'Enabled' : 'Disabled'}
                                                        size="small"
                                                        color={feature.enabled ? 'success' : 'default'}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <FormControlLabel
                                                        control={<Switch checked={feature.enabled} color="primary" />}
                                                        label=""
                                                        sx={{ m: 0 }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default SubscriptionManagement;
