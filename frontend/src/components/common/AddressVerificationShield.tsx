import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Stack,
  Alert,
  CircularProgress,
  useTheme,
  Autocomplete
} from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import stateCityData from '../../data/state_city.json';
import { validateAddressField } from '../../utils/addressValidation';

export const AddressVerificationShield: React.FC = () => {
  const { user, updateProfile, refreshUser } = useAuth();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  // Form State
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    console.log('[AddressShield] Checking user:', user?.email, 'Role:', user?.role);
    if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'owner')) {
      const isMissingAddress = !user.address || !user.city || !user.state || !user.pincode;
      
      if (isMissingAddress) {
        setOpen(true);
        setFormData({
            address: user.address || '',
            city: user.city || '',
            state: user.state || '',
            pincode: user.pincode || ''
        });
      } else {
        setOpen(false);
      }
    } else {
        setOpen(false);
    }
  }, [user]);

  const validateForm = () => {
    const errors: Record<string, string | null> = {
      address: validateAddressField('address', formData.address),
      city: validateAddressField('city', formData.city),
      state: validateAddressField('state', formData.state),
      pincode: validateAddressField('pincode', formData.pincode)
    };
    setFieldErrors(errors);
    return !Object.values(errors).some(v => v !== null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors below.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateProfile({
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      });
      await refreshUser();
      setOpen(false);
    } catch (err: any) {
      const detailedError = err.response?.data?.error || err.message || 'Failed to update address. Please try again.';
      setError(detailedError);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      maxWidth="sm" 
      fullWidth 
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 2,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
        }
      }}
      sx={{
        '& .MuiBackdrop-root': {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
        <Box sx={{ 
          width: 80, 
          height: 80, 
          borderRadius: '24px', 
          bgcolor: 'primary.main', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mx: 'auto',
          mb: 3,
          boxShadow: `0 10px 15px -3px ${theme.palette.primary.main}40`,
          transform: 'rotate(-5deg)'
        }}>
          <BusinessIcon sx={{ fontSize: 40, color: 'white' }} />
        </Box>
        <Typography variant="h4" fontWeight="800" gutterBottom sx={{ letterSpacing: '-0.5px' }}>
          Almost There!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '80%', mx: 'auto', mb: 1 }}>
          Your business address is required to generate professional invoices and receipts.
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pb: 0 }}>
        {error && (
          <Alert severity="error" variant="filled" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Street Address / Area"
            multiline
            rows={2}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. Shop No. 5, Main Road, Near Station..."
            fullWidth
            required
            autoFocus
            error={!!fieldErrors.address}
            helperText={fieldErrors.address}
            InputProps={{
              sx: { borderRadius: 2 }
            }}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
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
                  required 
                  placeholder="Maharashtra"
                  error={!!fieldErrors.state}
                  helperText={fieldErrors.state}
                  InputProps={{ ...params.InputProps, sx: { borderRadius: 2 } }}
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
                  required 
                  placeholder="Mumbai"
                  error={!!fieldErrors.city}
                  helperText={fieldErrors.city}
                  InputProps={{ ...params.InputProps, sx: { borderRadius: 2 } }}
                />
              )}
            />
          </Box>
          <TextField
            label="Pincode"
            value={formData.pincode}
            onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, pincode: val });
            }}
            placeholder="400001"
            fullWidth
            required
            error={!!fieldErrors.pincode}
            helperText={fieldErrors.pincode}
            inputProps={{ maxLength: 6 }}
            InputProps={{
              sx: { borderRadius: 2 }
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          variant="contained" 
          fullWidth 
          size="large"
          onClick={handleSubmit} 
          disabled={loading}
          sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 2, textTransform: 'none', fontSize: '1.1rem' }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Save & Continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
