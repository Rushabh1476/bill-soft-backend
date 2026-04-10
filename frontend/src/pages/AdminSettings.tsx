/* eslint-disable */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Tab,
  Tabs,
  Alert,
  Button,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Notifications as NotificationsIcon,
  Build as MaintenanceIcon,
  AdminPanelSettings as AdminIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import BusinessProfileSettings from '../components/settings/BusinessProfileSettings';
import NotificationsTab from '../components/settings/NotificationsTab';
import MaintenanceTab from '../components/settings/MaintenanceTab';
import BrandingSettings from '../components/settings/BrandingSettings';
import { useAuth } from '../contexts/AuthContext';
import useRoleBasedAccess from '../hooks/useRoleBasedAccess';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-settings-tabpanel-${index}`}
      aria-labelledby={`admin-settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const permissions = useRoleBasedAccess();
  const navigate = useNavigate();
  const { '*': subPage } = useParams();

  const tabPathMap: Record<string, number> = {
    'business': 0,
    'branding': 1,
    'notifications': 2,
    'maintenance': 3
  };

  const [tabValue, setTabValue] = useState(() => {
    const path = subPage?.split('/')[0] || '';
    return tabPathMap[path] !== undefined ? tabPathMap[path] : 0;
  });

  useEffect(() => {
    const path = subPage?.split('/')[0] || '';
    if (path && tabPathMap[path] !== undefined) {
      setTabValue(tabPathMap[path]);
    }
  }, [subPage]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    const path = Object.keys(tabPathMap).find(key => tabPathMap[key] === newValue);
    if (path) {
      navigate(`/admin/settings/${path}`);
    }
  };


  const [settingsMap, setSettingsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await axios.put(`${API_URL}/admin/settings`, settingsMap, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      setSuccessMessage('Settings updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!permissions.canManageSettings) {
    return <Box sx={{ p: 3 }}><Alert severity="error">Access Denied.</Alert></Box>;
  }

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ pb: 8 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin')}>
          Back
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AdminIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight="bold">Business Settings</Typography>
        </Box>
      </Box>

      <Card sx={{ borderRadius: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
          <Tab icon={<BusinessIcon />} label="Profile" iconPosition="start" />
          <Tab icon={<PaletteIcon />} label="Branding" iconPosition="start" />
          <Tab icon={<NotificationsIcon />} label="Notifications" iconPosition="start" />
          <Tab icon={<MaintenanceIcon />} label="Maintenance" iconPosition="start" />
        </Tabs>

        {error && <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>}

        <TabPanel value={tabValue} index={0}><BusinessProfileSettings /></TabPanel>
        <TabPanel value={tabValue} index={1}><BrandingSettings /></TabPanel>
        <TabPanel value={tabValue} index={2}><NotificationsTab settings={settingsMap} onSettingChange={handleSettingChange} /></TabPanel>
        <TabPanel value={tabValue} index={3}><MaintenanceTab settings={settingsMap} onBackupTrigger={async () => { }} /></TabPanel>
      </Card>

      <Box sx={{ position: 'fixed', bottom: 32, right: 32 }}>
        <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleSaveSettings} disabled={saving}
          sx={{ borderRadius: 50, px: 4, py: 1.5, boxShadow: 6 }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage(null)}>
        <Alert severity="success" variant="filled">{successMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminSettings;
