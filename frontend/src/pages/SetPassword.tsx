import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Business,
  Person,
  Lock,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { validatePassword } from '../utils/validatePassword';

const setPasswordSchema = z.object({
  name: z.string().trim()
    .min(3, 'Name must be at least 3 characters')
    .max(30, 'Name must be 30 characters or less'),
  companyName: z.string().trim()
    .min(3, 'Company name must be at least 3 characters')
    .max(30, 'Company name must be 30 characters or less'),
  password: z.string().superRefine((val, ctx) => {
    const result = validatePassword(val);
    if (!result.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error,
      });
    }
  }),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

const SetPassword: React.FC = () => {
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { completeSignup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token) {
      setServerError('Missing verification token. Please start signup again.');
    }
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
    mode: 'onChange'
  });

  const [success, setSuccess] = useState(false);

  const onSubmit = async (data: SetPasswordFormData) => {
    if (!token) return;

    setServerError('');
    setIsSubmitting(true);

    try {
      await completeSignup({
        token,
        password: data.password,
        companyName: data.companyName,
        name: data.name,
      });

      // Show success message
      setSuccess(true);
      
      // Auto-login happens inside completeSignup context
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } catch (err: any) {
      setServerError(err.message || 'Failed to complete signup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">
          Invalid or expired link. Please <Button onClick={() => navigate('/signup')}>Sign up again</Button>.
        </Alert>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Card sx={{ width: '100%', maxWidth: 500, borderRadius: 3, boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
              <img
                src="/logo.png"
                alt="BillSoft Logo"
                style={{ height: '40px', width: 'auto', marginRight: '12px' }}
              />
              <Typography component="h1" variant="h4" fontWeight="800" color="primary">BillSoft</Typography>
            </Box>

            <Typography component="h2" variant="h5" align="center" fontWeight="700" gutterBottom>Complete Your Profile</Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
              Almost there! Set your password and organization details for <strong>{email}</strong>.
            </Typography>

            {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>Password updated successfully! Redirecting to dashboard...</Alert>}
            {serverError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{serverError}</Alert>}

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Full Name"
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><Person color="primary" /></InputAdornment>),
                  sx: { borderRadius: 2 }
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Company Name"
                {...register('companyName')}
                error={!!errors.companyName}
                helperText={errors.companyName?.message}
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><Business color="primary" /></InputAdornment>),
                  sx: { borderRadius: 2 }
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Set Password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><Lock color="primary" /></InputAdornment>),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><Lock color="primary" /></InputAdornment>),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  mt: 4, 
                  py: 1.5, 
                  borderRadius: 2, 
                  fontWeight: '700',
                  fontSize: '1rem',
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)'
                }}
                disabled={isSubmitting || !isValid}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Finish Signup & Login'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default SetPassword;
