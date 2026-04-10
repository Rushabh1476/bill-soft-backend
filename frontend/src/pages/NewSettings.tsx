import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  CreditCard as CreditCardIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Settings
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

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* General Preferences */}
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

                <Button variant="contained" onClick={handleSaveSettings}>
                  Save Preferences
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Notification Settings */}
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
                  onClick={() => setShowPasswordDialog(true)}
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

        {/* Billing & Subscription */}
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
                <Button variant="contained" size="small">
                  Upgrade Plan
                </Button>
                <Button variant="outlined" size="small">
                  Billing History
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              variant="outlined"
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowPasswordDialog(false)}>
            Update Password
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
    </Box>
  );
};

export default Settings;
