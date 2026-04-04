import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Switch,
    Stack,
    Divider,
} from '@mui/material';

interface NotificationsTabProps {
    settings: any;
    onSettingChange: (key: string, value: any) => void;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ settings, onSettingChange }) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                        System Notifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        Control when and how you get alerted about important events.
                    </Typography>

                    <Stack spacing={3}>
                        {/* Invoice Due Alerts */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="600">
                                    Invoice Due Alerts
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Get notified when an invoice is approaching its due date
                                </Typography>
                            </Box>
                            <Switch
                                checked={!!settings.invoice_due_alerts}
                                onChange={(e) => onSettingChange('invoice_due_alerts', e.target.checked)}
                                color="primary"
                            />
                        </Box>

                        <Divider />

                        {/* Payment Received Alerts */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="600">
                                    Payment Received Alerts
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Receive a confirmation when a client completes a payment
                                </Typography>
                            </Box>
                            <Switch
                                checked={!!settings.payment_received_alerts}
                                onChange={(e) => onSettingChange('payment_received_alerts', e.target.checked)}
                                color="primary"
                            />
                        </Box>

                        <Divider />

                        {/* Admin System Alerts */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="600">
                                    Admin System Alerts
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Crucial alerts about system health and administrative changes
                                </Typography>
                            </Box>
                            <Switch
                                checked={!!settings.admin_system_alerts}
                                onChange={(e) => onSettingChange('admin_system_alerts', e.target.checked)}
                                color="primary"
                            />
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};

export default NotificationsTab;
