import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS, TooltipRenderProps } from 'react-joyride';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { Box, Typography, Button, Paper, useTheme, useMediaQuery } from '@mui/material';

// Custom Premium Tooltip Component
const Tooltip = ({
    continuous,
    index,
    step,
    backProps,
    closeProps,
    primaryProps,
    skipProps,
    tooltipProps,
    isLastStep,
}: TooltipRenderProps) => (
    <Paper
        {...tooltipProps}
        elevation={0}
        sx={{
            backgroundColor: '#ffffff',
            borderRadius: '30px', // High-end curved display look
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
            borderTop: '5px solid #305cde', // Premium blue patti accent
            maxWidth: { xs: '280px', sm: 340 }, // Responsive width for mobile
            width: '100%',
            overflow: 'hidden',
            p: { xs: 2.5, sm: 3.5 }, // Surgical mobile padding adjustment
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative'
        }}
    >
        <Box sx={{ mb: 2.5 }}>
            <Typography
                variant="h6"
                sx={{
                    fontWeight: 800,
                    color: '#1a1a1a',
                    mb: 1.5,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' }, // Responsive font size
                    letterSpacing: '-0.02em'
                }}
            >
                {step.title || 'Dashboard Tour'}
            </Typography>
            <Typography
                variant="body2"
                sx={{
                    color: '#555',
                    lineHeight: 1.7,
                    fontSize: { xs: '0.85rem', sm: '0.95rem' }, // Responsive line height
                    fontWeight: 500
                }}
            >
                {step.content}
            </Typography>
        </Box>

        <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Button
                {...skipProps}
                sx={{
                    color: '#9E9E9E',
                    textTransform: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: 'transparent', color: '#666' }
                }}
            >
                Skip
            </Button>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
                {index > 0 && (
                    <Button
                        {...backProps}
                        sx={{
                            borderRadius: '18px', // Curved buttons
                            textTransform: 'none',
                            px: { xs: 1.5, sm: 2.5 },
                            py: 0.8,
                            color: '#666',
                            border: '1.5px solid #eee',
                            fontSize: '0.85rem',
                            fontWeight: 700
                        }}
                    >
                        Back
                    </Button>
                )}
                <Button
                    {...primaryProps}
                    variant="contained"
                    sx={{
                        borderRadius: '18px', // Curved buttons
                        textTransform: 'none',
                        px: { xs: 2.5, sm: 3.5 },
                        py: 0.8,
                        backgroundColor: '#305cde',
                        boxShadow: '0 4px 12px rgba(48, 92, 222, 0.25)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        '&:hover': { backgroundColor: '#254dbb' }
                    }}
                >
                    {isLastStep ? 'Finish' : 'Next'}
                </Button>
            </Box>
        </Box>
    </Paper>
);

const OnboardingTour: React.FC = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [run, setRun] = useState(false);

    useEffect(() => {
        if (user?.id) {
            const isTourDone = localStorage.getItem(`billsoft_tour_done_${user.id}`);
            
            // 🛡️ Prevent overlap with Address Verification Shield
            const isMissingAddress = !user.address || !user.city || !user.state || !user.pincode;
            const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'owner';
            const shouldWaitAddress = isAdmin && isMissingAddress;

            if (!isTourDone && !shouldWaitAddress) {
                setRun(true);
            } else {
                setRun(false);
            }
        }
    }, [user]);

    const steps: Step[] = [
        {
            target: isMobile ? '.tour-menu-toggle' : '.tour-sidebar',
            title: 'Explore Modules',
            content: 'Easily navigate through Bills, Customers, Inventory, and more from this menu.',
            placement: isMobile ? 'bottom' : 'right',
            disableBeacon: true,
        },
        {
            target: '.tour-metric-cards',
            title: 'Business Health',
            content: 'Real-time insight into your Profits, Expenses, and Revenue at a glance.',
            placement: 'bottom',
        },
        {
            target: '.tour-quick-actions',
            title: 'Save Time',
            content: 'Ready to start? Use these shortcuts to create bills or add new products instantly.',
            placement: 'left',
        },
        {
            target: '.tour-profile-icon',
            title: 'User Settings',
            content: 'Manage your profile preferences, company details, or log out securely.',
            placement: 'bottom',
        }
    ];

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);

            if (user?.id) {
                // Save status in LocalStorage permanently for this user
                localStorage.setItem(`billsoft_tour_done_${user.id}`, 'true');
            }
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous={true}
            showProgress={false}
            showSkipButton={true}
            callback={handleJoyrideCallback}
            tooltipComponent={Tooltip}
            disableScrolling={false} // Enable auto-scroll for mobile
            scrollOffset={120}       // Offset to keep header visible
            disableScrollParentFix={true}
            floaterProps={{
                disableAnimation: true, // Smoother positioning on mobile
            }}
            styles={{
                options: {
                    zIndex: 10000,
                    overlayColor: 'rgba(0, 0, 0, 0.72)',
                }
            }}
        />
    );
};

export default OnboardingTour;
