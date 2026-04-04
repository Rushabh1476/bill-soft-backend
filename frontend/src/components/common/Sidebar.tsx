import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  alpha, // Added alpha for dynamic sidebar colors
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
  AdminPanelSettings as AdminIcon,
  LibraryBooks as TemplateIcon,
  GroupWork as GroupWorkIcon,
  CurrencyRupee as MoneyIcon,
  DesignServices as ServicesIcon,
  Security as SecurityIcon,
  ConfirmationNumber as TicketIcon,
  ShoppingCart as PurchaseOrderIcon,
} from '@mui/icons-material';
import { useRoleBasedAccess } from '../../hooks/useRoleBasedAccess';
import { usePermissions } from '../../contexts/PermissionsContext';

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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const permissions = useRoleBasedAccess();
  const { permissions: livePermissions, isAdmin, role } = usePermissions();

  const isSubUserWithNoPerms = !isAdmin && role !== 'ADMIN' && livePermissions.length === 0;

  const mainMenuItems = isSubUserWithNoPerms ? [] : [
    { text: 'Control Panel', icon: <SecurityIcon />, path: '/super-admin', visible: permissions.canViewSuperAdmin, id: 'tour-nav-super-admin' },
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', visible: permissions.canViewDashboard, id: 'tour-nav-dashboard' },
    { text: 'Bills', icon: <ReceiptIcon />, path: '/bills', visible: permissions.canViewBills, id: 'tour-nav-bills' },
    { text: 'Customers', icon: <PeopleIcon />, path: '/customers', visible: permissions.canViewCustomers, id: 'tour-nav-customers' },
    { text: 'Products', icon: <InventoryIcon />, path: '/products', visible: permissions.canViewProducts, id: 'tour-nav-products' },
    { text: 'Suppliers', icon: <GroupWorkIcon />, path: '/suppliers', visible: permissions.canViewSuppliers, id: 'tour-nav-suppliers' },
    { text: 'Services', icon: <ServicesIcon />, path: '/services', visible: permissions.canManageServices, id: 'tour-nav-services' },
    { text: 'Service Tickets', icon: <TicketIcon />, path: '/service-tickets', visible: permissions.canManageServiceTickets, id: 'tour-nav-service-tickets' },
    { text: 'Purchase Orders', icon: <PurchaseOrderIcon />, path: '/purchase-orders', visible: permissions.canManagePurchaseOrders, id: 'tour-nav-purchase-orders' },
    { text: 'Expenses', icon: <MoneyIcon />, path: '/expenses', visible: permissions.canManageExpenses, id: 'tour-nav-expenses' },
    { text: 'Reports', icon: <ReportsIcon />, path: '/reports', visible: permissions.canViewReports, id: 'tour-nav-reports' },
    { text: 'Admin Panel', icon: <AdminIcon />, path: '/admin', visible: permissions.canViewAdminPanel, id: 'tour-nav-admin' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings', visible: permissions.canManageSettings, id: 'tour-nav-settings' }
  ];

  const visibleMenuItems = mainMenuItems.filter(item => item.visible);

  const renderMenuItem = (item: { text: string; icon: JSX.Element; path: string; id: string }) => {
    // Check if the current path matches the menu item's path
    const isActive = item.path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.path);

    return (
      <ListItem key={item.text} disablePadding sx={{ px: 1 }} id={item.id}>
        <ListItemButton
          component={Link}
          to={item.path}
          selected={isActive}
          sx={{
            minHeight: 48,
            justifyContent: collapsed && !isMobile ? 'center' : 'initial',
            px: 2.5,
            borderRadius: 1,
            mx: 1,
            my: 0.5,
            transition: 'all 0.2s ease',
            '& .MuiListItemIcon-root': {
                color: `${theme.palette.text.secondary} !important`, // Soft Light Black / Grey
                '& .icon-bg': {
                  backgroundColor: 'transparent',
                  borderRadius: '50%',
                }
              },
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08), // Slightly more visible on click
                borderLeft: `5px solid ${theme.palette.primary.main}`,
                marginLeft: '-1px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12)
                },
                '& .MuiListItemIcon-root': {
                  color: `${theme.palette.primary.main} !important`, // Selective branding
                  '& .icon-bg': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: '50%',
                  }
                },
                '& .MuiListItemText-primary': { 
                  fontWeight: 700, // Bold on active
                  color: `${theme.palette.text.primary} !important`, // DARKER on active (not faded)
                },
              },
            '&:hover': { 
               backgroundColor: alpha(theme.palette.primary.main, 0.03),
               '& .MuiListItemIcon-root': { color: theme.palette.primary.main } // Flash brand color on hover
            },
          }}
          onClick={isMobile ? onMobileToggle : undefined}
        >
          <ListItemIcon sx={{ 
            minWidth: 0, 
            mr: collapsed && !isMobile ? 0 : 3, 
            justifyContent: 'center',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            color: 'inherit' // Inherit from the SX rule above
          }}>
            <Box
              className="icon-bg"
              sx={{
                position: 'absolute',
                width: 32,
                height: 32,
                zIndex: 0,
                transition: 'all 0.2s ease',
              }}
            />
            <Box sx={{ zIndex: 1, display: 'flex' }}>
              {item.icon}
            </Box>
          </ListItemIcon>
          {(!collapsed || isMobile) && (
            <ListItemText primary={item.text} sx={{ opacity: collapsed && !isMobile ? 0 : 1 }} />
          )}
        </ListItemButton>
      </ListItem>
    );
  };

  const drawer = (
    <Box className="tour-sidebar" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: collapsed && !isMobile ? 'center' : 'space-between', minHeight: 64, borderBottom: `1px solid ${theme.palette.divider}` }}>
        {(!collapsed || isMobile) && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img
              src="/logo.png"
              alt="Logo"
              style={{ height: '32px', width: 'auto', marginRight: '8px' }}
            />
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: 'bold', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'visible' }}
            >
              BillSoft
            </Typography>
          </Box>
        )}
        {collapsed && !isMobile && (
          <img src="/logo.png" alt="Logo" style={{ height: '28px', width: 'auto' }} />
        )}
        <IconButton onClick={isMobile ? onMobileToggle : onToggle} size="small">
          {collapsed && !isMobile ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      <Divider />

      <List sx={{ flexGrow: 1, pt: 1, overflowY: 'auto' }}>
        {visibleMenuItems.map(renderMenuItem)}
      </List>

      <Box sx={{ p: 2, textAlign: 'center', mt: 'auto', borderTop: `1px solid ${theme.palette.divider}` }}>
        {(!collapsed || isMobile) && <Typography variant="caption" color="text.secondary">© 2025 BillSoft</Typography>}
      </Box>
    </Box>
  );

  return (
    <>
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onMobileToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '@media print': { display: 'none !important' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: theme.palette.background.paper, // Solid white/background for mobile sidebar
              backgroundImage: 'none',
              '@media print': { display: 'none !important' }
            }
          }}
        >
          {drawer}
        </Drawer>
      )}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: collapsed ? collapsedWidth : drawerWidth,
            flexShrink: 0,
            '@media print': { display: 'none !important' },
            '& .MuiDrawer-paper': {
              width: collapsed ? collapsedWidth : drawerWidth,
              boxSizing: 'border-box',
              overflowX: 'hidden',
              backgroundColor: alpha(theme.palette.primary.main, 0.02), // "Dudhiya" tint background
              backgroundImage: 'none',
              borderRight: `1px solid ${theme.palette.divider}`,
              '@media print': { display: 'none !important' }
            }
          }}
        >
          {drawer}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;