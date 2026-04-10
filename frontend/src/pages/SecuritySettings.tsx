import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Paper,
    Alert,
    useTheme
} from '@mui/material';
import {
    Security as SecurityIcon,
    ArrowBack as ArrowBackIcon,
    Key as ApiKeyIcon,
    VpnKey as RbacIcon,
    History as LogsIcon,
    Shield as ShieldIcon,
    Delete as DeleteIcon,
    ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SecurityTab from '../components/settings/SecurityTab';
import { useAuth } from '../contexts/AuthContext';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const SecuritySettings: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const permissions = useRoleBasedAccess();
    const [tabValue, setTabValue] = useState(0);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const [mockApiKeys] = useState([
        { id: 1, name: 'Main API Key', key: 'bs_live_4k83...2m91', created: '2024-01-10', status: 'Active' },
        { id: 2, name: 'Mobile App Key', key: 'bs_live_j92n...s81k', created: '2024-02-05', status: 'Active' },
    ]);

    const [mockLogs] = useState([
        { id: 1, event: 'User Login', user: 'admin@billsoft.com', ip: '192.168.1.1', time: '2024-02-28 10:20:15' },
        { id: 2, event: 'API Key Created', user: 'admin@billsoft.com', ip: '192.168.1.1', time: '2024-02-28 09:15:22' },
        { id: 3, event: 'Role Permission Changed', user: 'manager@billsoft.com', ip: '103.42.12.5', time: '2024-02-27 18:45:10' },
        { id: 4, event: 'Bulk Export Triggered', user: 'admin@billsoft.com', ip: '192.168.1.1', time: '2024-02-27 14:12:44' },
    ]);

    // This would normally come from a settings hook/context
    const [securitySettings, setSecuritySettings] = useState({
        password_strength: 'strong',
        login_attempts_limit: 5,
        session_timeout: 30
    });

    const handleSettingChange = (key: string, value: any) => {
        setSecuritySettings(prev => ({ ...prev, [key]: value }));
    };

    if (!permissions.canManageSettings && user?.role?.toUpperCase() !== 'ADMIN') {
        return (
            <Box sx={{ p: 5, textAlign: 'center', mt: 10 }}>
                <Paper sx={{ p: 5, borderRadius: 3 }}>
                    <Typography variant="h5" color="error">Access Denied</Typography>
                    <Typography color="text.secondary" sx={{ mt: 2 }}>You do not have permission to access security settings.</Typography>
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
                    <SecurityIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" fontWeight="bold">
                        Security Settings
                    </Typography>
                </Box>
            </Box>

            <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                    <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                        <Tab icon={<ShieldIcon />} label="Account Protection" iconPosition="start" />
                        <Tab icon={<RbacIcon />} label="Roles & RBAC" iconPosition="start" />
                        <Tab icon={<ApiKeyIcon />} label="API Keys" iconPosition="start" />
                        <Tab icon={<LogsIcon />} label="Security Logs" iconPosition="start" />
                    </Tabs>
                </Box>

                <CardContent sx={{ p: 3 }}>
                    {/* Tab 1: Account Protection */}
                    <TabPanel value={tabValue} index={0}>
                        <SecurityTab settings={securitySettings} onSettingChange={handleSettingChange} />
                    </TabPanel>

                    {/* Tab 2: RBAC */}
                    <TabPanel value={tabValue} index={1}>
                        <Box>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>Role-Based Access Control</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Define granular permissions for different user roles in your organization.
                            </Typography>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                RBAC configurations are currently managed at the organization level. Customize roles below.
                            </Alert>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Permissions</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Members</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell><Chip label="Super Admin" color="primary" /></TableCell>
                                            <TableCell>Full System Access</TableCell>
                                            <TableCell align="right">2</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><Chip label="Manager" color="secondary" /></TableCell>
                                            <TableCell>Inventory, Billing, Reports</TableCell>
                                            <TableCell align="right">5</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </TabPanel>

                    {/* Tab 3: API Keys */}
                    <TabPanel value={tabValue} index={2}>
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold">API Access Keys</Typography>
                                    <Typography variant="body2" color="text.secondary">Use these keys to integrate BillSoft with your external tools.</Typography>
                                </Box>
                                <Button variant="contained" startIcon={<ApiKeyIcon />}>Create New Key</Button>
                            </Box>

                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>API Key</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {mockApiKeys.map(key => (
                                            <TableRow key={key.id}>
                                                <TableCell sx={{ fontWeight: '600' }}>{key.name}</TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace' }}>{key.key}</TableCell>
                                                <TableCell>{key.created}</TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small"><CopyIcon fontSize="small" /></IconButton>
                                                    <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </TabPanel>

                    {/* Tab 4: Logs */}
                    <TabPanel value={tabValue} index={3}>
                        <Box>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>Security Activity Logs</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Audit trail of all sensitive activities within your organization.</Typography>

                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                                <Table>
                                    <TableHead sx={{ bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'grey.100' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Event</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>IP Address</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {mockLogs.map(log => (
                                            <TableRow key={log.id}>
                                                <TableCell sx={{ fontWeight: '600' }}>{log.event}</TableCell>
                                                <TableCell>{log.user}</TableCell>
                                                <TableCell>{log.ip}</TableCell>
                                                <TableCell sx={{ color: 'text.secondary' }}>{log.time}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </TabPanel>
                </CardContent>
            </Card>
        </Box>
    );
};

export default SecuritySettings;
