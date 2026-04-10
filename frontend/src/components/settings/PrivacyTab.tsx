import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Switch,
    FormControlLabel,
    Alert,
    TextField,
    IconButton,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SecurityIcon from '@mui/icons-material/Security';
import ClearIcon from '@mui/icons-material/Clear';

interface PrivacyTabProps {
    settings: any;
    onSettingChange: (key: string, value: any) => void;
}

const PrivacyTab: React.FC<PrivacyTabProps> = ({ settings, onSettingChange }) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Security PIN Section */}
            <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <SecurityIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                            Internal Security PIN
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 600 }}>
                        Set a dedicated PIN for internal verification. You'll be prompted for this PIN when performing sensitive operations like permanent deletions, financial record modification, or changing security settings.
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {/* Hidden decoy field to prevent browser from auto-filling the search box behind the dialog as a 'username' field */}
                        <input type="text" name="username" style={{ display: 'none' }} autoComplete="username" />
                        
                        <TextField
                            label={settings.app_lock_pin ? "Update Security PIN" : "Set Security PIN"}
                            type="password"
                            size="small"
                            value={settings.app_lock_pin || ''}
                            onChange={(e) => onSettingChange('app_lock_pin', e.target.value)}
                            placeholder="4-6 digit PIN"
                            sx={{ width: 220 }}
                            autoComplete="new-password"
                            name="privacy-pin-input-field"
                            inputProps={{ 
                                maxLength: 6,
                                style: { letterSpacing: settings.app_lock_pin ? '0.3em' : 'normal' },
                                autoComplete: 'new-password'
                            }}
                        />
                        {settings.app_lock_pin && (
                            <IconButton 
                                color="error" 
                                onClick={() => onSettingChange('app_lock_pin', '')}
                                title="Remove PIN"
                                size="small"
                                sx={{ 
                                    border: '1px solid', 
                                    borderColor: 'error.light',
                                    '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.04)' }
                                }}
                            >
                                <ClearIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>

                    <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }} icon={<LockIcon />}>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                            <strong>Note:</strong> This PIN is only for <strong>internal verification</strong> and will <strong>NOT</strong> lock the entire application or restrict access upon login.
                        </Typography>
                    </Alert>
                </CardContent>
            </Card>

            {/* Financial Privacy Section */}
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <VisibilityIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                            Financial Privacy
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Control the visibility of financial figures like revenue, totals, and balances across the app.
                    </Typography>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.hide_financials === true}
                                onChange={(e) => onSettingChange('hide_financials', e.target.checked)}
                                color="primary"
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="subtitle1" fontWeight="600">
                                    Hide Financial Data
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Amounts will be masked (e.g., ₹***) until you hover over them or disable this setting.
                                </Typography>
                            </Box>
                        }
                    />
                </CardContent>
            </Card>

            {/* Secure Actions Section */}
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <SecurityIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                            Secure Actions
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Require confirmation for critical actions like deleting records or resetting data.
                    </Typography>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.secure_actions_enabled === true}
                                onChange={(e) => onSettingChange('secure_actions_enabled', e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Enable Confirmation for Critical Actions"
                    />
                </CardContent>
            </Card>

            <Alert severity="warning" variant="outlined">
                Enabling these settings provides extra protection for your business data, especially in shared environments.
            </Alert>
        </Box>
    );
};

export default PrivacyTab;
