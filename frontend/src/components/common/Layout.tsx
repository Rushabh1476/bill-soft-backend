/* eslint-disable */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Settings,
  Logout,
  Person,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import Sidebar from './Sidebar';
import RoleIndicator from './RoleIndicator';
// import BranchSwitcher from './BranchSwitcher';
import NotificationCenter from './NotificationCenter';
import MobileBottomNav from './MobileBottomNav';
import OnboardingTour from './OnboardingTour';
import { AddressVerificationShield } from './AddressVerificationShield';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingScreen } from './LoadingScreen';
import { API_URL } from '../../config/api';
import useRoleBasedAccess from '../../hooks/useRoleBasedAccess';
import { useCustomers } from '../../hooks/useCustomers';
import { useProducts } from '../../hooks/useProducts';
import axios from 'axios';

// Preloads customers & products into shared context as soon as user is logged in
const DataPreloader: React.FC = () => {
  const { refetch: refetchCustomers, customers } = useCustomers();
  const { refetch: refetchProducts, products } = useProducts();
  React.useEffect(() => {
    // Only fetch if not already loaded
    if (customers.length === 0) refetchCustomers();
    if (products.length === 0) refetchProducts();
  }, []);
  return null;
};


interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const permissions = useRoleBasedAccess();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);

  // 🔒 App Lock Logic
  const [isLocked, setIsLocked] = useState(() => {
    const enabled = localStorage.getItem('appLockEnabled') === 'true';
    const unlocked = sessionStorage.getItem('appUnlocked') === 'true';
    return enabled && !unlocked;
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Forgot PIN Logic
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [isSettingNewPin, setIsSettingNewPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUnlock = async () => {
    const savedPin = localStorage.getItem('appLockPin') || '1234';
    if (pinInput === savedPin) {
      sessionStorage.setItem('appUnlocked', 'true');
      setIsLocked(false);
      setPinError(false);
      setPinInput('');
      localStorage.setItem('appLockEnabled', 'false');

      try {
        const response = await axios.get(`${API_URL}/admin/settings`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (response.data.success && response.data.flatData) {
          const flatMap: Record<string, any> = {};
          response.data.flatData.forEach((s: any) => { flatMap[s.key] = s.value; });
          const updatedSettings = { ...flatMap, app_lock_enabled: false };
          await axios.put(`${API_URL}/admin/settings`, updatedSettings, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json'
            }
          });
        }
      } catch (err) {
        console.error('Failed to persistently disable app lock:', err);
      }
      window.dispatchEvent(new Event('storage'));
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleVerifyPassword = async () => {
    if (!passwordInput) return;
    setIsProcessing(true);
    setPasswordError(false);
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: user?.email,
        password: passwordInput
      });
      setIsVerifyingPassword(false);
      setIsSettingNewPin(true);
      setPasswordInput('');
    } catch (err) {
      setPasswordError(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPin = async () => {
    if (!newPinInput || newPinInput.length < 4) return;
    setIsProcessing(true);
    try {
      localStorage.setItem('appLockPin', newPinInput);
      const response = await axios.get(`${API_URL}/admin/settings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (response.data.success && response.data.flatData) {
        const flatMap: Record<string, any> = {};
        response.data.flatData.forEach((s: any) => { flatMap[s.key] = s.value; });
        const updatedSettings = { ...flatMap, app_lock_pin: newPinInput, app_lock_enabled: false };
        await axios.put(`${API_URL}/admin/settings`, updatedSettings, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });
      }
      sessionStorage.setItem('appUnlocked', 'true');
      localStorage.setItem('appLockEnabled', 'false');
      setIsLocked(false);
      setIsSettingNewPin(false);
      setNewPinInput('');
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Failed to reset PIN:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  React.useEffect(() => {
    const checkLockStatus = () => {
      const enabled = localStorage.getItem('appLockEnabled') === 'true';
      const unlocked = sessionStorage.getItem('appUnlocked') === 'true';
      setIsLocked(enabled && !unlocked);
    };
    window.addEventListener('storage', checkLockStatus);
    window.addEventListener('app-lock-changed', checkLockStatus);
    checkLockStatus();
    return () => {
      window.removeEventListener('storage', checkLockStatus);
      window.removeEventListener('app-lock-changed', checkLockStatus);
    };
  }, []);

  React.useEffect(() => {
    if (!isLoading && !user) {
      const isInvited = localStorage.getItem('isInvitedSession') === 'true';
      navigate(isInvited ? '/login' : '/signup');
    }
  }, [user, isLoading, navigate]);

  if (isLoading || (!user)) {
    return <LoadingScreen message="Initializing session..." />;
  }

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleMobileDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  const handleNavigateToProfile = () => {
    navigate('/profile');
    handleProfileMenuClose();
  };

  const handleNavigateToUserSettings = () => {
    navigate('/settings');
    handleProfileMenuClose();
  };

  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      bgcolor: 'background.default',
      '@media print': { display: 'none !important' }
    }}>
      {/* 🛑 Address Verification Gate for Admins */}
      <AddressVerificationShield />

      {/* Preload customers & products once when user logs in */}
      <DataPreloader />

      {/* Interactive Tour */}
      <OnboardingTour />

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        mobileOpen={mobileDrawerOpen}
        onMobileToggle={handleMobileDrawerToggle}
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0, minHeight: '100vh' }}>
        <AppBar
          position="sticky"
          sx={{
            zIndex: theme.zIndex.drawer - 1,
            backgroundColor: 'transparent',
            color: 'text.primary',
            boxShadow: 'none',
            borderBottom: 'none',
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton
                className="tour-menu-toggle"
                color="inherit"
                edge="start"
                aria-label="Toggle navigation menu"
                onClick={handleMobileDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 'bold',
                  color: 'primary.main',
                  fontSize: { xs: '1.0rem', sm: '1.10rem' },
                  display: { xs: isMobile ? 'none' : 'block', sm: 'block' }
                }}
              >
                BillSoft
              </Typography>
              {isMobile && (
                <Typography variant="h6" sx={{
                  flexGrow: 1,
                  fontWeight: 'bold',
                  color: 'primary.main',
                  fontSize: '1rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  BillSoft
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 }, ml: 'auto' }}>
              <NotificationCenter />
              <RoleIndicator size="small" />
              <Chip
                label={isMobile ? (user?.plan?.split(' ')[0] || "Basic") : (user?.plan || "Basic Plan")}
                size="small"
                sx={{
                  height: 22,
                  fontSize: { xs: '0.6rem', sm: '0.75rem' },
                  fontWeight: 700,
                  cursor: 'pointer',
                  '& .MuiChip-label': { px: { xs: 0.5, sm: 1 } },
                  minWidth: { xs: 'auto', sm: 70 }
                }}
              />

              <IconButton className="tour-profile-icon" onClick={handleProfileMenuOpen} sx={{ p: 0.25 }}>
                <Avatar
                  src={user?.avatar ? `${API_URL.replace('/api', '')}${user.avatar}` : (user?.logoUrl || undefined)}
                  sx={{
                    width: { xs: 28, sm: 35 },
                    height: { xs: 28, sm: 35 },
                    bgcolor: theme.palette.primary.main,
                    fontSize: { xs: '0.75rem', sm: '1rem' },
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Box>
          </Toolbar>
          {/* Subtle Glassmorphism Divider Strip */}
          <Box
            sx={{
              height: '3px',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(8px)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.03)',
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />
        </AppBar>



        <Menu
          anchorEl={profileMenuAnchor}
          open={Boolean(profileMenuAnchor)}
          onClose={handleProfileMenuClose}
          onClick={handleProfileMenuClose}
          PaperProps={{ elevation: 3, sx: { overflow: 'visible', mt: 1.5, minWidth: 200 } }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" fontWeight="bold">{user?.name || 'Admin User'}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email || 'admin@admin.com'}</Typography>
          </Box>
          <MenuItem onClick={handleNavigateToProfile}>
            <ListItemIcon><Person fontSize="small" /></ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleNavigateToUserSettings}>
            <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
            <ListItemText>User Settings</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>

        <Box component="main" role="main" sx={{ flexGrow: 1, backgroundColor: theme.palette.background.default, overflow: 'auto', pb: isMobile ? 7 : 0 }}>
          <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, width: '100%', pb: isMobile ? 8 : 1 }}>{children}</Box>
        </Box>
        {isMobile && <MobileBottomNav />}
      </Box>

      {/* 🔒 App Lock Overlay */}
      <Dialog open={isLocked} fullScreen={isMobile} disableEscapeKeyDown PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4, p: 2, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' } }} sx={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, py: 4 }}>
          {isVerifyingPassword ? (
            <>
              <Avatar sx={{ width: 64, height: 64, bgcolor: 'secondary.main', mb: 1 }}><Person fontSize="large" /></Avatar>
              <Box><Typography variant="h5" fontWeight="bold" gutterBottom>Verify Account</Typography></Box>
              <TextField autoFocus type="password" label="Account Password" variant="outlined" fullWidth value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleVerifyPassword()} error={passwordError} helperText={passwordError ? 'Incorrect password' : ''} disabled={isProcessing} />
              <Button variant="contained" fullWidth size="large" onClick={handleVerifyPassword} disabled={isProcessing || !passwordInput} sx={{ borderRadius: 2 }}>{isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Verify Password'}</Button>
              <Button variant="text" color="inherit" onClick={() => setIsVerifyingPassword(false)} disabled={isProcessing}>Cancel</Button>
            </>
          ) : isSettingNewPin ? (
            <>
              <Avatar sx={{ width: 64, height: 64, bgcolor: 'success.main', mb: 1 }}><CheckCircleIcon fontSize="large" /></Avatar>
              <Box><Typography variant="h5" fontWeight="bold" gutterBottom>Set New PIN</Typography></Box>
              <TextField autoFocus type="password" label="New PIN" variant="outlined" fullWidth value={newPinInput} onChange={(e) => setNewPinInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleResetPin()} placeholder="4-6 Digits" inputProps={{ style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }, maxLength: 6 }} disabled={isProcessing} />
              <Button variant="contained" fullWidth size="large" onClick={handleResetPin} disabled={isProcessing || newPinInput.length < 4} sx={{ borderRadius: 2 }}>Unlock Site</Button>
            </>
          ) : (
            <>
              <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', mb: 1 }}><LockIcon fontSize="large" /></Avatar>
              <Box><Typography variant="h5" fontWeight="bold" gutterBottom>App Locked</Typography></Box>
              <TextField autoFocus type="password" label="Enter PIN" variant="outlined" value={pinInput} onChange={(e) => setPinInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleUnlock()} error={pinError} helperText={pinError ? 'Incorrect PIN' : ''} inputProps={{ style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }, maxLength: 6 }} sx={{ width: 220 }} />
              <Button variant="contained" fullWidth size="large" onClick={handleUnlock} sx={{ borderRadius: 2, fontWeight: 'bold' }}>Unlock Application</Button>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                <Button variant="text" size="small" onClick={() => setIsVerifyingPassword(true)}>Forgot PIN?</Button>
                <Button variant="text" color="inherit" onClick={logout}>Switch Account</Button>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Layout;
