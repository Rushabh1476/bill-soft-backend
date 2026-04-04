import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Button,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  People as UsersIcon,
  CreditCard as BillingIcon,
  History as HistoryIcon,
  NavigateNext as NavigateNextIcon,
  Engineering as TechIcon,
  Palette as TemplateIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useRoleBasedAccess from '../hooks/useRoleBasedAccess';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const permissions = useRoleBasedAccess();

  const isAdminRoot = location.pathname === '/admin' || location.pathname === '/admin/';

  if (!permissions.canViewAdminPanel) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access Denied: You don't have permission to access the Admin Panel.
        </Alert>
      </Box>
    );
  }

  // Handle Nested Rendering: If URL is /admin/settings/*, render child via Outlet
  if (!isAdminRoot) {
    let subTitle = 'Admin Tool';
    if (location.pathname.includes('/users')) subTitle = 'User Management';
    else if (location.pathname.includes('/employees')) subTitle = 'Technician Management';
    else if (location.pathname.includes('/subscription')) subTitle = 'Subscription';
    else if (location.pathname.includes('/audit-logs')) subTitle = 'Audit Logs';
    else if (location.pathname.includes('/templates')) subTitle = 'Invoice Template Library';

    return (
      <Box sx={{ p: 1 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <Link
            component="button"
            variant="body1"
            underline="hover"
            color="primary"
            onClick={() => navigate('/admin')}
            sx={{ cursor: 'pointer', fontWeight: 600 }}
          >
            Admin Panel
          </Link>
          <Typography color="text.primary" fontWeight={600}>{subTitle}</Typography>
        </Breadcrumbs>
        <Outlet />
      </Box>
    );
  }

  const adminTools = [
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: <UsersIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
      path: 'users',
      enabled: permissions.canManageUsers,
    },
    {
      title: 'Technician Management',
      description: 'Choose which team members can handle Service Tickets',
      icon: <TechIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
      path: 'employees',
      enabled: permissions.canManageUsers,
    },
    {
      title: 'Subscription & Plans',
      description: 'Manage pricing tiers, billing cycle, and feature toggles',
      icon: <BillingIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
      path: '/admin/subscription',
      enabled: permissions.canViewSubscription,
    },
    {
      title: 'Invoice Template Library',
      description: 'Manage and preview various invoice designs and formats',
      icon: <TechIcon sx={{ fontSize: 32, color: 'primary.main' }} />, // Reusing or using a better one below
      path: '/templates',
      enabled: true, // Should ideally check permissions, but per user request, making sure it's there
    },
    {
      title: 'Audit Logs',
      description: 'View system activity and user actions history',
      icon: <HistoryIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
      path: '/admin/audit-logs',
      enabled: permissions.canViewAuditLogs,
    },
    // {
    //   title: 'Invoice Template Library',
    //   description: 'Design and customize bill formats and templates',
    //   icon: <TemplateIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
    //   path: '/admin/templates',
    //   enabled: true, // Typically admin access implies template management
    // },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Admin Panel
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome, {user?.name}! You have administrator access to manage the system.
          </Typography>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Administrator Mode:</strong> You have full system access. Be careful when making changes.
      </Alert>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
        {adminTools.map((tool, index) => (
          <Card
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              cursor: tool.enabled ? 'pointer' : 'default',
              opacity: tool.enabled ? 1 : 0.6,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.3s ease',
              '&:hover': tool.enabled ? {
                boxShadow: 4, transform: 'translateY(-2px)', borderColor: 'primary.main',
              } : {},
            }}
            onClick={tool.enabled ? () => navigate(tool.path) : undefined}
          >
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {tool.icon}
                <Typography variant="h6" fontWeight="bold">{tool.title}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {tool.description}
              </Typography>
              {tool.enabled ? (
                <Box sx={{ mt: 'auto' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ borderRadius: 2 }}
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(tool.path); }}
                  >
                    Access
                  </Button>
                </Box>
              ) : (
                <Typography variant="caption" color="error" sx={{ mt: 'auto', pt: 1, display: 'block' }}>
                  Insufficient permissions
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default AdminPanel;
