import React from 'react';
import { Box, Chip, Typography, Tooltip, useTheme } from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  AccountTree as ManagerIcon,
  Person as StaffIcon,
  Visibility as ViewerIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface RoleIndicatorProps {
  showDescription?: boolean;
  size?: 'small' | 'medium';
}

const RoleIndicator: React.FC<RoleIndicatorProps> = ({
  showDescription = false,
  size = 'small'
}) => {
  const { user } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();

  if (!user) return null;

  const roleConfig = {
    ADMIN: {
      icon: <AdminIcon fontSize="small" />,
      color: 'error' as const,
      label: 'Admin',
      description: 'Full system access — tap to open Admin Panel'
    },
    MANAGER: {
      icon: <ManagerIcon fontSize="small" />,
      color: 'warning' as const,
      label: 'Manager',
      description: 'Business operations access — tap to open Admin Panel'
    },
    ACCOUNTANT: {
      icon: <StaffIcon fontSize="small" />,
      color: 'info' as const,
      label: 'Accountant',
      description: 'Billing operations access — tap to open Admin Panel'
    },
    VIEWER: {
      icon: <ViewerIcon fontSize="small" />,
      color: 'default' as const,
      label: 'Viewer',
      description: 'Read-only access — tap to open Admin Panel'
    }
  };

  const roleKey = (user.role || 'VIEWER').toString().toUpperCase();
  const currentRole = (roleConfig as any)[roleKey] || roleConfig.VIEWER;

  // Visual logic for light/dark visibility
  const isLight = theme.palette.mode === 'light';

  // Choose a solid background and text color based on role
  const getRoleStyles = () => {
    if (currentRole.color === 'default') {
      return {
        bgcolor: isLight ? 'action.hover' : 'rgba(255, 255, 255, 0.05)',
        color: 'text.secondary',
        border: '1px solid',
        borderColor: 'divider'
      };
    }

    // For ADMIN, MANAGER, ACCOUNTANT: Solid meaningful colors
    return {
      bgcolor: isLight
        ? (currentRole.color === 'error' ? '#FEF2F2' : currentRole.color === 'warning' ? '#FFFBEB' : '#EFF6FF')
        : `rgba(${currentRole.color === 'error' ? '239, 68, 68' : currentRole.color === 'warning' ? '245, 158, 11' : '48, 92, 222'}, 0.15)`,
      color: isLight
        ? (currentRole.color === 'error' ? '#B91C1C' : currentRole.color === 'warning' ? '#92400E' : '#1E40AF')
        : `${currentRole.color}.main`,
      border: '1px solid',
      borderColor: isLight
        ? (currentRole.color === 'error' ? '#FCA5A5' : currentRole.color === 'warning' ? '#FCD34D' : '#93C5FD')
        : 'transparent'
    };
  };

  const styles = getRoleStyles();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={currentRole.description}>
        <Chip
          icon={React.cloneElement(currentRole.icon as React.ReactElement, {
            sx: { color: 'inherit !important' }
          })}
          label={currentRole.label}
          size={size}
          onClick={() => navigate('/admin')}
          sx={{
            height: 24,
            fontSize: { xs: '0.65rem', sm: '0.75rem' },
            fontWeight: 700,
            cursor: 'pointer',
            bgcolor: styles.bgcolor,
            color: styles.color,
            border: styles.border,
            borderColor: styles.borderColor,
            '& .MuiChip-label': {
              px: { xs: 0.5, sm: 1 },
            },
            '& .MuiChip-icon': {
              fontSize: { xs: '0.75rem', sm: '1rem' },
              color: 'inherit',
              mr: { xs: -0.25, sm: 0.5 },
              ml: { xs: 0.25, sm: 0.5 },
              display: { xs: 'none', tiny: 'none', xsm: 'inline-block', sm: 'inline-block' } // Hide icon on extra small
            },
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
              borderColor: 'transparent',
              opacity: 1
            }
          }}
        />
      </Tooltip>
      {showDescription && (
        <Typography variant="caption" color="text.secondary">
          {currentRole.description}
        </Typography>
      )}
    </Box>
  );
};

export default RoleIndicator;
