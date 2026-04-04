/* eslint-disable */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Alert,
  Autocomplete,
  Card,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
  Snackbar,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CurrencyRupee as MoneyIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Person
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Product } from '../../types/product';
import { useProducts } from '../../hooks/useProducts';
import { useSuppliers } from '../../hooks/useSuppliers';
import { TaxDropdown } from '../shared/TaxDropdown';
import { PRODUCT_CATEGORIES } from '../../constants/categories';
import { useCustomColumns } from '../../hooks/useCustomColumns';
import { validateName } from '../../utils/validation';

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave?: (product: Product) => void;
}

interface ValidationErrors {
  name?: string;
  price?: string;
  taxRate?: string;
  stock?: string;
  sku?: string;
}

const ProductForm: React.FC<ProductFormProps> = ({
  open,
  onClose,
  product: initialProduct,
  onSave
}) => {
  const { createProduct, updateProduct, products } = useProducts();
  const { columns: configuredColumns } = useCustomColumns('product');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { suppliers } = useSuppliers();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<Array<{ key: string, value: string }>>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [formData, setFormData] = useState<Product>({
    id: '',
    name: '',
    description: '',
    price: '' as any,
    taxRate: 0,
    tax: 0,
    stock: '' as any,
    quantity: 1 as any,
    category: '',
    sku: '',
    createdAt: '',
    updatedAt: '',
    customFields: {},
    isMarkedRed: false
  });

  // Categories for suggestions
  // Derive categories dynamically from shared constants + existing products
  const productCategories = React.useMemo(() => {
    const fromProducts = products.map(p => p.category).filter(Boolean) as string[];
    return Array.from(new Set([...PRODUCT_CATEGORIES, ...fromProducts])).sort();
  }, [products]);

  useEffect(() => {
    if (initialProduct) {
      // Split custom fields into configured and ad-hoc
      const configuredFields: Record<string, any> = {};
      const adHocArray: Array<{ key: string, value: string }> = [];
      
      if (initialProduct.customFields) {
        Object.entries(initialProduct.customFields).forEach(([key, value]) => {
          if (configuredColumns.some(col => col.name === key)) {
            configuredFields[key] = value;
          } else if (!key.startsWith('_') && key !== 'importJobId') {
            adHocArray.push({ key, value: String(value) });
          }
        });
      }

      setFormData({
        ...initialProduct,
        customFields: configuredFields
      });
      setCustomFields(adHocArray);
    } else {
      // Reset form for new product
      setFormData({
        id: '',
        name: '',
        description: '',
        price: '' as any,
        taxRate: 0,
        tax: 0,
        stock: '' as any,
        quantity: 1 as any,
        category: '',
        sku: '',
        supplierId: '',
        createdAt: '',
        updatedAt: '',
        customFields: {},
        isMarkedRed: false
      });
      setCustomFields([]);
    }
    setErrors({});
    setSubmitError(null);
  }, [initialProduct, open, configuredColumns]);

  // 🧠 Enhanced Auto-Category Prediction Logic (Mobile-App Style)
  const autoCategoryMap: Record<string, string[]> = {
    'Food & Beverages': [
      'milk', 'bread', 'rice', 'apple', 'food', 'drink', 'oil', 'spice', 'fruit', 'snack', 'biscuit', 'parle', 'chocolate', 'tea', 'coffee', 'juice',
      'sugar', 'salt', 'wheat', 'flour', 'dal', 'pulse', 'egg', 'meat', 'chicken', 'fish', 'paneer', 'cheese', 'butter', 'ghee', 'curd', 'yogurt',
      'maggi', 'noodle', 'pasta', 'sauce', 'jam', 'pickle', 'honey', 'dry fruit', 'cashew', 'almond', 'badam', 'pista', 'kaju', 'water', 'soda',
      'cola', 'pepsi', 'coke', 'lays', 'kurkure', 'chips', 'namkeen', 'sweets', 'mithai', 'haldiram'
    ],
    'Electronics': [
      'laptop', 'pc', 'usb', 'cable', 'battery', 'phone', 'led', 'tv', 'fan', 'ac', 'switch', 'light', 'computer', 'mobile', 'charger', 'mouse',
      'keyboard', 'monitor', 'printer', 'router', 'wifi', 'speaker', 'headphone', 'earphone', 'mote', 'remote', 'bulb', 'tube light', 'inverter',
      'cooler', 'microwave', 'fridge', 'refrigerator', 'washing machine', 'iron', 'press', 'kettle', 'heater', 'camera', 'lens', 'sensor',
      'wire', 'plug', 'socket', 'panel', 'circuit', 'motor', 'pump', 'transformer', 'generator'
    ],
    'Clothing': [
      'shirt', 'pant', 'shoe', 'sock', 'cloth', 'jacket', 'jean', 'dress', 'cap', 'tshirt', 'wear', 'trousers', 'suit', 'tie', 'belt', 'undergarment',
      'banyan', 'vest', 'bra', 'brief', 'underwear', 'saree', 'kurta', 'kurti', 'leggings', 'jeans', 'top', 'gown', 'skirt', 'blouse', 'dupatta',
      'towel', 'handkerchief', 'wallet', 'purse', 'bag', 'handbag', 'watch'
    ],
    'Hardware': [
      'nut', 'bolt', 'tool', 'drill', 'saw', 'hammer', 'pipe', 'plastic', 'metal', 'iron', 'steel', 'pvc', 'elbow', 'tee', 'valve', 'fitting',
      'wrench', 'screwdriver', 'pliers', 'tape', 'glue', 'adhesive', 'screw', 'nail', 'hinge', 'latch', 'lock', 'key', 'handle', 'drill bit',
      'welding', 'rod', 'sheet', 'plate', 'wire mesh', 'cement', 'paint', 'brush', 'roller', 'thinner'
    ],
    'Office Supplies': [
      'pen', 'pencil', 'paper', 'ink', 'book', 'notebook', 'folder', 'desk', 'chair', 'stapler', 'pin', 'clip', 'marker', 'highlighter', 'eraser',
      'sharpener', 'scale', 'ruler', 'calculator', 'envelope', 'file', 'diary', 'calendar', 'register', 'whitener', 'glue stick', 'rubber band'
    ],
    'Health & Beauty': [
      'soap', 'cream', 'mask', 'medicine', 'drug', 'shampoo', 'paste', 'lotion', 'brush', 'toothpaste', 'toothbrush', 'oil', 'hair oil', 'perfume',
      'deo', 'deodorant', 'powder', 'makeup', 'lipstick', 'nail polish', 'sanitizer', 'vitamin', 'tablet', 'capsule', 'syrup', 'ointment', 'bandage',
      'comb', 'razor', 'blade', 'shaver', 'trimmer'
    ],
    'Software & Services': ['repair', 'service', 'maintenance', 'consulting', 'design', 'development', 'clean', 'wash', 'labor', 'installation', 'charge'],
    'Automotive': ['car', 'bike', 'tire', 'part', 'engine', 'fuel', 'brake', 'oil', 'lubricant', 'tube', 'helmet', 'visor', 'mirror', 'bulb', 'indicator'],
    'Sports & Outdoors': ['ball', 'bat', 'gym', 'fitness', 'cycle', 'yoga', 'sport', 'tent', 'camp', 'racket', 'shuttle', 'kit', 'jersey']
  };

  const predictCategory = (name: string): string | null => {
    const tokens = name.toLowerCase().split(/\s+/);
    for (const token of tokens) {
      if (token.length < 2) continue;
      for (const [category, keywords] of Object.entries(autoCategoryMap)) {
        if (keywords.includes(token)) return category;
      }
    }
    // Fallback: check if name contains keyword anywhere
    const nameLower = name.toLowerCase();
    for (const [category, keywords] of Object.entries(autoCategoryMap)) {
      if (keywords.some(keyword => nameLower.includes(keyword))) {
        return category;
      }
    }
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (formData.name) {
      const nameVal = validateName(formData.name);
      if (!nameVal.isValid) newErrors.name = nameVal.error!;
    } else {
      newErrors.name = 'Product name is required';
    }

    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }

    if (formData.taxRate && (formData.taxRate < 0 || formData.taxRate > 100)) {
      newErrors.taxRate = 'Tax rate must be between 0 and 100';
    }

    if (formData.stock !== undefined && formData.stock < 0) {
      newErrors.stock = 'Stock cannot be negative';
    }

    if (formData.sku && formData.sku.trim().length > 0 && formData.sku.trim().length < 3) {
      newErrors.sku = 'SKU must be at least 3 characters if provided';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNumberKeyDown = (e: React.KeyboardEvent) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (field: keyof Product) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    let updatedData = { ...formData };

    if (field === 'price' || field === 'taxRate' || field === 'stock' || field === 'quantity') {
      if (value === '') {
        (updatedData as any)[field] = '' as any;
      } else {
        const numValue = parseFloat(value);
        (updatedData as any)[field] = isNaN(numValue) ? 0 : Math.max(0, numValue);
      }
    } else {
      (updatedData as any)[field] = value;
    }

    // Sync tax and taxRate fields
    if (field === 'taxRate') {
      updatedData.tax = Number(value) || 0;
    }

    setFormData(updatedData);

    // Dynamic field validation
    const newErrors = { ...errors };
    if (field === 'name') {
      const nameVal = validateName(value);
      if (!nameVal.isValid) newErrors.name = nameVal.error!;
      else delete newErrors.name;

      // Smart Auto-Category Prediction
      // Only auto-fill if category is empty or currently matches a predicted category
      const predicted = predictCategory(value);
      if (predicted && (!formData.category || Object.keys(autoCategoryMap).includes(formData.category))) {
        updatedData.category = predicted;
        setFormData(updatedData);
      }
    }
    if (field === 'price') {
      if (parseFloat(value) < 0) newErrors.price = 'Price cannot be negative';
      else delete newErrors.price;
    }
    if (field === 'stock') {
      if (parseInt(value) < 0) newErrors.stock = 'Stock cannot be negative';
      else delete newErrors.stock;
    }

    setErrors(newErrors);
    if (submitError) setSubmitError(null);
  };

  const handleCategoryChange = (event: any, value: string | null) => {
    setFormData(prev => ({ ...prev, category: value || '' }));
  };



  const addCustomField = () => {
    setCustomFields(prev => [...prev, { key: '', value: '' }]);
  };

  const updateCustomField = (index: number, field: 'key' | 'value', value: string) => {
    setCustomFields(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const removeCustomField = (index: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Convert custom fields array back to object
      const customFieldsObject = customFields.reduce((acc, field) => {
        if (field.key.trim()) {
          acc[field.key.trim()] = field.value;
        }
        return acc;
      }, {} as Record<string, string>);

      const productData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        category: formData.category?.trim() || '',
        sku: formData.sku?.trim() || '',
        price: Number(formData.price) || 0,
        stock: Number(formData.stock) || 0,
        quantity: Number(formData.quantity) || 0,
        taxRate: Number(formData.taxRate) || 0,
        customFields: {
          ...(formData.customFields || {}),
          ...customFieldsObject
        },
        updatedAt: new Date().toISOString()
      };

      let result;
      if (initialProduct?.id) {
        // Update existing product
        result = await updateProduct({
          ...productData,
          id: initialProduct.id,
          createdAt: initialProduct.createdAt
        });
      } else {
        // Create new product
        const { id, createdAt, updatedAt, ...productDataWithoutId } = productData;
        result = await createProduct(productDataWithoutId);
      }

      if (onSave) {
        // IMPORTANT: Use the actual result from the server to ensure consistency
        onSave(result);
      }

      // Trigger notification refresh if needed
      window.dispatchEvent(new Event('refresh-notifications'));

      onClose();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to save product. Please check your connection.';
      console.error(' [ProductForm] Submit Error:', errorMessage);
      setSubmitError(errorMessage);

      // Native window alert as a definitive fallback
      if (errorMessage.includes('already exists')) {
        window.alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const isEditMode = Boolean(initialProduct?.id);

  return (
    <React.Fragment>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            maxHeight: isMobile ? '100%' : '90vh'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, borderBottom: isMobile ? '1px solid divider' : 'none' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <InventoryIcon color="primary" />
              <Typography variant="h6">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </Typography>
            </Box>
            {isMobile && (
              <IconButton onClick={onClose} size="small">
                <CancelIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <DialogContent dividers sx={{ p: { xs: 2.5, sm: 3 }, flex: 1, overflowY: 'auto' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2.5, sm: 3 } }}>
              {/* Inline Error Message */}
              {submitError && (
                <Alert
                  severity="error"
                  onClose={() => setSubmitError(null)}
                  sx={{ borderRadius: 2, mb: 1 }}
                >
                  {submitError}
                </Alert>
              )}


              {/* Basic Information */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                  Basic Information
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  label="Product Name"
                  value={formData.name}
                  onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                  onChange={handleChange('name')}
                  error={Boolean(errors.name) && (touched.name || submitAttempted)}
                  helperText={(touched.name || submitAttempted) ? errors.name : ''}
                  required
                  sx={{ flex: 2 }}
                  inputProps={{ maxLength: 30 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <InventoryIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="SKU"
                  value={formData.sku}
                  onChange={handleChange('sku')}
                  error={Boolean(errors.sku)}
                  helperText={errors.sku || 'Stock Keeping Unit'}
                  placeholder="e.g., PROD-001"
                  sx={{ flex: 1 }}
                />
              </Box>

              <Box sx={{ mt: -1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isMarkedRed || false}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, isMarkedRed: e.target.checked }))}
                      color="error"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium" color="error.main">
                        Mark in Red
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Highlight this product for special attention
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                multiline
                rows={isMobile ? 2 : 3}
                placeholder="Enter product description..."
              />

              <Autocomplete
                freeSolo
                options={productCategories}
                value={formData.category}
                onChange={handleCategoryChange}
                ListboxProps={{
                  sx: {
                    maxHeight: '180px', // Restricts to approximately 4 items (45px each)
                    overflowY: 'auto',
                    scrollBehavior: 'smooth',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                      borderRadius: '10px',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      },
                    },
                    '& .MuiAutocomplete-option': {
                      minHeight: '45px',
                      transition: 'background-color 0.2s ease',
                      fontSize: '0.9rem',
                    }
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    placeholder="Select or type category"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <CategoryIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />

              {/* Pricing & Tax */}
              <Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                  Pricing & Tax
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <TextField
                  label="Rate (₹)"
                  type="number"
                  value={formData.price}
                  onBlur={() => setTouched(prev => ({ ...prev, price: true }))}
                  onChange={handleChange('price')}
                  onKeyDown={handleNumberKeyDown}
                  error={Boolean(errors.price) && (touched.price || submitAttempted)}
                  helperText={(touched.price || submitAttempted) ? errors.price : ''}
                  required
                  sx={{ maxWidth: { xs: '100%', sm: 240 } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 'bold', color: 'text.secondary' }}>
                  GST & TAX CONFIGURATION
                </Typography>
                <TaxDropdown
                  taxRate={formData.taxRate || 0}
                  onChange={(newRate) => {
                    setFormData(prev => ({ ...prev, taxRate: newRate, tax: newRate }));
                    setTouched(prev => ({ ...prev, taxRate: true }));
                    // Validations
                    const newErrors = { ...errors };
                    if (newRate < 0 || newRate > 100) {
                      newErrors.taxRate = 'Tax rate must be between 0 and 100';
                    } else {
                      delete newErrors.taxRate;
                    }
                    setErrors(newErrors);
                  }}
                  error={(touched.taxRate || submitAttempted) ? errors.taxRate : undefined}
                />
              </Box>

              {/* Inventory */}
              <Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                  Inventory
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  label="Stock Quantity"
                  type="number"
                  value={formData.stock}
                  onBlur={() => setTouched(prev => ({ ...prev, stock: true }))}
                  onChange={handleChange('stock')}
                  onKeyDown={handleNumberKeyDown}
                  error={Boolean(errors.stock) && (touched.stock || submitAttempted)}
                  helperText={(touched.stock || submitAttempted) ? errors.stock : 'Current items in warehouse'}
                  required
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <InventoryIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <FormControl fullWidth sx={{ flex: 1 }}>
                  <InputLabel>Supplier</InputLabel>
                  <Select
                    value={formData.supplierId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                    label="Supplier"
                    startAdornment={
                      <InputAdornment position="start" sx={{ mr: 1 }}>
                        <Person fontSize="small" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="">
                      <em>None (No Supplier)</em>
                    </MenuItem>
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1 }}>
                    Who provides this stock?
                  </Typography>
                </FormControl>
              </Box>

              {/* Custom Fields */}
              <Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary">
                    Custom Fields
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addCustomField}
                    variant="outlined"
                    size="small"
                    fullWidth={isMobile}
                  >
                    Add Field
                  </Button>
                </Box>
              </Box>
              
              {configuredColumns.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                    CONFIGURED FIELDS
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                    {configuredColumns.map(col => (
                      <TextField
                        key={col.id}
                        fullWidth
                        label={col.label}
                        type={col.type === 'number' ? 'number' : 'text'}
                        value={formData.customFields?.[col.name] || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          customFields: {
                            ...(prev.customFields || {}),
                            [col.name]: e.target.value
                          }
                        }))}
                        required={col.required}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {customFields.map((field, index) => (
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }} key={index}>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'start' } }}>
                      <TextField
                        size="small"
                        label="Label (e.g., Color)"
                        value={field.key}
                        onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                        sx={{ flex: 1 }}
                        required
                      />
                      <TextField
                        size="small"
                        label="Value (e.g., Blue)"
                        value={field.value}
                        onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                        sx={{ flex: 1 }}
                        required
                      />
                      <IconButton
                        color="error"
                        onClick={() => removeCustomField(index)}
                        size="small"
                        sx={{ alignSelf: { xs: 'flex-end', sm: 'auto' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Card>
                ))}
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: { xs: 2, sm: 2.5 }, gap: 1.5, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
            <Button
              onClick={onClose}
              variant="outlined"
              fullWidth={isMobile}
              size={isMobile ? 'large' : 'medium'}
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={loading}
              startIcon={<SaveIcon />}
              fullWidth={isMobile}
              size={isMobile ? 'large' : 'medium'}
              sx={{ borderRadius: 2 }}
            >
              {isEditMode ? 'Update Product' : 'Create Product'}
            </LoadingButton>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={Boolean(submitError)}
        autoHideDuration={6000}
        onClose={() => setSubmitError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          zIndex: 10000,
          bottom: { xs: 80, sm: 24 } // Lift it up on mobile to clear bottom navigation
        }}
      >
        <Alert
          onClose={() => setSubmitError(null)}
          severity="error"
          variant="filled"
          elevation={6}
          sx={{
            width: '100%',
            minWidth: '300px',
            borderRadius: 3,
            fontWeight: 'bold',
            boxShadow: '0 8px 32px rgba(220, 38, 38, 0.4)'
          }}
        >
          {submitError}
        </Alert>
      </Snackbar>
    </React.Fragment >
  );
};

export default ProductForm;
