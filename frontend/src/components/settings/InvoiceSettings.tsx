import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
  TextField,
  InputAdornment
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../../config/api';
import TaxSettings from './TaxSettings';


/**
 * InvoiceSettings component handles invoice-related configuration
 * Uses single-record ID-based persistence as requested.
 */
const InvoiceSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<any>({
    autoGenerateInvoiceNumbers: true,
    showLogo: true,
    sendEmailNotifications: false,
    showPaymentTerms: true,
    includeTaxBreakdown: true,
    requireApproval: false,
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ open: boolean; message: string; type: 'success' | 'info' | 'error' }>({ open: false, message: '', type: 'info' });

  useEffect(() => {
    // Hydrate settings from the specific route to ensure 100% sync
    axios.get(`${API_URL}/admin/settings/invoice-preferences`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    }).then(res => {
      // res.data.data is the specific record we just implemented (findUnique)
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        setPreferences({
          autoGenerateInvoiceNumbers: data.autoGenerateInvoiceNumbers ?? true,
          showLogo: data.showLogo ?? true,
          sendEmailNotifications: data.sendEmailNotifications ?? false,
          showPaymentTerms: data.showPaymentTerms ?? true,
          includeTaxBreakdown: data.includeTaxBreakdown ?? true,
          requireApproval: data.requireApproval ?? false,
        });
      }
    }).catch(err => {
      console.error('Failed to load invoice preferences', err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const updateSetting = async (key: string, value: boolean) => {
    const previousValue = preferences[key];
    // Optimistic UI Update
    setPreferences((prev: any) => ({ ...prev, [key]: value }));
    setStatus({ open: true, message: 'Saving...', type: 'info' });

    try {
      // Backend expects: { preferences: { [key]: value } }
      await axios.put(`${API_URL}/admin/settings/invoice-preferences`, 
        { preferences: { [key]: value } }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      setStatus({ open: true, message: 'Settings Updated', type: 'success' });
    } catch (err) {
      console.error('Save failed:', err);
      // Revert on error
      setPreferences((prev: any) => ({ ...prev, [key]: previousValue }));
      setStatus({ open: true, message: 'Failed to Save', type: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Invoice template management has been moved to Admin Settings 
          for better organization and security.
        </Typography>
      </Alert>

      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Tax Configuration
          </Typography>
          <TaxSettings />
        </CardContent>
      </Card>



      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Invoice Preferences
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={<Switch checked={preferences.autoGenerateInvoiceNumbers} onChange={(e) => updateSetting('autoGenerateInvoiceNumbers', e.target.checked)} />}
              label="Auto-generate invoice numbers"
            />
            <FormControlLabel
              control={<Switch checked={preferences.showLogo} onChange={(e) => updateSetting('showLogo', e.target.checked)} />}
              label="Include company logo on invoices"
            />
            <FormControlLabel
              control={<Switch checked={preferences.sendEmailNotifications} onChange={(e) => updateSetting('sendEmailNotifications', e.target.checked)} />}
              label="Send email notifications for new invoices"
            />
            <FormControlLabel
              control={<Switch checked={preferences.showPaymentTerms} onChange={(e) => updateSetting('showPaymentTerms', e.target.checked)} />}
              label="Show payment terms on invoices"
            />
            <FormControlLabel
              control={<Switch checked={preferences.includeTaxBreakdown} onChange={(e) => updateSetting('includeTaxBreakdown', e.target.checked)} />}
              label="Include tax breakdown in invoice summary"
            />
            <FormControlLabel
              control={<Switch checked={preferences.requireApproval} onChange={(e) => updateSetting('requireApproval', e.target.checked)} />}
              label="Require approval for invoices"
            />
            {preferences.requireApproval && (
              <TextField
                label="Approval Threshold"
                type="number"
                size="small"
                value={preferences.approvalThreshold}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setPreferences({ ...preferences, approvalThreshold: val });
                }}
                onBlur={() => updateSetting('approvalThreshold', preferences.approvalThreshold)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                sx={{ ml: 4, maxWidth: 200 }}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      <Snackbar 
        open={status.open} 
        autoHideDuration={2000} 
        onClose={() => setStatus(prev => ({ ...prev, open: false }))} 
      >
        <Alert severity={status.type} variant="filled">{status.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default InvoiceSettings;
