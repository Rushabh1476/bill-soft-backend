/* eslint-disable */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  Fab,
  useTheme,
  useMediaQuery,
  MenuItem,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Snackbar,
  Alert
} from '@mui/material';
import { SectionLoader } from '../components/common/LoadingScreen';
import {
  Add as AddIcon,
  Flag as FlagIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  FilterList as FilterListIcon,
  GetApp as ExportIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import CustomerForm from '../components/customers/CustomerForm';
import { useCustomers } from '../hooks/useCustomers';
import { useAuth } from '../contexts/AuthContext';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';
import SecureActionDialog from '../components/shared/SecureActionDialog';

const Customers: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => (localStorage.getItem('preferredView_Customers') as 'list' | 'grid') || 'list');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [dateRange, setDateRange] = useState('All Time');
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const { customers, deleteCustomer, exportCustomers, loading } = useCustomers();
  const { user } = useAuth();
  const navigate = useNavigate();
  const permissions = useRoleBasedAccess();
  const canView = permissions.canViewCustomers;
  const canCreate = permissions.canManageCustomers;
  const canEdit = permissions.canManageCustomers;
  const canDelete = permissions.canManageCustomers;

  // Secure Actions
  const [secureDialogOpen, setSecureDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [pendingEditCustomer, setPendingEditCustomer] = useState<any>(null);
  const isSecureEnabled = localStorage.getItem('secureActionsEnabled') === 'true';

  if (!canView) {
    return (
      <Box sx={{ p: 5, textAlign: 'center', mt: 10 }}>
        <Paper sx={{ p: 5, borderRadius: 3 }}>
          <Typography variant="h5" color="error">Access Denied</Typography>
          <Typography color="text.secondary" sx={{ mt: 2 }}>You do not have permission to view customers.</Typography>
          <Button sx={{ mt: 3 }} variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Paper>
      </Box>
    );
  }

  const handleClose = () => {
    setOpen(false);
    setSelectedCustomer(null);
  };

  const handleOpen = (customer?: any) => {
    if (customer && customer.id) {
      setSelectedCustomer(customer);
    } else {
      setSelectedCustomer(null);
    }
    setOpen(true);
  };

  const showMessage = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDelete = (customerId: string) => {
    const isSecure = localStorage.getItem('secureActionsEnabled') === 'true';
    if (isSecure) {
      setCustomerToDelete(customerId);
      setSecureDialogOpen(true);
    } else {
      if (window.confirm('Are you sure you want to delete this customer?')) {
        handleConfirmDelete(customerId);
      }
    }
  };

  const handleEditTrigger = (customer: any) => {
    const isSecure = localStorage.getItem('secureActionsEnabled') === 'true';
    if (isSecure) {
      setPendingEditCustomer(customer);
      setSecureDialogOpen(true);
    } else {
      setSelectedCustomer(customer);
      setOpen(true);
    }
  };

  const handleSecureActionConfirm = () => {
    if (pendingEditCustomer) {
      setSelectedCustomer(pendingEditCustomer);
      setOpen(true);
      setPendingEditCustomer(null);
      setSecureDialogOpen(false);
    } else {
      handleConfirmDelete();
    }
  };

  const handleConfirmDelete = async (id?: string) => {
    const targetId = id || customerToDelete;
    if (!targetId) return;
    try {
      await deleteCustomer(targetId);
      showMessage('Customer Deleted Successfully');
      setSearchTerm(''); // Clear search box after deletion to prevent browser side-effects
    } catch (err: any) {
      showMessage(err?.message || 'Failed to delete customer', 'error');
    } finally {
      setSecureDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleViewChange = (event: React.MouseEvent<HTMLElement>, newView: 'list' | 'grid') => {
    if (newView !== null) {
      setViewMode(newView);
      localStorage.setItem('preferredView_Customers', newView);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportCustomers('excel');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      showMessage('Export Started');
    } catch (err: any) {
      showMessage(err.message || 'Failed to export customers', 'error');
    }
  };

  const filteredCustomers = customers.filter(customer => {
    // Search Term Filter
    const searchMatch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!searchMatch) return false;

    // Status Filter
    if (statusFilter !== 'All Status') {
      const customerStatus = customer.isActive !== false ? 'Active' : 'Inactive';
      if (customerStatus !== statusFilter) return false;
    }

    // Date Range Filter
    if (dateRange !== 'All Time') {
      const createdAt = new Date(customer.createdAt);
      const now = new Date();
      if (dateRange === 'This Month') {
        if (createdAt.getMonth() !== now.getMonth() || createdAt.getFullYear() !== now.getFullYear()) return false;
      } else if (dateRange === 'Last Month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        if (createdAt.getMonth() !== lastMonth.getMonth() || createdAt.getFullYear() !== lastMonth.getFullYear()) return false;
      }
    }

    return true;
  });

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Customer Management
        </Typography>
        <Typography variant={isMobile ? "body2" : "subtitle1"} color="text.secondary">
          Manage your customer database and contact information
        </Typography>
      </Box>

      {/* Controls Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          flexWrap: 'wrap'
        }}>
          {/* Left Side: Search & Filters */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flexGrow: 1 }}>
            <TextField
              placeholder="Search customers..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
              name="customer-search-main"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                autoComplete: 'off'
              }}
              sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 250 } }}
            />

            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 150 } }}
              label="Status"
            >
              <MenuItem key="all" value="All Status">All Status</MenuItem>
              <MenuItem key="active" value="Active">Active</MenuItem>
              <MenuItem key="inactive" value="Inactive">Inactive</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 150 } }}
              label="Date Range"
            >
              <MenuItem key="all" value="All Time">All Time</MenuItem>
              <MenuItem key="month" value="This Month">This Month</MenuItem>
              <MenuItem key="last-month" value="Last Month">Last Month</MenuItem>
            </TextField>
          </Box>

          {/* Right Side: Actions */}
          <Box sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            width: { xs: '100%', md: 'auto' },
            justifyContent: { xs: 'space-between', md: 'flex-end' },
            flexWrap: 'wrap'
          }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewChange}
              size="small"
              aria-label="view mode"
            >
              <ToggleButton value="list" aria-label="list view">
                <ViewListIcon />
              </ToggleButton>
              <ToggleButton value="grid" aria-label="grid view">
                <ViewModuleIcon />
              </ToggleButton>
            </ToggleButtonGroup>

            {/* <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              sx={{ flexGrow: { xs: 1, sm: 0 } }}
            >
              Filters
            </Button> */}
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExport}
              sx={{ flexGrow: { xs: 1, sm: 0 } }}
            >
              Export
            </Button>
            {canCreate && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpen()}
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                Add Customer
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Content Area */}
      {loading && (
        <Box sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SectionLoader message={loading ? 'Processing...' : 'Syncing records...'} />    
        </Box>
      )}

      {filteredCustomers.length > 0 && !loading ? (
        <>
          {viewMode === 'list' ? (
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer Name</TableCell>
                    <TableCell>Contact Info</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell align="center">Loyalty Points</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                            {customer.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography fontWeight="medium">{customer.name}</Typography>
                          {customer.isMarkedRed && (
                            <FlagIcon sx={{ color: 'error.main', fontSize: 18, ml: 1 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexDirection="column">
                          {customer.email && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">{customer.email}</Typography>
                            </Box>
                          )}
                          {customer.phone && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">{customer.phone}</Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }} noWrap>
                          {customer.address || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={customer.loyaltyPoints || 0}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={customer.isActive !== false ? 'Active' : 'Inactive'}
                          color={customer.isActive !== false ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {canEdit && (
                            <IconButton size="small" onClick={() => handleEditTrigger(customer)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          {canDelete && (
                            <IconButton size="small" color="error" onClick={() => handleDelete(customer.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)'
              },
              gap: 3
            }}>
              {filteredCustomers.map((customer) => (
                <Card sx={{ height: '100%', position: 'relative' }} key={customer.id}>
                  <CardContent sx={{ pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold" noWrap>
                        {customer.name}
                        {customer.isMarkedRed && (
                          <FlagIcon sx={{ color: 'error.main', fontSize: 18, ml: 1, verticalAlign: 'middle' }} />
                        )}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {canEdit && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => handleEditTrigger(customer)}
                            sx={{ minWidth: 32, width: 32, height: 32, p: 0 }}
                          >
                            <EditIcon fontSize="small" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleDelete(customer.id)}
                            sx={{ minWidth: 32, width: 32, height: 32, p: 0 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </Button>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {customer.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {customer.email}
                          </Typography>
                        </Box>
                      )}

                      {customer.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {customer.phone}
                          </Typography>
                        </Box>
                      )}

                      {customer.address && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <LocationIcon fontSize="small" color="action" sx={{ mt: 0.25 }} />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {customer.address}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {customer.loyaltyPoints !== undefined && customer.loyaltyPoints > 0 && (
                      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'primary.lighter', borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="primary.dark" fontWeight="medium" display="block">
                          Loyalty Points
                        </Typography>
                        <Typography variant="h6" color="primary.main" fontWeight="bold">
                          {customer.loyaltyPoints}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={customer.isActive !== false ? 'Active' : 'Inactive'}
                          size="small"
                          color={customer.isActive !== false ? 'success' : 'error'}
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          Added {new Date(customer.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </>
      ) : (
        !loading && (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm ? 'No customers found' : 'No customers yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Start by adding your first customer to get started'
              }
            </Typography>
            {!searchTerm && canCreate && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
                Add Your First Customer
              </Button>
            )}
          </Paper>
        )
      )}

      {/* Floating Action Button for Mobile */}
      {isMobile && canCreate && (
        <Fab
          color="primary"
          aria-label="add customer"
          onClick={() => handleOpen()}
          sx={{
            position: 'fixed',
            bottom: 85,
            right: 16,
            zIndex: 1000
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Add Customer Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
          {isMobile && (
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent dividers={isMobile}>
          <CustomerForm customer={selectedCustomer} onClose={handleClose} />
        </DialogContent>
      </Dialog>

      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

      <SecureActionDialog
        open={secureDialogOpen}
        onClose={() => setSecureDialogOpen(false)}
        onConfirm={handleSecureActionConfirm}
        title={pendingEditCustomer ? "Authorize Customer Edit" : "Authorize Customer Deletion"}
        message={pendingEditCustomer ? "Editing a customer profile is a critical action. Enter your security PIN to proceed." : "Deleting a customer is a critical action. Enter your security PIN to proceed."}
        actionLabel={pendingEditCustomer ? "Edit Customer" : "Delete Customer"}
      />
    </Box>
  );
};

export default Customers;
