import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Stack,
    Divider,
    Chip,
    CircularProgress,
    useTheme
} from '@mui/material';
import {
    Backup as BackupIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
} from '@mui/icons-material';

interface MaintenanceTabProps {
    settings: any;
    onBackupTrigger: () => Promise<void>;
}

const MaintenanceTab: React.FC<MaintenanceTabProps> = ({ settings, onBackupTrigger }) => {
    const [backingUp, setBackingUp] = useState(false);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const handleBackup = async () => {
        setBackingUp(true);
        await onBackupTrigger();
        setBackingUp(false);
    };

    const isHealthy = !settings.system_status || settings.system_status === 'Healthy';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                        System Maintenance
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        Perform manual backups and monitor the health of your application.
                    </Typography>

                    <Stack spacing={4}>
                        {/* System Status */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="600">
                                    System Status
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Current health of the application services
                                </Typography>
                            </Box>
                            <Chip
                                icon={isHealthy ? <CheckCircleIcon /> : <ErrorIcon />}
                                label={settings.system_status || 'Healthy'}
                                color={isHealthy ? 'success' : 'error'}
                                variant="outlined"
                            />
                        </Box>

                        <Divider />

                        {/* Last Backup Time */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                Last Backup Time
                            </Typography>
                            <Typography variant="body1" sx={{
                                fontFamily: 'monospace',
                                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'grey.100',
                                p: 1,
                                borderRadius: 1,
                                display: 'inline-block'
                            }}>
                                {settings.last_backup_time ? new Date(settings.last_backup_time).toLocaleString() : 'Never'}
                            </Typography>
                        </Box>

                        <Divider />

                        {/* Backup Data */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                Backup Data
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Trigger a manual full database backup. This process may take a few moments.
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={backingUp ? <CircularProgress size={20} color="inherit" /> : <BackupIcon />}
                                onClick={handleBackup}
                                disabled={backingUp}
                                sx={{ borderRadius: 2, px: 4 }}
                            >
                                {backingUp ? 'Backing up...' : 'Run Backup'}
                            </Button>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};

export default MaintenanceTab;
