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
} from '@mui/material';
import { Visibility, VisibilityOff, Business, Email, Person } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Note: login hook yahan sirf handleLoginRedirect ke liye rakha hai agar chahiye ho
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          companyName: formData.company 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }
      
      // ============================================================
      // 🔥 CHANGE: Auto-login hata diya hai. 
      // Ab success ke baad user direct Login page par jayega.
      // ============================================================
      alert('Account created successfully! Please login to continue.');
      navigate('/login');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Card sx={{ width: '100%', maxWidth: 500 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
              <Business color="primary" sx={{ fontSize: 40, mr: 2 }} />
              <Typography component="h1" variant="h4" fontWeight="bold">BillSoft</Typography>
            </Box>
            
            <Typography component="h2" variant="h5" align="center" gutterBottom>Create Your Account</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField margin="normal" required fullWidth label="Full Name" name="name" value={formData.name} onChange={handleChange} />
              <TextField margin="normal" fullWidth label="Company Name" name="company" value={formData.company} onChange={handleChange} />
              <TextField margin="normal" required fullWidth label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} />
              <TextField margin="normal" required fullWidth name="password" label="Password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField margin="normal" required fullWidth name="confirmPassword" label="Confirm Password" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isLoading} size="large">
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
              <Box textAlign="center">
                <Typography variant="body2">
                  Already have an account? <Link component="button" onClick={handleLoginRedirect}>Sign in here</Link>
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