/* eslint-disable */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Alert,
  Fab,
  useTheme,
  useMediaQuery,
  alpha,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Snackbar,
  Checkbox,
  CircularProgress,
  Pagination,
  LinearProgress,
  Menu,
} from '@mui/material';
import { SectionLoader } from '../components/common/LoadingScreen';
import {
  Add as AddIcon,
  Flag as FlagIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
  Upload as UploadIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import ProductForm from '../components/products/ProductForm';
import BulkProductManager from '../components/products/BulkProductManager';
import ColumnConfigDialog from '../components/shared/ColumnConfigDialog';
import VirtualizedProductList from '../components/products/VirtualizedProductList';
import { useProducts } from '../hooks/useProducts';
import { useSuppliers } from '../hooks/useSuppliers';
import { Product } from '../types/product';
import { formatCurrency, formatCompactCurrency, formatCompactNumber } from '../utils/currency';
import { useAuth } from '../contexts/AuthContext';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';
import { resolveFileUrl } from '../utils/url';
import { LoadingScreen } from '../components/common';
import { PRODUCT_CATEGORIES } from '../constants/categories';
import { useCustomColumns } from '../hooks/useCustomColumns';
import SecureActionDialog from '../components/shared/SecureActionDialog';

const Products: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deferredSearchTerm, setDeferredSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => (localStorage.getItem('preferredView_Products') as 'list' | 'grid') || 'list');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [deferredStatusFilter, setDeferredStatusFilter] = useState('All Status');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [deferredCategoryFilter, setDeferredCategoryFilter] = useState('All Categories'); // Replaced Date with Category as it fits products better
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [undoDelete, setUndoDelete] = useState<{ ids: string[], products: Product[], timeout: any } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [selectionMode, setSelectionMode] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState<{ current: number, total: number } | null>(null);
  const [selectAllAnchorEl, setSelectAllAnchorEl] = useState<null | HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectionMenuAnchorEl, setSelectionMenuAnchorEl] = useState<null | HTMLElement>(null);

  const { columns: customColumns } = useCustomColumns('product');

  const { products, pagination, loadProductsPaginated, deleteProduct, deleteProducts, createProduct, updateProduct, error, loading: productsLoading, getAllProductIds } = useProducts();
  const loading = productsLoading || isLoading;
  const { suppliers } = useSuppliers();
  const { user } = useAuth();

  // Secure Actions
  const [secureDialogOpen, setSecureDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [pendingEditProduct, setPendingEditProduct] = useState<Product | null>(null);
  const isSecureEnabled = localStorage.getItem('secureActionsEnabled') === 'true';
  const permissions = useRoleBasedAccess();
  const canView = permissions.canViewProducts;
  const canCreate = permissions.canManageProducts;
  const canEdit = permissions.canManageProducts;
  const canDelete = permissions.canManageProducts;

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.searchProduct || location.state?.triggerEditId) {
      // Set the search term
      if (location.state.searchProduct) {
        setSearchTerm(location.state.searchProduct);
      }

      // Auto-open edit modal if products are loaded
      if (location.state.triggerEditId && products.length > 0) {
        const productToEdit = products.find(p => p.id === location.state.triggerEditId);
        if (productToEdit) {
          handleEdit(productToEdit);
          // Clear the state so it doesn't re-trigger on subsequent re-renders or navigation back
          navigate(location.pathname, { replace: true, state: {} });
        }
      }
    }
  }, [location.state, products, navigate]);

  useEffect(() => {
    if (localStorage.getItem('bulkImportJobId')) {
      setBulkOpen(true);
    }
  }, []);

  const lastLoadRef = useRef(0);
  // Use refs to track latest filter values without triggering re-renders
  const filtersRef = useRef({ page, rowsPerPage, deferredSearchTerm, deferredCategoryFilter, deferredStatusFilter });
  useEffect(() => {
    filtersRef.current = { page, rowsPerPage, deferredSearchTerm, deferredCategoryFilter, deferredStatusFilter };
  });

  if (!canView) {
    return (
      <Box sx={{ p: 5, textAlign: 'center', mt: 10 }}>
        <Paper sx={{ p: 5, borderRadius: 3 }}>
          <Typography variant="h5" color="error">Access Denied</Typography>
          <Typography color="text.secondary" sx={{ mt: 2 }}>You do not have permission to view products.</Typography>
          <Button sx={{ mt: 3 }} variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Paper>
      </Box>
    );
  }

  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
  };

  const handleOpen = () => {
    setOpen(true);
    setEditingProduct(null);
  };

  const handleEditTrigger = (product: Product) => {
    const isSecure = localStorage.getItem('secureActionsEnabled') === 'true';
    if (isSecure) {
      setPendingEditProduct(product);
      setPendingBulkDelete(false);
      setSecureDialogOpen(true);
    } else {
      setEditingProduct(product);
      setOpen(true);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setOpen(true);
  };

  const showMessage = (message: string, severity: 'success' | 'error' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleBulkOpen = () => {
    setBulkOpen(true);
  };

  const handleBulkClose = () => {
    setBulkOpen(false);
    // Refresh products on close just in case some were imported
    loadProductsPaginated({ page, limit: rowsPerPage, search: deferredSearchTerm });
  };

  const handleBulkImport = async (bulkProducts: Product[]) => {
    for (const product of bulkProducts) {
      const { id, createdAt, updatedAt, ...productData } = product;
      await createProduct(productData);
    }
  };

  const handleDelete = (productId: string) => {
    setProductToDelete(productId);
    setPendingBulkDelete(false);
    const isSecure = localStorage.getItem('secureActionsEnabled') === 'true';
    if (isSecure) {
      setSecureDialogOpen(true);
    } else {
      if (window.confirm('Are you sure you want to delete this product?')) {
        handleConfirmDelete(productId);
      }
    }
  };

  const handleBulkDeleteTrigger = () => {
    if (selectedIds.length === 0) return;
    const isSecure = localStorage.getItem('secureActionsEnabled') === 'true';
    if (isSecure) {
      setPendingBulkDelete(true);
      setSecureDialogOpen(true);
    } else {
      if (window.confirm(`Are you sure you want to delete ${selectedIds.length} products? This will permanently remove them.`)) {
        handleConfirmBulkDelete();
      }
    }
  };

  const handleSecureActionConfirm = () => {
    if (pendingEditProduct) {
      handleEdit(pendingEditProduct);
      setPendingEditProduct(null);
      setSecureDialogOpen(false);
    } else if (pendingBulkDelete) {
      handleConfirmBulkDelete();
    } else {
      handleConfirmDelete();
    }
  };

  const handleConfirmDelete = async (id?: string) => {
    const targetId = id || productToDelete;
    if (!targetId) return;
    try {
      await deleteProduct(targetId);
      showMessage('Product Deleted Successfully');
      setSearchTerm(''); // Clear search box after successful deletion
    } catch (err: any) {
      showMessage(err?.message || 'Failed to delete product', 'error');
      console.error('Failed to delete product:', err?.message || err);
    } finally {
      setSecureDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setSecureDialogOpen(false);
    setPendingBulkDelete(false);
    const idsToDelete = [...selectedIds];
    const total = idsToDelete.length;
    let actualDeletedFromServer = 0;

    try {
      setIsDeleting(true);
      setDeletionProgress({ current: 0, total });

      // --- IMPROVED BATCHING (As Requested) ---
      // We chunk the 1000+ items into smaller slices to keep the UI moving 
      // and avoid a single massive payload that might hit proxy/server limits.
      const BATCH_SIZE = 100;
      for (let i = 0; i < total; i += BATCH_SIZE) {
        const chunk = idsToDelete.slice(i, i + BATCH_SIZE);
        await deleteProducts(chunk, true); // True = quiet (don't refresh yet)

        actualDeletedFromServer += chunk.length;
        setDeletionProgress({ current: Math.min(i + BATCH_SIZE, total), total });
      }

      // Final clean-up and forced table refresh with no-cache protocol
      window.dispatchEvent(new Event('inventory-updated'));
      localStorage.removeItem('isBulkImporting'); // Job finished, don't resume next time

      showMessage(`Deletion complete: All ${actualDeletedFromServer} selected products were removed.`);

      setSelectedIds([]);
      setSelectionMode(false);
      // Force synchronous reload of page 1 to verify results
      loadProductsPaginated({ page: 1, limit: rowsPerPage, search: deferredSearchTerm });
    } catch (err: any) {
      console.error('Core loop failure in bulk delete:', err);
      showMessage('A system error occurred during the deletion process.', 'error');
      loadProductsPaginated({ page, limit: rowsPerPage, search: deferredSearchTerm });
    } finally {
      setIsDeleting(false);
      setDeletionProgress(null);
    }
  };

  // getAllProductIds is already available from the top-level useProducts() call above

  const handleSelectStep = async (count: number | 'all') => {
    try {
      setIsLoading(true);
      const allIds = await getAllProductIds({
        search: deferredSearchTerm,
        category: deferredCategoryFilter === 'All Categories' ? undefined : deferredCategoryFilter,
        status: deferredStatusFilter === 'All Status' ? undefined : deferredStatusFilter
      });

      if (count === 'all') {
        setSelectedIds(allIds);
      } else {
        setSelectedIds(allIds.slice(0, count));
      }
      setSelectionMode(true);
      setSelectAllAnchorEl(null);
      setSelectionMenuAnchorEl(null);
    } catch (err) {
      showMessage('Failed to select items', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // 1. Give immediate UI feedback with current page items
      const currentIds = products.map(p => p.id);
      setSelectedIds(currentIds);

      // 2. If there are more items globally, fetch ALL matching IDs to remove the "20" limit
      if (pagination && pagination.total > products.length) {
        try {
          setIsLoading(true);
          const allBatchIds = await getAllProductIds({
            search: deferredSearchTerm,
            category: deferredCategoryFilter === 'All Categories' ? undefined : deferredCategoryFilter,
            status: deferredStatusFilter === 'All Status' ? undefined : deferredStatusFilter
          });
          setSelectedIds(allBatchIds); // This removes any paging limit
          showMessage(`Selected all ${allBatchIds.length} matching products.`);
        } catch (err) {
          console.error('[Selection] Global select failed:', err);
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleProductSave = (product: Product) => {
    const msg = product.id ? 'Product updated successfully' : 'Product created successfully';
    setSuccessMessage(msg);
    setSnackbar({ open: true, message: msg, severity: 'success' });
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedIds([]);
    }
  };

  const handleViewChange = (event: React.MouseEvent<HTMLElement>, newView: 'list' | 'grid') => {
    if (newView !== null) {
      setViewMode(newView);
      localStorage.setItem('preferredView_Products', newView);
    }
  };

  // Stable load function — does NOT have loadProductsPaginated in deps to avoid infinite loops
  // Reads current filter values from ref to always use latest values
  const doLoad = useCallback(() => {
    const now = Date.now();
    if (now - lastLoadRef.current < 400) {
      // console.log('[Products] Load throttled (too frequent)');
      return;
    }
    lastLoadRef.current = now;

    const { page, rowsPerPage, deferredSearchTerm, deferredCategoryFilter, deferredStatusFilter } = filtersRef.current;
    loadProductsPaginated({
      page,
      limit: rowsPerPage,
      search: deferredSearchTerm,
      category: deferredCategoryFilter === 'All Categories' ? undefined : deferredCategoryFilter,
      status: deferredStatusFilter === 'All Status' ? undefined : deferredStatusFilter,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadProductsPaginated]);

  // Single effect: re-fetch when filters or page change
  useEffect(() => {
    doLoad();
  }, [page, rowsPerPage, deferredSearchTerm, deferredCategoryFilter, deferredStatusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Single, stable inventory-updated listener
  useEffect(() => {
    const handleRefresh = () => doLoad();
    window.addEventListener('inventory-updated', handleRefresh);
    return () => window.removeEventListener('inventory-updated', handleRefresh);
  }, [doLoad]);

  // Task 2: Auto-dismiss header success notification after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const uniqueCategories = useMemo(() => {
    // We can't easily get unique categories across all products without a separate API call now
    // For now, use the standard ones or keep it as is if it was just UI sugar
    return ['Uncategorized', ...PRODUCT_CATEGORIES].sort();
  }, []);

  // Task 1: Fix 'Uncategorized' Filter Connectivity
  // Although server-side filtering is active, we apply a frontend filter function 
  // to ensure consistency for 'Uncategorized' (null, empty, or explicitly set).
  const filteredProducts = useMemo(() => {
    if (deferredCategoryFilter === 'All Categories') return products;

    return products.filter(product => {
      if (deferredCategoryFilter === 'Uncategorized') {
        // Correct displays products where the category is null, empty, or explicitly 'Uncategorized'
        return !product.category || product.category.trim() === '' || product.category === 'Uncategorized';
      }
      return product.category === deferredCategoryFilter;
    });
  }, [products, deferredCategoryFilter]);

  const productDisplay = useMemo(() => {
    if (filteredProducts.length === 0) {
      return (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant='h6' color='text.secondary' gutterBottom>
            {searchTerm ? 'No products found' : 'No products yet'}
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Start by adding your first product to get started'
            }
          </Typography>
          {!searchTerm && canCreate && (
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleOpen}>
              Add Your First Product
            </Button>
          )}
        </Paper>
      );
    }

    if (viewMode === 'list') {
      return (
        <VirtualizedProductList
          products={filteredProducts}
          suppliers={suppliers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          selectedIds={selectedIds}
          onSelect={handleSelectOne}
          canEdit={canEdit}
          canDelete={canDelete}
          height={600}
          selectionMode={selectionMode}
          onSelectAll={(checked) => handleSelectAll({ target: { checked } } as any)}
          customColumns={customColumns}
        />
      );
    }

    return (
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)'
        },
        gap: 3,
        position: 'relative'
      }}>
        {filteredProducts.slice(0, rowsPerPage).map((product) => (
          <Card
            sx={{
              height: '100%',
              position: 'relative',
              transition: 'all 0.3s ease',
              border: selectedIds.includes(product.id)
                ? `2px solid ${theme.palette.primary.main}`
                : `1px solid ${theme.palette.divider}`,
              bgcolor: selectedIds.includes(product.id)
                ? alpha(theme.palette.primary.main, 0.05)
                : 'background.paper',
              cursor: 'pointer',
              overflow: 'hidden',
              '&:hover': {
                boxShadow: theme.shadows[4],
                borderColor: theme.palette.primary.light
              }
            }}
            key={product.id}
            onClick={() => handleSelectOne(product.id)}
          >
            {product.imageUrl && (
              <Box sx={{
                height: 180,
                overflow: 'hidden',
                position: 'relative',
                bgcolor: 'grey.50',
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={resolveFileUrl(product.imageUrl)}
                  alt={product.name}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </Box>
            )}
            <CardContent sx={{ pb: 2, pt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                  {selectionMode && (
                    <Checkbox
                      size="small"
                      checked={selectedIds.includes(product.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleSelectOne(product.id)}
                      sx={{ p: 0, mr: 0.5 }}
                    />
                  )}
                  <Typography variant='h6' fontWeight='bold' noWrap sx={{ flex: 1 }}>
                    {product.name}
                    {product.isMarkedRed && (
                      <FlagIcon sx={{ color: 'error.main', fontSize: 18, ml: 1, verticalAlign: 'middle' }} />
                    )}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {canEdit && (
                    <Button
                      size='small'
                      variant='outlined'
                      onClick={() => handleEditTrigger(product)}
                      sx={{ minWidth: 'auto', p: 0.5 }}
                    >
                      <EditIcon fontSize='small' />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size='small'
                      variant='outlined'
                      color='error'
                      onClick={() => handleDelete(product.id)}
                      sx={{ minWidth: 'auto', p: 0.5 }}
                    >
                      <DeleteIcon fontSize='small' />
                    </Button>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {product.description && (
                  <Typography variant='body2' color='text.secondary' sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {product.description}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant='h6' fontWeight='bold' color='primary'>
                    {formatCompactCurrency(product.price)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InventoryIcon fontSize='small' color='action' />
                  <Typography variant='body2' color='text.secondary'>
                    Stock: {formatCompactNumber(product.stock)} units
                  </Typography>
                </Box>

                {/* Display Custom Fields (if any) */}
                {product.customFields && Object.keys(product.customFields).length > 0 && (
                  <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(product.customFields).map(([key, value]) => {
                      // Skip internal keys if any exist
                      if (key.startsWith('_') || key === 'importJobId') return null;

                      // For configured columns, match with its label if possible
                      const col = (customColumns || []).find(c => c.name === key);
                      const displayLabel = col ? col.label : key;

                      return (
                        <Box key={key} sx={{
                          bgcolor: 'action.hover',
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 0.5
                        }}>
                          <Typography variant="caption" fontWeight="bold" color="text.secondary">
                            {displayLabel}:
                          </Typography>
                          <Typography variant="caption" fontWeight="medium">
                            {String(value)}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>

              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={
                      !product.stock || product.stock <= 0 ? 'Out of Stock' :
                        product.stock <= 10 ? 'Low Stock' : 'In Stock'
                    }
                    size='small'
                    color={
                      !product.stock || product.stock <= 0 ? 'error' :
                        product.stock <= 10 ? 'warning' : 'success'
                    }
                    variant={(product.stock && product.stock <= 10) ? 'filled' : 'outlined'}
                  />
                  <Typography variant='caption' color='text.secondary'>
                    Added {new Date(product.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }, [filteredProducts, viewMode, canEdit, canDelete, searchTerm, canCreate, handleOpen, handleEdit, handleDelete, selectionMode, selectedIds, suppliers, theme, customColumns, rowsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  // Sync deferred filters using React.startTransition
  useEffect(() => {
    const handler = setTimeout(() => {
      React.startTransition(() => {
        setDeferredSearchTerm(searchTerm);
        setDeferredStatusFilter(statusFilter);
        setDeferredCategoryFilter(categoryFilter);
      });
    }, 150); // fast 150ms debounce
    return () => clearTimeout(handler);
  }, [searchTerm, statusFilter, categoryFilter]);


  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Product Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your product catalog and inventory
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* Controls Bar */}
      <Paper sx={{ p: 2, mb: 4 }}>
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
              placeholder="Search products..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
              name="product-catalog-search"
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
              label="Stock Status"
            >
              <MenuItem key="all" value="All Status">All Status</MenuItem>
              <MenuItem key="in-stock" value="In Stock">In Stock</MenuItem>
              <MenuItem key="low-stock" value="Low Stock">Low Stock</MenuItem>
              <MenuItem key="out-of-stock" value="Out of Stock">Out of Stock</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 150 } }}
              label="Category"
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      maxHeight: '180px', // Restricts to 4 items
                      scrollBehavior: 'smooth',
                      '&::-webkit-scrollbar': {
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                        borderRadius: '10px',
                      }
                    }
                  }
                }
              }}
            >
              <MenuItem key="all" value="All Categories">All Categories</MenuItem>
              {uniqueCategories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
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
            {!selectionMode ? (
              <>
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

                {canDelete && products.length > 0 && (
                  <Button
                    variant="outlined"
                    onClick={handleToggleSelectionMode}
                    sx={{ borderRadius: 2 }}
                  >
                    Select Items
                  </Button>
                )}

                {canCreate && (
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={handleBulkOpen}
                    sx={{ flexGrow: { xs: 1, sm: 0 }, borderRadius: 2 }}
                  >
                    Import
                  </Button>
                )}
                {canCreate && (
                  <Button
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    onClick={() => setConfigOpen(true)}
                    sx={{ flexGrow: { xs: 1, sm: 0 }, borderRadius: 2, ml: 1 }}
                  >
                    Configure Columns
                  </Button>
                )}
                {canCreate && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpen}
                    sx={{ flexGrow: { xs: 1, sm: 0 }, borderRadius: 2 }}
                  >
                    Add Product
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={handleCancelSelection}
                  sx={{ borderRadius: 2 }}
                >
                  Cancel
                </Button>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  {/* Mobile Selection Menu Trigger */}
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => setSelectionMenuAnchorEl(e.currentTarget)}
                    sx={{ display: { xs: 'inline-flex', lg: 'none' }, borderRadius: 2 }}
                  >
                    Select...
                  </Button>

                  {/* <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleSelectStep(50)}
                    sx={{ display: { xs: 'none', lg: 'inline-flex' }, borderRadius: 2 }}
                  >
                    Select 50
                  </Button> */}
                  {/* <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleSelectStep(500)}
                    sx={{ display: { xs: 'none', lg: 'inline-flex' }, borderRadius: 2 }}
                  >
                    Select 500
                  </Button> */}
                  {/* <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleSelectStep(1000)}
                    sx={{ display: { xs: 'none', lg: 'inline-flex' }, borderRadius: 2 }}
                  >
                    Select 1000
                  </Button> */}
                </Box>

                {/* <Menu
                  anchorEl={selectionMenuAnchorEl}
                  open={Boolean(selectionMenuAnchorEl)}
                  onClose={() => setSelectionMenuAnchorEl(null)}
                >
                  <MenuItem onClick={() => handleSelectStep(50)}>Select 50</MenuItem>
                  <MenuItem onClick={() => handleSelectStep(500)}>Select 500</MenuItem>
                  <MenuItem onClick={() => handleSelectStep(1000)}>Select 1000</MenuItem>
                </Menu> */}

                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleBulkDeleteTrigger}
                  disabled={selectedIds.length === 0}
                  sx={{ borderRadius: 2 }}
                >
                  Delete {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                </Button>

                {/* Select All Menu */}
                <Menu
                  anchorEl={selectAllAnchorEl}
                  open={Boolean(selectAllAnchorEl)}
                  onClose={() => setSelectAllAnchorEl(null)}
                >
                  <MenuItem onClick={() => {
                    setSelectedIds(products.map(p => p.id));
                    setSelectAllAnchorEl(null);
                  }}>
                    Select Current Page ({products.length})
                  </MenuItem>
                  <MenuItem onClick={() => handleSelectStep('all')}>
                    Select All Products ({pagination?.total})
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Products Content */}
      <Box sx={{ minHeight: 400, position: 'relative' }}>
        {isDeleting && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2
          }}>
            <Box sx={{ textAlign: 'center', width: '80%', maxWidth: 400 }}>
              <SectionLoader />
              <Typography variant="h6" gutterBottom>
                {deletionProgress ? `Deleting ${deletionProgress.current} of ${deletionProgress.total}...` : 'Deleting products...'}
              </Typography>
              {deletionProgress && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(deletionProgress.current / deletionProgress.total) * 100}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {Math.round((deletionProgress.current / deletionProgress.total) * 100)}% Complete
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
        {loading && !isDeleting && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(4px)',
            borderRadius: 2,
            transition: 'all 0.3s ease'
          }}>
            <SectionLoader message="Syncing catalog..." transparent />
          </Box>
        )}
        {productDisplay}
      </Box>

      {/* Pagination Controls */}
      {pagination && (
        <Box sx={{
          mt: 4,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">Rows per page:</Typography>
            <TextField
              select
              size="small"
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              sx={{ width: 80 }}
              SelectProps={{ sx: { py: 0 } }}
            >
              {[10, 20, 50].map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Total Products: {pagination.total}
          </Typography>
        </Box>
      )}

      {/* Floating Action Button for Mobile */}
      {isMobile && canCreate && (
        <Fab
          color='primary'
          aria-label='add product'
          sx={{
            position: 'fixed',
            bottom: 85,
            right: 16,
            zIndex: 1000
          }}
          onClick={handleOpen}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Product Form Dialog */}
      <ProductForm
        open={open}
        onClose={handleClose}
        product={editingProduct}
        onSave={handleProductSave}
      />

      {/* Original Bulk Product Import */}
      <BulkProductManager
        open={bulkOpen}
        onClose={handleBulkClose}
        onBulkImport={handleBulkImport}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', alignItems: 'center' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ColumnConfigDialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        entity="product"
      />

      <SecureActionDialog
        open={secureDialogOpen}
        onClose={() => setSecureDialogOpen(false)}
        onConfirm={handleSecureActionConfirm}
        title={pendingEditProduct ? "Authorize Product Edit" : (pendingBulkDelete ? "Authorize Bulk Deletion" : "Authorize Product Deletion")}
        message={pendingEditProduct ? "Editing a product is a critical action. Enter your security PIN to proceed." : (pendingBulkDelete ? `You are about to delete ${selectedIds.length} products. This is a critical action. Enter your security PIN to proceed.` : "Deleting a product is a critical action. Enter your security PIN to proceed.")}
        actionLabel={pendingEditProduct ? "Edit Product" : (pendingBulkDelete ? `Delete ${selectedIds.length} Products` : "Delete Product")}
      />
    </Box>
  );
};

export default Products;
