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
    IconButton,
    InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff, LockOpen } from '@mui/icons-material';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { validatePassword } from '../utils/validatePassword';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { API_URL } from '../config/api';

// Uses our central validation helper to match Organization settings
const resetSchema = z.object({
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

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [serverError, setServerError] = useState('');
    const [success, setSuccess] = useState(false);
    type ResetFormData = z.infer<typeof resetSchema>;


    const { token: pathToken } = useParams();
    const token = pathToken || searchParams.get('token');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isValid },
    } = useForm<ResetFormData>({
        resolver: zodResolver(resetSchema),
        mode: 'onChange',
    });


    const onSubmit = async (data: ResetFormData) => {
        setServerError('');

        if (data.password !== data.confirmPassword) {
            setServerError('Passwords do not match');
            return;
        }

        if (data.password.length < 6) {
            setServerError('Password must be at least 6 characters long');
            return;
        }


        try {
            await axios.post(`${API_URL}/auth/reset-password`, {
                token,
                password: data.password
            });

            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            console.error('Reset password error:', err);
            const backendError = err.response?.data?.error || err.response?.data?.detail || err.response?.data?.message;
            setServerError(backendError || 'Failed to reset password. The link may have expired.');
        }
    };

    return (
        <Container component="main" maxWidth="sm">
            <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Card sx={{ width: '100%', maxWidth: 400 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
                            <img
                                src="/Bill (1).svg"
                                alt="BillSoft Logo"
                                style={{ height: '50px', width: 'auto', marginRight: '16px' }}
                            />
                            <Typography component="h1" variant="h4" fontWeight="bold">BillSoft</Typography>
                        </Box>

                        <Typography component="h2" variant="h5" align="center" gutterBottom>
                            Reset Password
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                            Enter your new password below
                        </Typography>

                        {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

                        {success ? (
                            <Box sx={{ textAlign: 'center' }}>
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    Password reset successfully! Redirecting to login...
                                </Alert>
                                <Button variant="contained" onClick={() => navigate('/login')} fullWidth>
                                    Go to Login Now
                                </Button>
                            </Box>
                        ) : (
                            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
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
                                    disabled={isSubmitting || !isValid || success}
                                    size="large"
                                    color={success ? 'success' : 'primary'}
                                >
                                    {isSubmitting ? 'Resetting...' : (success ? 'Updated!' : 'Update Password')}
                                </Button>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default ResetPassword;
