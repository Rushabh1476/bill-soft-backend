/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
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

// New Billing Module Imports
import { useSettingsContext } from '../../contexts/SettingsContext';
import PrinterService from '../../services/PrinterService';
import { processSaleData } from '../../utils/billingUtils';
import { getBillingTemplate, SUPPORTED_BILLING_FORMATS } from '../../modules/billing-templates';
import BillTemplateRenderer from '../../modules/billing-templates/BillTemplateRenderer';
import { BillSize, BILL_SIZE_DIMENSIONS, BILL_SIZE_COLUMN_LIMITS } from '../../modules/billing-templates/core';
import { 
  Dialog,
  DialogActions, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  DialogTitle,
  DialogContent,
  Modal,
  CircularProgress
} from '@mui/material';
import { 
  Visibility as PreviewIcon,
  Print as PrintIcon
} from '@mui/icons-material';

// Original Components
import A4BillPreview from './A4BillPreview';
import { TemplateComplexity } from '../../types/billTemplate';

// Legacy Module Components
import A4InvoicePreview from '../../modules/billing-templates/previews/A4InvoicePreview';

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

const isThermal = (size: string) => size?.includes('mm') || size?.includes('1/7') || size?.includes('1/8');

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
  const [paymentMode, setPaymentMode] = useState('Cash');

  // New Printing & Compliance State
  const { 
    appearanceSettings, 
    businessProfile, 
    templateOverrides, 
    setTemplateOverrides 
  } = useSettingsContext();

  const [selectedFormat, setSelectedFormat] = useState(() => {
    return localStorage.getItem('billsoft_default_template_id') || appearanceSettings.activeTemplateId || 'default';
  });

  // 🛠️ SYNC DEFAULT (ISSUE 1): Update selected format when default template changes in Library
  useEffect(() => {
    if (!initialBill && appearanceSettings.activeTemplateId) {
      setSelectedFormat(appearanceSettings.activeTemplateId);
    }
  }, [appearanceSettings.activeTemplateId, initialBill]);

  // 🛠️ STRICT RUNTIME MERGE (REQ: DYNAMIC COLUMN MERGING)
  const activeTemplateColumns = useMemo(() => {
    const formatInfo = SUPPORTED_BILLING_FORMATS.find(f => f.id === selectedFormat);
    const metadataSize = formatInfo?.size || 'A4';
    const globalSize = appearanceSettings.defaultBillSize || 'A4';
    
    // 1. Get Base Template Overrides
    const o = 
      templateOverrides[`${selectedFormat}:${globalSize}`] || 
      templateOverrides[`${selectedFormat}:${metadataSize}`] || 
      templateOverrides[selectedFormat];
    
    let baseCols: string[] = [];
    if (o?.settings?.activeColumns && o.settings.activeColumns.length > 0) {
      baseCols = [...o.settings.activeColumns];
    } else {
      const targetSize = o?.settings?.billSize || globalSize || metadataSize;
      const formatMeta = SUPPORTED_BILLING_FORMATS.find(f => f.id === selectedFormat);
      baseCols = formatMeta?.supportedColumns || (isThermal(targetSize) 
        ? ['S.No', 'Item Name', 'Qty', 'Rate', 'Amount']
        : ['S.No', 'Item Name', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount']);
    }

    // 2. Merge with Global User-Defined Columns (from DB)
    const customNames = (customItemColumns || []).map(c => c.name);
    
    // 3. Merge with Template-Specific Custom Columns
    const templateSpecificCustomNames = (o?.settings?.customColumns || []).map((c: any) => c.label);

    // 4. Absolute Deduplication & Pillar Protection
    return Array.from(new Set([
      'S.No', 
      'Item Name', 
      ...baseCols, 
      ...customNames, 
      ...templateSpecificCustomNames,
      'Amount'
    ])).filter(c => c !== 'Status');
  }, [selectedFormat, templateOverrides, appearanceSettings.defaultBillSize, customItemColumns]);

  const level = 1; // Logic driven strictly by activeTemplateColumns.includes('...')

  const [previewOpen, setPreviewOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // New controlled inputs for the Product Row
  const [customPrice, setCustomPrice] = useState<number | string>('');
  const [customTaxRate, setCustomTaxRate] = useState<number | string>(0);
  const [customDiscount, setCustomDiscount] = useState<number | string>(0);
  const [customUnit, setCustomUnit] = useState('PCS');
  const [customHsn, setCustomHsn] = useState('');
  const [customBatch, setCustomBatch] = useState('');
  const [customExp, setCustomExp] = useState('');
  const [customMfg, setCustomMfg] = useState('');
  const [customSize, setCustomSize] = useState('');
  const [templateCustomValues, setTemplateCustomValues] = useState<Record<string, any>>({});

  // Sync inputs when product changes
  useEffect(() => {
    if (selectedProduct) {
      setCustomPrice(selectedProduct.price);
      setCustomTaxRate(selectedProduct.taxRate || 0);
      setCustomHsn((selectedProduct as any).hsn || '');
      setCustomUnit((selectedProduct as any).unit || 'PCS');
    }
  }, [selectedProduct]);

  // Persistence logic
  useEffect(() => {
    localStorage.setItem('lastSelectedFormat', selectedFormat);
  }, [selectedFormat]);

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
      if (initialBill.templateId) {
        setSelectedFormat(initialBill.templateId);
      }
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
      if (initialBill.paymentMode) {
        setPaymentMode(initialBill.paymentMode);
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

  // 🚀 Real-time Compliance & Totals Calculation
  const processedSale = React.useMemo(() => {
    const saleData = {
        items: billItems.map(item => ({
        name: item.productName,
        qty: Number(item.quantity) || 0,
        rate: Number(item.price) || 0,
        taxRate: Number(item.taxRate) || 0,
        discount: 0, 
        hsn: item.customFields?.hsn || '-',
        unit: item.customFields?.unit || 'PCS',
        batch: item.customFields?.batch || '-',
        exp: item.customFields?.exp || '-',
        mfg: item.customFields?.mfg || '-',
        size: item.customFields?.size || '-',
        ...item.customFields
      })),
      isInterState: selectedCustomer?.state !== invoicePreferences?.storeState,
      tcsRate: invoicePreferences?.tcsRate || 0,
      tcsMode: invoicePreferences?.tcsMode || 'TOTAL',
      storeName: invoicePreferences?.storeName || 'BillSoft Store',
      storeAddress: invoicePreferences?.storeAddress || 'Address, City',
      storeGSTIN: invoicePreferences?.storeGSTIN || '12ABCDE1234F1Z1',
      billNo: initialBill?.billNumber || 'AUTO',
      billDate: billDate,
      customerName: selectedCustomer?.name || 'Walk-in Customer',
      customerPhone: selectedCustomer?.phone || '',
      customerAddress: selectedCustomer?.address || '',
      customerGSTIN: selectedCustomer?.gstNumber || '',
      paymentMode: paymentMode,
      bankName: invoicePreferences?.bankName || 'HDFC BANK',
      accountNumber: invoicePreferences?.accountNumber || '50200012345678',
      ifscCode: invoicePreferences?.ifscCode || 'HDFC0001234',
      branchName: invoicePreferences?.branchName || 'PUNE',
      upiId: invoicePreferences?.upiId || 'shop@upi'
    };
    return processSaleData(saleData);
  }, [billItems, selectedCustomer, invoicePreferences, billDate, initialBill, paymentMode]);

  const { summary } = processedSale;
  const totalAmount = summary.grandTotal;
  const subtotal = summary.basicTotal;
  const taxAmount = summary.taxTotal;
  const discountAmount = (selectedCustomer?.loyaltyPoints && redeemPoints)
    ? Math.min(selectedCustomer.loyaltyPoints, totalAmount * 0.10)
    : 0;

  // Final adjustment for loyalty discount if applied outside engine
  const finalPayable = totalAmount - discountAmount;


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

    // 🛡️ REQUIRED FIELD VALIDATION (Template-Specific)
    const formatInfo = SUPPORTED_BILLING_FORMATS.find(f => f.id === selectedFormat);
    const globalSize = appearanceSettings.defaultBillSize || 'A4';
    const metadataSize = formatInfo?.size || 'A4';
    const o = templateOverrides[`${selectedFormat}:${globalSize}`] || 
              templateOverrides[`${selectedFormat}:${metadataSize}`] || 
              templateOverrides[selectedFormat];
    
    const requiredCols = (o?.settings?.customColumns || []).filter((c: any) => c.required);
    for (const col of requiredCols) {
      if (!templateCustomValues[col.label]?.trim()) {
        setError(`Custom column "${col.label}" is required.`);
        return;
      }
    }

    const productPrice = Number(customPrice) || selectedProduct.price;
    const productTaxRate = Number(customTaxRate) || selectedProduct.taxRate || 0;
    const productDiscount = Number(customDiscount) || 0;

    const calculateFinalTotal = (qty: number, price: number, tax: number, disc: number) => {
      const base = qty * price;
      const discounted = base - (base * disc) / 100;
      return discounted + (discounted * tax) / 100;
    };

    if (existingItem) {
      setBillItems(billItems.map(item => {
        if (!matchFn(item)) return item;
        const newQty = (Number(item.quantity) || 0) + currentQuantity;
        return {
          ...item,
          quantity: newQty,
          price: productPrice,
          taxRate: productTaxRate,
          total: calculateFinalTotal(newQty, productPrice, productTaxRate, productDiscount),
          customFields: {
             ...item.customFields,
             discount: productDiscount,
             hsn: customHsn || item.customFields?.hsn,
             batch: customBatch || item.customFields?.batch,
             exp: customExp || item.customFields?.exp,
             size: customSize || item.customFields?.size,
             ...templateCustomValues
          }
        };
      }));
    } else {
      const productQuantity = Number(quantity) || 1;
      const finalTotal = calculateFinalTotal(productQuantity, productPrice, productTaxRate, productDiscount);

      const newItem: BillItem = {
        productId: selectedProduct.isService ? undefined : selectedProduct.id,
        serviceId: selectedProduct.isService ? selectedProduct.id : undefined,
        isService: selectedProduct.isService,
        productName: selectedProduct.name,
        quantity: productQuantity,
        price: productPrice,
        taxRate: productTaxRate,
        total: finalTotal,
          customFields: {
            hsn: customHsn,
            batch: customBatch,
            exp: customExp,
            mfg: customMfg,
            unit: customUnit,
            size: customSize,
            discount: productDiscount,
            ...templateCustomValues
          }
      };
      setBillItems([...billItems, newItem]);
    }

    setSelectedProduct(null);
    setQuantity('' as any);
    setCustomPrice('');
    setCustomTaxRate(0);
    setCustomUnit('PCS');
    setCustomHsn('');
    setCustomBatch('');
    setCustomExp('');
    setCustomMfg('');
    setCustomSize('');
    setTemplateCustomValues({});
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

    // 🛡️ SUBMISSION VALIDATION: Ensure required custom fields are present in all items
    const formatInfo = SUPPORTED_BILLING_FORMATS.find(f => f.id === selectedFormat);
    const globalSize = appearanceSettings.defaultBillSize || 'A4';
    const metadataSize = formatInfo?.size || 'A4';
    const o = templateOverrides[`${selectedFormat}:${globalSize}`] || 
              templateOverrides[`${selectedFormat}:${metadataSize}`] || 
              templateOverrides[selectedFormat];
    
    const requiredColLabels = (o?.settings?.customColumns || []).filter((c: any) => c.required).map((c: any) => c.label);
    
    for (let i = 0; i < billItems.length; i++) {
        const item = billItems[i];
        for (const label of requiredColLabels) {
            if (!item.customFields?.[label]?.trim()) {
                setError(`Item #${i + 1} ("${item.productName}") is missing required custom field: ${label}`);
                return;
            }
        }
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
        branchId: branchId || null,
        templateId: selectedFormat, // Persist Print Format Preference
        paymentMode: paymentMode
      };

      console.log('[Billing Module] Final Payload:', billPayload);

      // 2. Execute transaction
      let result;
      if (initialBill) {
        result = await updateBill(billPayload as any);
      } else {
        result = await createBill(billPayload as any);
      }

      // 3. IMMEDIATE SUCCESS UI
      setToast({ open: true, message: initialBill ? 'Bill updated successfully!' : 'Bill created successfully!', severity: 'success' });

      // REMOVED AUTOMATIC PRINTING (Task 2)
      // The user now saves the bill and can print manually from preview if needed

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

      // Execute background tasks
      handlePostSuccess();

      // DISBABLED AUTOMATIC PREVIEW POPUP (Task 6)
      // setPreviewOpen(true); 

      // DIRECT REDIRECT/CLOSE (Restoring original flow)
      if (onClose) {
        onClose();
      } else {
        navigate('/bills');
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
                  <FormControl fullWidth>
                    <InputLabel>Payment Mode</InputLabel>
                    <Select
                      value={paymentMode}
                      label="Payment Mode"
                      onChange={(e) => setPaymentMode(e.target.value)}
                    >
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="Card">Card</MenuItem>
                      <MenuItem value="UPI">UPI</MenuItem>
                      <MenuItem value="QR">QR</MenuItem>
                      <MenuItem value="Net Banking">Net Banking</MenuItem>
                      <MenuItem value="Credit">Credit (Udhaar)</MenuItem>
                    </Select>
                  </FormControl>

                  {paymentMode === 'QR' && (
                    <Box sx={{ 
                      p: 2, 
                      border: '1px dashed grey', 
                      borderRadius: 1, 
                      textAlign: 'center',
                      bgcolor: 'action.hover'
                    }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Shop's UPI QR Placeholder
                      </Typography>
                      <Box sx={{ 
                        width: 100, 
                        height: 100, 
                        bgcolor: 'white', 
                        mx: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #ddd'
                      }}>
                        <Typography variant="h4" color="text.disabled">QR</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                        {invoicePreferences?.upiId || 'No UPI ID Set'}
                      </Typography>
                    </Box>
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
                gridTemplateColumns: { xs: '1fr', md: 'repeat(auto-fit, minmax(100px, 1fr))' },
                gap: 1.5,
                alignItems: 'start',
                mb: 2,
                transition: 'all 0.3s ease'
              }}>
                <Box sx={{ gridColumn: { md: 'span 2' }, minWidth: 200 }}>
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
                    filterOptions={(options, state) => {
                      const search = state.inputValue.toLowerCase().trim();
                      const filtered = options.filter(opt =>
                        opt.name.toLowerCase().includes(search) ||
                        (opt as any).sku?.toLowerCase().includes(search)
                      );
                      return filtered.slice(0, 100);
                    }}
                    renderOption={(props, option) => (
                      <li {...props} key={`${option.isService ? 's' : 'p'}_${option.id}`}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                          <Typography variant="body1">{option.name}</Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                            <Typography variant="caption">{option.isService ? 'Service' : `Stock: ${option.stock || 0}`}</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatCompactCurrency(option.price)}</Typography>
                          </Box>
                        </Box>
                      </li>
                    )}
                    renderInput={(params) => <TextField {...params} label="Select Item" fullWidth size="small" />}
                  />
                </Box>

                {/* 🌉 THE DATA BRIDGE: Strictly Template-Driven Inputs */}
                {activeTemplateColumns.includes('HSN') && (
                  <TextField label="HSN" size="small" value={customHsn} onChange={(e) => setCustomHsn(e.target.value)} sx={{ width: 100 }} />
                )}
                
                {activeTemplateColumns.includes('Batch') && (
                  <TextField label="Batch" size="small" value={customBatch} onChange={(e) => setCustomBatch(e.target.value)} sx={{ width: 120 }} />
                )}

                {activeTemplateColumns.includes('Exp') && (
                  <TextField label="Exp" size="small" type="date" InputLabelProps={{ shrink: true }} value={customExp} onChange={(e) => setCustomExp(e.target.value)} sx={{ width: 130 }} />
                )}

                {activeTemplateColumns.includes('Mfg') && (
                  <TextField label="Mfg" size="small" value={customMfg} onChange={(e) => setCustomMfg(e.target.value)} sx={{ width: 120 }} />
                )}

                {activeTemplateColumns.includes('Unit') && (
                  <TextField label="Unit" size="small" value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} sx={{ width: 80 }} />
                )}

                {activeTemplateColumns.includes('Qty') && (
                  <TextField label="Qty" type="number" size="small" value={quantity} onChange={(e) => setQuantity(e.target.value)} sx={{ width: 80 }} />
                )}

                {activeTemplateColumns.includes('Rate') && (
                  <TextField label="Price" type="number" size="small" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} sx={{ width: 100 }} />
                )}

                {activeTemplateColumns.includes('Tax') && (
                  <TextField label="GST%" type="number" size="small" value={customTaxRate} onChange={(e) => setCustomTaxRate(e.target.value)} sx={{ width: 80 }} />
                )}

                {/* 🎨 TEMPLATE-SPECIFIC CUSTOM COLUMNS RENDERING */}
                {(() => {
                   const formatInfo = SUPPORTED_BILLING_FORMATS.find(f => f.id === selectedFormat);
                   const globalSize = appearanceSettings.defaultBillSize || 'A4';
                   const metadataSize = formatInfo?.size || 'A4';
                   const o = templateOverrides[`${selectedFormat}:${globalSize}`] || 
                             templateOverrides[`${selectedFormat}:${metadataSize}`] || 
                             templateOverrides[selectedFormat];
                   
                   return (o?.settings?.customColumns || []).map((col: any) => (
                     <TextField 
                       key={col.id}
                       label={col.required ? `${col.label} *` : col.label}
                       size="small"
                       required={col.required}
                       error={col.required && !templateCustomValues[col.label]}
                       type={col.type === 'integer' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                       InputLabelProps={col.type === 'date' ? { shrink: true } : undefined}
                       value={templateCustomValues[col.label] || ''}
                       onChange={(e) => setTemplateCustomValues({...templateCustomValues, [col.label]: e.target.value})}
                       sx={{ 
                         width: 120,
                         '& .MuiInputLabel-root': { color: col.required ? 'error.main' : 'inherit' }
                       }}
                     />
                   ));
                })()}

                {activeTemplateColumns.includes('Discount') && (
                  <TextField label="Disc%" type="number" size="small" value={customDiscount} onChange={(e) => setCustomDiscount(e.target.value)} sx={{ width: 80 }} />
                )}

                {activeTemplateColumns.includes('Size') && (
                  <TextField label="Size" size="small" value={customSize} onChange={(e) => setCustomSize(e.target.value)} sx={{ width: 100 }} />
                )}

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddProduct}
                  disabled={!selectedProduct}
                  sx={{ height: 40, whiteSpace: 'nowrap' }}
                >
                  Add
                </Button>
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
                        <TableCell sx={{ minWidth: 150, width: 'auto' }}>Product</TableCell>
                        {activeTemplateColumns.includes('HSN') && <TableCell align="center" sx={{ width: 100 }}>HSN</TableCell>}
                        {activeTemplateColumns.includes('Batch') && <TableCell align="center" sx={{ width: 100 }}>Batch</TableCell>}
                        {activeTemplateColumns.includes('Exp') && <TableCell align="center" sx={{ width: 100 }}>Exp</TableCell>}
                        {activeTemplateColumns.includes('Mfg') && <TableCell align="center" sx={{ width: 100 }}>Mfg</TableCell>}
                        {activeTemplateColumns.includes('Unit') && <TableCell align="center" sx={{ width: 80 }}>Unit</TableCell>}
                        {activeTemplateColumns.includes('Size') && <TableCell align="center" sx={{ width: 80 }}>Size</TableCell>}
                        
                        {/* 🎨 TEMPLATE-SPECIFIC HEADERS */}
                        {(() => {
                            const formatInfo = SUPPORTED_BILLING_FORMATS.find(f => f.id === selectedFormat);
                            const globalSize = appearanceSettings.defaultBillSize || 'A4';
                            const metadataSize = formatInfo?.size || 'A4';
                            const o = templateOverrides[`${selectedFormat}:${globalSize}`] || 
                                      templateOverrides[`${selectedFormat}:${metadataSize}`] || 
                                      templateOverrides[selectedFormat];
                            return (o?.settings?.customColumns || []).map((col: any) => (
                              <TableCell key={col.id} align="center" sx={{ width: 120 }}>{col.label}</TableCell>
                            ));
                        })()}

                        {activeTemplateColumns.includes('Rate') && <TableCell align="center" sx={{ width: 100 }}>Price</TableCell>}
                        {activeTemplateColumns.includes('Qty') && <TableCell align="center" sx={{ width: 100 }}>Qty</TableCell>}
                        {activeTemplateColumns.includes('Tax') && <TableCell align="center" sx={{ width: 100 }}>Tax</TableCell>}
                        {activeTemplateColumns.includes('Discount') && <TableCell align="center" sx={{ width: 100 }}>Disc%</TableCell>}
                        {customItemColumns.filter(c => activeTemplateColumns.includes(c.name)).map(col => (
                          <TableCell key={col.id} align="center" sx={{ width: 120 }}>{col.label}</TableCell>
                        ))}
                        <TableCell align="center" sx={{ width: 120 }}>Total</TableCell>
                        <TableCell align="center" sx={{ width: 70 }}>Del</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {billItems.map((item, index) => {
                        const itemTaxAmt = (item.total * (item.taxRate || 0)) / 100;
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.productName}</Typography>
                              {item.isService && <Typography variant="caption" display="block">(Service)</Typography>}
                            </TableCell>
                            {activeTemplateColumns.includes('HSN') && <TableCell align="center">{item.customFields?.hsn || '-'}</TableCell>}
                            {activeTemplateColumns.includes('Batch') && <TableCell align="center">{item.customFields?.batch || '-'}</TableCell>}
                            {activeTemplateColumns.includes('Exp') && <TableCell align="center">{item.customFields?.exp || '-'}</TableCell>}
                            {activeTemplateColumns.includes('Mfg') && <TableCell align="center">{item.customFields?.mfg || '-'}</TableCell>}
                             {activeTemplateColumns.includes('Unit') && <TableCell align="center">{item.customFields?.unit || 'Nos'}</TableCell>}
                             
                             {/* 🎨 TEMPLATE-SPECIFIC DATA CELLS */}
                             {(() => {
                                const formatInfo = SUPPORTED_BILLING_FORMATS.find(f => f.id === selectedFormat);
                                const globalSize = appearanceSettings.defaultBillSize || 'A4';
                                const metadataSize = formatInfo?.size || 'A4';
                                const o = templateOverrides[`${selectedFormat}:${globalSize}`] || 
                                          templateOverrides[`${selectedFormat}:${metadataSize}`] || 
                                          templateOverrides[selectedFormat];
                                return (o?.settings?.customColumns || []).map((col: any) => (
                                  <TableCell key={col.id} align="center">
                                    <TextField
                                      size="small"
                                      value={item.customFields?.[col.label] || ''}
                                      onChange={(e) => {
                                        const updatedItems = [...billItems];
                                        updatedItems[index] = {
                                          ...item,
                                          customFields: { ...(item.customFields || {}), [col.label]: e.target.value }
                                        };
                                        setBillItems(updatedItems);
                                      }}
                                      inputProps={{ style: { textAlign: 'center' } }}
                                    />
                                  </TableCell>
                                ));
                             })()}

                             {activeTemplateColumns.includes('Rate') && <TableCell align="center">{formatCompactCurrency(item.price)}</TableCell>}
                            {activeTemplateColumns.includes('Qty') && (
                              <TableCell align="center">
                                <TextField
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    handleUpdateQuantity(index, val === '' ? '' : parseInt(val));
                                  }}
                                  size="small"
                                  inputProps={{ style: { textAlign: 'center' } }}
                                  sx={{ width: 80 }}
                                />
                              </TableCell>
                            )}
                            {activeTemplateColumns.includes('Tax') && (
                              <TableCell align="center">
                                <Typography variant="caption" display="block">{item.taxRate}%</Typography>
                                <Typography variant="caption" color="text.secondary">{formatCurrency(itemTaxAmt)}</Typography>
                              </TableCell>
                            )}
                            {activeTemplateColumns.includes('Discount') && (
                              <TableCell align="center">
                                <Typography variant="body2">{item.customFields?.discount || 0}%</Typography>
                              </TableCell>
                            )}
                            {customItemColumns.filter(c => activeTemplateColumns.includes(c.name)).map(col => (
                              <TableCell key={col.id} align="center">
                                <TextField
                                  size="small"
                                  value={item.customFields?.[col.name] || ''}
                                  onChange={(e) => {
                                    const updatedItems = [...billItems];
                                    updatedItems[index] = {
                                      ...item,
                                      customFields: { ...(item.customFields || {}), [col.name]: e.target.value }
                                    };
                                    setBillItems(updatedItems);
                                  }}
                                  inputProps={{ style: { textAlign: 'center' } }}
                                />
                              </TableCell>
                            ))}
                            <TableCell align="center" sx={{ fontWeight: 700 }}>{formatCurrency(item.total)}</TableCell>
                            <TableCell align="center">
                              <IconButton color="error" onClick={() => handleRemoveProduct(index)} size="small">
                                <DeleteIcon fontSize="small" />
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
                    {summary.tcsAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'error.main' }}>
                        <Typography>TCS Amount ({invoicePreferences?.tcsRate || 0}%):</Typography>
                        <Typography>+{formatCurrency(summary.tcsAmount)}</Typography>
                      </Box>
                    )}
                    {discountAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'success.main' }}>
                        <Typography>Loyalty Discount:</Typography>
                        <Typography>-{formatCurrency(discountAmount)}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, color: 'text.secondary', fontStyle: 'italic' }}>
                      <Typography variant="body2">Round Off:</Typography>
                      <Typography variant="body2">{summary.roundOff}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6">Final Total:</Typography>
                      <Typography variant="h6">{formatCurrency(finalPayable)}</Typography>
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
            alignItems: 'center',
            justifyContent: { xs: 'stretch', sm: 'flex-end' },
            flexDirection: { xs: 'column', sm: 'row' },
            mt: 4
          }}>
            <Box sx={{ flexGrow: 1 }} />

            <Button
              variant="outlined"
              color="secondary"
              startIcon={<PreviewIcon />}
              onClick={() => setPreviewOpen(true)}
              disabled={billItems.length === 0}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Preview
            </Button>

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
              sx={{ minWidth: 150 }}
            >
              {isSubmitting ? 'Saving...' : (initialBill ? 'Update Bill' : 'Save Bill')}
            </Button>
          </Box>
        </Stack>
      </form>

      {/* Invoice Preview Modal */}
      <Dialog 
        open={previewOpen} 
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Invoice Preview ({SUPPORTED_BILLING_FORMATS.find(f => f.id === selectedFormat)?.label})
          <IconButton onClick={() => setPreviewOpen(false)}><CancelIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f3f4f6', p: { xs: 1, md: 4 }, overflow: 'auto' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            width: '100%',
            pb: 4 // Bottom padding for scroll clearance
          }}>
            {(() => {
              const previewKey = `preview-${selectedFormat}`;
              const formatInfo = SUPPORTED_BILLING_FORMATS.find(f => f.id === selectedFormat);
              const isThermal = formatInfo?.device === 'thermal' || selectedFormat.includes('thermal') || selectedFormat.includes('80mm') || selectedFormat.includes('58mm');
              const sizeDims = BILL_SIZE_DIMENSIONS[(formatInfo?.size as BillSize) || 'A4'] || BILL_SIZE_DIMENSIONS['A4'];

              return (
                <Box key={previewKey} sx={{ 
                  width: sizeDims?.width || '210mm',
                  minHeight: sizeDims?.height !== 'auto' ? sizeDims?.height : '600px',
                  transform: isThermal ? 'scale(1.1)' : 'scale(1)', 
                  transformOrigin: 'top center',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  bgcolor: 'white',
                  border: '1px solid #e5e7eb',
                  mb: 4
                }}>
                  <BillTemplateRenderer 
                    saleData={{ ...processedSale, templateId: selectedFormat }} 
                    size={formatInfo?.size || 'A4'}
                    activeColumns={activeTemplateColumns}
                  />
                </Box>
              );
            })()}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPreviewOpen(false)}>Close Preview</Button>
          <Button 
            variant="contained" 
            startIcon={<PrintIcon />} 
            onClick={() => {
              PrinterService.print(processedSale, selectedFormat, activeTemplateColumns);
              setPreviewOpen(false);
            }}
          >
            Print Now
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillForm;
