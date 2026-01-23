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
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Settings,
  Logout,
  Person,
} from '@mui/icons-material';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State for sidebar collapse and mobile drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);

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
    navigate('/user-settings');
    handleProfileMenuClose();
  };

  const drawerWidth = 280;
  const collapsedWidth = 70;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        mobileOpen={mobileDrawerOpen}
        onMobileToggle={handleMobileDrawerToggle}
      />

      {/* Main Content Container */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flexGrow: 1,
        width: 0, // This ensures the flexbox properly calculates remaining space
        minHeight: '100vh'
      }}>
        {/* Top App Bar */}
        <AppBar
          position="sticky"
          sx={{
            zIndex: theme.zIndex.drawer - 1, // Lower than sidebar
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: 'none',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
        <Toolbar>
          {/* Hamburger menu button for both mobile and desktop */}
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={isMobile ? handleMobileDrawerToggle : handleSidebarToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {isMobile ? 'BillSoft' : ''}
          </Typography>

          {/* User Profile Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={user?.plan || "Free Plan"} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{ p: 0 }}
              aria-label="user profile"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            minWidth: 200,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email || 'user@example.com'}
          </Typography>
        </Box>
        
        <MenuItem onClick={handleNavigateToProfile}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleNavigateToUserSettings}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>User Settings</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

        {/* Main content area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            backgroundColor: theme.palette.background.default,
            overflow: 'auto',
          }}
        >
          <Box sx={{ p: 1, width: '100%' }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;