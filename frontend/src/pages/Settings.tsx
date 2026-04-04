/* eslint-disable */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Container,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Snackbar,
  Button,
  alpha,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Build as MaintenanceIcon,
  BrandingWatermark as BrandingIcon,
  ChevronRight as ChevronRightIcon,
  Save as SaveIcon,
  AccountBalance as TaxIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';

// Settings Components
import BusinessProfileSettings from '../components/settings/BusinessProfileSettings';
import InvoiceSettings from '../components/settings/InvoiceSettings';
import AppearanceSettings from '../components/settings/AppearanceSettings';
import BrandingSettings from '../components/settings/BrandingSettings';
import TaxSettings from '../components/settings/TaxSettings';
import SecurityTab from '../components/settings/SecurityTab';
import PrivacyTab from '../components/settings/PrivacyTab';
import NotificationsTab from '../components/settings/NotificationsTab';
import MaintenanceTab from '../components/settings/MaintenanceTab';

import { useAuth } from '../contexts/AuthContext';
import useRoleBasedAccess from '../hooks/useRoleBasedAccess';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const permissions = useRoleBasedAccess();

  const [activeTab, setActiveTab] = useState(tab || 'profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  const [settingsMap, setSettingsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [tab]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    navigate(`/settings/${newTab}`);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/admin/settings`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (response.data.success && response.data.flatData) {
          const flatMap: Record<string, any> = {};
          response.data.flatData.forEach((s: any) => { flatMap[s.key] = s.value; });
          setSettingsMap(flatMap);
          // Hydrate secureActionsEnabled into localStorage so all modules can read it instantly
          if (flatMap.hasOwnProperty('secure_actions_enabled')) {
            localStorage.setItem('secureActionsEnabled', flatMap.secure_actions_enabled === true ? 'true' : 'false');
          }
          // Hydrate passwordStrength so password-change dialogs can validate immediately
          if (flatMap.hasOwnProperty('password_strength')) {
            localStorage.setItem('passwordStrength', flatMap.password_strength || 'weak');
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSettingChange = (key: string, value: any) => {
    setSettingsMap(prev => ({ ...prev, [key]: value }));
  };

  // Listen for external App Lock changes (e.g. from Layout's auto-disable on unlock)
  useEffect(() => {
    const syncAppLockToggle = () => {
      const isEnabled = localStorage.getItem('appLockEnabled') === 'true';
      if (settingsMap.hasOwnProperty('app_lock_enabled')) {
        setSettingsMap(prev => ({ ...prev, app_lock_enabled: isEnabled }));
      }
    };
    window.addEventListener('app-lock-changed', syncAppLockToggle);
    window.addEventListener('storage', syncAppLockToggle);
    return () => {
      window.removeEventListener('app-lock-changed', syncAppLockToggle);
      window.removeEventListener('storage', syncAppLockToggle);
    };
  }, [settingsMap.hasOwnProperty('app_lock_enabled')]);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await axios.put(`${API_URL}/admin/settings`, settingsMap, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      // Synchronize Privacy Settings to localStorage only AFTER successful save
      if (settingsMap.hasOwnProperty('app_lock_enabled')) {
        const isEnabled = settingsMap.app_lock_enabled === true;
        localStorage.setItem('appLockEnabled', isEnabled ? 'true' : 'false');
        
        // CRITICAL: Clear unlocked status to trigger instant lock overlay
        if (isEnabled) {
          sessionStorage.removeItem('appUnlocked');
        }
      }
      if (settingsMap.hasOwnProperty('app_lock_pin')) {
        localStorage.setItem('appLockPin', settingsMap.app_lock_pin);
      }
      if (settingsMap.hasOwnProperty('hide_financials')) {
        localStorage.setItem('hideFinancials', settingsMap.hide_financials ? 'true' : 'false');
      }
      // CRITICAL: Sync Secure Actions flag so all modules can read it from localStorage immediately
      if (settingsMap.hasOwnProperty('secure_actions_enabled')) {
        const isSecure = settingsMap.secure_actions_enabled === true;
        localStorage.setItem('secureActionsEnabled', isSecure ? 'true' : 'false');
        console.log(`[Settings] Secure Actions ${isSecure ? 'ENABLED' : 'DISABLED'} — localStorage updated.`);
      }
      // Sync Password Strength so change-password dialogs validate with the correct rules
      if (settingsMap.hasOwnProperty('password_strength')) {
        localStorage.setItem('passwordStrength', settingsMap.password_strength || 'weak');
        console.log(`[Settings] Password Strength set to: ${settingsMap.password_strength || 'weak'}`);
      }

      // Broadcast changes for instant UI reaction (in Layout and currency utils)
      window.dispatchEvent(new Event('app-lock-changed'));
      window.dispatchEvent(new Event('storage'));

      setSuccessMessage('Settings updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { id: 'profile', label: 'Business Profile', icon: <BusinessIcon />, group: 'General' },
    { id: 'branding', label: 'Branding', icon: <BrandingIcon />, group: 'General' },
    { id: 'invoice', label: 'Invoice Settings', icon: <ReceiptIcon />, group: 'General' },
    { id: 'appearance', label: 'Appearance', icon: <PaletteIcon />, group: 'General' },
    { id: 'notifications', label: 'Notifications', icon: <NotificationsIcon />, group: 'System' },
    { id: 'security', label: 'Security', icon: <SecurityIcon />, group: 'System' },
    { id: 'privacy', label: 'Privacy', icon: <LockIcon />, group: 'System' },
  ];

  if (permissions.canManageSettings) {
    menuItems.push(
      { id: 'maintenance', label: 'Maintenance', icon: <MaintenanceIcon />, group: 'Admin' }
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <BusinessProfileSettings />;
      case 'branding': return <BrandingSettings />;
      case 'invoice': return <InvoiceSettings />;
      case 'tax': return <TaxSettings />;
      case 'appearance': return <AppearanceSettings />;
      case 'notifications': return <NotificationsTab settings={settingsMap} onSettingChange={handleSettingChange} />;
      case 'security': return <SecurityTab settings={settingsMap} onSettingChange={handleSettingChange} />;
      case 'privacy': return <PrivacyTab settings={settingsMap} onSettingChange={handleSettingChange} />;
      case 'maintenance': return (
        <MaintenanceTab 
          settings={settingsMap} 
          onBackupTrigger={async () => {
            try {
              const response = await axios.post(`${API_URL}/admin/settings/backup`, {}, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
              });
              if (response.data.success) {
                setSuccessMessage(response.data.message || 'Backup completed successfully!');
                // Refresh settings to show new backup time
                const refreshResponse = await axios.get(`${API_URL}/admin/settings`, {
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (refreshResponse.data.success && refreshResponse.data.flatData) {
                  const flatMap: Record<string, any> = {};
                  refreshResponse.data.flatData.forEach((s: any) => { flatMap[s.key] = s.value; });
                  setSettingsMap(flatMap);
                }
              }
            } catch (err: any) {
              setError(err.response?.data?.error || err.message || 'Backup failed');
              throw err;
            }
          }} 
        />
      );
      default: return <BusinessProfileSettings />;
    }
  };

  const groups = ['General', 'System', 'Admin'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 8 }}>
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 4 }}>

        {/* Sidebar */}
        <Box sx={{ width: isMobile ? '100%' : 280, flexShrink: 0 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, px: 1 }}>
            Settings
          </Typography>

          <Paper 
            sx={{ 
              borderRadius: 3, 
              overflow: 'hidden', 
              border: '1px solid', 
              borderColor: 'divider',
              backgroundColor: alpha(theme.palette.primary.main, 0.02), // "Dudhiya" tint matching Main Sidebar
            }} 
            elevation={0}
          >
            <List component="nav" sx={{ p: 1 }}>
              {groups.map((group) => {
                const groupItems = menuItems.filter(item => item.group === group);
                if (groupItems.length === 0) return null;

                return (
                  <React.Fragment key={group}>
                    <Typography
                      variant="overline"
                      sx={{ px: 2, pt: 2, pb: 1, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}
                    >
                      {group}
                    </Typography>
                    {groupItems.map((item) => (
                      <ListItemButton
                        key={item.id}
                        selected={activeTab === item.id}
                        onClick={() => handleTabChange(item.id)}
                        sx={{
                          borderRadius: 1,
                          mx: 1,
                          my: 0.5,
                          minHeight: 48,
                          transition: 'all 0.2s ease',
                          color: theme.palette.text.secondary,
                          '& .MuiListItemIcon-root': {
                            color: `${theme.palette.text.secondary} !important`,
                            minWidth: 0,
                            mr: 3,
                            justifyContent: 'center',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            '& .icon-bg': {
                              backgroundColor: 'transparent',
                              borderRadius: '50%',
                            }
                          },
                          '&.Mui-selected': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            borderLeft: `5px solid ${theme.palette.primary.main}`,
                            marginLeft: '-1px',
                            color: theme.palette.text.primary,
                            '& .MuiListItemIcon-root': {
                              color: `${theme.palette.primary.main} !important`,
                              '& .icon-bg': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                borderRadius: '50%',
                              }
                            },
                            '& .MuiListItemText-primary': { 
                               fontWeight: 700,
                               color: `${theme.palette.text.primary} !important`,
                            },
                          },
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.03),
                            '& .MuiListItemIcon-root': { color: theme.palette.primary.main }
                          }
                        }}
                      >
                        <ListItemIcon>
                          <Box
                            className="icon-bg"
                            sx={{
                              position: 'absolute',
                              width: 32,
                              height: 32,
                              zIndex: 0,
                              transition: 'all 0.2s ease',
                            }}
                          />
                          <Box sx={{ zIndex: 1, display: 'flex' }}>
                            {item.icon}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{ 
                            variant: 'body2', 
                            fontWeight: activeTab === item.id ? 700 : 500,
                            color: 'inherit'
                          }}
                        />
                        <ChevronRightIcon sx={{ fontSize: 16, opacity: 0.5 }} />
                      </ListItemButton>
                    ))}
                    <Divider sx={{ my: 1, mx: 1 }} />
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {menuItems.find(i => i.id === activeTab)?.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your {menuItems.find(i => i.id === activeTab)?.label.toLowerCase()} here.
              </Typography>
            </Box>

            {/* Save Button for System/Admin settings that use settingsMap */}
            {['notifications', 'security', 'privacy', 'maintenance'].includes(activeTab) && (
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveSettings}
                disabled={saving}
                sx={{ borderRadius: 2 }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </Box>

          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
            <CardContent sx={{ p: isMobile ? 2 : 4 }}>
              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
              {renderContent()}
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage(null)}>
        <Alert severity="success" variant="filled">{successMessage}</Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings;
