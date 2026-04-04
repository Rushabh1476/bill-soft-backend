/**
 * ViewerWelcome — Shown when an invited sub-user has no modules assigned.
 * A premium "empty state" that encourages them to contact their admin.
 */
import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import {
    AutoAwesome as SparkleIcon,
    LockOpen as LockOpenIcon,
    Email as EmailIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const FEATURES = [
    { icon: '🧾', title: 'Invoice Management', desc: 'Create and send professional invoices instantly' },
    { icon: '👥', title: 'Customer CRM', desc: 'Manage all your client relationships in one place' },
    { icon: '📦', title: 'Inventory Control', desc: 'Track stock levels and get low-stock alerts' },
    { icon: '📊', title: 'Business Reports', desc: 'Revenue analytics and GST-ready exports' },
];

const ViewerWelcome: React.FC = () => {
    const { user } = useAuth();

    const firstName = user?.name ? user.name.split(' ')[0] : 'there';
    const userEmail = user?.email || '';

    return (
        <Box
            sx={{
                minHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                px: 3,
                py: 6,
                background: 'transparent',
            }}
        >
            {/* Hero */}
            <Box sx={{ textAlign: 'center', mb: 6, maxWidth: 560 }}>
                {/* Animated logo badge */}
                <Box
                    sx={{
                        width: 96, height: 96, borderRadius: '28px', mx: 'auto', mb: 3,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 16px 48px rgba(99,102,241,.4)',
                        animation: 'float 3s ease-in-out infinite',
                        '@keyframes float': {
                            '0%, 100%': { transform: 'translateY(0)' },
                            '50%': { transform: 'translateY(-10px)' },
                        },
                    }}
                >
                    <SparkleIcon sx={{ color: 'white', fontSize: 48 }} />
                </Box>

                <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{
                        mb: 1,
                        background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: { xs: '1.8rem', sm: '2.5rem' }
                    }}
                >
                    Welcome to BillSoft, {firstName}! 👋
                </Typography>

                <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ lineHeight: 1.6 }}>
                    You're now part of the team. Your admin is setting up your workspace —
                    hang tight while modules get assigned to you.
                </Typography>
            </Box>

            {/* Feature preview cards */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                    gap: 2,
                    maxWidth: 820,
                    width: '100%',
                    mb: 6,
                }}
            >
                {FEATURES.map((f) => (
                    <Paper
                        key={f.title}
                        elevation={0}
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            textAlign: 'center',
                            border: '1px solid',
                            borderColor: 'divider',
                            opacity: 0.55,
                            filter: 'grayscale(40%)',
                            cursor: 'not-allowed',
                            transition: 'all .2s',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::after': {
                                content: '"🔒"',
                                position: 'absolute',
                                top: 8, right: 10,
                                fontSize: '12px',
                            },
                            '&:hover': { opacity: 0.7, filter: 'grayscale(20%)' },
                        }}
                    >
                        <Typography fontSize="2rem" mb={1}>{f.icon}</Typography>
                        <Typography variant="body2" fontWeight={600} gutterBottom>{f.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{f.desc}</Typography>
                    </Paper>
                ))}
            </Box>

            {/* Call to action */}
            <Paper
                elevation={0}
                sx={{
                    p: 3, borderRadius: 3, maxWidth: 480, width: '100%', textAlign: 'center',
                    border: '2px dashed',
                    borderColor: 'primary.light',
                    backgroundColor: (theme: any) => theme.palette.mode === 'dark'
                        ? 'rgba(99,102,241,.08)'
                        : 'rgba(99,102,241,.04)',
                }}
            >
                <LockOpenIcon sx={{ color: 'primary.main', fontSize: 36, mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    Waiting for permissions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Your admin hasn't assigned any modules to your account yet.
                    Once they grant access, this page will automatically update — no refresh needed!
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<EmailIcon />}
                    href={`mailto:?subject=BillSoft Access Request&body=Hi Admin, please assign modules to my BillSoft account (${userEmail}).`}
                    sx={{ borderRadius: 2 }}
                >
                    Request Access
                </Button>
            </Paper>
        </Box>
    );
};

export default ViewerWelcome;
