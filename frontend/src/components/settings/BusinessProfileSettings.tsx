import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import LogoUpload from './LogoUpload';
import SecureActionDialog from '../shared/SecureActionDialog';
import stateCityData from '../../data/state_city.json';
import { validateAddressField } from '../../utils/addressValidation';
import { Autocomplete } from '@mui/material';
import { validateGST, validatePAN } from '../../utils/validation';

const BusinessProfileSettings: React.FC = () => {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    panNumber: ''
  });

  // Secure Actions
  const [secureDialogOpen, setSecureDialogOpen] = useState(false);
  const isSecureEnabled = localStorage.getItem('secureActionsEnabled') === 'true';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = response.data.user;
      setFormData({
        name: userData.name || '',
        companyName: userData.companyName || '',
        phone: userData.phone || '',
        email: userData.email || '',
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || '',
        pincode: userData.pincode || '',
        gstNumber: userData.gstNumber || '',
        panNumber: userData.panNumber || ''
      });
    } catch (err: any) {
      console.error('Failed to fetch profile', err);
      setError('Could not load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };


  const handleSaveTrigger = () => {
    const isSecure = localStorage.getItem('secureActionsEnabled') === 'true';
    if (isSecure) {
      setSecureDialogOpen(true);
    } else {
      handleSave();
    }
  };

  const validateForm = () => {
    const errors: Record<string, string | null> = {
      address: validateAddressField('address', formData.address),
      city: validateAddressField('city', formData.city),
      state: validateAddressField('state', formData.state),
      pincode: validateAddressField('pincode', formData.pincode)
    };
    
    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone)) {
      errors.phone = 'Phone must be 10 digits and start with 6, 7, 8, or 9';
    }

    const gstRes = validateGST(formData.gstNumber);
    if (!gstRes.isValid) errors.gstNumber = gstRes.error || 'Invalid GST';

    const panRes = validatePAN(formData.panNumber);
    if (!panRes.isValid) errors.panNumber = panRes.error || 'Invalid PAN';

    setFieldErrors(errors);
    return !Object.values(errors).some(v => v !== null);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors below.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`${API_URL}/auth/profile`, {
        name: formData.name,
        companyName: formData.companyName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        gstNumber: formData.gstNumber,
        panNumber: formData.panNumber
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await refreshUser();
      setSuccess(true);
      setFieldErrors({});
    } catch (err: any) {
      console.error('Failed to save settings', err);
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
      setSecureDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            Business Identity
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
              <TextField
                fullWidth
                label="Company Name"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Business Name / Owner Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                variant="outlined"
              />
            </Box>
            
            <TextField
              fullWidth
              label="Street Address / Area"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              multiline
              rows={3}
              variant="outlined"
              error={!!fieldErrors.address}
              helperText={fieldErrors.address}
              inputProps={{ maxLength: 80 }}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
              <Autocomplete
                options={stateCityData.states.map((s: { name: string }) => s.name)}
                value={formData.state}
                onChange={(_, newValue) => {
                  setFormData({ ...formData, state: newValue || '', city: '' });
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="State" 
                    variant="outlined"
                    error={!!fieldErrors.state}
                    helperText={fieldErrors.state}
                  />
                )}
              />
              <Autocomplete
                options={stateCityData.states.find((s: { name: string }) => s.name === formData.state)?.cities || []}
                value={formData.city}
                disabled={!formData.state}
                onChange={(_, newValue) => {
                  setFormData({ ...formData, city: newValue || '' });
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="City" 
                    variant="outlined"
                    error={!!fieldErrors.city}
                    helperText={fieldErrors.city}
                  />
                )}
              />
              <TextField
                fullWidth
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, pincode: val.slice(0, 6) });
                }}
                variant="outlined"
                error={!!fieldErrors.pincode}
                helperText={fieldErrors.pincode}
                inputProps={{ maxLength: 6 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                variant="outlined"
                error={!!fieldErrors.phone}
                helperText={fieldErrors.phone}
              />
              <TextField
                fullWidth
                label="Email Address (Login)"
                value={formData.email}
                disabled
                variant="outlined"
                helperText="Email cannot be changed"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
              <TextField
                fullWidth
                label="GST Number"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15);
                  setFormData({ ...formData, gstNumber: val });
                }}
                variant="outlined"
                error={!!fieldErrors.gstNumber}
                helperText={fieldErrors.gstNumber}
                inputProps={{ maxLength: 15 }}
              />
              <TextField
                fullWidth
                label="PAN Number"
                name="panNumber"
                value={formData.panNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
                  setFormData({ ...formData, panNumber: val });
                }}
                variant="outlined"
                error={!!fieldErrors.panNumber}
                helperText={fieldErrors.panNumber}
                inputProps={{ maxLength: 10 }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <LogoUpload />

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          onClick={handleSaveTrigger} 
          disabled={saving}
          size="large"
          sx={{ px: 4, py: 1.5, fontWeight: 'bold', borderRadius: 2 }}
        >
          {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Profile Settings'}
        </Button>
      </Box>

      <SecureActionDialog 
        open={secureDialogOpen}
        onClose={() => setSecureDialogOpen(false)}
        onConfirm={() => handleSave()}
        title="Authorize Profile Update"
        message="Updating your business profile is a critical action. Enter your security PIN to proceed."
        actionLabel="Update Profile"
      />

      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
          Business settings updated successfully
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BusinessProfileSettings;

