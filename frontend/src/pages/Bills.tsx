/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  DialogContentText,
  DialogActions,
  Fab,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Tooltip,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  LinearProgress,
  Checkbox,
  Pagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Share,
  FilterList,
  MoreVert,
  PictureAsPdf,
  Description,
  Person,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import BillForm from '../components/bills/BillForm';
import { LoadingScreen } from '../components/common';
import { useBills } from '../hooks/useBills';
import { SectionLoader } from '../components/common/LoadingScreen';
import { exportBillHistory, shareOnWhatsApp } from '../utils/exportUtils';
import { API_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';
import VirtualizedBillList from '../components/bills/VirtualizedBillList';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency, formatCompactCurrency } from '../utils/currency';
import SecureActionDialog from '../components/shared/SecureActionDialog';

const Bills: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDarkMode = theme.palette.mode === 'dark';
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => (localStorage.getItem('preferredView_Bills') as 'list' | 'grid') || 'list');
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  const [viewCustomerOpen, setViewCustomerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Secure Actions
  const [secureDialogOpen, setSecureDialogOpen] = useState(false);
  const isSecureEnabled = localStorage.getItem('secureActionsEnabled') === 'true';
  const [networkIp, setNetworkIp] = useState<string>('');
  const [configOpen, setConfigOpen] = useState(false);

  // Selection & Bulk Operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState<{ current: number, total: number } | null>(null);
  const [selectionAnchorEl, setSelectionAnchorEl] = useState<null | HTMLElement>(null);
  const [selectionMenuAnchorEl, setSelectionMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [pendingEditBill, setPendingEditBill] = useState<any>(null);
  const deferredSearchTerm = useDebounce(searchTerm, 300);
  const deferredStatusFilter = useDebounce(statusFilter, 300);
  const deferredDateFilter = useDebounce(dateFilter, 300);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const { bills, deleteBill, deleteBills, getAllBillIds, loading: billsLoading, error, pagination, loadBillsPaginated } = useBills();

  useEffect(() => {
    loadBillsPaginated({
      page,
      limit: rowsPerPage,
      search: deferredSearchTerm,
      status: deferredStatusFilter === 'all' ? undefined : deferredStatusFilter,
      dateFilter: deferredDateFilter === 'all' ? undefined : deferredDateFilter
    });
  }, [page, rowsPerPage, deferredSearchTerm, deferredStatusFilter, deferredDateFilter, loadBillsPaginated]);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.triggerEditId && bills.length > 0) {
      const billToEdit = bills.find(b => b.id === location.state.triggerEditId);
      if (billToEdit) {
        setEditingBill(billToEdit);
        setOpen(true);
        // Clear the state so it doesn't re-trigger
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, bills, navigate]);

  const { user } = useAuth();
  const permissions = useRoleBasedAccess();
  const canView = permissions.canViewBills;
  const canCreate = permissions.canCreateBills;
  const canEdit = permissions.canEditBills;
  const canDelete = permissions.canDeleteBills;
  const canExport = permissions.canAccessBulkOperations;

  // Refresh listener for Bill Management page
  useEffect(() => {
    const handleRefresh = () => {
      console.log('[Bills Page] Refreshing due to global event');
      loadBillsPaginated({
        page,
        limit: rowsPerPage,
        search: deferredSearchTerm,
        status: deferredStatusFilter === 'all' ? undefined : deferredStatusFilter,
        dateFilter: deferredDateFilter === 'all' ? undefined : deferredDateFilter
      });
    };

    window.addEventListener('bill-created', handleRefresh);
    window.addEventListener('bills-updated', handleRefresh);

    return () => {
      window.removeEventListener('bill-created', handleRefresh);
      window.removeEventListener('bills-updated', handleRefresh);
    };
  }, [loadBillsPaginated, page, rowsPerPage, deferredSearchTerm, deferredStatusFilter, deferredDateFilter]);

  useEffect(() => {
    fetch(`${API_URL}/system/network-ip`)
      .then(res => res.json())
      .then(data => setNetworkIp(data.ip))
      .catch(err => console.error("Error fetching network IP:", err));
  }, []);

  if (!canView) {
    return (
      <Box sx={{ p: 5, textAlign: 'center', mt: 10 }}>
        <Paper sx={{ p: 5, borderRadius: 3 }}>
          <Typography variant="h5" color="error">Access Denied</Typography>
          <Typography color="text.secondary" sx={{ mt: 2 }}>You do not have permission to view bills.</Typography>
          <Button sx={{ mt: 3 }} variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Paper>
      </Box>
    );
  }

  const showMessage = (message: string, severity: 'success' | 'error' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => setEditingBill(null), 300);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleDelete = (billId: string) => {
    setBillToDelete(billId);
    setPendingBulkDelete(false);
    const isSecure = localStorage.getItem('secureActionsEnabled') === 'true';
    if (isSecure) {
      setSecureDialogOpen(true);
    } else {
      setDeleteDialogOpen(true);
    }
  };

  const handleBulkDeleteTrigger = () => {
    if (selectedIds.length === 0) return;
    const isSecure = localStorage.getItem('secureActionsEnabled') === 'true';
    if (isSecure) {
      setPendingBulkDelete(true);
      setSecureDialogOpen(true);
    } else {
      if (window.confirm(`Are you sure you want to delete ${selectedIds.length} bills? This will restore stock for each bill. This action is irreversible.`)) {
        handleConfirmBulkDelete();
      }
    }
  };

  const handleEditTrigger = (bill: any) => {
    const isSecure = localStorage.getItem('secureActionsEnabled') === 'true';
    if (isSecure) {
      setPendingEditBill(bill);
      setPendingBulkDelete(false);
      setSecureDialogOpen(true);
    } else {
      setEditingBill(bill);
      setOpen(true);
    }
  };

  const handleSecureActionConfirm = () => {
    if (pendingEditBill) {
      setEditingBill(pendingEditBill);
      setOpen(true);
      setPendingEditBill(null);
      setSecureDialogOpen(false);
    } else if (pendingBulkDelete) {
      handleConfirmBulkDelete();
    } else {
      handleConfirmDelete();
    }
  };

  const handleConfirmDelete = async () => {
    if (!billToDelete) return;
    try {
      await deleteBill(billToDelete);
      showMessage('Bill deleted successfully');
      setSelectedIds(prev => prev.filter(id => id !== billToDelete));
      setSecureDialogOpen(false);
      setDeleteDialogOpen(false);
      setSearchTerm(''); // Reset search bar after successful deletion as requested
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Failed to delete bill', 'error');
    } finally {
      setBillToDelete(null);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setSecureDialogOpen(false);
    setPendingBulkDelete(false);

    try {
      setIsLoading(true);
      const idsToDelete = [...selectedIds];
      const batchSize = 100; // Smaller batch size for bills due to stock restoration complexity
      const total = idsToDelete.length;
      let successCount = 0;
      let failCount = 0;

      setDeletionProgress({ current: 0, total });

      for (let i = 0; i < total; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize);
        try {
          // Use quiet mode to prevent multiple intermediate refreshes
          await deleteBills(batch, true);
          successCount += batch.length;
          setDeletionProgress(prev => prev ? { ...prev, current: Math.min(i + batchSize, total) } : null);
        } catch (batchErr) {
          console.error(`Bill batch starting at ${i} failed:`, batchErr);
          failCount += batch.length;
        }
      }

      // Single refresh after all batches
      window.dispatchEvent(new Event('bills-updated'));
      window.dispatchEvent(new Event('inventory-updated'));

      if (failCount > 0) {
        showMessage(`Deleted ${successCount} bills. ${failCount} bills could not be deleted.`, 'warning');
      } else {
        showMessage(`Successfully deleted ${successCount} bills`, 'success');
      }

      setSelectedIds([]);
      setSelectionMode(false);
      setSearchTerm(''); // Reset search bar after successful bulk deletion as requested
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'An error occurred during bulk deletion.', 'error');
    } finally {
      setIsLoading(false);
      setDeletionProgress(null);
    }
  };

  const handleSelectId = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllOnPage = (checked: boolean) => {
    if (checked) {
      const pageIds = filteredBills.map(p => p.id);
      setSelectedIds(prev => [...new Set([...prev, ...pageIds])]);
    } else {
      const pageIds = filteredBills.map(p => p.id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelectStep = async (count: number | 'all') => {
    try {
      setIsLoading(true);
      const allIds = await getAllBillIds({
        search: deferredSearchTerm,
        status: deferredStatusFilter,
        dateFilter: deferredDateFilter
      });

      if (count === 'all') {
        setSelectedIds(allIds);
      } else {
        setSelectedIds(allIds.slice(0, count));
      }
      setSelectionMode(true);
      setSelectionAnchorEl(null);
      setSelectionMenuAnchorEl(null);
    } catch (err) {
      showMessage('Failed to select items', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, billId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedBill(billId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBill(null);
  };

  const handleViewChange = (event: React.MouseEvent<HTMLElement>, newView: 'list' | 'grid') => {
    if (newView !== null) {
      setViewMode(newView);
      localStorage.setItem('preferredView_Bills', newView);
    }
  };

  const handleDownloadBill = (billId: string, format: 'pdf' | 'excel') => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) {
      showMessage('Error: Bill data not found!', 'error');
      return;
    }
    if (format === 'pdf') {
      navigate(`/bills/view/${billId}?autoDownload=true`);
    } else if (format === 'excel') {
      try {
        exportBillHistory([bill]);
        showMessage('Excel export started');
      } catch (err) {
        showMessage(`Failed to export Excel: ${err instanceof Error ? err.message : String(err)}`, 'error');
      }
    }
    handleMenuClose();
  };

  const handleShareBill = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;
    if (navigator.share) {
      const host = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? (networkIp ? `${networkIp}:${window.location.port}` : window.location.host)
        : window.location.host;
      const shareUrl = `${window.location.protocol}//${host}/share/invoice/${bill.id}`;
      navigator.share({
        title: `Invoice ${bill.billNumber || bill.id.slice(0, 8)}`,
        text: `Hello, your Invoice is ready to view.`,
        url: shareUrl
      }).catch(err => {
        if (err.name !== 'AbortError') copyToClipboard(shareUrl);
      });
    } else {
      shareOnWhatsApp(bill, networkIp);
    }
    handleMenuClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showMessage('Bill link copied to clipboard!');
  };

  const handleViewBill = (billId: string) => {
    navigate(`/bills/view/${billId}`);
  };

  const handleExportAll = (format: 'pdf' | 'excel') => {
    if (filteredBills.length === 0) {
      alert('No bills to export');
      return;
    }
    if (format === 'excel') {
      exportBillHistory(filteredBills);
    } else {
      alert('Bulk PDF export is currently limited. Please export individually or use Excel for reports.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return 'success';
      case 'PENDING_APPROVAL': return 'success';
      case 'PENDING': return 'warning';
      case 'OVERDUE': return 'error';
      case 'DRAFT': return 'default';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const filteredBills = bills;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Bill Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Create, manage and track all your bills and invoices
        </Typography>
      </Box>

      {/* Bulk Action Controls */}
      {(selectionMode || selectedIds.length > 0) && (
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 3,
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 2,
            animation: 'fadeIn 0.3s ease-in-out'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedIds.length} Bills Selected
            </Typography>
            <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" color="inherit" size="small" onClick={() => handleSelectStep(50)} sx={{ color: 'primary.main', fontWeight: 'bold' }}>Top 50</Button>
              <Button variant="contained" color="inherit" size="small" onClick={() => handleSelectStep(500)} sx={{ color: 'primary.main', fontWeight: 'bold' }}>Top 500</Button>
              <Button variant="contained" color="inherit" size="small" onClick={() => handleSelectStep(1000)} sx={{ color: 'primary.main', fontWeight: 'bold' }}>Top 1000</Button>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" color="inherit" onClick={() => { setSelectedIds([]); setSelectionMode(false); }} sx={{ borderColor: 'rgba(255,255,255,0.5)' }}>Cancel</Button>
            <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleBulkDeleteTrigger} disabled={isLoading}>Delete Selected</Button>
          </Box>
        </Paper>
      )}

      {/* Search and Actions */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 }, alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', mb: showFilters ? 3 : 0 }}>
          <TextField
            placeholder="Search bills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            name="bill-search-primary"
            autoComplete="off"
            InputProps={{
              startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: 'primary.main' }} /></InputAdornment>),
              sx: { borderRadius: 3, bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff' },
              autoComplete: 'off'
            }}
            sx={{ flexGrow: 1, maxWidth: { md: 450 } }}
          />
          <Box sx={{
            display: 'flex',
            gap: 1.5,
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: { xs: 'space-between', sm: 'flex-start', md: 'flex-end' }
          }}>
            <Tooltip title={showFilters ? "Hide Filters" : "Show Filters"}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{
                  flexGrow: { xs: 1, sm: 0 },
                  bgcolor: showFilters ? 'primary.main' : 'transparent',
                  color: showFilters ? 'white' : 'primary.main',
                  borderColor: showFilters ? 'primary.main' : undefined,
                  '&:hover': { bgcolor: showFilters ? 'primary.dark' : 'rgba(48, 92, 222, 0.04)', borderColor: showFilters ? 'primary.dark' : 'primary.main' }
                }}
              >
                Filters
              </Button>
            </Tooltip>

            <Tooltip title="Bulk Selection">
              <Button
                variant={selectionMode ? "contained" : "outlined"}
                startIcon={<CheckCircleIcon />}
                onClick={(e) => setSelectionAnchorEl(e.currentTarget)}
                sx={{ flexGrow: { xs: 1, sm: 0 }, borderRadius: 2 }}
              >
                Select...
              </Button>
            </Tooltip>

            <Menu anchorEl={selectionAnchorEl} open={Boolean(selectionAnchorEl)} onClose={() => setSelectionAnchorEl(null)}>
              <MenuItem onClick={() => { handleSelectAllOnPage(true); setSelectionMode(true); setSelectionAnchorEl(null); }}>Select Current Page</MenuItem>
              <MenuItem onClick={() => handleSelectStep('all')}>Select All ({pagination?.total || bills.length} items)</MenuItem>
              <Divider />
              {/* Step-wise Selection Options in Menu for Mobile or Clean Desktop UI */}
              {/* <MenuItem onClick={() => handleSelectStep(50)}>Select 50</MenuItem>
              <MenuItem onClick={() => handleSelectStep(500)}>Select 500</MenuItem>
              <MenuItem onClick={() => handleSelectStep(1000)}>Select 1000</MenuItem> */}
              <Divider />
              <MenuItem onClick={() => { setSelectedIds([]); setSelectionMode(false); setSelectionAnchorEl(null); }} sx={{ color: 'error.main' }}>Clear Selection</MenuItem>
            </Menu>

            {selectionMode && selectedIds.length > 0 && (
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleBulkDeleteTrigger}
                sx={{ borderRadius: 2 }}
              >
                Delete {selectedIds.length}
              </Button>
            )}

            <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: 'center' }}>
              <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewChange} size="small" sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff', borderRadius: 2 }}>
                <ToggleButton value="list" sx={{ px: 2 }}><ViewListIcon fontSize="small" /></ToggleButton>
                <ToggleButton value="grid" sx={{ px: 2 }}><ViewModuleIcon fontSize="small" /></ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              {canExport && (<Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExportAll('excel')} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Export</Button>)}
              {canCreate && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpen}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: 2 }}
                >
                  Create Bill
                </Button>
              )}
            </Stack>
          </Box>
        </Box>

        {showFilters && (
          <Paper sx={{ p: 2, mt: 2, bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F9FAFC', border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <FormControl sx={{ minWidth: 180 }} size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem key="all" value="all">All Status</MenuItem>
                  <MenuItem key="paid" value="paid">Paid</MenuItem>
                  <MenuItem key="pending" value="pending">Pending</MenuItem>
                  <MenuItem key="overdue" value="overdue">Overdue</MenuItem>
                  <MenuItem key="draft" value="draft">Draft</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 180 }} size="small">
                <InputLabel>Date Range</InputLabel>
                <Select value={dateFilter} label="Date Range" onChange={(e) => setDateFilter(e.target.value)}>
                  <MenuItem key="all" value="all">All Time</MenuItem>
                  <MenuItem key="today" value="today">Today</MenuItem>
                  <MenuItem key="week" value="week">Last 7 Days</MenuItem>
                  <MenuItem key="month" value="month">Last 30 Days</MenuItem>
                  <MenuItem key="quarter" value="quarter">Last 3 Months</MenuItem>
                </Select>
              </FormControl>
              {(statusFilter !== 'all' || dateFilter !== 'all') && (
                <Button size="small" onClick={() => { setStatusFilter('all'); setDateFilter('all'); }} sx={{ color: 'text.secondary' }}>Clear</Button>
              )}
              <Box sx={{ flexGrow: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {pagination ? `Showing ${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} bills` : `Showing ${filteredBills.length} bills`}
              </Typography>
              <TextField select size="small" label="Rows" value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))} SelectProps={{ native: true }} sx={{ width: 100 }}>
                <option value={20}>20</option>
                <option value={50}>50</option>
                {/* <option value={100}>100</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option> */}
              </TextField>
            </Stack>
          </Paper>
        )}
      </Paper>

      {(billsLoading || isLoading) && (
        <SectionLoader message={isLoading ? 'Processing...' : 'Cataloging records...'} />
      )}

      {error && (<Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>)}

      {filteredBills.length > 0 ? (
        <Box sx={{ position: 'relative' }}>
          {deletionProgress && (
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(255, 255, 255, 0.8)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 3, backdropFilter: 'blur(4px)' }}>
              <Box sx={{ width: '100%', maxWidth: 400, p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">Deleting Bills...</Typography>
                <LinearProgress variant="determinate" value={(deletionProgress.current / deletionProgress.total) * 100} sx={{ height: 12, borderRadius: 6, mb: 2 }} />
                <Typography variant="body2" color="text.secondary">Processed {deletionProgress.current} of {deletionProgress.total}</Typography>
              </Box>
            </Box>
          )}

          {viewMode === 'list' ? (
            <VirtualizedBillList
              bills={filteredBills}
              height={600}
              onView={handleViewBill}
              onEdit={(bill) => { setEditingBill(bill); setOpen(true); }}
              onMenuOpen={handleMenuOpen}
              selectedIds={selectedIds}
              onSelect={handleSelectId}
              canEdit={canEdit}
              canDelete={canDelete}
              selectionMode={selectionMode}
              onSelectAll={handleSelectAllOnPage}
            />
          ) : (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)', // Show 2 columns on very small devices for Grid view
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)'
              },
              gap: { xs: 1.5, sm: 3 }
            }}>
              {filteredBills.slice(0, rowsPerPage).map((bill) => (
                <Card key={bill.id} sx={{ height: '100%', '&:hover': { boxShadow: 3 }, border: selectedIds.includes(bill.id) ? '2px solid' : 'none', borderColor: 'primary.main', position: 'relative', borderRadius: { xs: 2.5, sm: 3 } }}>
                  {selectionMode && (
                    <Checkbox sx={{ position: 'absolute', top: { xs: 4, sm: 8 }, left: { xs: 4, sm: 8 }, zIndex: 1 }} checked={selectedIds.includes(bill.id)} onChange={() => handleSelectId(bill.id)} />
                  )}
                  <CardContent sx={{ p: { xs: 1.5, sm: 2 }, pt: selectionMode ? 5 : { xs: 1.5, sm: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { xs: 1, sm: 2 }, alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ReceiptIcon sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }} color="action" />
                        <Typography fontWeight="bold" variant="subtitle2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>#{bill.billNumber || bill.id.slice(0, 8)}</Typography>
                      </Box>
                      <Chip
                        label={bill.status === 'PENDING_APPROVAL' ? 'PAID' : bill.status}
                        size="small"
                        color={getStatusColor(bill.status) as any}
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight="bold" noWrap sx={{ mb: 0.5, fontSize: { xs: '0.8rem', sm: '1rem' } }}>{bill.customerName}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontSize: '0.7rem' }}>{new Date(bill.createdAt).toLocaleDateString()}</Typography>
                    <Box sx={{ mt: 'auto', pt: 1, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" color="primary" fontWeight="bold" sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>{formatCompactCurrency(bill.totalAmount)}</Typography>
                      <Box sx={{ display: 'flex' }}>
                        <IconButton size="small" color="primary" onClick={() => handleViewBill(bill.id)} sx={{ p: { xs: 0.5, sm: 1 } }}><VisibilityIcon sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }} /></IconButton>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, bill.id)} sx={{ p: { xs: 0.5, sm: 1 } }}><MoreVert sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }} /></IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {pagination && pagination.totalPages > 1 && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={pagination.totalPages}
                page={page}
                onChange={(_e: React.ChangeEvent<unknown>, v: number) => setPage(v)}
                color="primary"
                size={isMobile ? "small" : "medium"}
              />
            </Box>
          )}
        </Box>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>{searchTerm ? 'No bills found' : 'No bills yet'}</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen} sx={{ mt: 2 }}>Create Bill</Button>
        </Paper>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth fullScreen={isMobile}><DialogContent sx={{ p: 0 }}><BillForm onClose={handleClose} showTitle={false} initialBill={editingBill} /></DialogContent></Dialog>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <MenuItem onClick={() => {
          if (selectedBill) {
            handleViewBill(selectedBill);
          }
          handleMenuClose();
        }}>
          <ListItemIcon><VisibilityIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedBill) {
            const bill = bills.find(b => b.id === selectedBill);
            if (bill) {
              handleEditTrigger(bill);
            }
          }
          handleMenuClose();
        }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedBill && handleDownloadBill(selectedBill, 'pdf')}><ListItemIcon><PictureAsPdf fontSize="small" /></ListItemIcon><ListItemText>PDF</ListItemText></MenuItem>
        <MenuItem onClick={() => selectedBill && handleDownloadBill(selectedBill, 'excel')}><ListItemIcon><Description fontSize="small" /></ListItemIcon><ListItemText>Excel</ListItemText></MenuItem>
        <MenuItem onClick={() => selectedBill && handleShareBill(selectedBill)}><ListItemIcon><Share fontSize="small" /></ListItemIcon><ListItemText>Share</ListItemText></MenuItem>
        {canDelete && (<MenuItem onClick={() => { if (selectedBill) handleDelete(selectedBill); handleMenuClose(); }} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon><ListItemText>Delete</ListItemText></MenuItem>)}
      </Menu>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth><DialogTitle>Confirm Deletion</DialogTitle><DialogContent><DialogContentText>Delete this bill? Cannot be undone.</DialogContentText></DialogContent><DialogActions><Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button><Button onClick={handleConfirmDelete} color="error">Delete</Button></DialogActions></Dialog>

      <SecureActionDialog
        open={secureDialogOpen}
        onClose={() => setSecureDialogOpen(false)}
        onConfirm={handleSecureActionConfirm}
        title={pendingEditBill ? "Authorize Bill Edit" : (pendingBulkDelete ? "Authorize Bulk Deletion" : "Authorize Bill Deletion")}
        message={pendingEditBill ? "Editing a bill is a critical action. Enter your security PIN to proceed." : (pendingBulkDelete ? `You are about to delete ${selectedIds.length} bills. Enter your security PIN to proceed.` : "Deleting a bill is a critical action. Enter your security PIN to proceed.")}
        actionLabel={pendingEditBill ? "Edit Bill" : (pendingBulkDelete ? `Delete ${selectedIds.length} Bills` : "Delete Bill")}
      />

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert></Snackbar>

      {/* FAB for Mobile */}
      {isMobile && canCreate && (
        <Fab
          color="primary"
          aria-label="add bill"
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: 85,
            right: 16,
            boxShadow: 4,
            zIndex: 1000
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
};

export default Bills;
