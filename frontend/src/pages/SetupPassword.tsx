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
    CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, Business, LockOpen } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { validatePassword } from '../utils/validatePassword';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { API_URL } from '../config/api';

const setupSchema = z.object({
    password: z.string().superRefine((val, ctx) => {
        const result = validatePassword(val);
        if (!result.valid) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: result.error,
            });
        }
    }),
    confirmPassword: z.string()
        .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type SetupFormData = z.infer<typeof setupSchema>;

const SetupPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Additional states specifically for Setup Password validation
    const [serverError, setServerError] = useState('');
    const [success, setSuccess] = useState(false);
    const [validating, setValidating] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [tokenError, setTokenError] = useState('');

    const token = searchParams.get('token');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isValid },
    } = useForm<SetupFormData>({
        resolver: zodResolver(setupSchema),
        mode: 'onChange',
    });

    useEffect(() => {
        if (!token) {
            setTokenError('No invitation token found. Please check your email link.');
            setValidating(false);
            return;
        }
        axios.get(`${API_URL}/admin/invite/validate?token=${token}`)
            .then(res => {
                if (res.data.valid) {
                    setTokenValid(true);
                    setUserEmail(res.data.email || '');
                    // Persist invitation context to disable signup features globally for this user
                    localStorage.setItem('isInvitedSession', 'true');
                } else {
                    setTokenError(res.data.error || 'Invalid invitation link');
                }
            })
            .catch(err => {
                const msg = err.response?.data?.error || 'Link Expired or Server Moved. The invitation is no longer valid or the server IP has changed.';
                setTokenError(msg);
            })
            .finally(() => setValidating(false));
    }, [token]);

    const onSubmit = async (data: SetupFormData) => {
        setServerError('');
        if (!token) {
            setServerError('Invalid or missing invitation token.');
            return;
        }
        try {
            await axios.post(`${API_URL}/admin/invite/setup-password`, {
                token,
                password: data.password,
            });
            setSuccess(true);
            setTimeout(() => navigate('/login?invite=true'), 3000);
        } catch (err: any) {
            setServerError(err.response?.data?.error || 'Failed to set password. Please try again.');
        }
    };

    if (validating) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
                <Box textAlign="center">
                    <CircularProgress size={48} />
                    <Typography sx={{ mt: 2, color: 'text.secondary' }}>Validating invitation...</Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Container component="main" maxWidth="sm">
            <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Card sx={{ width: '100%', maxWidth: 400 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
                            <Business color="primary" sx={{ fontSize: 40, mr: 2 }} />
                            <Typography component="h1" variant="h4" fontWeight="bold">BillSoft</Typography>
                        </Box>

                        <Typography component="h2" variant="h5" align="center" gutterBottom>
                            {success ? 'Account Activated!' : 'Set Your Password'}
                        </Typography>

                        {!success && (
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                                Activate your account for <strong>{userEmail}</strong>
                            </Typography>
                        )}

                        {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
                        {!tokenValid && <Alert severity="error" sx={{ mb: 2 }}>{tokenError}</Alert>}

                        {success ? (
                            <Box sx={{ textAlign: 'center' }}>
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    Password set successfully! Redirecting to login...
                                </Alert>
                                <Button variant="contained" onClick={() => navigate('/login?invite=true')} fullWidth>
                                    Go to Login Now
                                </Button>
                            </Box>
                        ) : (
                            tokenValid && (
                                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                                    <TextField
                                        margin="normal"
                                        fullWidth
                                        label="Login ID (Email)"
                                        value={userEmail}
                                        disabled
                                        sx={{
                                            mb: 1,
                                            '& .MuiInputBase-input.Mui-disabled': {
                                                WebkitTextFillColor: '#475569',
                                                bgcolor: '#f8fafc'
                                            }
                                        }}
                                    />

                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        label="New Password"
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        {...register('password')}
                                        error={!!errors.password}
                                        helperText={errors.password?.message || 'Max 16 characters'}
                                        inputProps={{ maxLength: 16 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start"><LockOpen /></InputAdornment>
                                            ),
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
                                        id="confirmPassword"
                                        {...register('confirmPassword')}
                                        error={!!errors.confirmPassword}
                                        helperText={errors.confirmPassword?.message || 'Max 16 characters'}
                                        inputProps={{ maxLength: 16 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start"><LockOpen /></InputAdornment>
                                            ),
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
                                        disabled={isSubmitting || !isValid}
                                        size="large"
                                    >
                                        {isSubmitting ? 'Activating...' : 'Activate Account'}
                                    </Button>

                                    {!success && (
                                        <Typography variant="caption" color="text.secondary" align="center" display="block">
                                            This invitation link will expire in 48 hours.
                                        </Typography>
                                    )}
                                </Box>
                            )
                        )}
                        {!tokenValid && (
                            <Button variant="outlined" onClick={() => navigate('/login')} fullWidth sx={{ mt: 2 }}>
                                Back to Login
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default SetupPassword;
