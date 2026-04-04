import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  useTheme,
  useMediaQuery,
  Snackbar,
  InputAdornment,
  Grid,
  FormControlLabel,
  Switch,
  Typography
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Cake as CakeIcon,
  Event as EventIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PinDrop as PinIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Customer } from '../../types/customer';
import { useCustomers } from '../../hooks/useCustomers';
import LoadingButton from '@mui/lab/LoadingButton';
import { StateCitySelector } from '../common';

import { nameSchema, emailSchema, mobileSchema, addressSchema, stateSchema, citySchema, pincodeSchema, gstSchema } from '../../utils/validation';

const customerSchema = z.object({
  name: nameSchema,
  email: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: addressSchema,
  state: stateSchema,
  city: citySchema,
  pincode: pincodeSchema,
  gstNumber: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
  dob: z.string().optional().or(z.literal('')),
  anniversaryDate: z.string().optional().or(z.literal('')),
  isMarkedRed: z.boolean()
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer?: Customer;
  onClose: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { createCustomer, updateCustomer } = useCustomers();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setError: setFieldStatus,
    formState: { errors, isValid },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema) as any,
    mode: 'onTouched',
    defaultValues: {
      name: customer?.name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
      state: customer?.state || '',
      city: customer?.city || '',
      pincode: customer?.pincode || '',
      gstNumber: customer?.gstNumber || '',
      dob: customer?.dob ? new Date(customer.dob).toISOString().split('T')[0] : '',
      anniversaryDate: customer?.anniversaryDate ? new Date(customer.anniversaryDate).toISOString().split('T')[0] : '',
      isActive: customer?.isActive ?? true,
      isMarkedRed: customer?.isMarkedRed ?? false
    }
  });

  const onSubmit = async (data: CustomerFormData) => {
    setLoading(true);
    setServerError(null);

    try {
      const customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        state: data.state || null,
        city: data.city || null,
        pincode: data.pincode || null,
        gstNumber: data.gstNumber || null,
        isActive: data.isActive,
        dob: (data.dob && data.dob.trim() !== '') ? new Date(data.dob).toISOString() : null,
        anniversaryDate: (data.anniversaryDate && data.anniversaryDate.trim() !== '') ? new Date(data.anniversaryDate).toISOString() : null,
        isMarkedRed: data.isMarkedRed
      };

      if (customer) {
        await updateCustomer({ ...customer, ...customerData });
      } else {
        await createCustomer(customerData);
      }
      onClose();
    } catch (err: any) {
      console.error('[CustomerForm] Save failed:', err);
      const msg = err.message || 'Failed to save customer';
      
      if (msg.toLowerCase().includes('already exists')) {
        setFieldStatus('name', { 
            type: 'manual', 
            message: msg 
        });
      } else {
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit as any)} sx={{ pt: { xs: 1, sm: 2 }, display: 'flex', flexDirection: 'column' }}>
      <Snackbar
        open={Boolean(serverError)}
        autoHideDuration={6000}
        onClose={() => setServerError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setServerError(null)}
          severity="error"
          variant="filled"
          sx={{ width: '100%', boxShadow: 3, borderRadius: 2 }}
        >
          {serverError}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, px: 0.5 }}>
        <TextField
          fullWidth
          label="Customer Name"
          {...register('name', {
            onChange: (e) => {
              const val = e.target.value.replace(/[^a-zA-Z\s.\-]/g, '').slice(0, 30);
              e.target.value = val;
            }
          })}
          error={!!errors.name}
          helperText={errors.name?.message}
          required
          autoFocus
          disabled={loading}
          variant="outlined"
          inputProps={{ maxLength: 30 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="Email Address"
          type="email"
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
          disabled={loading}
          variant="outlined"
          inputProps={{ maxLength: 50 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="Phone Number"
          type="tel"
          {...register('phone', {
            onChange: (e) => {
              const val = e.target.value.replace(/\D/g, '');
              e.target.value = val.slice(0, 10);
            }
          })}
          error={!!errors.phone}
          helperText={errors.phone?.message as string}
          disabled={loading}
          variant="outlined"
          placeholder="10 digit number"
          inputProps={{ maxLength: 10, pattern: '[0-9]*' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {/* Address (single line) */}
        <TextField
          fullWidth
          label="Address"
          {...register('address')}
          error={!!errors.address}
          helperText={errors.address?.message}
          required
          disabled={loading}
          variant="outlined"
          placeholder="e.g. 123, MG Road, Near City Mall"
          inputProps={{ maxLength: 80 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <HomeIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {/* State, City, Pincode row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2 }}>
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <Controller
                name="city"
                control={control}
                render={({ field: cityField }) => (
                  <StateCitySelector
                    selectedState={field.value || ''}
                    selectedCity={cityField.value || ''}
                    onStateChange={(state: string) => field.onChange(state)}
                    onCityChange={(city: string) => cityField.onChange(city)}
                    errorState={errors.state?.message}
                    errorCity={errors.city?.message}
                    disabled={loading}
                  />
                )}
              />
            )}
          />
          <TextField
            fullWidth
            label="Pincode"
            {...register('pincode', {
              onChange: (e) => {
                const val = e.target.value.replace(/\D/g, '');
                e.target.value = val.slice(0, 6);
              }
            })}
            error={!!errors.pincode}
            helperText={errors.pincode?.message}
            required
            disabled={loading}
            variant="outlined"
            placeholder="e.g. 400001"
            inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PinIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ width: '100%' }}>
            <Controller
              name="gstNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="GST Number"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  autoComplete="gst-number"
                  error={!!errors.gstNumber}
                  helperText={errors.gstNumber?.message || 'Optional 15-digit code'}
                  onChange={(e) => {
                    const val = (e.target.value ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    field.onChange(val.slice(0, 15));
                  }}
                  variant="outlined"
                  inputProps={{ maxLength: 15 }}
                  InputProps={{
                    sx: { borderRadius: 2 },
                  }}
                />
              )}
            />
          </Box>

        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            InputLabelProps={{ shrink: true }}
            disabled={loading}
            variant="outlined"
            {...register('dob')}
            error={!!errors.dob}
            helperText={errors.dob?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CakeIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Anniversary"
            type="date"
            InputLabelProps={{ shrink: true }}
            disabled={loading}
            variant="outlined"
            {...register('anniversaryDate')}
            error={!!errors.anniversaryDate}
            helperText={errors.anniversaryDate?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EventIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ mt: 1 }}>
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      Active Customer
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Inactive customers are hidden from bill generation and selection
                    </Typography>
                  </Box>
                }
              />
            )}
          />
        </Box>

        <Box sx={{ mt: 1 }}>
          <Controller
            name="isMarkedRed"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    color="error"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="medium" color="error.main">
                      Mark in Red
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Flag this customer for urgent attention in reports and lists
                    </Typography>
                  </Box>
                }
              />
            )}
          />
        </Box>
      </Box>

      <Box sx={{
        display: 'flex',
        gap: 1.5,
        justifyContent: 'flex-end',
        mt: 4,
        flexDirection: { xs: 'column-reverse', sm: 'row' },
        pb: isMobile ? 2 : 0
      }}>
        <Button
          onClick={onClose}
          disabled={loading}
          fullWidth={isMobile}
          variant="outlined"
          size={isMobile ? 'large' : 'medium'}
          startIcon={<CancelIcon />}
          sx={{ borderRadius: 2 }}
        >
          Cancel
        </Button>
        <LoadingButton
          type="submit"
          variant="contained"
          disabled={loading || !isValid}
          loading={loading}
          fullWidth={isMobile}
          size={isMobile ? 'large' : 'medium'}
          startIcon={<SaveIcon />}
          sx={{ borderRadius: 2 }}
        >
          {customer ? 'Update Details' : 'Save Customer'}
        </LoadingButton>
      </Box>
    </Box>
  );
};

export default CustomerForm;
