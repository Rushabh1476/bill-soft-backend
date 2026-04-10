/* eslint-disable */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Divider,
  Grid,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  Timeline as TimelineIcon,
  Engineering as TechIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';

// ─── Expanded Permissions Configuration ─────────────────────────────────────

export const PERMISSION_CATEGORIES = [
  {
    category: 'Billing & Finance',
    permissions: [
      { key: 'view_bills', label: 'View Invoices' },
      { key: 'create_bills', label: 'Create New Bills' },
      { key: 'edit_bills', label: 'Edit Existing Bills' },
      { key: 'delete_bills', label: 'Delete Bills (Caution)' },
      { key: 'receive_payments', label: 'Record & View Payments' },
      { key: 'bills:export', label: 'Export Data (CSV/Excel)' },
    ],
  },
  {
    category: 'Inventory & Services',
    permissions: [
      { key: 'view_products', label: 'View Products' },
      { key: 'manage_products', label: 'Add/Edit Products' },
      { key: 'stock_adjustments', label: 'Manual Stock Adjust' },
      { key: 'barcode_management', label: 'Manage Barcodes/QR' },
      { key: 'manage_services', label: 'Manage Services' },
      { key: 'manage_expenses', label: 'Manage Business Expenses' },
    ],
  },
  {
    category: 'CRM & Loyalty',
    permissions: [
      { key: 'view_customers', label: 'View Customer List' },
      { key: 'manage_customers', label: 'Add/Edit Customers' },
      { key: 'view_suppliers', label: 'View Suppliers' },
      { key: 'manage_suppliers', label: 'Manage Suppliers' },
      { key: 'loyalty_rewards', label: 'Manage Loyalty Points' },
      { key: 'customer_history', label: 'View Purchase History' },
    ],
  },
  {
    category: 'Marketing & Outreach',
    permissions: [
      { key: 'send_reminders', label: 'Send Payment Reminders' },
      { key: 'bulk_sms', label: 'Dispatch Bulk SMS' },
      { key: 'email_marketing', label: 'Campaign Management' },
      { key: 'discount_coupons', label: 'Generate Promo Codes' },
    ],
  },
  {
    category: 'Analytics & Admin',
    permissions: [
      { key: 'view_reports', label: 'Basic Business Reports' },
      { key: 'tax_gst_reports', label: 'Tax & GST Reports' },
      { key: 'view_audit_logs', label: 'View Security Logs' },
      { key: 'admin_access', label: 'Access Admin Panel' },
      { key: 'business_settings', label: 'Change Business Settings' },
    ],
  },
  {
    category: 'Operations & Security',
    permissions: [
      { key: 'switch_branch', label: 'Switch Between Branches' },
      { key: 'manage_users', label: 'Manage Team Access' },
      { key: 'view_api_keys', label: 'View API Credentials' },
      { key: 'force_mfa', label: 'Enforce MFA Security' },
    ],
  },
];

// ─── Intelligent Default Assignments ────────────────────────────────────────

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['all_access'],
  MANAGER: [
    'view_bills', 'create_bills', 'edit_bills', 'bills:export',
    'view_products', 'manage_products', 'manage_services',
    'view_customers', 'manage_customers', 'view_reports'
  ],
  ACCOUNTANT: [
    'view_bills', 'create_bills', 'view_products', 'view_customers',
    'view_reports', 'tax_gst_reports'
  ],
  FINANCE: ['view_bills', 'view_reports', 'tax_gst_reports', 'view_audit_logs'],
  TECHNICIAN: ['manage_services'],
  OPERATOR: ['view_bills', 'create_bills', 'view_products', 'manage_products'],
  READONLY: ['view_bills', 'view_products', 'view_customers', 'view_reports'],
  VIEWER: ['view_bills', 'view_products', 'view_customers', 'view_reports']
};

export const ALL_PERMISSIONS = PERMISSION_CATEGORIES.flatMap(c => c.permissions.map(p => p.key));

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'VIEWER' | 'FINANCE' | 'OPERATOR' | 'READONLY' | 'TECHNICIAN';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLoginAt: string | null;
  permissions: string[];
  isEmployee: boolean;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // History State
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<User | null>(null);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserHistory = async (user: User) => {
    setSelectedUserForHistory(user);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.get(`${API_URL}/admin/users/${user.id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUserHistory(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
      setUserHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'VIEWER' as any,
    permissions: [] as string[],
    isEmployee: false,
  });

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: '', // Password is not loaded for editing existing users
        role: user.role,
        permissions: user.permissions || [],
        isEmployee: user.isEmployee || false,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'VIEWER',
        permissions: ROLE_DEFAULT_PERMISSIONS['VIEWER'], // Default for Viewer
        isEmployee: false,
      });
    }
    setOpenDialog(true);
  };

  const handleRoleChange = (newRole: any) => {
    setFormData({
      ...formData,
      role: newRole,
      permissions: ROLE_DEFAULT_PERMISSIONS[newRole] || [],
      // Auto-enable technician flag when Technician role is selected
      isEmployee: newRole === 'TECHNICIAN' ? true : formData.isEmployee,
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'VIEWER',
      permissions: [],
      isEmployee: false,
    });
  };

  const handleSubmit = async () => {
    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone)) {
      alert('Phone must be 10 digits and start with 6, 7, 8, or 9');
      return;
    }
    // 1. Prepare data
    const permissionsToSave = formData.role === 'ADMIN' ? ALL_PERMISSIONS : formData.permissions;
    const previousUsers = [...users];
    const token = localStorage.getItem('authToken');

    // 2. Optimistic Update
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? {
        ...u,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        permissions: permissionsToSave,
        isEmployee: formData.isEmployee
      } : u));
    } else {
      const tempUser: User = {
        id: `temp-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        permissions: permissionsToSave,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
        lastLoginAt: null,
        isEmployee: formData.isEmployee
      };
      setUsers([tempUser, ...users]);
    }

    // 3. Close UI immediately
    handleCloseDialog();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

      // 4. Background Sync
      try {
        let response;
        if (editingUser) {
          response = await axios.put(`${API_URL}/admin/users/${editingUser.id}`, {
            role: formData.role,
            permissions: permissionsToSave,
            name: formData.name,
            phone: formData.phone,
            isEmployee: formData.isEmployee,
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else {
          response = await axios.post(`${API_URL}/admin/users`, {
            ...formData,
            permissions: permissionsToSave,
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }

        // Handle success but with email warnings
        if (response.data.success) {
          if (response.data.mailError) {
            alert(`User saved successfully, but the invitation email failed to send: ${response.data.mailError}. You may need to reset their password manually or check SMTP settings.`);
          } else {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
          }
        }

        // Re-fetch to get real IDs and confirm sync
        await fetchUsers();
      } catch (err: any) {
        console.error('Failed to sync user updates:', err);
        // Rollback
        setUsers(previousUsers);
        const errorMsg = err.response?.data?.error || err.message || 'Failed to save user.';
        alert(errorMsg);
      }
    };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to permanently remove this user? This cannot be undone.')) {
      try {
        const token = localStorage.getItem('authToken');
        await axios.delete(`${API_URL}/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchUsers();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (err) {
        console.error('Failed to delete user:', err);
        alert('Failed to delete user. They might have existing records or you lack permission.');
      }
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus as any } : u));
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`${API_URL}/admin/users/${user.id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      // Rollback on failure
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: user.status } : u));
      alert('Failed to update user status.');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':        return 'error';
      case 'MANAGER':      return 'primary';
      case 'ACCOUNTANT':   return 'secondary';
      case 'TECHNICIAN':   return 'success';
      case 'FINANCE':      return 'info';
      case 'OPERATOR':     return 'warning';
      default:             return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'inactive':
        return 'default';
      default:
        return 'default';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'ADMIN':       return 'Full access to all features and settings';
      case 'MANAGER':     return 'Can manage customers, products, and bills';
      case 'ACCOUNTANT':  return 'Can view and create bills, limited editing';
      case 'TECHNICIAN':  return 'Service technician — can manage and accept service tickets';
      case 'FINANCE':     return 'View financial reports and audit logs';
      case 'OPERATOR':    return 'Manage inventory and products only';
      case 'VIEWER':      return 'Read-only access to dashboard and reports';
      default:            return '';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage team access and permissions for your organization
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Add User
        </Button>
      </Box>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          User {editingUser ? 'updated' : 'created'} successfully! Access credentials have been sent to their email.
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h4" fontWeight={600} color="primary">
              {users.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Users
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h4" fontWeight={600} color="error.main">
              {users.filter(u => u.role === 'ADMIN').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Admins
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h4" fontWeight={600} color="primary">
              {users.filter(u => u.role === 'MANAGER').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Managers
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h4" fontWeight={600} color="success.main">
              {users.filter(u => u.status === 'active').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Users
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Users Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon color="primary" />
            Team Members
          </Typography>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F3F6FB' }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: isDarkMode ? '#FFFFFF' : 'inherit' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: isDarkMode ? '#FFFFFF' : 'inherit' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: isDarkMode ? '#FFFFFF' : 'inherit' }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: isDarkMode ? '#FFFFFF' : 'inherit' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: isDarkMode ? '#FFFFFF' : 'inherit' }}>Last Active</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: isDarkMode ? '#FFFFFF' : 'inherit' }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: isDarkMode ? '#FFFFFF' : 'inherit' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: isDarkMode ? '#FFFFFF' : 'inherit' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow
                    key={user.id}
                    sx={{
                      bgcolor: isDarkMode
                        ? (index % 2 === 0 ? 'background.paper' : 'rgba(255, 255, 255, 0.02)')
                        : (index % 2 === 0 ? '#FFFFFF' : '#F9FAFC'),
                      height: '48px',
                      '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2" fontWeight={500}>
                          {user.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.phone || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role.toUpperCase()}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.isEmployee ? 'YES' : 'NO'} 
                        size="small" 
                        color={user.isEmployee ? 'primary' : 'default'} 
                        variant={user.isEmployee ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Switch
                          size="small"
                          checked={user.status === 'active'}
                          onChange={() => handleToggleStatus(user)}
                          color="success"
                          disabled={user.status === 'pending'}
                          title={user.status === 'pending' ? 'Pending email activation' : `Click to mark ${user.status === 'active' ? 'Inactive' : 'Active'}`}
                        />
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          color={
                            user.status === 'active' ? 'success.main' :
                            user.status === 'pending' ? 'warning.main' : 'text.disabled'
                          }
                        >
                          {user.status === 'active' ? 'Active' : user.status === 'pending' ? 'Pending' : 'Inactive'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(user)}
                        sx={{ mr: 0.5 }}
                        title="Edit User"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => fetchUserHistory(user)}
                        sx={{ mr: 0.5 }}
                        title="View Activity History"
                      >
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                      {user.role !== 'ADMIN' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
                {editingUser ? 'Edit User' : 'Add New User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {editingUser
                ? 'Update user information and role'
                : 'Provide user details to grant access'}
            </Typography>
          </Box>
          {isMobile && <IconButton onClick={handleCloseDialog} size="small">✕</IconButton>}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-Z\s.\-]/g, '').slice(0, 30);
                setFormData({ ...formData, name: val });
              }}
              required
              inputProps={{ maxLength: 30 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData({ ...formData, phone: val });
              }}
              error={formData.phone.length > 0 && formData.phone.length < 10}
              helperText={formData.phone.length > 0 && formData.phone.length < 10 ? "Phone number must be 10 digits" : ""}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon />
                  </InputAdornment>
                ),
              }}
            />

            {!editingUser && (
              <TextField
                fullWidth
                label="Login Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="Assign a secure password"
              />
            )}

            <FormControl fullWidth>
              <InputLabel>User Role</InputLabel>
              <Select
                value={formData.role}
                label="User Role"
                onChange={(e) => handleRoleChange(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="ADMIN">Admin (Full Control)</MenuItem>
                <MenuItem value="MANAGER">Manager (Operational Access)</MenuItem>
                <MenuItem value="ACCOUNTANT">Accountant (Billing & Tax)</MenuItem>
                <MenuItem value="FINANCE">Finance (Audit & Reports)</MenuItem>
                <MenuItem value="TECHNICIAN">Technician (Service Tickets)</MenuItem>
                <MenuItem value="OPERATOR">Operator (Inventory Only)</MenuItem>
                <MenuItem value="READONLY">Read-Only (View Access)</MenuItem>
                <MenuItem value="VIEWER">Viewer (Dashboard Only)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Technician Status</InputLabel>
              <Select
                value={formData.isEmployee ? 'YES' : 'NO'}
                label="Technician Status"
                onChange={(e) => setFormData({ ...formData, isEmployee: e.target.value === 'YES' })}
                sx={{ borderRadius: 2 }}
                startAdornment={
                  <InputAdornment position="start">
                    <TechIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                }
              >
                <MenuItem value="NO">No (Software Access Only)</MenuItem>
                <MenuItem value="YES">Yes (Assign to Service Tickets)</MenuItem>
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1 }}>
                Determines if this user appears in the technician dropdown for service jobs
              </Typography>
            </FormControl>

            <Box sx={{
              p: 2.5,
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFD',
              borderRadius: '16px',
              border: '1px solid',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E6ECF5',
              mt: 1
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <SecurityIcon color="primary" sx={{ fontSize: 22 }} />
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                    Dynamic Permissions Matrix
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setFormData({ ...formData, permissions: ALL_PERMISSIONS })}
                    disabled={formData.role === 'ADMIN'}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 2
                    }}
                  >
                    Enable All
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => setFormData({ ...formData, permissions: [] })}
                    disabled={formData.role === 'ADMIN'}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 2
                    }}
                  >
                    Disable All
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                {PERMISSION_CATEGORIES.map((categoryGroup) => (
                  <Grid size={{ xs: 12 }} key={categoryGroup.category}>
                    <Typography
                      variant="caption"
                      fontWeight={800}
                      sx={{
                        color: 'primary.main',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        display: 'block',
                        mb: 1.5,
                        opacity: 0.9
                      }}
                    >
                      {categoryGroup.category}
                    </Typography>

                    <Grid container spacing={1}>
                      {categoryGroup.permissions.map((perm) => {
                        const isAdmin = formData.role === 'ADMIN';
                        const isChecked = isAdmin || formData.permissions.includes(perm.key);
                        return (
                          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={perm.key}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  checked={isChecked}
                                  disabled={isAdmin}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({ ...formData, permissions: [...formData.permissions, perm.key] });
                                    } else {
                                      setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== perm.key) });
                                    }
                                  }}
                                  sx={{
                                    color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                                    '&.Mui-checked': {
                                      color: 'primary.main',
                                    },
                                    transform: 'scale(0.9)'
                                  }}
                                />
                              }
                              label={
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: isChecked ? 'text.primary' : 'text.secondary',
                                    fontWeight: isChecked ? 600 : 400,
                                    fontSize: '0.8125rem',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  {perm.label}
                                </Typography>
                              }
                              sx={{
                                width: '100%',
                                ml: -0.5,
                                py: 0.5,
                                px: 1,
                                borderRadius: '8px',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                                }
                              }}
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                    {categoryGroup !== PERMISSION_CATEGORIES[PERMISSION_CATEGORIES.length - 1] && (
                      <Divider sx={{ mt: 3, mb: 2, opacity: 0.5, borderStyle: 'dashed' }} />
                    )}
                  </Grid>
                ))}
              </Grid>
            </Box>

            {!editingUser && (
              <Alert severity="info">
                An automated email with login credentials will be sent to the user's email address.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.email || (formData.phone.length > 0 && formData.phone.length < 10)}
          >
            {editingUser ? 'Update User' : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Activity History Dialog */}
      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, maxHeight: '80vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TimelineIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={700}>User Activity: {selectedUserForHistory?.name}</Typography>
            <Typography variant="caption" color="text.secondary">Detailed audit trail of latest 50 actions</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : userHistory.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No activity logs found for this user.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Module</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>IP Source</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userHistory.map((log) => (
                    <TableRow key={log.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell>
                        <Chip
                          label={log.action}
                          size="small"
                          variant="outlined"
                          color={log.action === 'DELETE' ? 'error' : log.action === 'CREATE' ? 'success' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{log.entity.toUpperCase()}</Typography>
                        {log.entityId && <Typography variant="caption" color="text.secondary" display="block">ID: {log.entityId}</Typography>}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{log.ipAddress || 'Unknown'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{new Date(log.createdAt).toLocaleString()}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)} sx={{ fontWeight: 700 }}>Close Logs</Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
};

export default UserManagement;
