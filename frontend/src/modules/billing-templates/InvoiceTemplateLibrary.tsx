/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Switch,
  Slider,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
  Snackbar,
  alpha,
} from '@mui/material';
import { 
  Description as DescriptionIcon,
  Tune as TuneIcon,
  Settings as SettingsIcon,
  Check as CheckIcon,
  Search as SearchIcon,
  TableChart as TableChartIcon,
  Business as BusinessIcon,
  ShoppingCart as RetailIcon,
  Handyman as ServiceIcon,
  Receipt as TaxIcon,
  Autorenew as RecurringIcon,
  TrendingUp as ExpenseIcon,
  Handshake as ConsultingIcon,
  AssignmentTurnedIn as ProjectIcon,
  LocalShipping as DeliveryIcon,
  TextFields as CustomFieldIcon,
  Visibility as PreviewIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Close as CloseIcon,
  ContentCopy as DuplicateIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { api } from '../../services/api';
import { 
  InvoiceTemplate, 
  TemplateField, 
  TemplateSettings, 
  BILL_SIZE_DIMENSIONS, 
  BillSize, 
  BILL_SIZE_COLUMN_LIMITS,
  SIZE_CONFIG
} from './core';
import { MOCK_TEMPLATES } from './core/mockData';
import { ThemeProvider } from '@mui/material/styles';
import { modernTheme } from '../../theme/theme';
import BillTemplateRenderer from './BillTemplateRenderer';
import { SUPPORTED_BILLING_FORMATS } from './index';
import { useSettingsContext } from '../../contexts/SettingsContext';

/**
 * Main Invoice Template Library Component
 * Handles template search, selection, preview, and customization
 */
const MOCK_BILL = {
  id: 'preview-123',
  billNumber: 'INV/2026/001',
  customerName: 'Mehul Deshwal',
  createdAt: new Date().toISOString(),
  paymentMode: 'UPI',
  subtotal: 8150,
  taxAmount: 1467,
  totalAmount: 9617,
  items: [
    { productName: 'Professional Service', quantity: 1, price: 4500, taxRate: 18, total: 4500 },
    { productName: 'Consulting Fee', quantity: 2, price: 1200, taxRate: 18, total: 2400 },
    { productName: 'Technical Support', quantity: 5, price: 250, taxRate: 5, total: 1250 }
  ],
  user: {
    companyName: 'AG BIT SOLUTIONS',
    address: '123 Tech Park, Digital City',
    gstNumber: '27AAAAA0000A1Z5',
    phone: '+91 9876543210',
    bankName: 'HDFC BANK',
    accountNumber: '502000543210',
    ifscCode: 'HDFC0001234',
    upiId: 'agbit@upi'
  }
} as any;

const InvoiceTemplateLibrary: React.FC = () => {
  const { appearanceSettings, setAppearanceSettings, refreshSettings, templateOverrides, setTemplateOverrides } = useSettingsContext();
  const [activeFormat, setActiveFormat] = useState(appearanceSettings.activeTemplateId);
  const [selectedSize, setSelectedSize] = useState(appearanceSettings.defaultBillSize);

  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [lastSyncFailed, setLastSyncFailed] = useState(false);

  // Template categories and complexities
  const categories = ['all', 'business', 'retail', 'service', 'consulting', 'healthcare', 'education'];
  const complexities = ['all', 'basic', 'standard', 'advanced'];
  const billSizes = ['80mm', '58mm', '1/4 Size', '1/5 Size', '1/6 Size', '1/7 Size', '1/8 Size', 'A4', 'A5'];
  const allFormats = SUPPORTED_BILLING_FORMATS;

  // Dialog states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [columnManagerOpen, setColumnManagerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);

  // Notification state
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Keep local selection state in sync with context
  useEffect(() => {
    setActiveFormat(appearanceSettings.activeTemplateId);
    setSelectedSize(appearanceSettings.defaultBillSize);
  }, [appearanceSettings.activeTemplateId, appearanceSettings.defaultBillSize]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const syncTemplateConfig = async (size: string, format: string) => {
    setIsSaving(true);
    try {
      const { templateAPI } = await import('../../services/api');
      await templateAPI.updateTemplateConfig({
        defaultBillSize: size,
        activeTemplateId: format
      });

      // ONLY update local and global state AFTER server confirmation
      setActiveFormat(format);
      setSelectedSize(size);

      setAppearanceSettings(prev => ({
        ...prev,
        defaultBillSize: size,
        activeTemplateId: format
      }));

      localStorage.setItem('billsoft_default_bill_size', size);
      localStorage.setItem('billsoft_default_template_id', format);

      setLastSyncFailed(false);
    } catch (err: any) {
      console.error('Failed to sync config:', err);
      setLastSyncFailed(true);
      
      // REVERT: If save fails, revert UI to the last known database state from context
      setSelectedSize(appearanceSettings.defaultBillSize);
      setActiveFormat(appearanceSettings.activeTemplateId);

      setNotification({
        open: true,
        message: 'Save Failed: Reverting to last known secure state ⚠️',
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetrySync = async () => {
    try {
      // Clear local cache for recovery
      localStorage.removeItem('billsoft_default_bill_size');
      localStorage.removeItem('billsoft_default_template_id');
      localStorage.removeItem('billsoft_template_overrides');
      
      setLastSyncFailed(false);
      setLoading(true);
      
      // Re-fetch from Single Source of Truth (Database)
      await refreshSettings();
      await fetchTemplates();
      
      showNotification('🔄 Sync Restored Successfully!', 'success');
    } catch (err) {
      setLastSyncFailed(true);
      showNotification('Retry failed. Please check connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, selectedCategory, selectedComplexity, showFavoritesOnly]);

  // ─── localStorage persistence helpers ──────────────────────────────────────
  // The GET /templates API only returns user-created custom templates, NOT the
  // saved settings/fields for built-in templates (IDs 1-6). So we persist those
  // overrides in localStorage and merge them back on every load.
  const LS_KEY = 'billsoft_template_overrides';

  const getLocalOverrides = (): Record<string, { settings?: any; fields?: any }> => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    } catch {
      return {};
    }
  };

  const saveLocalOverride = (templateId: string, size: string, patch: { settings?: any; fields?: any }) => {
    const key = `${templateId}:${size}`;
    const overrides = getLocalOverrides();
    overrides[key] = { ...(overrides[key] || {}), ...patch };
    localStorage.setItem(LS_KEY, JSON.stringify(overrides));
  };

  /** Merge localStorage overrides into a list of templates */
  const mergeOverrides = (list: InvoiceTemplate[]): InvoiceTemplate[] => {
    const overrides = getLocalOverrides();
    const defaultId = localStorage.getItem('billsoft_default_template_id');
    
    return list.map(t => {
      // Priority: 1. size-specific override, 2. general override, 3. original template
      const sizeKey = `${t.id}:${selectedSize}`;
      const override = overrides[sizeKey] || overrides[t.id];
      
      const template = {
        ...t,
        isDefault: defaultId ? t.id === defaultId : t.isDefault,
        settings: {
          ...t.settings,
          billSize: selectedSize as BillSize
        }
      };

      if (!override) return template;

      return {
        ...template,
        settings: { 
          ...template.settings, 
          ...(override.settings || {}),
          billSize: selectedSize as BillSize // Maintain current size context
        },
        fields: override.fields || template.fields,
      };
    });
  };
  // ────────────────────────────────────────────────────────────────────────────

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user-created custom templates from backend
      const response = await api.get('/templates');
      const customTemplates = response.data.customTemplates || [];

      // Merge saved localStorage overrides into built-in templates so that
      // settings/fields changes survive page refresh (the API GET endpoint
      // does NOT return saved settings for built-in template IDs 1-6).
      const merged = mergeOverrides([
        ...MOCK_TEMPLATES, 
        ...SUPPORTED_BILLING_FORMATS.filter(s => 
          !MOCK_TEMPLATES.some(m => m.id === s.id)
        ).map(s => ({
          id: s.id,
          name: s.label,
          description: `Industry-standard ${s.size} template for ${s.device} billing.`,
          category: s.device === 'thermal' ? 'retail' : 'business',
          complexity: 'standard' as const,
          preview: '',
          settings: { 
            billSize: s.size as BillSize, 
            activeColumns: (s.size === '80mm' || s.size === '58mm') ? ['Item Name', 'Qty', 'Amount'] : ['S.No', 'Item Name', 'Qty', 'Rate', 'Amount'],
            colorScheme: '#10B981',
            logoPosition: 'top-left' as const,
            fontFamily: 'Inter',
            fontSize: 10,
            showBorder: true,
            headerHeight: 60,
            footerHeight: 40,
            margins: { top: 10, bottom: 10, left: 10, right: 10 }
          },
          tags: [s.device, s.size],
          fields: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })),
        ...customTemplates
      ]);
      setTemplates(merged);
    } catch (err) {
      console.error('Error fetching templates:', err);
      // Fallback: still apply any locally-saved overrides
      const defaultList = [
        ...MOCK_TEMPLATES,
        ...SUPPORTED_BILLING_FORMATS.filter(s => !MOCK_TEMPLATES.some(m => m.id === s.id)).map(s => ({
          id: s.id,
          name: s.label,
          description: `Industry-standard ${s.size} template`,
          category: 'business',
          complexity: 'standard' as const,
          preview: '',
          settings: { 
            billSize: s.size as BillSize, 
            activeColumns: (s.size === '80mm' || s.size === '58mm') ? ['Item Name', 'Qty', 'Amount'] : ['S.No', 'Item Name', 'Qty', 'Rate', 'Amount'],
            colorScheme: '#10B981',
            logoPosition: 'top-left' as const,
            fontFamily: 'Inter',
            fontSize: 10,
            showBorder: true,
            headerHeight: 40,
            footerHeight: 40,
            margins: { top: 10, bottom: 10, left: 10, right: 10 }
          },
          tags: [s.device, s.size],
          fields: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
      ];
      setTemplates(mergeOverrides(defaultList));
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Complexity filter
    if (selectedComplexity !== 'all') {
      filtered = filtered.filter(template => template.complexity === selectedComplexity);
    }

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(template => template.isFavorite);
    }

    setFilteredTemplates(filtered);
  };

  const handleTemplateSelect = async (templateId: string, overrideSize?: string) => {
    if (isSaving) return; // Anti-race condition
    
    // Determine which size to save: the provided override (for manual size changes) 
    // or the current selectedSize state (for template card clicks)
    const sizeToSave = overrideSize || selectedSize;

    try {
      // Sync with database first. Note: local state now only updates on success within syncTemplateConfig
      await syncTemplateConfig(sizeToSave, templateId);
      
      // Update template list isDefault status locally
      setTemplates(prev => prev.map(template => ({
        ...template,
        isDefault: template.id === templateId
      })));

      // Show success message
      const curTemplate = templates.find(t => t.id === templateId);
      showNotification(`Success! "${curTemplate?.name}" is now set as default.`, 'success');

    } catch (err: any) {
      console.error('Error updating default template:', err);
      showNotification('Failed to update default template.', 'error');
    }
  };

  const handleToggleFavorite = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      // Update local state
      setTemplates(templates.map(t =>
        t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
      ));

    } catch (err) {
      console.error('Error updating favorite status:', err);
    }
  };

  const handleDownloadTemplate = (template: InvoiceTemplate) => {
    // Set the selected template and open preview
    setSelectedTemplate(template);
    setPreviewOpen(true);

    setTimeout(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          window.print();
        }, 100);
      });
    }, 1200);
  };

  const handlePreview = (template: InvoiceTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleEditSettings = (template: InvoiceTemplate) => {
    setSelectedTemplate(template);
    setSettingsOpen(true);
  };

  const handleEditFields = (template: InvoiceTemplate) => {
    setSelectedTemplate(template);
    setFieldsOpen(true);
  };

  const handleSaveSettings = async (settings: TemplateSettings) => {
    if (!selectedTemplate) return;

    try {
      const response = await api.put(`/templates/${selectedTemplate.id}/settings`, { settings });

      if (response.status !== 200) {
        throw new Error('Failed to save template settings');
      }

      // ✅ Persist to localStorage so settings survive page refresh
      // (The GET /templates API does not return saved settings for built-in templates)
      saveLocalOverride(selectedTemplate.id, selectedSize, { settings });

      const updatedTemplate: InvoiceTemplate = {
        ...selectedTemplate,
        settings: JSON.parse(JSON.stringify(settings)),
        updatedAt: new Date().toISOString()
      };

      setTemplates(prev => prev.map(t =>
        t.id === selectedTemplate.id ? updatedTemplate : t
      ));

      // 🛠️ SINGLE SOURCE OF TRUTH (ISSUE 1): Update Global Context
      const sizeKey = `${selectedTemplate.id}:${selectedSize}`;
      setTemplateOverrides(prev => ({
        ...prev,
        [sizeKey]: { ...prev[sizeKey], settings: updatedTemplate.settings },
        [selectedTemplate.id]: { ...prev[selectedTemplate.id], settings: updatedTemplate.settings }
      }));

      setSelectedTemplate(updatedTemplate);
      setSettingsOpen(false);
      showNotification('✅ Styles saved successfully!', 'success');
    } catch (err) {
      console.error('Error saving template settings:', err);
      showNotification('Failed to save template settings.', 'error');
    }
  };

  const handleSaveFields = async (fields: TemplateField[]) => {
    if (!selectedTemplate) return;

    try {
      const response = await api.put(`/templates/${selectedTemplate.id}/fields`, { fields });

      if (response.status !== 200) {
        throw new Error('Failed to save template fields');
      }

      // ✅ Persist to localStorage so field settings survive page refresh
      // (The GET /templates API does not return saved fields for built-in templates)
      saveLocalOverride(selectedTemplate.id, selectedSize, { fields });

      const updatedTemplate: InvoiceTemplate = {
        ...selectedTemplate,
        fields: JSON.parse(JSON.stringify(fields)),
        updatedAt: new Date().toISOString()
      };

      setTemplates(prev => prev.map(t =>
        t.id === selectedTemplate.id ? updatedTemplate : t
      ));

      // 🛠️ SINGLE SOURCE OF TRUTH (ISSUE 1): Update Global Context
      const sizeKey = `${selectedTemplate.id}:${selectedSize}`;
      setTemplateOverrides(prev => ({
        ...prev,
        [sizeKey]: { ...prev[sizeKey], fields: JSON.parse(JSON.stringify(fields)) },
        [selectedTemplate.id]: { ...prev[selectedTemplate.id], fields: JSON.parse(JSON.stringify(fields)) }
      }));

      setSelectedTemplate(updatedTemplate);
      setFieldsOpen(false);
      showNotification('✅ Fields saved successfully!', 'success');
    } catch (err) {
      console.error('Error saving template fields:', err);
      showNotification('Failed to save template fields.', 'error');
    }
  };

  const handleSaveColumns = async (template: InvoiceTemplate, stayOpen = false) => {
    try {
      // Save settings to backend
      const response = await api.put(`/templates/${template.id}/settings`, { 
        settings: template.settings 
      });

      if (response.status !== 200) {
        throw new Error('Failed to save column settings');
      }

      // Persist to local storage for instant sync
      saveLocalOverride(template.id, selectedSize, { settings: template.settings });

      // Update state
      setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
      
      // Update selected template if it is the one being edited
      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate(template);
      }

      if (!stayOpen) {
        setColumnManagerOpen(false);
      }
      
      // 🛠️ SINGLE SOURCE OF TRUTH (ISSUE 1): Update Global Context
      const sizeKey = `${template.id}:${selectedSize}`;
      setTemplateOverrides(prev => ({
        ...prev,
        [sizeKey]: { ...prev[sizeKey], settings: template.settings },
        [template.id]: { ...prev[template.id], settings: template.settings }
      }));

      if (!stayOpen) {
        showNotification('✅ Columns updated successfully!', 'success');
      }
    } catch (err) {
      console.error('Error saving column settings:', err);
      if (!stayOpen) {
        showNotification('Failed to save columns.', 'error');
      }
    }
  };

  // ─── ICON MAPPING FOR CATEGORIES ───────────────────────────────────────────
  const getTemplateIcon = (template: InvoiceTemplate) => {
    const name = template.name.toLowerCase();
    const category = template.category.toLowerCase();

    if (name.includes('business')) return <BusinessIcon sx={{ fontSize: 32, color: 'primary.main' }} />;
    if (name.includes('retail') || category === 'retail') return <RetailIcon sx={{ fontSize: 32, color: 'primary.main' }} />;
    if (name.includes('service') || category === 'service') return <ServiceIcon sx={{ fontSize: 32, color: 'primary.main' }} />;
    if (name.includes('gst') || name.includes('tax')) return <TaxIcon sx={{ fontSize: 32, color: 'primary.main' }} />;
    if (name.includes('recurring') || name.includes('subscription')) return <RecurringIcon sx={{ fontSize: 32, color: 'primary.main' }} />;
    if (name.includes('expense')) return <ExpenseIcon sx={{ fontSize: 32, color: 'primary.main' }} />;
    if (name.includes('consulting')) return <ConsultingIcon sx={{ fontSize: 32, color: 'primary.main' }} />;
    if (name.includes('project')) return <ProjectIcon sx={{ fontSize: 32, color: 'primary.main' }} />;
    if (name.includes('delivery')) return <DeliveryIcon sx={{ fontSize: 32, color: 'primary.main' }} />;
    
    return <CustomFieldIcon sx={{ fontSize: 32, color: 'primary.main' }} />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading template library...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={fetchTemplates}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 7 }} // Offset from the header
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          variant="filled"
          sx={{ width: '100%', boxShadow: 3, borderRadius: 2 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Invoice Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Browse and select professional designs for your invoices. Choose a template to set as your default.
          </Typography>
        </Box>
        {lastSyncFailed && (
          <Button 
            variant="contained" 
            color="error" 
            size="large"
            startIcon={<TuneIcon />}
            onClick={handleRetrySync}
            sx={{ 
                borderRadius: 3, 
                px: 4, 
                py: 1.5,
                boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)',
                animation: 'pulse 2s infinite'
            }}
          >
            Retry Sync
          </Button>
        )}
      </Box>

      {/* CSS for custom layout elements */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          .custom-scrollbar::-webkit-scrollbar {
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.05);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.2);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(0,0,0,0.3);
          }
          .custom-scrollbar::-webkit-scrollbar {
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.05);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.2);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(0,0,0,0.3);
          }
        `}
      </style>


      {/* Main Layout Control Bar */}
      <Paper elevation={0} sx={{ 
        p: 2, 
        mb: 2, 
        borderRadius: 3, 
        bgcolor: '#fff',
        border: '1px solid rgba(0,0,0,0.05)',
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <TextField
          placeholder="Search templates..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 180 }}
        />

        {/* 📏 SCROLLABLE BILL SIZE SELECTOR (REQUESTED NEXT TO SEARCH) */}
        <Box className="custom-scrollbar" sx={{ 
          display: 'flex', 
          gap: 1, 
          overflowX: 'auto', 
          py: 0.5,
          maxWidth: '500px',
          alignItems: 'center',
          '&::-webkit-scrollbar': { height: 4 }
        }}>
          {billSizes.map(size => {
            const isActive = size === selectedSize;
            return (
              <Chip
                key={size}
                label={size}
                onClick={() => {
                  setSelectedSize(size);
                  syncTemplateConfig(size, activeFormat);
                }}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 2,
                  fontWeight: isActive ? 800 : 500,
                  bgcolor: isActive ? 'primary.main' : 'rgba(0,0,0,0.04)',
                  color: isActive ? '#fff' : 'text.primary',
                  border: isActive ? 'none' : '1px solid rgba(0,0,0,0.08)',
                  minWidth: 'fit-content',
                  height: 32,
                  fontSize: '0.75rem',
                  transition: 'all 0.2s ease',
                  '&:hover': { bgcolor: isActive ? 'primary.dark' : 'rgba(0,0,0,0.1)' }
                }}
              />
            );
          })}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            color="secondary"
            startIcon={<TableChartIcon />}
            onClick={() => {
              const current = templates.find(t => t.id === activeFormat);
              if (current) {
                setSelectedTemplate(current);
                setColumnManagerOpen(true);
              }
            }}
            sx={{ borderRadius: 2 }}
          >
            Manage Columns
          </Button>
        </Stack>
      </Paper>

      {/* 🚀 NEW SIDE-BY-SIDE CATEGORIZED LAYOUT */}
      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        height: 'calc(100vh - 220px)', 
        minHeight: '700px',
        mb: 2
      }}>
        {/* LEFT SIDEBAR: DESIGN GALLERY */}
        <Paper elevation={0} sx={{ 
          width: 320, 
          height: '100%', 
          bgcolor: '#fff', 
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.05)', bgcolor: 'rgba(0,0,0,0.01)' }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Typography variant="subtitle1" fontWeight="950" color="#1e293b">{selectedSize}</Typography>
                <Chip 
                  label={`${SIZE_CONFIG[selectedSize as BillSize]?.maxCols || 0} Cols`} 
                  color="primary" 
                  size="small" 
                  sx={{ fontWeight: 800, height: 20, fontSize: '0.65rem' }} 
                />
            </Stack>
            <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 2, lineHeight: 1.3 }}>
              {SIZE_CONFIG[selectedSize as BillSize]?.commonUses}
            </Typography>

            <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.primary', opacity: 0.4, mb: 1, display: 'block', letterSpacing: 1 }}>RECOMMENDED TYPES</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {SIZE_CONFIG[selectedSize as BillSize]?.recommendedTypes?.slice(0, 6).map((type: string) => (
                  <Chip key={type} label={type} size="small" sx={{ fontSize: '0.6rem', height: 18, bgcolor: 'rgba(0,0,0,0.05)', fontWeight: 600 }} />
                ))}
            </Box>

            <Box sx={{ pt: 1, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
               <Typography variant="subtitle2" fontWeight="900" sx={{ opacity: 0.6, letterSpacing: 1 }}>BILL TYPES</Typography>
            </Box>
          </Box>
          <Box className="custom-scrollbar" sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredTemplates.map((template) => {
              const isActive = template.id === activeFormat;
              const themeColor = template.settings?.colorScheme || '#3B82F6';
              return (
                <Card 
                  key={template.id}
                  onClick={() => {
                    handleTemplateSelect(template.id);
                    setActiveFormat(template.id);
                  }}
                  sx={{ 
                    cursor: 'pointer',
                    borderRadius: 3.5,
                    border: isActive ? `2px solid ${themeColor}` : '1.5px solid rgba(0,0,0,0.06)',
                    background: isActive ? `linear-gradient(to bottom right, #fff, ${themeColor}10)` : '#fff',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'visible',
                    boxShadow: isActive ? `0 12px 24px ${themeColor + '15'}` : '0 2px 8px rgba(0,0,0,0.03)',
                    '&:hover': { 
                      transform: 'translateY(-4px)', 
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                      border: isActive ? `2px solid ${themeColor}` : '2px solid #3B82F633',
                      bgcolor: 'rgba(59, 130, 246, 0.05)' // Cool-toned hover effect
                    }
                  }}
                >
                  <CardContent sx={{ p: '14px !important' }}>
                    <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
                      <Box sx={{ 
                        width: 56, 
                        height: 56, 
                        bgcolor: isActive ? `${themeColor}15` : '#f8fafc', 
                        borderRadius: 2.5, 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(0,0,0,0.04)',
                        transition: 'all 0.3s ease'
                      }}>
                        {getTemplateIcon(template)}
                      </Box>
                      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                        <Typography variant="subtitle2" fontWeight="950" sx={{ color: '#1e293b', lineHeight: 1.2, mb: 0.2 }}>{template.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: 0.5 }}>{template.category} • {template.complexity}</Typography>
                        
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                             {template.tags?.slice(0, 2).map((tag: string) => (
                               <Chip key={tag} label={tag} size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)' }} />
                             ))}
                        </Box>
                      </Box>
                    </Box>
                    {isActive && (
                      <Typography variant="caption" sx={{ 
                        position: 'absolute', 
                        top: -10, 
                        left: 20, 
                        bgcolor: themeColor, 
                        color: '#fff', 
                        px: 1, 
                        borderRadius: 1, 
                        fontSize: '0.6rem', 
                        fontWeight: 900,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                      }}>
                        ACTIVE TEMPLATE
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {filteredTemplates.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, width: '100%', textAlign: 'center' }}>
                No templates matching filters.
              </Typography>
            )}
          </Box>
        </Paper>

        {/* RIGHT AREA: LIVE PREVIEW CANVAS */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ 
            flexGrow: 1, 
            bgcolor: '#f1f5f9', 
            borderRadius: 4, 
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            p: 4,
            border: '1px solid rgba(0,0,0,0.04)',
            position: 'relative',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)'
          }}>
            {(() => {
              const currentTemplate = templates.find(t => t.id === activeFormat) || templates[0];
              if (!currentTemplate) return null;

              return (
                <Paper elevation={12} sx={{
                  width: BILL_SIZE_DIMENSIONS[(selectedSize as BillSize) || 'A4']?.width || '794px',
                  height: 'fit-content',
                  minHeight: BILL_SIZE_DIMENSIONS[(selectedSize as BillSize) || 'A4']?.height || '1123px',
                  bgcolor: '#fff',
                  borderRadius: 1,
                  overflow: 'hidden',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
                  transition: 'all 0.4s ease'
                }}>
                  <BillTemplateRenderer 
                    template={currentTemplate} 
                    bill={MOCK_BILL} 
                    size={selectedSize}
                  />
                </Paper>
              );
            })()}

            {/* QUICK ACTIONS ELIMINATED AS REQUESTED */}
          </Box>
        </Box>
      </Box>

      {/* Column Management Dialog */}
      {selectedTemplate && (
        <ColumnManagerDialog
          open={columnManagerOpen}
          onClose={() => setColumnManagerOpen(false)}
          template={selectedTemplate}
          onSave={handleSaveColumns}
        />
      )}

      {/* Template Preview Dialog */}
      <TemplatePreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        template={selectedTemplate}
        onSelect={handleTemplateSelect}
      />

      {/* Template Settings Dialog */}
      <TemplateSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        template={selectedTemplate}
        onSave={handleSaveSettings}
      />

      {/* Template Fields Dialog */}
      <TemplateFieldsDialog
        open={fieldsOpen}
        onClose={() => setFieldsOpen(false)}
        template={selectedTemplate}
        onSave={handleSaveFields}
      />
    </Box>
  );
};

/**
 * Template Preview Dialog Component
 */
interface TemplatePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  template: InvoiceTemplate | null;
  onSelect: (templateId: string) => void;
}

const TemplatePreviewDialog: React.FC<TemplatePreviewDialogProps> = ({
  open,
  onClose,
  template,
  onSelect,
}) => {
  const [isReady, setIsReady] = React.useState(false);
  const [renderKey, setRenderKey] = React.useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (open) {
      setRenderKey(prev => prev + 1);
    }
  }, [open, template]); // Re-render if template changes too

  useEffect(() => {
    if (open && template) {
      setIsReady(false);
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 300);
      return () => {
        clearTimeout(timer);
        setIsReady(false);
      };
    } else {
      setIsReady(false);
    }
  }, [open, template]);

  if (!template) return null;

  return (
    <Dialog
      key={`${template.id}-${renderKey}`}
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen
      PaperProps={{
        sx: {
          backgroundColor: '#fff',
          backgroundImage: 'none',
          color: '#0F172A',
        }
      }}
    >
      <ThemeProvider theme={modernTheme}>
        <DialogTitle sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: '#fff',
          color: '#0F172A',
          zIndex: 10
        }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6" fontWeight="bold">Design Preview: {template.name}</Typography>
            {template.isDefault && (
              <Chip label="Current Default" size="small" color="success" icon={<CheckIcon />} />
            )}
          </Stack>
          <IconButton onClick={onClose} size="small" sx={{ color: '#0F172A' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{
          p: { xs: 0, sm: 4 },
          bgcolor: '#f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '100%'
        }}>
          {isReady ? (
            <Paper elevation={isMobile ? 0 : 6} sx={{
              width: isMobile ? '100%' : BILL_SIZE_DIMENSIONS[(template.settings.billSize as BillSize) || 'A4'].width,
              height: isMobile ? 'auto' : BILL_SIZE_DIMENSIONS[(template.settings.billSize as BillSize) || 'A4'].height,
              minHeight: isMobile ? 'auto' : BILL_SIZE_DIMENSIONS[(template.settings.billSize as BillSize) || 'A4'].height,
              bgcolor: '#fff',
              my: { xs: 0, sm: 4 },
              borderRadius: isMobile ? 0 : 1,
              overflow: 'hidden',
              boxShadow: isMobile ? 'none' : '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              <BillTemplateRenderer 
                template={template} 
                bill={MOCK_BILL} 
                size={template.settings.billSize} 
              />
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
              <CircularProgress size={32} />
              <Typography sx={{ mt: 2 }} color="text.secondary">Preparing HD Preview...</Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: '#fff',
          justifyContent: isMobile ? 'stretch' : 'flex-end',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 1
        }}>
          <Button
            variant="outlined"
            onClick={onClose}
            fullWidth={isMobile}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          {!template.isDefault && (
            <Button
              variant="contained"
              onClick={() => { onSelect(template.id); onClose(); }}
              fullWidth={isMobile}
              sx={{ borderRadius: 2 }}
            >
              Set as Default Template
            </Button>
          )}
        </DialogActions>
      </ThemeProvider>
    </Dialog>
  );
};

/**
 * Template Settings Dialog Component
 */
interface TemplateSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  template: InvoiceTemplate | null;
  onSave: (settings: TemplateSettings) => void;
}

const TemplateSettingsDialog: React.FC<TemplateSettingsDialogProps> = ({
  open,
  onClose,
  template,
  onSave,
}) => {
  const [settings, setSettings] = useState<TemplateSettings | null>(null);

  useEffect(() => {
    if (template) {
      setSettings({ ...template.settings });
    }
  }, [template, open]);

  if (!template || !settings) return null;

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Template Settings: {template.name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3
          }}>
            <FormControl fullWidth>
              <InputLabel>Logo Position</InputLabel>
              <Select
                value={settings.logoPosition}
                onChange={(e) => setSettings({
                  ...settings,
                  logoPosition: e.target.value as any
                })}
                label="Logo Position"
              >
                <MenuItem value="top-left">Top Left</MenuItem>
                <MenuItem value="top-center">Top Center</MenuItem>
                <MenuItem value="top-right">Top Right</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Color Scheme"
              value={settings.colorScheme}
              onChange={(e) => setSettings({
                ...settings,
                colorScheme: e.target.value
              })}
            />

            <TextField
              fullWidth
              label="Font Family"
              value={settings.fontFamily}
              onChange={(e) => setSettings({
                ...settings,
                fontFamily: e.target.value
              })}
            />

            <TextField
              fullWidth
              label="Logo URL"
              value={settings.logoUrl || ''}
              onChange={(e) => setSettings({
                ...settings,
                logoUrl: e.target.value
              })}
              placeholder="https://example.com/logo.png"
              sx={{ mt: 1 }}
            />

            <Box>
              <Typography gutterBottom>Font Size: {settings.fontSize}px</Typography>
              <Slider
                value={settings.fontSize}
                onChange={(_, value) => setSettings({
                  ...settings,
                  fontSize: value as number
                })}
                min={8}
                max={24}
                marks
                valueLabelDisplay="auto"
              />
            </Box>

            <Box>
              <Typography gutterBottom>Title Size: {settings.titleFontSize ?? 28}px</Typography>
              <Slider
                value={settings.titleFontSize ?? 28}
                onChange={(_, value) => setSettings({
                  ...settings,
                  titleFontSize: value as number
                })}
                min={16}
                max={48}
                step={2}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
          </Box>

          <Box sx={{ mt: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showBorder}
                  onChange={(e) => setSettings({
                    ...settings,
                    showBorder: e.target.checked
                  })}
                />
              }
              label="Show Border"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save Styles
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Template Fields Dialog Component
 */
interface TemplateFieldsDialogProps {
  open: boolean;
  onClose: () => void;
  template: InvoiceTemplate | null;
  onSave: (fields: TemplateField[]) => void;
}

const TemplateFieldsDialog: React.FC<TemplateFieldsDialogProps> = ({
  open,
  onClose,
  template,
  onSave,
}) => {
  const [fields, setFields] = useState<TemplateField[]>([]);

  useEffect(() => {
    if (template) {
      setFields([...template.fields]);
    }
  }, [template, open]);

  if (!template) return null;

  const handleFieldUpdate = (index: number, updates: Partial<TemplateField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setFields(updatedFields);
  };

  const handleSave = () => {
    onSave(fields);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">Template Fields: {template.name}</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <List sx={{ pt: 1 }}>
          {fields.map((field, index) => (
            <ListItem key={field.id} divider sx={{ py: 2 }}>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1.2fr 1.2fr 0.8fr 0.8fr' },
                gap: 2,
                alignItems: 'center',
                width: '100%'
              }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                    {field.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {field.type}
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  size="small"
                  label="Display Label"
                  placeholder="e.g. Serial No."
                  value={field.label || ''}
                  onChange={(e) => handleFieldUpdate(index, { label: e.target.value })}
                  sx={{ '& .MuiInputBase-input': { fontWeight: 600 } }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.visible}
                      onChange={(e) => handleFieldUpdate(index, { visible: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={<Typography variant="body2" fontWeight={500}>Visible</Typography>}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.required}
                      onChange={(e) => handleFieldUpdate(index, { required: e.target.checked })}
                      color="error"
                    />
                  }
                  label={<Typography variant="body2" fontWeight={500}>Required</Typography>}
                />
              </Box>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
        <Button onClick={onClose} variant="outlined" color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSave} sx={{ px: 4, borderRadius: 2 }}>
          Save Customizations
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface ColumnManagerDialogProps {
  open: boolean;
  onClose: () => void;
  template: InvoiceTemplate;
  onSave: (template: InvoiceTemplate, stayOpen?: boolean) => void;
}

const ColumnManagerDialog: React.FC<ColumnManagerDialogProps> = ({
  open,
  onClose,
  template,
  onSave,
}) => {
  const [activeColumns, setActiveColumns] = useState<string[]>([]);
  const [requiredColumns, setRequiredColumns] = useState<string[]>([]);
  const [columnLabels, setColumnLabels] = useState<Record<string, string>>({});
  const [customColumns, setCustomColumns] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const debouncedSyncRef = useRef<any>(null);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [columnTypeOverrides, setColumnTypeOverrides] = useState<Record<string, 'TEXT' | 'INTEGER' | 'DATE'>>({});
  const [newColLabel, setNewColLabel] = useState('');
  const [newColRequired, setNewColRequired] = useState(false);
  const [newColCap, setNewColCap] = useState(false);
  const [capitalizeStates, setCapitalizeStates] = useState<Record<string, boolean>>({});
  
  const currentSize = template.settings.billSize;
  const isThermal = currentSize === '80mm' || currentSize === '58mm';
  
  const formatInfo = SUPPORTED_BILLING_FORMATS.find(f => f.id === template.id);
  const supportedByTemplate = (formatInfo as any)?.supportedColumns || [];
  
  const availableColumns = supportedByTemplate.length > 0 
    ? supportedByTemplate.filter((col: string) => !isThermal || ['S.No', 'Item Name', 'Qty', 'Rate', 'Amount'].includes(col))
    : (isThermal 
        ? ['S.No', 'Item Name', 'Qty', 'Rate', 'Amount']
        : ['S.No', 'Item Name', 'HSN', 'Unit', 'Qty', 'Batch', 'Exp', 'Rate', 'Tax', 'Discount', 'Amount']);
  
  const limits = isThermal ? { default: 4, max: 4 } : (BILL_SIZE_COLUMN_LIMITS[currentSize] || { default: 5, max: 7 });

  useEffect(() => {
    if (open && template) {
      const baseActive = template.settings.activeColumns || [];
      const baseRequired = template.settings.requiredColumns || ['Item Name', 'Amount'];
      
      setRequiredColumns(baseRequired);
      setActiveColumns(baseActive);
      setColumnLabels(template.settings.columnLabels || {});
      setCustomColumns(template.settings.customColumns || []);
      setColumnTypeOverrides(template.settings.columnDataTypes || {});

      // Initialize Capitalize states from settings
      const capStates: Record<string, boolean> = template.settings.columnCapitalized || {};
      
      // Also ensure custom columns capitalization is synced
      (template.settings.customColumns || []).forEach((col: any) => {
        if (col.capitalize !== undefined) {
          capStates[col.id] = col.capitalize;
        }
      });
      
      setCapitalizeStates(capStates);
    }
  }, [open]);

  const getColumnType = (colLabel: string, colId?: string): 'TEXT' | 'INTEGER' | 'DATE' => {
    if (colId && columnTypeOverrides[colId]) {
      return columnTypeOverrides[colId];
    }
    const name = (colLabel || '').toLowerCase().trim();
    if (!name) return 'TEXT';

    if (name.includes('date') || name.includes('mfg') || name.includes('exp') || 
        name.includes('time') || name.includes('dob') || name.includes('day') || 
        name.includes('anniversary') || name.includes('billing')) return 'DATE';
    
    if (name.includes('qty') || name.includes('price') || name.includes('amount') || 
        name.includes('cost') || name.includes('total') || name.includes('count') || 
        name.includes('id') || name.includes('num') || name.includes('s.no') || 
        name.includes('rate') || name.includes('tax') || name.includes('discount') || 
        /^\d+$/.test(name)) return 'INTEGER';

    if (name.includes('name') || name.includes('description') || name.includes('label') || 
        name.includes('title') || name.includes('note') || name.includes('comment') || 
        name.includes('msg') || name.includes('address') || name.includes('hsn') || 
        name.includes('unit') || name.includes('batch')) return 'TEXT';
    
    return 'TEXT';
  };


  const toggleCapitalize = (colId: string, currentLabel: string, isCustom: boolean) => {
    const nextCap = !capitalizeStates[colId];
    setCapitalizeStates(prev => ({ ...prev, [colId]: nextCap }));
    
    if (isCustom) {
      const updated = customColumns.map(c => c.id === colId ? { ...c, capitalize: nextCap } : c);
      setCustomColumns(updated);
      triggerImmediateSync(activeColumns, requiredColumns, updated, columnLabels);
    } else {
      triggerImmediateSync(activeColumns, requiredColumns, customColumns, columnLabels);
    }
  };

  const triggerImmediateSync = (active: string[], required: string[], custom: any[], labels: Record<string, string>) => {
    const updatedTemplate = {
      ...template,
      settings: {
        ...template.settings,
        activeColumns: active,
        requiredColumns: required,
        columnLabels: labels,
        customColumns: custom,
        columnCapitalized: capitalizeStates
      }
    };
    onSave(updatedTemplate, true);
  };

  const triggerDebouncedSync = (active: string[], required: string[], custom: any[], labels: Record<string, string>) => {
    if (debouncedSyncRef.current) clearTimeout(debouncedSyncRef.current);
    debouncedSyncRef.current = setTimeout(() => {
      // Using latest state pieces for any not provided
      triggerImmediateSync(active, required, custom, labels);
    }, 500);
  };

  const handleAddCustomCol = async () => {
    if (!newColLabel.trim()) return;
    const finalType = getColumnType(newColLabel, 'new-col-preview');
    const newCol = {
      id: `custom_${Date.now()}`,
      label: newColLabel,
      type: finalType.toLowerCase(),
      required: newColRequired,
      capitalize: newColCap
    };
    
    // Update local capitalize state
    setCapitalizeStates(prev => ({ ...prev, [newCol.id]: newColCap }));
    
    // Transfer override if any
    if (columnTypeOverrides['new-col-preview']) {
      setColumnTypeOverrides(prev => {
        const next = { ...prev, [newCol.id]: prev['new-col-preview'] };
        delete next['new-col-preview'];
        return next;
      });
    }

    const updatedCustomCols = [...customColumns, newCol];
    setCustomColumns(updatedCustomCols);
    triggerImmediateSync(activeColumns, requiredColumns, updatedCustomCols, columnLabels);

    setNewColLabel('');
    setNewColRequired(false);
    setNewColCap(false);
    setIsAddingCustom(false);
  };

  const removeCustomCol = (id: string) => {
    const updated = customColumns.filter(c => c.id !== id);
    setCustomColumns(updated);
    triggerImmediateSync(activeColumns, requiredColumns, updated, columnLabels);
  };

  const toggleColumn = (col: string) => {
    let next;
    if (activeColumns.includes(col)) {
      next = activeColumns.filter((c: string) => c !== col);
    } else {
      if (activeColumns.length >= limits.max) return;
      next = [...activeColumns, col];
    }
    setActiveColumns(next);
    triggerImmediateSync(next, requiredColumns, customColumns, columnLabels);
  };

  const toggleRequired = (col: string) => {
    setRequiredColumns(prev => {
      const nextReq = prev.includes(col) 
        ? prev.filter(c => c !== col) 
        : [...prev, col];
      
      // Sync immediately with the NEW required list
      triggerImmediateSync(activeColumns, nextReq, customColumns, columnLabels);
      return nextReq;
    });
  };

  const handleSave = () => {
    const updatedTemplate = {
      ...template,
      settings: {
        ...template.settings,
        activeColumns: activeColumns,
        requiredColumns: requiredColumns,
        columnLabels: columnLabels,
        customColumns: customColumns,
        columnDataTypes: columnTypeOverrides,
        columnCapitalized: capitalizeStates
      }
    };
    onSave(updatedTemplate);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1.5, borderBottom: '1px solid #e2e8f0', fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
        Manage Invoice Columns
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
             Config For: <span style={{ color: '#3b82f6' }}>{currentSize}</span>
          </Typography>
          <Box sx={{ px: 2, py: 1, bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', width: 'fit-content' }}>
            <Typography variant="h6" fontWeight={900} color="#3b82f6">
              {activeColumns.length} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>/ {limits.max} Max</span>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1.8fr 0.4fr 1.2fr 0.8fr 0.8fr', columnGap: 2, bgcolor: '#f1f5f9', py: 1, px: 2, borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10, width: '100%', overflowX: 'hidden' }}>
            <Typography variant="caption" fontWeight={900} color="#64748b" sx={{ pl: 5 }}>COLUMN NAME</Typography>
            <Typography variant="caption" fontWeight={900} color="#64748b" textAlign="center">CAP</Typography>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                variant="standard"
                size="small"
                disableUnderline
                sx={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 900, 
                  color: '#64748b', 
                  textTransform: 'uppercase',
                  '& .MuiSelect-select': { pr: '20px !important' }
                }}
              >
                <MenuItem value="ALL" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>DATA TYPE</MenuItem>
                <MenuItem value="TEXT" sx={{ fontSize: '0.75rem' }}>TEXT</MenuItem>
                <MenuItem value="INTEGER" sx={{ fontSize: '0.75rem' }}>INTEGER</MenuItem>
                <MenuItem value="DATE" sx={{ fontSize: '0.75rem' }}>DATE</MenuItem>
              </Select>
            </Box>
            <Typography variant="caption" fontWeight={900} color="#64748b" textAlign="center">REQUIRED</Typography>
            <Typography variant="caption" fontWeight={900} color="#64748b" textAlign="center">ACTIONS</Typography>
          </Box>

          <Box className="custom-scrollbar" sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {availableColumns
              .filter((col: string) => {
                const currentLabel = columnLabels[col] ?? col;
                return typeFilter === 'ALL' || getColumnType(currentLabel, col) === typeFilter;
              })
              .map((col: string) => {
                const isSelected = activeColumns.includes(col);
                const currentLabel = columnLabels[col] ?? col;
                const colType = getColumnType(currentLabel, col);
              
                return (
                  <Box key={col} sx={{ display: 'grid', gridTemplateColumns: '1.8fr 0.4fr 1.2fr 0.8fr 0.8fr', columnGap: 2, alignItems: 'center', px: 2, py: 1, borderBottom: '1px solid #f1f5f9', bgcolor: isSelected ? 'transparent' : '#f8fafc', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Checkbox size="small" checked={isSelected} onChange={() => toggleColumn(col)} disabled={!isSelected && activeColumns.length >= limits.max} sx={{ mr: 1 }} />
                      <Box sx={{ flex: 1 }}>
                        <TextField size="small" fullWidth value={columnLabels[col] ?? col} onChange={(e) => {
                          const val = e.target.value;
                          setColumnLabels(prev => {
                            const next = { ...prev, [col]: val };
                            triggerDebouncedSync(activeColumns, requiredColumns, customColumns, next);
                            return next;
                          });
                        }} variant="standard" sx={{ '& .MuiInputBase-input': { fontWeight: 800, fontSize: '0.875rem' } }} />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Checkbox 
                        size="small" 
                        checked={!!capitalizeStates[col]} 
                        onChange={() => toggleCapitalize(col, currentLabel, false)}
                        sx={{ color: '#94a3b8' }}
                      />
                    </Box>
                    <Box>
                      <Select
                        value={colType}
                        onChange={(e) => {
                          setColumnTypeOverrides(prev => ({
                            ...prev,
                            [col]: e.target.value as any
                          }));
                        }}
                        variant="standard"
                        size="small"
                        disableUnderline
                        sx={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 950, 
                          color: colType === 'TEXT' ? '#64748b' : colType === 'INTEGER' ? '#10b981' : '#f59e0b',
                          '& .MuiSelect-select': { py: 0.5 }
                        }}
                      >
                        <MenuItem value="TEXT" sx={{ fontSize: '0.75rem', fontWeight: 800 }}>TEXT</MenuItem>
                        <MenuItem value="INTEGER" sx={{ fontSize: '0.75rem', fontWeight: 800 }}>INTEGER</MenuItem>
                        <MenuItem value="DATE" sx={{ fontSize: '0.75rem', fontWeight: 800 }}>DATE</MenuItem>
                      </Select>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Checkbox 
                        size="small" 
                        checked={requiredColumns.includes(col)} 
                        onChange={() => toggleRequired(col)} 
                      />
                    </Box>
                    <Typography variant="caption" color="#94a3b8" textAlign="center">—</Typography>
                  </Box>
                );
              })}


            {customColumns
              .filter((col: any) => typeFilter === 'ALL' || getColumnType(col.label, col.id) === typeFilter)
              .map((col: any) => {
                const colType = getColumnType(col.label, col.id);
                const isSelected = activeColumns.includes(col.id);
                return (
                  <Box key={col.id} sx={{ display: 'grid', gridTemplateColumns: '1.8fr 0.4fr 1.2fr 0.8fr 0.8fr', columnGap: 2, alignItems: 'center', px: 2, py: 1, borderBottom: '1px solid #f1f5f9', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Checkbox 
                        size="small" 
                        checked={isSelected} 
                        onChange={() => {
                          let next = isSelected ? activeColumns.filter(id => id !== col.id) : [...activeColumns, col.id];
                          setActiveColumns(next);
                          triggerImmediateSync(next, requiredColumns, customColumns, columnLabels);
                        }} 
                        disabled={!isSelected && activeColumns.length >= limits.max} 
                        sx={{ mr: 1 }} 
                      />
                      <TextField size="small" fullWidth value={col.label} onChange={(e) => {
                        const val = e.target.value;
                        const newType = getColumnType(val).toLowerCase();
                        const updated = customColumns.map(c => c.id === col.id ? { ...c, label: val, type: newType } : c);
                        setCustomColumns(updated);
                        triggerDebouncedSync(activeColumns, requiredColumns, updated, columnLabels);
                      }} variant="standard" sx={{ '& .MuiInputBase-input': { fontWeight: 800, fontSize: '0.875rem' } }} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Checkbox 
                        size="small" 
                        checked={!!capitalizeStates[col.id]} 
                        onChange={() => toggleCapitalize(col.id, col.label, true)}
                        sx={{ color: '#94a3b8' }}
                      />
                    </Box>
                    <Box>
                      <Select
                        value={colType}
                        onChange={(e) => {
                          setColumnTypeOverrides(prev => ({
                            ...prev,
                            [col.id]: e.target.value as any
                          }));
                        }}
                        variant="standard"
                        size="small"
                        disableUnderline
                        sx={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 950, 
                          color: colType === 'TEXT' ? '#64748b' : colType === 'INTEGER' ? '#10b981' : '#f59e0b',
                          '& .MuiSelect-select': { py: 0.5 }
                        }}
                      >
                        <MenuItem value="TEXT" sx={{ fontSize: '0.75rem', fontWeight: 800 }}>TEXT</MenuItem>
                        <MenuItem value="INTEGER" sx={{ fontSize: '0.75rem', fontWeight: 800 }}>INTEGER</MenuItem>
                        <MenuItem value="DATE" sx={{ fontSize: '0.75rem', fontWeight: 800 }}>DATE</MenuItem>
                      </Select>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                       <Checkbox 
                         size="small" 
                         checked={!!col.required} 
                         onChange={(e) => {
                           const isChecked = e.target.checked;
                           setCustomColumns(prev => {
                             const updated = prev.map(c => c.id === col.id ? { ...c, required: isChecked } : c);
                             triggerImmediateSync(activeColumns, requiredColumns, updated, columnLabels);
                             return updated;
                           });
                         }} 
                       />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                       <IconButton size="small" onClick={() => removeCustomCol(col.id)} color="error" sx={{ bgcolor: '#fef2f2' }}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                    </Box>
                  </Box>
                );
              })}

            {isAddingCustom && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1.8fr 0.4fr 1.2fr 0.8fr 0.8fr', columnGap: 2, alignItems: 'center', px: 2, py: 2, bgcolor: '#f1f5f9', borderTop: '2px solid #e2e8f0', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', pl: 5 }}>
                  <TextField 
                    size="small" 
                    fullWidth 
                    placeholder="Field Label" 
                    value={newColLabel} 
                    onChange={(e) => setNewColLabel(e.target.value)} 
                    sx={{ '& .MuiInputBase-root': { height: 32, bgcolor: '#fff', fontSize: '0.8rem' } }} 
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Checkbox 
                    size="small" 
                    checked={newColCap} 
                    onChange={(e) => setNewColCap(e.target.checked)}
                    sx={{ color: '#94a3b8' }}
                  />
                </Box>
                <Box>
                  <Select
                    value={getColumnType(newColLabel, 'new-col-preview')}
                    onChange={(e) => {
                      setColumnTypeOverrides(prev => ({
                        ...prev,
                        ['new-col-preview']: e.target.value as any
                      }));
                    }}
                    variant="standard"
                    size="small"
                    disableUnderline
                    sx={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 950, 
                      color: getColumnType(newColLabel, 'new-col-preview') === 'TEXT' ? '#64748b' : getColumnType(newColLabel, 'new-col-preview') === 'INTEGER' ? '#10b981' : '#f59e0b',
                      '& .MuiSelect-select': { py: 0.5 }
                    }}
                  >
                    <MenuItem value="TEXT" sx={{ fontSize: '0.75rem', fontWeight: 800 }}>TEXT</MenuItem>
                    <MenuItem value="INTEGER" sx={{ fontSize: '0.75rem', fontWeight: 800 }}>INTEGER</MenuItem>
                    <MenuItem value="DATE" sx={{ fontSize: '0.75rem', fontWeight: 800 }}>DATE</MenuItem>
                  </Select>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Checkbox size="small" checked={newColRequired} onChange={(e) => setNewColRequired(e.target.checked)} />
                </Box>
                <Stack direction="row" spacing={0.5} justifyContent="center">
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={handleAddCustomCol} 
                    disabled={!newColLabel.trim()} 
                    sx={{ bgcolor: '#fff', border: '1px solid #cbd5e1' }}
                  >
                    <CheckIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => setIsAddingCustom(false)} 
                    sx={{ bgcolor: '#fff', border: '1px solid #cbd5e1' }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>
              </Box>
            )}
          </Box>
          <Box sx={{ p: 2, bgcolor: '#fff', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0' }}>
            {!isAddingCustom && (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={() => setIsAddingCustom(true)} 
                sx={{ 
                  bgcolor: '#6366f1', 
                  borderRadius: '50px', 
                  px: 3,
                  fontWeight: 700
                }}
              >
                ADD CUSTOM COLUMN
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ fontWeight: 700, borderRadius: 2 }}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSave}
          sx={{ 
            bgcolor: '#ef4444', 
            fontWeight: 800, 
            px: 4, 
            borderRadius: 2,
            '&:hover': { bgcolor: '#dc2626' }
          }}
        >
          Apply Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceTemplateLibrary;
