import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Switch,
    TextField,
    FormControl,
    Select,
    MenuItem,
    Stack,
    Divider,
} from '@mui/material';

interface SecurityTabProps {
    settings: any;
    onSettingChange: (key: string, value: any) => void;
}

const SecurityTab: React.FC<SecurityTabProps> = ({ settings, onSettingChange }) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                        Account Protection
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        Manage password rules and session behavior to keep your account secure.
                    </Typography>

                    <Stack spacing={4}>
                        {/* Password Strength */}
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="600">
                                        Password Strength
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Enforce strong password rules (uppercase, number, symbol)
                                    </Typography>
                                </Box>
                                <FormControl component="fieldset">
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="body2" color={settings.password_strength === 'weak' ? 'primary' : 'text.secondary'}>Weak</Typography>
                                        <Switch
                                            checked={settings.password_strength === 'strong'}
                                            onChange={(e) => onSettingChange('password_strength', e.target.checked ? 'strong' : 'weak')}
                                            color="primary"
                                        />
                                        <Typography variant="body2" color={settings.password_strength === 'strong' ? 'primary' : 'text.secondary'}>Strong</Typography>
                                    </Stack>
                                </FormControl>
                            </Box>
                        </Box>

                        <Divider />

                        {/* Login Attempts */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                Login Attempts Limit
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Temporarily lock the account after too many failed attempts (Recommended: 5)
                            </Typography>
                            <TextField
                                type="number"
                                variant="outlined"
                                size="small"
                                value={settings.login_attempts_limit || 5}
                                onChange={(e) => onSettingChange('login_attempts_limit', parseInt(e.target.value))}
                                inputProps={{ min: 3, max: 10 }}
                                sx={{ width: 120 }}
                            />
                        </Box>

                        <Divider />

                        {/* Session Timeout */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                Session Timeout
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Automatically log out after being inactive for a certain period
                            </Typography>
                            <FormControl size="small" sx={{ width: 200 }}>
                                <Select
                                    value={settings.session_timeout || 30}
                                    onChange={(e) => onSettingChange('session_timeout', e.target.value)}
                                >
                                    <MenuItem value={15}>15 minutes</MenuItem>
                                    <MenuItem value={30}>30 minutes</MenuItem>
                                    <MenuItem value={60}>60 minutes</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};

export default SecurityTab;
