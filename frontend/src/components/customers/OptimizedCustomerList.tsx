/* eslint-disable */
import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Checkbox,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Stack,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ViewColumn as ViewColumnIcon,
} from '@mui/icons-material';
import { Customer } from '../../types/customer';
import { useOptimizedCustomers, UseOptimizedCustomersOptions } from '../../hooks/useOptimizedCustomers';
import { OptimizedCustomerService } from '../../services/optimizedCustomerService';

interface OptimizedCustomerListProps {
  customerService: OptimizedCustomerService;
  height?: number;
  options?: UseOptimizedCustomersOptions;
  onCustomerSelect?: (customer: Customer) => void;
  onCustomerEdit?: (customer: Customer) => void;
  onCustomerDelete?: (customer: Customer) => void;
  enableVirtualScrolling?: boolean;
  enableBulkActions?: boolean;
  enableSearch?: boolean;
  enableFilters?: boolean;
  visibleColumns?: (keyof Customer)[];
}

interface CustomerRowProps {
  customer: Customer;
  visibleColumns: (keyof Customer)[];
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const CustomerRow: React.FC<CustomerRowProps> = ({
  customer,
  visibleColumns,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}) => {
  const handleMenuAction = (action: string, event: React.MouseEvent) => {
    event.stopPropagation();
    switch (action) {
      case 'edit':
        onEdit();
        break;
      case 'delete':
        onDelete();
        break;
    }
  };

  return (
    <TableRow
      hover
      selected={isSelected}
      onClick={onSelect}
      sx={{ cursor: 'pointer' }}
    >
      <TableCell padding="checkbox">
        <Checkbox
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        />
      </TableCell>

      {visibleColumns.includes('name' as keyof Customer) && (
        <TableCell>
          <Box>
            <Typography variant="subtitle2" noWrap>
              {customer.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {customer.company || 'No company'}
            </Typography>
          </Box>
        </TableCell>
      )}

      {visibleColumns.includes('email' as keyof Customer) && (
        <TableCell>
          <Typography variant="body2" noWrap>
            {customer.email}
          </Typography>
        </TableCell>
      )}

      {visibleColumns.includes('phone' as keyof Customer) && (
        <TableCell>
          <Typography variant="body2" noWrap>
            {customer.phone || '-'}
          </Typography>
        </TableCell>
      )}

      {visibleColumns.includes('address' as keyof Customer) && (
        <TableCell>
          <Typography variant="body2" noWrap>
            {[customer.address, customer.city, customer.state].filter(Boolean).join(', ')}
            {customer.pincode ? ` - ${customer.pincode}` : ''}
            {!customer.address && !customer.city && !customer.state && !customer.pincode ? '-' : ''}
          </Typography>
        </TableCell>
      )}

      {visibleColumns.includes('company' as keyof Customer) && (
        <TableCell>
          <Typography variant="body2" noWrap>
            {customer.company || '-'}
          </Typography>
        </TableCell>
      )}

      {visibleColumns.includes('totalPurchases' as keyof Customer) && (
        <TableCell>
          <Typography variant="body2" fontWeight="medium">
            ₹{(customer.totalPurchases || 0).toLocaleString()}
          </Typography>
        </TableCell>
      )}

      {visibleColumns.includes('createdAt' as keyof Customer) && (
        <TableCell>
          <Typography variant="caption" color="text.secondary">
            {new Date(customer.createdAt).toLocaleDateString()}
          </Typography>
        </TableCell>
      )}

      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size="small"
            onClick={(e) => handleMenuAction('edit', e)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => handleMenuAction('delete', e)}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};

const OptimizedCustomerList: React.FC<OptimizedCustomerListProps> = ({
  customerService,
  height = 600,
  options = {},
  onCustomerSelect,
  onCustomerEdit,
  onCustomerDelete,
  enableVirtualScrolling = false,
  enableBulkActions = true,
  enableSearch = true,
  enableFilters = true,
  visibleColumns = ['name', 'email', 'phone', 'address', 'createdAt'],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<(keyof Customer)[]>(visibleColumns);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    customers,
    total,
    stats,
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    isLoading,
    isRefreshing,
    isSearching,
    isLoadingMore,
    error,
    refresh,
    loadMore,
    search,
    clearSearch,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    exportCustomers,
    selectedCustomers,
    selectCustomer,
    deselectCustomer,
    selectAll,
    clearSelection,
    isSelected,
  } = useOptimizedCustomers(customerService, {
    enablePrefetching: true,
    autoRefresh: true,
    refreshInterval: 30000,
    ...options,
  });

  // Debounced search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim()) {
        search(query);
      } else {
        clearSearch();
      }
    }, 300);
  }, [search, clearSearch]);

  // Infinite scroll handler
  const handleScroll = useCallback((scrollTop: number, scrollHeight: number, clientHeight: number) => {
    const threshold = 100; // pixels from bottom
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;

    if (isNearBottom && hasNext && !isLoadingMore) {
      loadMore();
    }
  }, [hasNext, isLoadingMore, loadMore]);

  // Memoized handlers for performance
  const handleCustomerSelect = useCallback((customer: Customer) => {
    const customerId = customer.id;
    if (isSelected(customerId)) {
      deselectCustomer(customerId);
    } else {
      selectCustomer(customerId);
    }
    onCustomerSelect?.(customer);
  }, [isSelected, selectCustomer, deselectCustomer, onCustomerSelect]);

  const handleCustomerEdit = useCallback((customer: Customer) => {
    onCustomerEdit?.(customer);
  }, [onCustomerEdit]);

  const handleCustomerDelete = useCallback((customer: Customer) => {
    onCustomerDelete?.(customer);
  }, [onCustomerDelete]);

  // Column toggle
  const handleColumnToggle = (column: keyof Customer) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) return;

    try {
      await Promise.all(selectedCustomers.map(id => deleteCustomer(id)));
      clearSelection();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    exportCustomers(format);
  };

  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      console.log(`Customer list render time: ${endTime - startTime}ms`);
    };
  });

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={refresh}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header with stats */}
      {stats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h4" color="primary">
                {stats.totalCustomers.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Customers
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h4" color="success.main">
                {stats.newCustomersThisMonth}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                New This Month
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h4">
                ₹{stats.averagePurchaseAmount.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Purchase
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h4" color="info.main">
                {stats.customerGrowthRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Growth Rate
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {enableSearch && (
            <TextField
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
              size="small"
            />
          )}

          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            {enableBulkActions && selectedCustomers.length > 0 && (
              <>
                <Chip
                  label={`${selectedCustomers.length} selected`}
                  color="primary"
                  size="small"
                />
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleBulkDelete}
                >
                  Delete Selected
                </Button>
              </>
            )}

            <IconButton onClick={() => setShowColumnDialog(true)} size="small">
              <ViewColumnIcon />
            </IconButton>

            <IconButton onClick={refresh} disabled={isRefreshing} size="small">
              <RefreshIcon />
            </IconButton>

            <Button
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('csv')}
              size="small"
            >
              Export
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Customer List */}
      <TableContainer component={Paper} sx={{ maxHeight: height }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedCustomers.length > 0 && selectedCustomers.length < customers.length}
                  checked={customers.length > 0 && selectedCustomers.length === customers.length}
                  onChange={() => {
                    if (selectedCustomers.length === customers.length) {
                      clearSelection();
                    } else {
                      selectAll();
                    }
                  }}
                />
              </TableCell>

              {selectedColumns.includes('name' as keyof Customer) && (
                <TableCell>Name</TableCell>
              )}

              {selectedColumns.includes('email' as keyof Customer) && (
                <TableCell>Email</TableCell>
              )}

              {selectedColumns.includes('phone' as keyof Customer) && (
                <TableCell>Phone</TableCell>
              )}

              {selectedColumns.includes('address' as keyof Customer) && (
                <TableCell>Address</TableCell>
              )}

              {selectedColumns.includes('company' as keyof Customer) && (
                <TableCell>Company</TableCell>
              )}

              {selectedColumns.includes('totalPurchases' as keyof Customer) && (
                <TableCell>Purchases</TableCell>
              )}

              {selectedColumns.includes('createdAt' as keyof Customer) && (
                <TableCell>Created</TableCell>
              )}

              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={selectedColumns.length + 2} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Loading customers...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={selectedColumns.length + 2} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {searchQuery ? 'No customers found matching your search.' : 'No customers found.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  visibleColumns={selectedColumns}
                  isSelected={isSelected(customer.id)}
                  onSelect={() => handleCustomerSelect(customer)}
                  onEdit={() => handleCustomerEdit(customer)}
                  onDelete={() => handleCustomerDelete(customer)}
                />
              ))
            )}

            {isLoadingMore && (
              <TableRow>
                <TableCell colSpan={selectedColumns.length + 2} align="center" sx={{ py: 2 }}>
                  <CircularProgress size={24} />
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    Loading more...
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Footer */}
        {customers.length > 0 && (
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0', textAlign: 'center', bgcolor: 'background.paper' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {customers.length} of {total.toLocaleString()} customers
              {hasNext && (
                <Button size="small" onClick={loadMore} disabled={isLoadingMore} sx={{ ml: 2 }}>
                  Load More
                </Button>
              )}
            </Typography>
          </Box>
        )}
      </TableContainer>

      {/* Column Selection Dialog */}
      <Dialog open={showColumnDialog} onClose={() => setShowColumnDialog(false)}>
        <DialogTitle>Select Visible Columns</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            {(['name', 'email', 'phone', 'company', 'address', 'totalPurchases', 'createdAt'] as (keyof Customer)[]).map((column) => (
              <Box key={column} sx={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  checked={selectedColumns.includes(column)}
                  onChange={() => handleColumnToggle(column)}
                />
                <Typography sx={{ textTransform: 'capitalize' }}>
                  {column}
                </Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowColumnDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OptimizedCustomerList;
