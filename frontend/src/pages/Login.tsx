import React, { useState } from 'react';
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
  Snackbar,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, LockOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import axios from 'axios';
import { API_URL } from '../config/api';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openForgotModal, setOpenForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [openErrorSnackbar, setOpenErrorSnackbar] = useState(false);

  const { user, isAuthenticated, isLoading: isAuthLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [justVerified, setJustVerified] = useState(false);
  const [justSignedUp, setJustSignedUp] = useState(false);
  // Hide signup toggle if this is an invited user
  const [isInvite, setIsInvite] = useState<boolean>(() => {
    return searchParams.get('invite') === 'true' ||
      !!searchParams.get('token') ||
      !!searchParams.get('invitationToken') ||
      localStorage.getItem('isInvitedSession') === 'true';
  });

  // --- AUTO-FILL CREDENTIALS ---
  React.useEffect(() => {
    const email = searchParams.get('email') || (location.state as any)?.email;
    const password = searchParams.get('password') || (location.state as any)?.password;
    const verifiedFlag = searchParams.get('verified') === 'true';

    if (email || password) {
      setFormData(prev => ({
        ...prev,
        email: email || prev.email,
        password: password || prev.password
      }));
      if (verifiedFlag) setJustVerified(true);
      if (searchParams.get('signup') === 'success') setJustSignedUp(true);
    } else if (verifiedFlag) {
      setJustVerified(true);
    } else if (searchParams.get('signup') === 'success') {
      setJustSignedUp(true);
    }
  }, [searchParams, location.state]);

  React.useEffect(() => {
    if (searchParams.get('invite') === 'true' || !!searchParams.get('token') || !!searchParams.get('invitationToken')) {
      localStorage.setItem('isInvitedSession', 'true');
      setIsInvite(true);
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      if (user?.role?.toUpperCase() === 'SUPER_ADMIN') {
        navigate('/super-admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, isAuthLoading, navigate, user?.role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setOpenErrorSnackbar(true);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const user = await login(formData.email, formData.password);
      if (user?.role?.toUpperCase() === 'SUPER_ADMIN') {
        navigate('/super-admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // The error is already set in context by the login function, 
      // but we explicitly call it here just in case or for custom messages
      setError(err.message || 'Invalid ID or Password');
      setOpenErrorSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupRedirect = () => {
    navigate('/signup');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email: forgotEmail });
      setResetSent(true);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      // Still show success to avoid email enumeration attacks
      setResetSent(true);
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleCloseForgotModal = () => {
    setOpenForgotModal(false);
    setForgotEmail('');
    setResetSent(false);
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          marginTop: { xs: 4, sm: 8 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card sx={{ 
          width: '100%', 
          maxWidth: { xs: '100%', sm: 400 },
          borderRadius: { xs: 2, sm: 3 },
          boxShadow: { xs: 'none', sm: 3 },
          border: { xs: 'none', sm: '1px solid rgba(0,0,0,0.05)' }
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
              <img
                src="/logo.png"
                alt="BillSoft Logo"
                style={{ height: '50px', width: 'auto', marginRight: '16px' }}
              />
              <Typography component="h1" variant="h4" fontWeight="bold">
                BillSoft
              </Typography>
            </Box>

            <Typography component="h2" variant="h5" align="center" gutterBottom>
              Welcome Back
            </Typography>

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              Sign in to your account
            </Typography>

            {justVerified && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Account verified successfully! Your details are pre-filled below.
              </Alert>
            )}

            {justSignedUp && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <b>Registration alert!</b> Please check your mail with spam folder for the activation link.
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                type="email"
                value={formData.email}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Link
                  component="button"
                  variant="body2"
                  type="button"
                  onClick={() => setOpenForgotModal(true)}
                  sx={{ cursor: 'pointer' }}
                >
                  Forgot Password?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading}
                size="large"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              <Divider sx={{ my: 2 }} />

              {!isInvite && (
                <Box textAlign="center" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Don't have an Admin account?{' '}
                    <Link
                      component="button"
                      variant="body2"
                      type="button"
                      onClick={handleSignupRedirect}
                      sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Create one here
                    </Link>
                  </Typography>
                </Box>
              )}

              <Box textAlign="center" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Need help?{' '}
                  <Link
                    component="button"
                    variant="body2"
                    type="button"
                    onClick={() => navigate('/support')}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Contact Support
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={openForgotModal} onClose={handleCloseForgotModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }} component="div">
          <LockOutlined color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography component="div" variant="h5" fontWeight="bold">Forgot Password</Typography>
        </DialogTitle>
        <DialogContent>
          {!resetSent ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your email address and we'll send you a link to reset your password.
              </Typography>
              <Box component="form" onSubmit={handleForgotPassword}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoFocus
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3 }}
                  size="large"
                  disabled={isForgotLoading}
                >
                  {isForgotLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Reset link sent! Please check your email inbox.
              </Alert>
              <Button fullWidth variant="outlined" onClick={handleCloseForgotModal}>
                Back to Login
              </Button>
            </Box>
          )}
        </DialogContent>
        {!resetSent && (
          <DialogActions sx={{ pb: 3, px: 3 }}>
            <Button onClick={handleCloseForgotModal} color="inherit">Cancel</Button>
          </DialogActions>
        )}
      </Dialog>

      <Snackbar
        open={openErrorSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenErrorSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setOpenErrorSnackbar(false)} severity="error" sx={{ width: '100%' }} variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Login;

