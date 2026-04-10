import React from 'react';
import { Box, Typography, keyframes, alpha, useTheme } from '@mui/material';

// --- Animations ---
const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.95; }
  50% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.4)); }
  100% { transform: scale(1); opacity: 0.95; }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const rotateClockwise = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const rotateCounterClockwise = keyframes`
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const dotLoading = keyframes`
  0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
`;

/**
 * Premium Full Page Loading Screen
 * Used for initial app load or major transitions
 */
export const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Initializing your business intelligence...' }) => {
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
        zIndex: 99999, // Ensure it's above everything
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle at center, rgba(30, 64, 175, 0.15) 0%, transparent 60%)',
          animation: `${rotateClockwise} 30s linear infinite`,
        }
      }}
    >
      <Box sx={{ position: 'relative', mb: 4, zIndex: 2 }}>
        {/* Outer Decorative Ring */}
        <Box
          sx={{
            position: 'absolute',
            top: -30,
            left: -30,
            right: -30,
            bottom: -30,
            border: '1px solid rgba(255, 215, 0, 0.1)',
            borderRadius: '50%',
            animation: `${rotateClockwise} 10s linear infinite`,
          }}
        />
        
        {/* Middle Progress Ring */}
        <Box
          sx={{
            position: 'absolute',
            top: -15,
            left: -15,
            right: -15,
            bottom: -15,
            border: '2px solid transparent',
            borderTop: '2px solid rgba(255, 215, 0, 0.6)',
            borderRight: '2px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '50%',
            animation: `${rotateCounterClockwise} 3s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
          }}
        />

        {/* Logo Container */}
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            p: 1.5,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            position: 'relative',
            animation: `${pulse} 3s infinite ease-in-out`,
          }}
        >
          <img 
            src="/Bill (1).svg" 
            alt="BillSoft Logo" 
            style={{ width: '80%', height: 'auto', objectFit: 'contain' }} 
          />
        </Box>
      </Box>

      {/* Brand Text */}
      <Box sx={{ textAlign: 'center', zIndex: 2 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 900,
            letterSpacing: 6,
            textTransform: 'uppercase',
            background: 'linear-gradient(to right, #ffffff 20%, #FFD700 40%, #ffffff 60%, #FFD700 80%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: `${shimmer} 4s linear infinite`,
            fontSize: { xs: '2rem', md: '3rem' }
          }}
        >
          BillSoft
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1, gap: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: 500,
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontSize: '0.75rem'
            }}
          >
            {message}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[0, 0.2, 0.4].map((delay) => (
              <Box
                key={delay}
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  bgcolor: '#FFD700',
                  animation: `${dotLoading} 1.4s infinite ease-in-out`,
                  animationDelay: `${delay}s`
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Background Decorative Circles */}
      <Box sx={{ position: 'absolute', top: '10%', left: '10%', width: 300, height: 300, borderRadius: '50%', filter: 'blur(80px)', bgcolor: 'rgba(30, 58, 138, 0.1)', zIndex: 1 }} />
      <Box sx={{ position: 'absolute', bottom: '15%', right: '15%', width: 250, height: 250, borderRadius: '50%', filter: 'blur(60px)', bgcolor: 'rgba(126, 34, 206, 0.05)', zIndex: 1 }} />
    </Box>
  );
};

/**
 * Premium Section Loader
 * Perfect for inside already loaded layouts (Suspense fallbacks)
 */
export const SectionLoader: React.FC<{ message?: string; transparent?: boolean }> = ({ 
  message = 'Processing your data...', 
  transparent = true 
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
        background: transparent ? 'transparent' : alpha(theme.palette.background.paper, 0.8),
        backdropFilter: transparent ? 'none' : 'blur(10px)',
        position: 'relative',
        transition: 'all 0.3s ease',
      }}
    >
      <Box sx={{ position: 'relative', width: 90, height: 90, mb: 3 }}>
        {/* Outer Geometric Ring */}
        <Box
          sx={{
            position: 'absolute',
            inset: -8,
            border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
            borderRadius: '40%',
            animation: `${rotateClockwise} 8s linear infinite`,
          }}
        />
        
        {/* Animated Accent Ring */}
        <Box
          sx={{
            position: 'absolute',
            inset: -4,
            border: '2px solid transparent',
            borderTop: `2px solid ${theme.palette.primary.main}`,
            borderBottom: `2px solid ${theme.palette.secondary.main}`,
            borderRadius: '50%',
            animation: `${rotateCounterClockwise} 2s cubic-bezier(0.5, 0, 0.5, 1) infinite`,
            opacity: 0.7,
          }}
        />

        {/* Core Container */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            p: 1,
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme.shadows[10],
            animation: `${float} 3s ease-in-out infinite`,
            zIndex: 2,
          }}
        >
          <img src="/Bill (1).svg" alt="Logo" style={{ width: '70%', height: 'auto' }} />
        </Box>
      </Box>
      
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="body2"
          sx={{
            color: 'text.primary',
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase',
            opacity: 0.9,
            mb: 0.5
          }}
        >
          {message}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
          {[0, 0.1, 0.2].map((delay) => (
            <Box
              key={delay}
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                bgcolor: theme.palette.primary.main,
                animation: `${dotLoading} 1s infinite ease-in-out`,
                animationDelay: `${delay}s`,
                opacity: 0.6
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default LoadingScreen;
