import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Container, 
  Typography, 
  CircularProgress, 
  Button, 
  Alert,
  Card,
  CardContent
} from '@mui/material';
import { CheckCircleOutline, ErrorOutline } from '@mui/icons-material';
import { API_URL } from '../config/api';

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your account...');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Missing verification token.');
        return;
      }

      try {
        const response = await axios.post(`${API_URL}/auth/verify-signup`, { token });
        setStatus('success');
        setMessage(response.data.message || 'Account verified successfully!');
        
        // Auto redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login?verified=true');
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        const errorMsg = err.response?.data?.error || 'Verification failed. The link may have expired or is invalid.';
        setMessage(errorMsg);
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Card sx={{ width: '100%', textAlign: 'center', p: 2, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <img src="/logo.png" alt="BillSoft" style={{ height: 60 }} />
            </Box>

            {status === 'loading' && (
              <>
                <CircularProgress size={60} sx={{ mb: 3 }} />
                <Typography variant="h5" gutterBottom>Verifying Account</Typography>
                <Typography color="text.secondary">{message}</Typography>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircleOutline sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h4" gutterBottom fontWeight="bold">Success!</Typography>
                <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Your account is now active. Redirecting you to login...
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth 
                  onClick={() => navigate('/login')}
                  size="large"
                >
                  Go to Login
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <ErrorOutline sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom fontWeight="bold">Verification Failed</Typography>
                <Alert severity="error" sx={{ mb: 3 }}>{message}</Alert>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Please try signing up again or contact support if the problem persists.
                </Typography>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  onClick={() => navigate('/signup')}
                  size="large"
                >
                  Back to Signup
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default VerifyEmail;
