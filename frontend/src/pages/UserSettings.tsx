import React, { useState } from 'react';
import { validatePassword } from '../utils/validatePassword';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  CreditCard as CreditCardIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  NightsStay as NightModeIcon,
  ViewColumn as ColumnIcon,
  Group as UserRolesIcon,
  Receipt as InvoiceIcon,
  OpenInNew as OpenInNewIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../contexts/ThemeContext';
import AdminSettings from '../components/settings/AdminSettings';
import { useNavigate } from 'react-router-dom';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';

const UserSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const { mode, setMode } = useAppTheme();
  const navigate = useNavigate();
  const permissions = useRoleBasedAccess();

  const [settings, setSettings] = useState({
    language: 'english',
    timezone: 'Asia/Kolkata',
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: true,
    twoFactorAuth: false,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);

  // Change Password form state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwShow, setPwShow] = useState({ current: false, newPw: false, confirm: false });
  const [pwErrors, setPwErrors] = useState({ current: '', newPw: '', confirm: '', api: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleSettingChange = (setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveSettings = () => {
    // Save settings logic here
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleLogout = () => {
    logout();
    setShowLogoutDialog(false);
  };

  const handleOpenPasswordDialog = () => {
    setPwForm({ current: '', newPw: '', confirm: '' });
    setPwErrors({ current: '', newPw: '', confirm: '', api: '' });
    setPwSuccess(false);
    setShowPasswordDialog(true);
  };

  const handleChangePassword = async () => {
    // --- Front-end validation ---
    const errs = { current: '', newPw: '', confirm: '', api: '' };
    if (!pwForm.current) errs.current = 'Current password is required';
    
    // Use the central validation (handles both strong/weak modes)
    const strengthCheck = validatePassword(pwForm.newPw);
    if (!strengthCheck.valid) {
      errs.newPw = strengthCheck.error;
    }

    if (!pwForm.confirm) errs.confirm = 'Please confirm your new password';
    else if (pwForm.newPw && pwForm.confirm !== pwForm.newPw) errs.confirm = 'Passwords do not match';

    if (errs.current || errs.newPw || errs.confirm) {
      setPwErrors(errs);
      return;
    }

    setPwLoading(true);
    setPwErrors({ current: '', newPw: '', confirm: '', api: '' });

    try {
      const token = localStorage.getItem('authToken');
      const { API_URL } = await import('../config/api');
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Show server error in the right field
        const msg = data.error || 'Something went wrong';
        if (res.status === 401) {
          setPwErrors(prev => ({ ...prev, current: msg }));
        } else {
          setPwErrors(prev => ({ ...prev, api: msg }));
        }
        return;
      }

      // Success!
      setPwSuccess(true);
      setPwForm({ current: '', newPw: '', confirm: '' });
      
      setTimeout(() => {
        navigate(-1); // Automatically navigate back to previous page
      }, 2000);
    } catch (err) {
      setPwErrors(prev => ({ ...prev, api: 'Network error. Please try again.' }));
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          User Settings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your account preferences and security settings
        </Typography>
      </Box>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      {permissions.canViewAdminPanel && (
        <Box sx={{ mb: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <AdminIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Admin Settings
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Control application-wide settings, user permissions, and data visibility.
              </Typography>

              {/* Actions row: compact button + quick action chips side by side */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
                {/* Primary CTA — small, auto-width */}
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate('/admin')}
                  startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                  sx={{ flexShrink: 0, height: 32, fontSize: '0.8125rem', px: 1.5 }}
                >
                  Open Admin Panel
                </Button>

                {/* Divider dot */}
                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'divider', flexShrink: 0 }} />

                {/* Quick Action Chips */}
                {permissions.canManageSettings && (
                  <Chip
                    icon={<ColumnIcon sx={{ fontSize: '0.9rem !important' }} />}
                    label="Column Settings"
                    size="small"
                    variant="outlined"
                    onClick={() => navigate('/admin/app-settings')}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  />
                )}
                {permissions.canManageUsers && (
                  <Chip
                    icon={<UserRolesIcon sx={{ fontSize: '0.9rem !important' }} />}
                    label="User Roles"
                    size="small"
                    variant="outlined"
                    onClick={() => navigate('/admin/users')}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  />
                )}
                {permissions.canManageSettings && (
                  <Chip
                    icon={<InvoiceIcon sx={{ fontSize: '0.9rem !important' }} />}
                    label="Invoice Config"
                    size="small"
                    variant="outlined"
                    onClick={() => navigate('/admin/settings/business')}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  />
                )}
              </Box>

            </CardContent>
          </Card>
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Security Settings */}
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <SecurityIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Security
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.twoFactorAuth}
                      onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                    />
                  }
                  label="Two-Factor Authentication"
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: -1, ml: 4 }}>
                  Add an extra layer of security to your account
                </Typography>

                <Button
                  variant="outlined"
                  onClick={handleOpenPasswordDialog}
                  sx={{ alignSelf: 'flex-start', mt: 2 }}
                >
                  Change Password
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setShowLogoutDialog(true)}
                  startIcon={<LogoutIcon />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Logout from All Devices
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {permissions.canViewSubscription && (
          <Box>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <CreditCardIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Billing & Subscription
                  </Typography>
                </Box>

                <List>
                  <ListItem>
                    <ListItemText
                      primary="Current Plan"
                      secondary={user?.plan || 'Pro Plan'}
                    />
                    <ListItemSecondaryAction>
                      <Chip label="Active" color="success" size="small" />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Next Billing Date"
                      secondary="November 12, 2025"
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="body2" fontWeight="bold">
                        ₹1,299/month
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="contained" size="small" onClick={() => navigate('/admin/subscription')}>
                    Upgrade Plan
                  </Button>
                  <Button variant="outlined" size="small" onClick={() => navigate('/admin/subscription')}>
                    Billing History
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* General Preferences - MOVED DOWN */}
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <LanguageIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  General Preferences
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    label="Language"
                  >
                    <MenuItem value="english">English</MenuItem>
                    <MenuItem value="hindi">हिंदी (Hindi)</MenuItem>
                    <MenuItem value="spanish">Español</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Time Zone</InputLabel>
                  <Select
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange('timezone', e.target.value)}
                    label="Time Zone"
                  >
                    <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST)</MenuItem>
                    <MenuItem value="America/New_York">America/New_York (EST)</MenuItem>
                    <MenuItem value="Europe/London">Europe/London (GMT)</MenuItem>
                    <MenuItem value="Asia/Tokyo">Asia/Tokyo (JST)</MenuItem>
                  </Select>
                </FormControl>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Appearance Mode
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    {[
                      { value: 'light', label: 'Light', icon: <LightModeIcon sx={{ mb: 0.5, fontSize: 24 }} /> },
                      { value: 'dark', label: 'Dark', icon: <DarkModeIcon sx={{ mb: 0.5, fontSize: 24 }} /> },
                      { value: 'night', label: 'Night', icon: <NightModeIcon sx={{ mb: 0.5, fontSize: 24 }} /> },
                    ].map((option) => (
                      <Box
                        key={option.value}
                        onClick={() => setMode(option.value as 'light' | 'dark' | 'night')}
                        sx={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          py: 2,
                          px: 1,
                          cursor: 'pointer',
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: mode === option.value ? 'primary.main' : 'divider',
                          backgroundColor: mode === option.value ? 'action.selected' : 'transparent',
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            backgroundColor: mode === option.value ? 'action.selected' : 'action.hover',
                          },
                        }}
                      >
                        {React.cloneElement(option.icon, {
                          color: mode === option.value ? 'primary' : 'inherit'
                        })}
                        <Typography
                          variant="body2"
                          fontWeight={mode === option.value ? 600 : 400}
                          color={mode === option.value ? 'primary.main' : 'text.secondary'}
                        >
                          {option.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    Choose your preferred visual theme across the application.
                  </Typography>
                </Box>

                <Button variant="contained" onClick={handleSaveSettings}>
                  Save Preferences
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Notification Settings - MOVED DOWN */}
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <NotificationsIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Notifications
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                  }
                  label="Email Notifications"
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: -1, ml: 4 }}>
                  Receive notifications about bills, payments, and updates
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.smsNotifications}
                      onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                    />
                  }
                  label="SMS Notifications"
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: -1, ml: 4 }}>
                  Get important alerts via text message
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.marketingEmails}
                      onChange={(e) => handleSettingChange('marketingEmails', e.target.checked)}
                    />
                  }
                  label="Marketing Emails"
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: -1, ml: 4 }}>
                  Receive product updates and promotional content
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Change Password Dialog */}
      <Dialog
        open={showPasswordDialog}
        onClose={() => !pwLoading && setShowPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>

            {pwSuccess && (
              <Alert severity="success">Password changed successfully! 🎉</Alert>
            )}
            {pwErrors.api && (
              <Alert severity="error">{pwErrors.api}</Alert>
            )}

            {/* Current Password */}
            <TextField
              fullWidth
              label="Current Password"
              type={pwShow.current ? 'text' : 'password'}
              variant="outlined"
              value={pwForm.current}
              onChange={(e) => { setPwForm(p => ({ ...p, current: e.target.value })); setPwErrors(p => ({ ...p, current: '' })); }}
              error={!!pwErrors.current}
              helperText={pwErrors.current}
              disabled={pwLoading || pwSuccess}
              inputProps={{ maxLength: 16 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setPwShow(p => ({ ...p, current: !p.current }))} edge="end" size="small">
                      {pwShow.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* New Password */}
            <TextField
              fullWidth
              label="New Password"
              type={pwShow.newPw ? 'text' : 'password'}
              variant="outlined"
              value={pwForm.newPw}
              onChange={(e) => { setPwForm(p => ({ ...p, newPw: e.target.value })); setPwErrors(p => ({ ...p, newPw: '' })); }}
              error={!!pwErrors.newPw}
              helperText={pwErrors.newPw || '8-16 characters'}
              disabled={pwLoading || pwSuccess}
              inputProps={{ maxLength: 16 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setPwShow(p => ({ ...p, newPw: !p.newPw }))} edge="end" size="small">
                      {pwShow.newPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* Confirm Password */}
            <TextField
              fullWidth
              label="Confirm New Password"
              type={pwShow.confirm ? 'text' : 'password'}
              variant="outlined"
              value={pwForm.confirm}
              onChange={(e) => { setPwForm(p => ({ ...p, confirm: e.target.value })); setPwErrors(p => ({ ...p, confirm: '' })); }}
              error={!!pwErrors.confirm}
              helperText={pwErrors.confirm}
              disabled={pwLoading || pwSuccess}
              inputProps={{ maxLength: 16 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setPwShow(p => ({ ...p, confirm: !p.confirm }))} edge="end" size="small">
                      {pwShow.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setShowPasswordDialog(false)} disabled={pwLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={pwLoading || pwSuccess}
            startIcon={pwLoading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {pwLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onClose={() => setShowLogoutDialog(false)}>
        <DialogTitle>Logout from All Devices</DialogTitle>
        <DialogContent>
          <Typography>
            This will log you out from all devices and you'll need to sign in again. Are you sure you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogoutDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleLogout}>
            Logout All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Admin Settings Dialog */}
      <AdminSettings
        isOpen={showAdminSettings}
        onClose={() => setShowAdminSettings(false)}
      />
    </Box>
  );
};

export default UserSettings;
