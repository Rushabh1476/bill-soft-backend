import React from 'react';
import { Box, Typography, keyframes, alpha } from '@mui/material';

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.9; }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const spinCustom = keyframes`
  0% { transform: rotate(0deg); stroke-dashoffset: 280; }
  50% { transform: rotate(180deg); stroke-dashoffset: 75; }
  100% { transform: rotate(360deg); stroke-dashoffset: 280; }
`;

const dotPulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.2); opacity: 1; }
`;

/**
 * Premium Full Page Loading Screen
 * Best used for initial app load or major state transitions
 */
export const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Powering Business Intelligence' }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        background: 'radial-gradient(circle at center, rgba(0, 35, 102, 0.98) 0%, rgba(0, 10, 40, 1) 100%)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Box sx={{ position: 'relative', mb: 5 }}>
        {/* Core Logo Container */}
        <Box
          sx={{
            width: 140,
            height: 140,
            borderRadius: '50%',
            p: 0.5,
            background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 50%, #FFD700 100%)',
            boxShadow: '0 0 50px rgba(255, 215, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `${pulse} 3s infinite ease-in-out`,
            zIndex: 2,
            position: 'relative'
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              bgcolor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)'
            }}
          >
            <img 
              src="/logo.png" 
              alt="BillSoft Logo" 
              style={{ width: '80%', height: 'auto', objectFit: 'contain' }} 
            />
          </Box>
        </Box>
        
        {/* Orbital Spinner */}
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            left: -20,
            right: -20,
            bottom: -20,
            zIndex: 1
          }}
        >
          <svg width="180" height="180" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="#FFD700"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="280"
              style={{
                animation: `${spinCustom} 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
                transformOrigin: 'center'
              }}
            />
          </svg>
        </Box>
      </Box>

      {/* Brand & Status */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: '800',
            letterSpacing: 8,
            textTransform: 'uppercase',
            background: 'linear-gradient(90deg, #FFD700, #FFFACD, #B8860B, #FFD700)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: `${shimmer} 4s linear infinite`,
            mb: 1
          }}
        >
          BillSoft
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: alpha('#FFD700', 0.6),
            letterSpacing: 4,
            fontWeight: 500,
            textTransform: 'uppercase'
          }}
        >
          {message}
        </Typography>
      </Box>

      {/* Loading Progress Dots */}
      <Box sx={{ mt: 5, display: 'flex', gap: 1.5 }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <Box
            key={i}
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: '#FFD700',
              boxShadow: '0 0 10px rgba(255,215,0,0.3)',
              animation: `${dotPulse} 1s infinite ease-in-out`,
              animationDelay: `${delay}s`
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

/**
 * Smaller Section Loader
 * Perfect for Suspense fallbacks inside already loaded layouts
 */
export const SectionLoader: React.FC<{ message?: string }> = ({ message = 'Loading Content...' }) => {
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        minHeight: '400px',
        bgcolor: 'transparent'
      }}
    >
      <Box sx={{ position: 'relative', width: 80, height: 80, mb: 3 }}>
        {/* Simplified Gold Circle for Section Loader */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            p: 0.3,
            background: 'linear-gradient(135deg, #FFD700, #B8860B)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)',
            animation: `${pulse} 2s infinite ease-in-out`
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              bgcolor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            <img src="/logo.png" alt="Logo" style={{ width: '75%', height: 'auto' }} />
          </Box>
        </Box>
        
        {/* Animated Single Ring for Section Loader */}
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            left: -10,
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: '2px solid rgba(0, 35, 102, 0.1)',
            borderTopColor: '#FFD700',
            animation: `${spinCustom} 1.5s linear infinite`
          }}
        />
      </Box>
      
      <Typography
        variant="body2"
        sx={{
          color: 'primary.main',
          fontWeight: 'bold',
          letterSpacing: 2,
          textTransform: 'uppercase',
          opacity: 0.7
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
