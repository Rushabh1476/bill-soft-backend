import React from 'react';
import { Box, CircularProgress, Typography, keyframes } from '@mui/material';
import { Receipt as ReceiptIcon } from '@mui/icons-material';

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

interface PremiumLoaderProps {
    message?: string;
    fullScreen?: boolean;
}

const PremiumLoader: React.FC<PremiumLoaderProps> = ({
    message = 'Loading...',
    fullScreen = false
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: fullScreen ? '100vh' : '400px',
                bgcolor: fullScreen ? 'background.default' : 'transparent',
                gap: 3,
            }}
        >
            {/* Animated Logo */}
            <Box
                sx={{
                    position: 'relative',
                    width: 80,
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: `${pulse} 2s ease-in-out infinite`,
                }}
            >
                {/* Background Circle */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        bgcolor: 'primary.lighter',
                        opacity: 0.2,
                    }}
                />

                {/* Icon */}
                <ReceiptIcon
                    sx={{
                        fontSize: 40,
                        color: 'primary.main',
                        zIndex: 1,
                    }}
                />

                {/* Spinning Border */}
                <CircularProgress
                    size={80}
                    thickness={2}
                    sx={{
                        position: 'absolute',
                        color: 'primary.main',
                        opacity: 0.3,
                    }}
                />
            </Box>

            {/* Loading Text */}
            <Box
                sx={{
                    textAlign: 'center',
                    animation: `${fadeIn} 0.5s ease-out`,
                }}
            >
                <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="primary.main"
                    gutterBottom
                >
                    BillSoft
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    {message}
                </Typography>
            </Box>

            {/* Progress Dots */}
            <Box sx={{ display: 'flex', gap: 1 }}>
                {[0, 1, 2].map((i) => (
                    <Box
                        key={i}
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            animation: `${pulse} 1.5s ease-in-out infinite`,
                            animationDelay: `${i * 0.2}s`,
                        }}
                    />
                ))}
            </Box>
        </Box>
    );
};

export default PremiumLoader;
