import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Settings as SettingsIcon,
  Assessment as ReportsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

const drawerWidth = 280;
const collapsedWidth = 70;

const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed, 
  onToggle, 
  mobileOpen, 
  onMobileToggle 
}) => {
  const location = useLocation();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Bills', icon: <ReceiptIcon />, path: '/bills' },
    { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
    { text: 'Products', icon: <InventoryIcon />, path: '/products' },
    { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#ffffff' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: collapsed && !isMobile ? 'center' : 'space-between', minHeight: 64, borderBottom: `1px solid ${theme.palette.divider}` }}>
        {(!collapsed || isMobile) && (
          <Typography variant="h6" noWrap sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
            BillSoft
          </Typography>
        )}
        <IconButton onClick={onToggle} size="small">
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      <Divider />

      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ px: 1 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={isActive}
                disableRipple
                disableTouchRipple
                sx={{
                  minHeight: 48,
                  justifyContent: collapsed && !isMobile ? 'center' : 'initial',
                  px: 2.5,
                  borderRadius: '8px', 
                  mx: 1,
                  my: 0.5,
                  transition: 'none !important',
                  
                  // 1. NORMAL STATE (Text & Icon gray/dark)
                  color: '#4b5563 !important', 
                  '& .MuiListItemIcon-root': { color: '#4b5563 !important' },

                  // 2. HOVER STATE (Fix: Cursor le jane par background white nahi hoga, normal dikhega)
                  '&:hover': {
                    backgroundColor: isActive ? '#1e3a8a !important' : 'transparent !important', 
                    color: isActive ? '#ffffff !important' : '#4b5563 !important',
                    '& .MuiListItemIcon-root': { 
                      color: isActive ? '#ffffff !important' : '#4b5563 !important' 
                    },
                    '& .MuiListItemText-primary': {
                      color: isActive ? '#ffffff !important' : '#4b5563 !important'
                    }
                  },

                  // 3. ACTIVE STATE (Click karne par solid dark blue)
                  '&.Mui-selected': {
                    backgroundColor: '#1e3a8a !important', 
                    color: '#ffffff !important',
                    opacity: '1 !important', // Transparency hatane ke liye
                    '& .MuiListItemIcon-root': { color: '#ffffff !important' },
                    '&:hover': { backgroundColor: '#1e3a8a !important' },
                    '&:focus': { backgroundColor: '#1e3a8a !important' },
                  },

                  // MUI Internal layers block karna
                  '& .MuiTouchRipple-root': { display: 'none !important' },
                }}
                onClick={isMobile ? onMobileToggle : undefined}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: collapsed && !isMobile ? 0 : 3, justifyContent: 'center', color: 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                {(!collapsed || isMobile) && (
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontWeight: isActive ? 'bold' : '500', 
                      fontSize: '0.9rem',
                      color: 'inherit' // Force normal color
                    }}
                    sx={{ opacity: collapsed && !isMobile ? 0 : 1 }} 
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />
      
      <List>
        <ListItem disablePadding sx={{ px: 1 }}>
          <ListItemButton
            onClick={handleLogout}
            disableRipple
            sx={{
              minHeight: 48,
              justifyContent: collapsed && !isMobile ? 'center' : 'initial',
              px: 2.5,
              borderRadius: '8px',
              mx: 1,
              my: 0.5,
              color: '#d32f2f !important',
              '&:hover': { backgroundColor: 'transparent !important' }
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed && !isMobile ? 0 : 3, color: 'inherit' }}>
              <LogoutIcon />
            </ListItemIcon>
            {(!collapsed || isMobile) && <ListItemText primary="Logout" />}
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <Drawer variant="temporary" open={mobileOpen} onClose={onMobileToggle} sx={{ '& .MuiDrawer-paper': { width: drawerWidth, transition: 'none !important' } }}>
          {drawer}
        </Drawer>
      ) : (
        <Drawer variant="permanent" sx={{ width: collapsed ? collapsedWidth : drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: collapsed ? collapsedWidth : drawerWidth, boxSizing: 'border-box', borderRight: '1px solid #e5e7eb', transition: 'none !important' } }}>
          {drawer}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;