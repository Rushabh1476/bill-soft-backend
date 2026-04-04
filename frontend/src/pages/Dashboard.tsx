/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Avatar,
  Chip,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  IconButton,
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
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  CurrencyRupee as CurrencyRupeeIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  WhatsApp as WhatsAppIcon,
  AdminPanelSettings as AdminIcon,
  PictureAsPdf as PdfIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  LibraryBooks as TemplateIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useBills } from '../hooks/useBills';
import { useCustomers } from '../hooks/useCustomers';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../contexts/AuthContext';
import useRoleBasedAccess from '../hooks/useRoleBasedAccess';
import { usePermissions } from '../contexts/PermissionsContext';
import { useExpenses } from '../hooks/useExpenses';
import { formatCurrency, formatCompactCurrency, formatCompactNumber } from '../utils/currency';
import { getProductService, getBillService } from '../services/DIContainer';
import InventoryAlerts from '../components/dashboard/InventoryAlerts';
import ViewerWelcome from '../components/common/ViewerWelcome';
import { exportBillHistory, shareOnWhatsApp } from '../utils/exportUtils';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
} from '@mui/material';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  onClick?: () => void;
  valueColor?: string;
  isMobile?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changeType, icon, onClick, valueColor, isMobile }) => {
  const changeColor = changeType === 'positive' ? 'success.main' : changeType === 'negative' ? 'error.main' : 'text.secondary';

  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: isMobile ? 1 : 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: isMobile ? 38 : 48, height: isMobile ? 38 : 48 }}>
            {icon}
          </Avatar>
          <Box sx={{ textAlign: 'right' }}>
            <Typography
              variant={isMobile ? "h6" : "h4"}
              component="div"
              fontWeight="bold"
              sx={{ color: value === '—' ? 'text.disabled' : (valueColor || 'text.primary') }}
            >
              {value}
            </Typography>
            <Typography variant="caption" sx={{ color: changeColor, fontWeight: 500 }}>
              {change}
            </Typography>
          </Box>
        </Box>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = useRoleBasedAccess();
  const { permissions: livePermissions, isAdmin, role } = usePermissions();

  const canCreate = permissions.canCreateBills;
  const canViewBills = permissions.canViewBills;
  const canManageCust = permissions.canManageCustomers;
  const canViewCust = permissions.canViewCustomers;
  const canManageProd = permissions.canManageProducts;
  const canViewProd = permissions.canViewProducts;
  const canViewRep = permissions.canViewReports;
  const canManageExp = permissions.canManageExpenses;
  const canViewExp = permissions.canManageExpenses;
  const canViewRev = permissions.canViewReports;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [openModal, setOpenModal] = useState<string | null>(null);

  // Get real data from hooks
  const { bills, refetch: refetchBills, deleteBill } = useBills();
  const { customers } = useCustomers();
  const { products, refetch: refetchProducts } = useProducts();
  const { expenses } = useExpenses();

  const [stats, setStats] = useState({
    productCount: 0,
    productValue: 0,
    billCount: 0,
    billRevenue: 0
  });

  const [billMenuAnchorEl, setBillMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBillForMenu, setSelectedBillForMenu] = useState<any>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const refreshStats = useCallback(async () => {
    try {
      const [pStats, bStats] = await Promise.all([
        getProductService().getProductStats(),
        getBillService().getBillStats()
      ]);
      setStats({
        productCount: pStats.totalCount,
        productValue: pStats.totalValue,
        billCount: bStats.totalCount,
        billRevenue: bStats.totalRevenue
      });
      console.log('[Dashboard] Stats refreshed:', { pStats, bStats });
    } catch (error) {
      console.error('[Dashboard] Failed to refresh stats:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshStats();
    refetchBills(); // Ensure bills are loaded on mount
  }, [refreshStats, refetchBills]);

  // Re-sync Dashboard whenever bills or inventory change (create/edit/delete)
  useEffect(() => {
    const handleBillsUpdated = () => {
      console.log('[Dashboard] bills-updated event — re-fetching');
      refetchBills();
      refreshStats();
    };
    const handleInventoryUpdated = () => {
      console.log('[Dashboard] inventory-updated event — re-fetching');
      refetchProducts();
      refreshStats();
    };
    window.addEventListener('bills-updated', handleBillsUpdated);
    window.addEventListener('inventory-updated', handleInventoryUpdated);
    window.addEventListener('bill-created', handleBillsUpdated);
    return () => {
      window.removeEventListener('bills-updated', handleBillsUpdated);
      window.removeEventListener('inventory-updated', handleInventoryUpdated);
      window.removeEventListener('bill-created', handleBillsUpdated);
    };
  }, [refetchBills, refetchProducts, refreshStats]);

  // Show welcome screen for invited sub-users with no assigned permissions
  const isViewer = !isAdmin && role !== 'ADMIN' && livePermissions.length === 0;
  if (isViewer) return <ViewerWelcome />;

  // Calculate real metrics
  const totalRevenue = stats.billRevenue;
  const totalStockValue = stats.productValue;
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const totalBills = stats.billCount;
  const activeCustomers = customers.length;
  const totalProducts = stats.productCount;

  // Get recent bills (last 5) — only from real API data, never fallback to dummies
  const recentBills = bills
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(bill => ({
      id: bill.id,
      customer: bill.customerName,
      amount: formatCompactCurrency(bill.totalAmount),
      status: bill.status,
      date: new Date(bill.createdAt).toLocaleDateString()
    }));

  // Growth labels — only show if there is real data, otherwise neutral
  const revenueGrowth = totalRevenue > 0 ? `${formatCompactCurrency(totalRevenue)} total` : 'No revenue yet';
  const stockValueGrowth = totalStockValue > 0 ? `${formatCompactCurrency(totalStockValue)} inventory value` : 'No stock value';
  const billsGrowth = totalBills > 0 ? `${totalBills} bill${totalBills !== 1 ? 's' : ''} created` : 'No bills yet';
  const customersGrowth = activeCustomers > 0 ? `${activeCustomers} customer${activeCustomers !== 1 ? 's' : ''}` : 'No customers yet';
  const productsGrowth = totalProducts > 0 ? `${totalProducts} product${totalProducts !== 1 ? 's' : ''}` : 'No products yet';

  // Bills breakdown by status — derived from real bills
  const billsBreakdown = (['PAID', 'PENDING', 'OVERDUE', 'DRAFT'] as const).map(status => {
    const filtered = bills.filter(b => b.status?.toUpperCase() === status);
    const total = filtered.reduce((sum, b) => sum + b.totalAmount, 0);
    return { status, count: filtered.length, amount: formatCompactCurrency(total) };
  });

  // Top active customers — aggregate from real bills
  const customerBillMap = new Map<string, { name: string; email: string; totalBills: number; totalAmount: number }>();
  bills.forEach(b => {
    const key = b.customerId || b.customerName;
    const existing = customerBillMap.get(key);
    if (existing) {
      existing.totalBills += 1;
      existing.totalAmount += b.totalAmount;
    } else {
      customerBillMap.set(key, {
        name: b.customerName,
        email: b.customerEmail || '—',
        totalBills: 1,
        totalAmount: b.totalAmount,
      });
    }
  });
  const topActiveCustomers = Array.from(customerBillMap.values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5)
    .map(c => ({ ...c, totalAmount: formatCompactCurrency(c.totalAmount) }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Pending': return 'warning';
      case 'Overdue': return 'error';
      case 'Draft': return 'default';
      default: return 'default';
    }
  };

  const handleCloseModal = () => setOpenModal(null);

  const showMessage = (message: string, severity: 'success' | 'error' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-bill':
        navigate('/bills/new');
        break;
      case 'add-customer':
        navigate('/customers/new');
        break;
      case 'add-product':
        navigate('/products/new');
        break;
    }
  };

  const handleBillClick = (billId: string) => {
    setOpenModal(`bill-${billId}`);
  };

  const handleBillMenuOpen = (event: React.MouseEvent<HTMLElement>, bill: any) => {
    event.stopPropagation();
    setBillMenuAnchorEl(event.currentTarget);
    setSelectedBillForMenu(bill);
  };

  const handleBillMenuClose = () => {
    setBillMenuAnchorEl(null);
    setSelectedBillForMenu(null);
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
    handleBillMenuClose();
  };

  const handleShareWhatsApp = (billId: string, customer: string, amount: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;
    shareOnWhatsApp(bill);
  };

  const handleShareBill = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    if (navigator.share) {
      const shareUrl = `${window.location.origin}/bills/view/${billId}`;
      navigator.share({
        title: `Bill #${billId}`,
        text: `Check out this bill for ${bill.customerName}`,
        url: shareUrl,
      }).catch(err => {
        if (err.name !== 'AbortError') {
          shareOnWhatsApp(bill);
        }
      });
    } else {
      shareOnWhatsApp(bill);
    }
    handleBillMenuClose();
  };

  const handleDeleteBill = async (billId: string) => {
    if (window.confirm('Are you sure you want to delete this bill? This will restore product stock and cannot be undone.')) {
      try {
        await deleteBill(billId);
        showMessage('Bill deleted successfully');
        refreshStats();
      } catch (err) {
        showMessage(err instanceof Error ? err.message : 'Failed to delete bill', 'error');
      }
    }
    handleBillMenuClose();
  };

  const handleViewFullBill = (billId: string) => {
    // Open full bill view in new window/tab
    window.open(`/bills/view/${billId}`, '_blank');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" gutterBottom>
            Welcome back! 👋
          </Typography>
          <Typography variant={isMobile ? "body2" : "subtitle1"} color="text.secondary">
            Here's what's happening with your business today
          </Typography>
        </Box>
        <Box sx={{ textAlign: isMobile ? 'left' : 'right' }}>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
            Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
            Last Login: {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'First session'}
          </Typography>
        </Box>
      </Box>

      {/* Inventory Alerts Widget */}
      <InventoryAlerts />

      {/* Metrics Cards */}
      <Box className="tour-metric-cards" sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(6, 1fr)'
        },
        gap: 2,
        mb: 4
      }}>
        <MetricCard
          title="Net Profit"
          value={canViewRep ? (netProfit !== 0 ? formatCompactCurrency(netProfit) : '—') : '***'}
          valueColor={netProfit > 0 ? theme.palette.success.main : netProfit < 0 ? theme.palette.error.main : undefined}
          change={canViewRep ? (netProfit !== 0 ? (netProfit > 0 ? `${formatCompactCurrency(netProfit)} profit` : `${formatCompactCurrency(Math.abs(netProfit))} loss`) : 'No data yet') : 'Access restricted'}
          changeType={netProfit > 0 ? "positive" : netProfit < 0 ? "negative" : "neutral"}
          icon={<TrendingUpIcon />}
          onClick={canManageExp ? () => navigate('/expenses') : undefined}
          isMobile={isMobile}
        />
        <MetricCard
          title="Total Expenses"
          value={canViewExp ? (totalExpenses !== 0 ? formatCompactCurrency(totalExpenses) : '—') : '***'}
          valueColor={totalExpenses > 0 ? theme.palette.error.main : undefined}
          change={canViewExp ? (totalExpenses > 0 ? `${formatCompactCurrency(totalExpenses)} spent` : 'No expenses yet') : 'Access restricted'}
          changeType={totalExpenses > 0 ? "negative" : "neutral"}
          icon={<CurrencyRupeeIcon />}
          onClick={canViewExp ? () => navigate('/expenses') : undefined}
          isMobile={isMobile}
        />
        <MetricCard
          title="Total Revenue"
          value={canViewRev ? (totalRevenue !== 0 ? formatCompactCurrency(totalRevenue) : '—') : '***'}
          valueColor={totalRevenue > 0 ? theme.palette.success.main : undefined}
          change={canViewRev ? (totalRevenue > 0 ? `${formatCompactCurrency(totalRevenue)} total` : 'No revenue yet') : 'Access restricted'}
          changeType={totalRevenue > 0 ? "positive" : "neutral"}
          icon={<CurrencyRupeeIcon />}
          onClick={canViewRev ? () => setOpenModal('revenue') : undefined}
          isMobile={isMobile}
        />
        <MetricCard
          title="Total Bills"
          value={canViewBills ? (totalBills !== 0 ? formatCompactNumber(totalBills) : '—') : '***'}
          change={canViewBills ? (totalBills > 0 ? `${formatCompactNumber(totalBills)} bill${totalBills !== 1 ? 's' : ''} created` : 'No bills yet') : 'Access restricted'}
          changeType={totalBills > 0 ? "positive" : "neutral"}
          icon={<ReceiptIcon />}
          onClick={canViewBills ? () => setOpenModal('bills') : undefined}
          isMobile={isMobile}
        />
        <MetricCard
          title="Active Customers"
          value={canViewCust ? (activeCustomers !== 0 ? formatCompactNumber(activeCustomers) : '—') : '***'}
          change={canViewCust ? (activeCustomers > 0 ? `${formatCompactNumber(activeCustomers)} customer${activeCustomers !== 1 ? 's' : ''}` : 'No customers yet') : 'Access restricted'}
          changeType={activeCustomers > 0 ? "positive" : "neutral"}
          icon={<PeopleIcon />}
          onClick={canViewCust ? () => setOpenModal('customers') : undefined}
          isMobile={isMobile}
        />
        <MetricCard
          title="Products"
          value={canViewProd ? (totalProducts !== 0 ? formatCompactNumber(totalProducts) : '—') : '***'}
          change={
            canViewProd
              ? totalProducts > 0
                ? `${formatCompactNumber(totalProducts)} items in inventory`
                : 'No products yet'
              : 'Access restricted'
          }
          changeType="neutral"
          icon={<InventoryIcon />}
          onClick={canViewProd ? () => navigate('/products') : undefined}
          isMobile={isMobile}
        />
      </Box>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: '2fr 1fr'
        },
        gap: 2,
        mt: 2
      }}>
        {/* Recent Bills */}
        {canViewBills && (
          <Paper sx={{ p: 2, height: 'fit-content' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Recent Bills
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                size="small"
                onClick={() => navigate('/bills/new')}
              >
                Create Bill
              </Button>
            </Box>

            {/* Debug: Show bills count */}
            {recentBills.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No recent bills found. Create your first bill to see it here.
              </Typography>
            ) : (
              <List>
                {recentBills.map((bill, index) => (
                  <ListItem
                    key={bill.id}
                    sx={{
                      borderBottom: index < recentBills.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      px: 0,
                      py: 1.5,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        borderRadius: 1,
                      }
                    }}
                    onClick={() => handleBillClick(bill.id)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        <ReceiptIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                      {/* Primary row with bill ID and status */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" fontWeight="medium" noWrap>
                            Bill #{bill.id}
                          </Typography>
                          <Chip
                            label={bill.status}
                            size="small"
                            color={getStatusColor(bill.status) as any}
                            variant="outlined"
                          />
                        </Box>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          color="primary"
                          sx={{
                            flexShrink: 0,
                            ml: 2,
                            display: { xs: 'none', sm: 'block' }
                          }}
                        >
                          {bill.amount}
                        </Typography>
                      </Box>

                      {/* Secondary row with customer and date */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ flex: 1, mr: 1 }}>
                          {bill.customer}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                          {bill.date}
                        </Typography>
                      </Box>

                      {/* Mobile: Amount on separate line */}
                      <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="primary">
                          {bill.amount}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Action buttons */}
                    <Box sx={{ flexShrink: 0, ml: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewFullBill(bill.id);
                        }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="more"
                        size="small"
                        onClick={(e) => {
                          const originalBill = bills.find(b => b.id === bill.id);
                          handleBillMenuOpen(e, originalBill || bill);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        )}

        {/* Quick Actions */}
        <Paper className="tour-quick-actions" sx={{ p: 2, height: 'fit-content' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {canCreate && (
              <Button
                id="tour-create-bill"
                variant="contained"
                startIcon={<ReceiptIcon />}
                fullWidth
                sx={{ justifyContent: 'flex-start' }}
                onClick={() => handleQuickAction('create-bill')}
              >
                Create New Bill
              </Button>
            )}
            {canManageCust && (
              <Button
                variant="outlined"
                startIcon={<PeopleIcon />}
                fullWidth
                sx={{ justifyContent: 'flex-start' }}
                onClick={() => handleQuickAction('add-customer')}
              >
                Add Customer
              </Button>
            )}
            {canManageProd && (
              <Button
                variant="outlined"
                startIcon={<InventoryIcon />}
                fullWidth
                sx={{ justifyContent: 'flex-start' }}
                onClick={() => handleQuickAction('add-product')}
              >
                Add Product
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<TemplateIcon />}
              fullWidth
              sx={{ 
                justifyContent: 'flex-start',
                borderColor: 'primary.light',
                bgcolor: 'rgba(48, 92, 222, 0.04)',
              }}
              onClick={() => navigate('/templates')}
            >
              Invoice Templates & Bill Size
            </Button>
            {permissions.canViewAdminPanel && (
              <Button
                variant="outlined"
                startIcon={<AdminIcon />}
                fullWidth
                sx={{
                  justifyContent: 'flex-start',
                  color: 'primary.main',
                  borderColor: 'primary.light',
                  backgroundColor: theme.palette.mode === 'light' ? 'rgba(48, 92, 222, 0.04)' : 'rgba(255, 255, 255, 0.03)',
                  mt: 1
                }}
                onClick={() => navigate('/admin')}
              >
                Admin Panel
              </Button>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Revenue Breakdown Modal — derived from real bill data */}
      <Dialog open={openModal === 'revenue'} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Revenue Breakdown
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {totalRevenue === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No revenue data available yet. Create your first bill to see a breakdown.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Bill #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bills.slice().sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 10).map((bill, index) => (
                    <TableRow key={bill.id || index}>
                      <TableCell>{bill.billNumber || bill.id?.slice(0, 8)}</TableCell>
                      <TableCell>{bill.customerName}</TableCell>
                      <TableCell align="right">{formatCurrency(bill.totalAmount)}</TableCell>
                      <TableCell align="right">
                        <Chip label={bill.status} size="small" color={getStatusColor(bill.status) as any} variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Bills Breakdown Modal — derived from real bill data */}
      <Dialog open={openModal === 'bills'} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Bills Breakdown
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {totalBills === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No bills yet. Create your first bill to see a status breakdown.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {billsBreakdown.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip
                          label={item.status}
                          size="small"
                          color={getStatusColor(item.status) as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">{item.count}</TableCell>
                      <TableCell align="right">{item.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Active Customers Modal — derived from real bill data */}
      <Dialog open={openModal === 'customers'} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Active Customers
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {topActiveCustomers.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No customer activity yet. Create a bill to see your top customers.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="right">Total Bills</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topActiveCustomers.map((customer: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell align="right">{customer.totalBills}</TableCell>
                      <TableCell align="right">{customer.totalAmount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Products Modal */}
      <Dialog open={openModal === 'products'} onClose={handleCloseModal} maxWidth="md" fullWidth >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Products List
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {totalProducts === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No product data available yet. Add your first product to see it here.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Stock</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product, index) => (
                    <TableRow key={product.id || index}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category || 'N/A'}</TableCell>
                      <TableCell align="right">{formatCompactCurrency(product.price)}</TableCell>
                      <TableCell align="right">{formatCompactNumber(product.stock)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Bill Preview Modals */}
      {
        recentBills.map((bill) => (
          <Dialog
            key={`bill-${bill.id}`}
            open={openModal === `bill-${bill.id}`}
            onClose={handleCloseModal}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Bill #{bill.id} Preview
                <IconButton onClick={handleCloseModal}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Customer: {bill.customer}</Typography>
                <Typography variant="body1" gutterBottom>Amount: {bill.amount}</Typography>
                <Typography variant="body1" gutterBottom>Status: {bill.status}</Typography>
                <Typography variant="body1" gutterBottom>Date: {bill.date}</Typography>

                <Divider sx={{ my: 2 }} />

                {/* Sample bill items */}
                <Typography variant="h6" gutterBottom>Items:</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Rate</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Web Development</TableCell>
                        <TableCell align="right">1</TableCell>
                        <TableCell align="right">₹2,450</TableCell>
                        <TableCell align="right">₹2,450</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </DialogContent>
            <DialogActions sx={{
              gap: 1.5,
              p: 3,
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'stretch'
            }}>
              <Button
                startIcon={<VisibilityIcon />}
                onClick={() => handleViewFullBill(bill.id)}
                variant="outlined"
                fullWidth
              >
                View Full Bill
              </Button>
              <Button
                startIcon={<WhatsAppIcon />}
                onClick={() => handleShareWhatsApp(bill.id, bill.customer, bill.amount)}
                variant="outlined"
                fullWidth
                sx={{
                  color: '#25D366',
                  borderColor: '#25D366',
                  '&:hover': {
                    borderColor: '#25D366',
                    backgroundColor: 'rgba(37, 211, 102, 0.04)'
                  }
                }}
              >
                Share
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownloadBill(bill.id, 'pdf')}
                fullWidth
              >
                PDF
              </Button>
            </DialogActions>
          </Dialog>
        ))
      }
      {/* Bill Action Menu */}
      <Menu
        anchorEl={billMenuAnchorEl}
        open={Boolean(billMenuAnchorEl)}
        onClose={handleBillMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => selectedBillForMenu && handleViewFullBill(selectedBillForMenu.id)}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View Full Bill</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedBillForMenu && handleDownloadBill(selectedBillForMenu.id, 'pdf')}>
          <ListItemIcon><PdfIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Download PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedBillForMenu && handleDownloadBill(selectedBillForMenu.id, 'excel')}>
          <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Export Excel</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedBillForMenu && handleShareBill(selectedBillForMenu.id)}>
          <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Share Bill</ListItemText>
        </MenuItem>
        <Divider />
        {permissions.canDeleteBills && (
          <MenuItem onClick={() => selectedBillForMenu && handleDeleteBill(selectedBillForMenu.id)} sx={{ color: 'error.main' }}>
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Delete Bill</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Global Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
