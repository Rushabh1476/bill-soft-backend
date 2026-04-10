import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  Link,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Business,
  Email,
  Person,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { API_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { validatePassword } from '../utils/validatePassword';
import { emailSchema, nameSchema, personalNameSchema, mobileSchema } from '../utils/validation';

// Base schema without password regex
const signupSchemaBase = z.object({
  name: personalNameSchema,
  email: emailSchema,
  phone: mobileSchema,
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
  companyName: nameSchema,
  organizationSize: z.string()
    .regex(/^\d*$/, 'Only numbers are allowed')
    .optional()
});

const Signup: React.FC = () => {
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState<'strong' | 'weak'>('strong');
  const { isLoading: isAuthLoading } = useAuth();

  // Fetch policy
  React.useEffect(() => {
    axios.get(`${API_URL}/public/password-policy`).then(res => {
      if (res.data.success) setPasswordPolicy(res.data.strength);
    }).catch(() => setPasswordPolicy('strong'));
  }, []);

  // Dynamic Schema
  const dynamicSignupSchema = React.useMemo(() => {
    let passSchema = z.string().max(16, 'Password must be 16 characters or less');
    
    if (passwordPolicy === 'strong') {
      passSchema = passSchema
        .min(8, 'Password must be at least 8 characters long')
        .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])/, 'Password must contain at least one number and one special character');
    } else {
      passSchema = passSchema.min(3, 'Password must be at least 3 characters');
    }

    return signupSchemaBase.extend({
      password: passSchema
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });
  }, [passwordPolicy]);

  type SignupFormData = z.infer<typeof dynamicSignupSchema>;
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignupFormData>({
    resolver: zodResolver(dynamicSignupSchema),
    mode: 'onChange'
  });

  React.useEffect(() => {
    // If already logged in, redirect to home
    if (!isAuthLoading && localStorage.getItem('authToken')) {
      navigate('/dashboard');
    }
  }, [isAuthLoading, navigate]);

  const onSubmit = async (data: SignupFormData) => {
    setServerError('');
    setIsLoading(true);

    try {
      // Store organization info in localStorage for profile
      localStorage.setItem('organizationData', JSON.stringify({
        companyName: data.companyName,
        organizationSize: data.organizationSize,
        adminName: data.name,
        adminEmail: data.email,
        adminPhone: data.phone,
      }));

      await axios.post(`${API_URL}/auth/register`, {
        email: data.email,
        password: data.password,
        companyName: data.companyName,
        name: data.name,
        phone: data.phone,
        organizationSize: data.organizationSize
      });

      // Show verification message on Login page after redirect
      navigate(`/login?signup=success&email=${encodeURIComponent(data.email)}`);

    } catch (err: any) {
      console.error('Registration Error:', err.response?.data);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create account.';
      setServerError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
      <Box sx={{ marginTop: { xs: 4, sm: 8 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Card sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 500 },
          borderRadius: { xs: 2, sm: 3 },
          boxShadow: { xs: 'none', sm: 3 },
          border: { xs: 'none', sm: '1px solid rgba(0,0,0,0.05)' }
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
              <img
                src="/Bill (1).svg"
                alt="BillSoft Logo"
                style={{ height: '50px', width: 'auto', marginRight: '16px' }}
              />
              <Typography component="h1" variant="h4" fontWeight="bold">BillSoft</Typography>
            </Box>

            <Typography component="h2" variant="h5" align="center" gutterBottom>Create Your Organization</Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              Set up your B2B billing account. You'll be the first admin.
            </Typography>

            {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, fontWeight: 600 }}>Organization Details</Typography>

              <TextField
                margin="normal"
                required
                fullWidth
                label="Company / Organization Name"
                {...register('companyName')}
                error={!!errors.companyName}
                helperText={errors.companyName?.message}
                inputProps={{ maxLength: 30 }}
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><Business /></InputAdornment>),
                }}
              />

              <TextField
                margin="normal"
                fullWidth
                label="Organization Size"
                {...register('organizationSize', {
                  onChange: (e) => {
                    const val = e.target.value.replace(/\D/g, ''); // Extract only digits
                    e.target.value = val;
                  }
                })}
                error={!!errors.organizationSize}
                helperText={errors.organizationSize?.message || "Example: 10, 50, 100"}
                placeholder="Enter numbers only"
                inputProps={{ 
                  inputMode: 'numeric', 
                  pattern: '[0-9]*' 
                }}
              />

              <Typography variant="subtitle2" sx={{ mb: 1, mt: 3, fontWeight: 600 }}>Admin Account (You)</Typography>

              <TextField
                margin="normal"
                required
                fullWidth
                label="Your Full Name"
                {...register('name', {
                  onChange: (e) => {
                    const val = e.target.value.replace(/[^a-zA-Z\s.-]/g, '').slice(0, 30);
                    e.target.value = val;
                  }
                })}
                error={!!errors.name}
                helperText={errors.name?.message}
                inputProps={{ maxLength: 30 }}
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><Person /></InputAdornment>),
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                type="email"
                {...register('email', {
                  onChange: (e) => {
                    e.target.value = e.target.value.toLowerCase().trim();
                  }
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
                inputProps={{ maxLength: 50 }}
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><Email /></InputAdornment>),
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Phone Number (10 digits)"
                type="tel"
                {...register('phone', {
                  onChange: (e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    e.target.value = val.slice(0, 10);
                  }
                })}
                error={!!errors.phone}
                helperText={errors.phone?.message}
                inputProps={{ maxLength: 10, pattern: '[0-9]*' }}
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><PhoneIcon /></InputAdornment>),
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message || 'Max 16 characters'}
                inputProps={{ maxLength: 16 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
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
                helperText={errors.confirmPassword?.message || 'Max 16 characters'}
                inputProps={{ maxLength: 16 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading || !isValid}
                size="large"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <Divider sx={{ my: 2 }} />

              <Box textAlign="center">
                <Typography variant="body2">
                  Already have an account?{' '}
                  <Link component="button" variant="body2" onClick={handleLoginRedirect} sx={{ cursor: 'pointer' }}>
                    Sign in here
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Signup;
