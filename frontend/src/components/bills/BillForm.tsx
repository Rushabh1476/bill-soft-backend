/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  Card,
  CardContent,
  Alert,
  Stack,
  Checkbox,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useBills } from '../../hooks/useBills';
import { useCustomers } from '../../hooks/useCustomers';
import { useProducts } from '../../hooks/useProducts';
import { useServices } from '../../hooks/useServices';
import { useSuppliers } from '../../hooks/useSuppliers';
import { formatCurrency, formatCompactCurrency, formatCompactNumber } from '../../utils/currency';
import { Customer } from '../../types/customer';
import { useCustomColumns } from '../../hooks/useCustomColumns';

interface BillFormProps {
  onClose?: () => void;
  showTitle?: boolean;
  initialBill?: any; // Used when editing an existing bill
}

interface BillItem {
  productId?: string;
  serviceId?: string;
  isService?: boolean;
  productName: string;
  quantity: number | string;
  price: number;
  total: number;
  taxRate: number; // per-product/service tax rate (%)
  customFields?: Record<string, any>;
}

interface CatalogItem {
  id: string;
  name: string;
  price: number;
  taxRate?: number;
  stock?: number | null;
  isService: boolean;
}

const BillForm: React.FC<BillFormProps> = ({ onClose, showTitle = true, initialBill }) => {
  const { createBill, updateBill, isSubmitting } = useBills();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { customers, loading: customersLoading, refetch: refetchCustomers } = useCustomers();
  const { products, loading: productsLoading, refetch: refetchProducts, loadProducts, updateStock } = useProducts();
  const { services, loading: servicesLoading } = useServices();
  const { suppliers } = useSuppliers();

  const catalogItems: CatalogItem[] = [
    ...products.map(p => ({ ...p, isService: false })),
    ...services.map(s => ({ ...s, isService: true, stock: null }))
  ];

  const { columns: customItemColumns } = useCustomColumns('bill');

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [itemType, setItemType] = useState<'product' | 'service'>('product');
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null);
  const [quantity, setQuantity] = useState<number | string>('');
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [redeemPoints, setRedeemPoints] = useState(false);
  const [error, setError] = useState<string>('');
  const [warning, setWarning] = useState<string>('');
  const [newItemCustomFields, setNewItemCustomFields] = useState<Record<string, any>>({});
  const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Invoice Settings State
  const [invoicePreferences, setInvoicePreferences] = useState<any>(null);
  const [manualBillNumber, setManualBillNumber] = useState('');

  // Load Invoice Settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { templateAPI } = await import('../../services/api');
        const response = await templateAPI.fetchSettings('invoice_settings', 'general_preferences');
        if (response.success && response.data) {
          setInvoicePreferences(response.data);
        }
      } catch (err) {
        console.error('Error loading invoice preferences:', err);
      }
    };
    loadSettings();
  }, []);

  // 🚀 Performance: Load ALL products/services on mount for instant local search
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        // Load up to 2000 products to ensure "Full Search" works instantly
        await loadProducts({ limit: 2000 } as any);
      } catch (err) {
        console.error('[BillForm] Catalog bootstrap failed:', err);
      }
    };
    fetchCatalog();
  }, []);

  // Load initial data when editing
  useEffect(() => {
    if (initialBill) {
      if (customers.length > 0 && initialBill.customerId && !selectedCustomer) {
        const cust = customers.find(c => c.id === initialBill.customerId);
        if (cust) setSelectedCustomer(cust);
      }
      if (initialBill.supplierId) setSelectedSupplierId(initialBill.supplierId);
      if (initialBill.dueDate) {
        setBillDate(new Date(initialBill.dueDate).toISOString().split('T')[0]);
      }
      if (initialBill.items) {
        setBillItems(initialBill.items.map((item: any) => ({
          productId: item.productId,
          serviceId: item.serviceId,
          isService: item.isService,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          taxRate: item.taxRate || 0,
          customFields: item.customFields || {}
        })));
      }
    }
  }, [initialBill, customers]);

  // Real-time Stock Validation & Clear Errors
  useEffect(() => {
    if (selectedProduct) {
      if (error.includes('Stock') || error.includes('product') || error.includes('Quantity')) {
        setError('');
      }
    }
  }, [selectedProduct]);

  const handleNumberKeyDown = (e: React.KeyboardEvent) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (selectedProduct && !selectedProduct.isService && typeof selectedProduct.stock === 'number') {
      const existingItem = billItems.find(item => item.productId === selectedProduct.id && !item.isService);
      const existingQuantity = existingItem ? Number(existingItem.quantity) || 0 : 0;
      const totalRequired = existingQuantity + (Number(quantity) || 0);

      const initialItem = initialBill?.items?.find((i: any) => i.productId === selectedProduct.id && !i.isService);
      const initiallyOrdered = initialItem ? initialItem.quantity : 0;
      const effectiveStock = selectedProduct.stock + initiallyOrdered;

      if (totalRequired > effectiveStock) {
        setError(`Insufficient Stock! Available: ${effectiveStock}${existingQuantity > 0 ? ` (Already added ${existingQuantity})` : ''}`);
        setWarning('');
      } else if (effectiveStock - totalRequired < 10) {
        setWarning(`Warning: Low stock after this sale. Remaining: ${effectiveStock - totalRequired}`);
        setError('');
      } else {
        if (error.startsWith('Insufficient Stock')) setError('');
        setWarning('');
      }
    } else {
      setWarning('');
      if (error && (error.includes('Insufficient Stock') || error.includes('Stock'))) {
        setError('');
      }
    }
  }, [selectedProduct, quantity, billItems]);

  const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
  // Tax is derived per-product: sum of (item.total * item.taxRate / 100)
  const taxAmount = billItems.reduce((sum, item) => sum + (item.total * (item.taxRate || 0)) / 100, 0);
  const grossTotal = subtotal + taxAmount;

  const discountAmount = (selectedCustomer?.loyaltyPoints && redeemPoints)
    ? Math.min(selectedCustomer.loyaltyPoints, grossTotal * 0.10)
    : 0;

  const totalAmount = grossTotal - discountAmount;


  const handleAddProduct = () => {
    if (!selectedProduct) {
      setError('Please select an item');
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    const currentQuantity = Number(quantity);

    const matchFn = (item: BillItem) => {
      if (selectedProduct.isService) return item.serviceId === selectedProduct.id;
      return item.productId === selectedProduct.id;
    };

    const existingItem = billItems.find(matchFn);
    const existingQuantity = existingItem ? Number(existingItem.quantity) || 0 : 0;
    const totalRequiredQuantity = existingQuantity + currentQuantity;

    if (!selectedProduct.isService) {
      const initialItem = initialBill?.items?.find((i: any) => i.productId === selectedProduct.id && !i.isService);
      const initiallyOrdered = initialItem ? initialItem.quantity : 0;
      const effectiveStock = (selectedProduct.stock || 0) + initiallyOrdered;

      if (selectedProduct.stock !== null && selectedProduct.stock !== undefined && totalRequiredQuantity > effectiveStock) {
        setError(`Insufficient Stock! Total Required: ${totalRequiredQuantity}, Available: ${effectiveStock}`);
        return;
      }
    }

    if (existingItem) {
      setBillItems(billItems.map(item =>
        matchFn(item)
          ? {
            ...item,
            quantity: (Number(item.quantity) || 0) + currentQuantity,
            total: ((Number(item.quantity) || 0) + currentQuantity) * selectedProduct.price
          }
          : item
      ));
    } else {
      const newItem: BillItem = {
        productId: selectedProduct.isService ? undefined : selectedProduct.id,
        serviceId: selectedProduct.isService ? selectedProduct.id : undefined,
        isService: selectedProduct.isService,
        productName: selectedProduct.name,
        quantity: currentQuantity,
        price: selectedProduct.price,
        total: currentQuantity * selectedProduct.price,
        taxRate: selectedProduct.taxRate ?? 0,
        customFields: { ...newItemCustomFields }
      };
      setBillItems([...billItems, newItem]);
    }

    setSelectedProduct(null);
    setQuantity('' as any);
    setNewItemCustomFields({});
    setError('');
    setWarning('');
  };

  const handleRemoveProduct = (index: number) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, newQuantity: number | string) => {
    const numQuantity = Number(newQuantity);
    const targetItem = billItems[index];

    if (!targetItem.isService) {
      const product = products.find(p => p.id === targetItem.productId);
      const initialItem = initialBill?.items?.find((i: any) => i.productId === targetItem.productId);
      const initiallyOrdered = initialItem ? initialItem.quantity : 0;
      const effectiveStock = (product?.stock || 0) + initiallyOrdered;

      if (newQuantity !== '' && product && product.stock !== null && product.stock !== undefined && numQuantity > effectiveStock) {
        setError(`Insufficient Stock for ${product.name}! Available: ${effectiveStock}`);
        return;
      }
    }

    const updatedItems = billItems.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          quantity: newQuantity,
          total: (numQuantity || 0) * item.price,
        };
      }
      return item;
    });
    setBillItems(updatedItems);
    if (error.startsWith('Insufficient Stock')) setError('');
  };

  const handleBlurQuantity = (index: number, currentQuantity: number | string) => {
    const num = Number(currentQuantity);
    if (isNaN(num) || num <= 0) {
      handleUpdateQuantity(index, 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }

    if (billItems.length === 0) {
      setError('Please add at least one item');
      return;
    }

    const hasInvalidQuantity = billItems.some(item => !item.quantity || Number(item.quantity) <= 0);
    if (hasInvalidQuantity) {
      setError('All item quantities must be greater than 0');
      return;
    }

    try {
      const paymentStatus: any = 'PAID';
      const branchId = localStorage.getItem('currentBranchId');

      // 1. NORMALIZE PAYLOAD: Ensure no undefined fields reach the backend (which causes 400)
      const billPayload = {
        ...(initialBill ? { id: initialBill.id } : {}),
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name || 'Walk-in Customer',
        customerEmail: selectedCustomer.email || null,
        supplierId: selectedSupplierId || null,
        billNumber: invoicePreferences?.autoGenerateInvoiceNumbers === false ? manualBillNumber : undefined,
        items: billItems.map(item => ({
          productId: item.productId || null,
          serviceId: item.serviceId || null,
          isService: !!item.isService,
          productName: item.productName || 'Unnamed Item',
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
          total: Number(item.total) || 0,
          taxRate: Number(item.taxRate) || 0,
          customFields: item.customFields || {}
        })),
        status: (paymentStatus || 'PAID').toUpperCase(), // Ensure UPPECASE for Prisma Enum
        paymentStatus: (paymentStatus || 'PAID').toUpperCase(),
        dueDate: billDate || new Date().toISOString().split('T')[0],
        redeemPoints: !!redeemPoints,
        branchId: branchId || null
      };


      // 2. Execute transaction
      let result;
      if (initialBill) {
        result = await updateBill(billPayload as any);
      } else {
        result = await createBill(billPayload as any);
      }

      // 3. IMMEDIATE SUCCESS UI: Show success state as soon as API returns
      setToast({ open: true, message: initialBill ? 'Bill updated successfully!' : 'Bill created successfully!', severity: 'success' });

      // Post-creation tasks (Non-blocking)
      const handlePostSuccess = () => {
        // Optimistic stock update - instantly reflects in UI
        updateStock(billItems.filter(i => !i.isService).map(item => ({
          productId: item.productId!,
          quantity: Number(item.quantity)
        })));

        // Dispatch events for real-time sync
        window.dispatchEvent(new Event('bill-created'));
        window.dispatchEvent(new Event('inventory-updated'));
        window.dispatchEvent(new Event('refresh-notifications'));
        window.dispatchEvent(new Event('bills-updated'));

        if (!initialBill && result && (result as any).whatsappUrl) {
          window.open((result as any).whatsappUrl, '_blank');
        }

        // Background refetch
        setTimeout(() => {
          refetchProducts();
          refetchCustomers();
        }, 300);
      };

      // Execute background tasks
      handlePostSuccess();

      // Close or Reset form immediately
      if (onClose) {
        onClose();
      } else {
        setSelectedProduct(null);
        setSelectedCustomer(null);
        setBillItems([]);
        setQuantity('');
        setNewItemCustomFields({});
        setBillDate(new Date().toISOString().split('T')[0]);
        setRedeemPoints(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error('[Billing Transaction Error] Full Response:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to process bill';
      setError(errorMessage);
      setToast({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const hasNoItems = products.length === 0 && services.length === 0;
  const isMissingRequirements = !customersLoading && !productsLoading && (customers.length === 0 || hasNoItems);

  if (isMissingRequirements && !initialBill) {
    return (
      <Box sx={{
        textAlign: 'center',
        bgcolor: 'action.hover',
        minHeight: '450px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 3, md: 6 }
      }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Setup Required
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 450 }}>
          Before you can create a bill, you need to add at least one customer and one product or service to your catalog.
        </Typography>

        <Stack spacing={2} sx={{ width: '100%', maxWidth: 400 }}>
          {customers.length === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => { onClose?.(); navigate('/customers/new'); }}
              fullWidth
              sx={{ py: 1.5, borderRadius: 2 }}
            >
              Add Your First Customer
            </Button>
          )}

          {hasNoItems && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => { onClose?.(); navigate('/products/new'); }}
              fullWidth
              sx={{ py: 1.5, borderRadius: 2 }}
            >
              Add Your First Product/Service
            </Button>
          )}

          <Button variant="text" color="inherit" onClick={onClose} sx={{ mt: 2 }}>
            Cancel
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, maxWidth: 1200, mx: 'auto' }}>
      {showTitle && (
        <Typography variant="h4" gutterBottom>
          Create New Bill
        </Typography>
      )}

      {warning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {warning}
        </Alert>
      )}
      {error && !error.includes('Stock') && !error.includes('product') && !error.includes('Quantity') && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast({ ...toast, open: false })}>
          {toast.message}
        </Alert>
      </Snackbar>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Customer and Bill Details Row */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
            alignItems: 'start'
          }}>
            {/* Customer & Supplier Selection */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Relationship Details
                </Typography>
                <Stack spacing={2}>
                  <Autocomplete
                    options={customers}
                    getOptionLabel={(option) => option.name}
                    value={selectedCustomer}
                    onChange={(_, newValue) => setSelectedCustomer(newValue)}
                    ListboxProps={{
                      sx: {
                        maxHeight: '180px',
                        scrollBehavior: 'smooth',
                        '&::-webkit-scrollbar': { width: '8px' },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                          borderRadius: '10px',
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Customer" required fullWidth />
                    )}
                  />

                  <Autocomplete
                    options={suppliers}
                    getOptionLabel={(option) => option.name}
                    value={suppliers.find(s => s.id === selectedSupplierId) || null}
                    onChange={(_, newValue) => setSelectedSupplierId(newValue?.id || '')}
                    ListboxProps={{
                      sx: {
                        maxHeight: '180px',
                        scrollBehavior: 'smooth',
                        '&::-webkit-scrollbar': { width: '8px' },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                          borderRadius: '10px',
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Link to Supplier (Optional)" fullWidth />
                    )}
                  />
                </Stack>

                {selectedCustomer && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Email: {selectedCustomer.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Phone: {selectedCustomer.phone}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Address: {selectedCustomer.address}
                    </Typography>
                    {/* <Box sx={{ mt: 2, p: 1, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}>
                      <Typography variant="subtitle2">Loyalty Points: {selectedCustomer.loyaltyPoints || 0}</Typography>
                    </Box>
                    <FormControlLabel
                      control={<Checkbox checked={redeemPoints} onChange={(e) => setRedeemPoints(e.target.checked)} disabled={!selectedCustomer.loyaltyPoints} />}
                      label="Redeem Points (Max 10%)"
                    /> */}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Bill Details */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Bill Details
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Bill Date"
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  {invoicePreferences?.autoGenerateInvoiceNumbers === false && (
                    <TextField
                      label="Manual Invoice Number"
                      value={manualBillNumber}
                      onChange={(e) => setManualBillNumber(e.target.value)}
                      placeholder="Enter invoice number (e.g. INV-001)"
                      fullWidth
                      required
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  )}
                  {/* Tax is auto-applied from each product's saved Tax Rate */}
                  <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      💡 Tax is automatically applied from each product's saved Tax Rate (%).
                      You can update a product's tax rate in the Products section.
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Product/Service Selection */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Choose Product or Service
              </Typography>
              {error && (error.includes('Stock') || error.includes('product') || error.includes('Quantity')) && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <ToggleButtonGroup
                color="primary"
                value={itemType}
                exclusive
                onChange={(_, newVal) => {
                  if (newVal) {
                    setItemType(newVal);
                    setSelectedProduct(null);
                    setQuantity(newVal === 'service' ? 1 : '');
                    setError('');
                  }
                }}
                fullWidth
                sx={{ mb: 3 }}
              >
                <ToggleButton value="product">Products</ToggleButton>
                <ToggleButton value="service">Services</ToggleButton>
              </ToggleButtonGroup>

              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' },
                gap: 2,
                alignItems: 'start'
              }}>
                <Autocomplete
                  options={catalogItems.filter(item => itemType === 'product' ? !item.isService : item.isService)}
                  getOptionLabel={(option) => option.name}
                  value={selectedProduct}
                  onChange={(_, newValue) => {
                    setSelectedProduct(newValue);
                    if (itemType === 'service' && (quantity === '' || Number(quantity) <= 0)) {
                      setQuantity(1);
                    }
                  }}
                  loading={productsLoading || servicesLoading}
                  // 🚀 Performance Optimized: Scan entire 1000+ list, but only render top 100 matches to prevent lag
                  filterOptions={(options, state) => {
                    const search = state.inputValue.toLowerCase().trim();
                    const filtered = options.filter(opt =>
                      opt.name.toLowerCase().includes(search) ||
                      (opt as any).sku?.toLowerCase().includes(search)
                    );
                    return filtered.slice(0, 100);
                  }}
                  disablePortal={false}
                  blurOnSelect
                  handleHomeEndKeys
                  ListboxProps={{
                    sx: {
                      maxHeight: '250px',
                      '&::-webkit-scrollbar': { width: '8px' },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                        borderRadius: '10px',
                      }
                    }
                  }}
                  renderOption={(props, option) => (
                    <li {...props} key={`${option.isService ? 's' : 'p'}_${option.id}`}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Typography variant="body1">{option.name}</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                          <Typography variant="caption">
                            {option.isService ? 'Service' : `Stock: ${option.stock || 0}`}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {formatCompactCurrency(option.price)}
                          </Typography>
                        </Box>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={itemType === 'product' ? "Select Product (Search All Products...)" : "Select Service"}
                      fullWidth
                    />
                  )}
                />
                <TextField
                  label="Quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setQuantity('');
                    } else {
                      const numVal = parseInt(val);
                      setQuantity(isNaN(numVal) ? '' : numVal);
                    }
                  }}
                  onBlur={() => {
                    if (quantity === '' || Number(quantity) <= 0) {
                      setQuantity(1);
                    }
                  }}
                  onKeyDown={handleNumberKeyDown}
                  fullWidth
                  inputProps={{ min: 1 }}
                />
                <Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddProduct}
                    fullWidth
                    disabled={!selectedProduct}
                    sx={{ height: 56 }}
                  >
                    Add Item
                  </Button>
                  {/* Stock Helper Text */}
                  {itemType === 'product' && selectedProduct && typeof selectedProduct.stock === 'number' && (
                    <Typography variant="caption" color={selectedProduct.stock < 10 ? 'error' : 'textSecondary'} sx={{ display: 'block', mt: 1, textAlign: 'center', width: '100%' }}>
                      Available Stock: {formatCompactNumber(selectedProduct.stock)}
                    </Typography>
                  )}
                </Box>

              </Box>

              {customItemColumns.length > 0 && selectedProduct && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 2 }}>
                  {customItemColumns.map(col => (
                    <TextField
                      key={col.id}
                      size="small"
                      label={col.label}
                      type={col.type === 'number' ? 'number' : 'text'}
                      value={newItemCustomFields[col.name] || ''}
                      onChange={(e) => setNewItemCustomFields({ ...newItemCustomFields, [col.name]: e.target.value })}
                      placeholder={`Enter ${col.label}`}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Bill Items Table */}
          {billItems.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Bill Items
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                  <Table sx={{ tableLayout: 'fixed', minWidth: 900 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 200, width: 'auto' }}>Product</TableCell>
                        <TableCell align="center" sx={{ width: 120 }}>Price</TableCell>
                        <TableCell align="center" sx={{ width: 120 }}>Quantity</TableCell>
                        <TableCell align="center" sx={{ width: 120 }}>Tax (Rate)</TableCell>
                        {customItemColumns.map(col => (
                          <TableCell key={col.id} align="center" sx={{ width: 120 }}>{col.label}</TableCell>
                        ))}
                        <TableCell align="center" sx={{ width: 120 }}>Total</TableCell>
                        <TableCell align="center" sx={{ width: 80 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {billItems.map((item, index) => {
                        const itemTaxAmt = (item.total * (item.taxRate || 0)) / 100;
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              {item.productName}
                              {item.isService && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  (Service)
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">{formatCompactCurrency(item.price)}</TableCell>
                            <TableCell align="center">
                              <TextField
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '') {
                                    handleUpdateQuantity(index, '');
                                  } else {
                                    const numVal = parseInt(val);
                                    handleUpdateQuantity(index, isNaN(numVal) ? '' : numVal);
                                  }
                                }}
                                onBlur={() => handleBlurQuantity(index, item.quantity)}
                                onKeyDown={handleNumberKeyDown}
                                size="small"
                                inputProps={{ min: 1, style: { textAlign: 'center' } }}
                                sx={{ width: '100%' }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              {(item.taxRate || 0) > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                                  <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                                    GST @ {item.taxRate}%
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatCurrency(itemTaxAmt)}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.disabled">No Tax</Typography>
                              )}
                            </TableCell>
                            {customItemColumns.map(col => (
                              <TableCell key={col.id} align="center">
                                <TextField
                                  size="small"
                                  type={col.type === 'number' ? 'number' : 'text'}
                                  value={item.customFields?.[col.name] || ''}
                                  onChange={(e) => {
                                    const updatedItems = [...billItems];
                                    updatedItems[index] = {
                                      ...item,
                                      customFields: {
                                        ...(item.customFields || {}),
                                        [col.name]: e.target.value
                                      }
                                    };
                                    setBillItems(updatedItems);
                                  }}
                                  inputProps={{ style: { textAlign: 'center' } }}
                                  sx={{ width: '100%' }}
                                />
                              </TableCell>
                            ))}
                            <TableCell align="center">{formatCurrency(item.total)}</TableCell>
                            <TableCell align="center">
                              <IconButton
                                color="error"
                                onClick={() => handleRemoveProduct(index)}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 2 }} />

                {/* Bill Summary */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Box sx={{ minWidth: 300 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Subtotal:</Typography>
                      <Typography>{formatCurrency(subtotal)}</Typography>
                    </Box>
                    {/* Per-rate tax breakdown */}
                    {(() => {
                      const rateMap = new Map<number, number>();
                      billItems.forEach(item => {
                        const rate = item.taxRate || 0;
                        if (rate > 0) {
                          const amt = (item.total * rate) / 100;
                          rateMap.set(rate, (rateMap.get(rate) || 0) + amt);
                        }
                      });
                      if (rateMap.size === 0) {
                        return (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography color="text.secondary">Tax:</Typography>
                            <Typography color="text.secondary">{formatCurrency(0)}</Typography>
                          </Box>
                        );
                      }
                      return Array.from(rateMap.entries()).map(([rate, amt]) => (
                        <Box key={rate} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography color="text.secondary">GST @ {rate}%:</Typography>
                          <Typography color="text.secondary">{formatCurrency(amt)}</Typography>
                        </Box>
                      ));
                    })()}
                    {billItems.some(i => (i.taxRate || 0) > 0) && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ fontWeight: 600 }}>Total Tax:</Typography>
                        <Typography sx={{ fontWeight: 600 }}>{formatCurrency(taxAmount)}</Typography>
                      </Box>
                    )}
                    {discountAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'success.main' }}>
                        <Typography>Loyalty Discount:</Typography>
                        <Typography>-{formatCurrency(discountAmount)}</Typography>
                      </Box>
                    )}
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6">Total:</Typography>
                      <Typography variant="h6">{formatCurrency(totalAmount)}</Typography>
                    </Box>

                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Box sx={{
            display: 'flex',
            gap: 2,
            justifyContent: { xs: 'stretch', sm: 'flex-end' },
            flexDirection: { xs: 'column', sm: 'row' },
            mt: 4
          }}>
            {onClose && (
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={onClose}
                fullWidth={isMobile}
                size={isMobile ? 'large' : 'medium'}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={!selectedCustomer || !billDate || billItems.length === 0 || isSubmitting}
              fullWidth={isMobile}
              size={isMobile ? 'large' : 'medium'}
            >
              {isSubmitting ? 'Saving...' : (initialBill ? 'Update Bill' : 'Create Bill')}
            </Button>
          </Box>
        </Stack>
      </form>
    </Box>
  );
};

export default BillForm;
