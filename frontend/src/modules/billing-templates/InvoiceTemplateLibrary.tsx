/* eslint-disable */
import React, { useState, useEffect } from 'react';
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
  Switch,
  Slider,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as PreviewIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Tune as TuneIcon,
  Close as CloseIcon,
  ContentCopy as DuplicateIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { api } from '../../services/api';
import { InvoiceTemplate, TemplateField, TemplateSettings, BILL_SIZE_DIMENSIONS } from './core';
import { MOCK_TEMPLATES } from './core/mockData';
import { ThemeProvider } from '@mui/material/styles';
import { modernTheme } from '../../theme/theme';
import BillTemplateRenderer from './BillTemplateRenderer';

/**
 * Main Invoice Template Library Component
 * Handles template search, selection, preview, and customization
 */
const InvoiceTemplateLibrary: React.FC = () => {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Dialog states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fieldsOpen, setFieldsOpen] = useState(false);
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

  // Tab state for settings
  const [settingsTab, setSettingsTab] = useState(0);

  // New Template state
  const [createOpen, setCreateOpen] = useState(false);
  const [newTemplateData, setNewTemplateData] = useState({
    name: '',
    description: '',
    category: 'business',
    complexity: 'standard'
  });


  // Template categories and complexities
  const categories = ['all', 'business', 'retail', 'service', 'consulting', 'healthcare', 'education'];
  const complexities = ['all', 'basic', 'standard', 'advanced'];

  useEffect(() => {
    fetchTemplates();
  }, []);

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

  const saveLocalOverride = (templateId: string, patch: { settings?: any; fields?: any }) => {
    const overrides = getLocalOverrides();
    overrides[templateId] = { ...(overrides[templateId] || {}), ...patch };
    localStorage.setItem(LS_KEY, JSON.stringify(overrides));
  };

  /** Merge localStorage overrides into a list of templates */
  const mergeOverrides = (list: InvoiceTemplate[]): InvoiceTemplate[] => {
    const overrides = getLocalOverrides();
    const defaultId = localStorage.getItem('billsoft_default_template_id');
    return list.map(t => {
      const override = overrides[t.id];
      const template = { ...t };
      if (defaultId) {
        template.isDefault = t.id === defaultId;
      }
      if (!override) return template;
      return {
        ...template,
        ...(override.settings ? { settings: { ...t.settings, ...override.settings } } : {}),
        ...(override.fields   ? { fields: override.fields } : {}),
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
      const merged = mergeOverrides([...MOCK_TEMPLATES, ...customTemplates]);
      setTemplates(merged);
    } catch (err) {
      console.error('Error fetching templates:', err);
      // Fallback: still apply any locally-saved overrides
      setTemplates(mergeOverrides(MOCK_TEMPLATES));
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

  const handleTemplateSelect = async (templateId: string) => {
    try {
      // Update local state
      setTemplates(templates.map(template => ({
        ...template,
        isDefault: template.id === templateId
      })));
      localStorage.setItem('billsoft_default_template_id', templateId);

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
      saveLocalOverride(selectedTemplate.id, { settings });

      const updatedTemplate: InvoiceTemplate = {
        ...selectedTemplate,
        settings: JSON.parse(JSON.stringify(settings)),
        updatedAt: new Date().toISOString()
      };

      setTemplates(prev => prev.map(t =>
        t.id === selectedTemplate.id ? updatedTemplate : t
      ));

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
      saveLocalOverride(selectedTemplate.id, { fields });

      const updatedTemplate: InvoiceTemplate = {
        ...selectedTemplate,
        fields: JSON.parse(JSON.stringify(fields)),
        updatedAt: new Date().toISOString()
      };

      setTemplates(prev => prev.map(t =>
        t.id === selectedTemplate.id ? updatedTemplate : t
      ));

      setSelectedTemplate(updatedTemplate);
      setFieldsOpen(false);
      showNotification('✅ Fields saved successfully!', 'success');
    } catch (err) {
      console.error('Error saving template fields:', err);
      showNotification('Failed to save template fields.', 'error');
    }
  };

  const handleCreateTemplate = async () => {
    try {
      if (!newTemplateData.name) {
        showNotification('Please enter a template name', 'warning');
        return;
      }

      const response = await api.post('/templates', newTemplateData);
      
      if (response.data && response.data.success) {
        const newTemplate = response.data.templateData;
        setTemplates(prev => [...prev, newTemplate]);
        setCreateOpen(false);
        setNewTemplateData({
          name: '',
          description: '',
          category: 'business',
          complexity: 'standard'
        });
        showNotification('New template created successfully!', 'success');
      }
    } catch (err) {
      console.error('Error creating template:', err);
      showNotification('Failed to create new template.', 'error');
    }
  };

  const handleDuplicateTemplate = async (template: InvoiceTemplate) => {
    try {
      const duplicateData = {
        name: `${template.name} (Copy)`,
        description: template.description,
        category: template.category,
        complexity: template.complexity,
        settings: template.settings,
        fields: template.fields
      };

      const response = await api.post('/templates', duplicateData);
      
      if (response.data && response.data.success) {
        const newTemplate = response.data.templateData;
        setTemplates(prev => [...prev, newTemplate]);
        showNotification(`Template "${template.name}" duplicated successfully!`, 'success');
      }
    } catch (err) {
      console.error('Error duplicating template:', err);
      showNotification('Failed to duplicate template.', 'error');
    }
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
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Invoice Templates
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Browse and select professional designs for your invoices. Choose a template to set as your default.
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3 }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' },
          gap: 2,
          alignItems: 'center'
        }}>
          <TextField
            fullWidth
            placeholder="Search..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1', md: 'span 2' } }}
          />

          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="Category"
            >
              {categories.map(category => (
                <MenuItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showFavoritesOnly}
                onChange={(e) => setShowFavoritesOnly(e.target.checked)}
              />
            }
            label={<Typography variant="body2">Favorites</Typography>}
            sx={{ ml: 0 }}
          />

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            fullWidth
            sx={{ borderRadius: 2 }}
            onClick={() => setCreateOpen(true)}
          >
            New
          </Button>
        </Box>
      </Paper>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)'
          },
          gap: 3
        }}>
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderRadius: 4,
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6,
                }
              }}
            >
              {/* Template Header/Badge */}
              <Box sx={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 2, display: 'flex', justifyContent: 'space-between' }}>
                {template.isDefault ? (
                  <Chip
                    label="Active"
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 'bold', boxShadow: 2 }}
                    icon={<CheckIcon fontSize="small" />}
                  />
                ) : <Box />}

                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(template.id);
                  }}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(4px)',
                    color: template.isFavorite ? 'warning.main' : 'grey.400',
                    '&:hover': { bgcolor: '#fff' }
                  }}
                >
                  {template.isFavorite ? <StarIcon /> : <StarBorderIcon />}
                </IconButton>
              </Box>

              {/* Preview Image Area */}
              <CardMedia
                sx={{
                  height: 200,
                  bgcolor: '#f5f7f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  position: 'relative'
                }}
                onClick={() => handlePreview(template)}
              >
                <Box
                  sx={{
                    width: 70,
                    height: 70,
                    backgroundColor: template.settings?.colorScheme || '#1976d2',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    boxShadow: 3
                  }}
                >
                  {template.name.charAt(0)}
                </Box>

                <Box sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: 'rgba(48, 92, 222, 0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PreviewIcon sx={{ color: 'primary.main', opacity: 0.3, fontSize: 40 }} />
                </Box>
              </CardMedia>

              <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom noWrap>
                  {template.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{
                  height: 40,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  mb: 2
                }}>
                  {template.description}
                </Typography>

                <Stack direction="row" spacing={1} mb={2.5}>
                  <Chip label={template.category} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                  <Chip label={template.complexity} size="small" sx={{ fontSize: '0.7rem' }} />
                </Stack>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PreviewIcon fontSize="small" />}
                    onClick={() => handlePreview(template)}
                    sx={{ gridColumn: 'span 2', borderRadius: 2, mb: 1, bgcolor: 'primary.main' }}
                  >
                    View Design / Preview
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SettingsIcon fontSize="small" />}
                    onClick={() => handleEditSettings(template)}
                    sx={{ borderRadius: 2 }}
                  >
                    Styles
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<TuneIcon fontSize="small" />}
                    onClick={() => handleEditFields(template)}
                    sx={{ borderRadius: 2 }}
                  >
                    Fields
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DuplicateIcon fontSize="small" />}
                    onClick={() => handleDuplicateTemplate(template)}
                    sx={{ borderRadius: 2, gridColumn: 'span 2' }}
                  >
                    Duplicate Template
                  </Button>

                  <Button
                    variant="contained"
                    fullWidth
                    disabled={template.isDefault}
                    sx={{ gridColumn: 'span 2', borderRadius: 2, mt: 1 }}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    {template.isDefault ? 'Selected' : 'Use This Template'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
          <Typography variant="h6" color="text.secondary">No templates found</Typography>
          <Button sx={{ mt: 2 }} onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}>
            Clear Filters
          </Button>
        </Paper>
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

      {/* Create New Template Dialog */}
      <CreateTemplateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        data={newTemplateData}
        onChange={(data) => setNewTemplateData(data)}
        onSave={handleCreateTemplate}
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
              width: isMobile ? '100%' : BILL_SIZE_DIMENSIONS[template.settings.billSize || 'A4'].width,
              height: isMobile ? 'auto' : BILL_SIZE_DIMENSIONS[template.settings.billSize || 'A4'].height,
              minHeight: isMobile ? 'auto' : BILL_SIZE_DIMENSIONS[template.settings.billSize || 'A4'].height,
              bgcolor: '#fff',
              my: { xs: 0, sm: 4 },
              borderRadius: isMobile ? 0 : 1,
              overflow: 'hidden',
              boxShadow: isMobile ? 'none' : '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              <BillTemplateRenderer template={template} bill={undefined as any} />
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
      <DialogTitle>
        Template Fields: {template.name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <List>
            {fields.map((field, index) => (
              <ListItem key={field.id} divider>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr auto auto auto' },
                  gap: 2,
                  alignItems: 'center',
                  width: '100%'
                }}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {field.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {field.type}
                    </Typography>
                  </Box>

                  <TextField
                    fullWidth
                    size="small"
                    label="Custom Label"
                    value={field.label || ''}
                    onChange={(e) => handleFieldUpdate(index, { label: e.target.value })}
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.visible}
                        onChange={(e) => handleFieldUpdate(index, { visible: e.target.checked })}
                      />
                    }
                    label="Visible"
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.required}
                        onChange={(e) => handleFieldUpdate(index, { required: e.target.checked })}
                      />
                    }
                    label="Required"
                  />

                  <TextField
                    size="small"
                    type="number"
                    label="Position"
                    value={field.position}
                    onChange={(e) => handleFieldUpdate(index, { position: parseInt(e.target.value) })}
                    sx={{ width: 100 }}
                  />
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save Fields
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Create New Template Dialog Component
 */
interface CreateTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  data: any;
  onChange: (data: any) => void;
  onSave: () => void;
}

const CreateTemplateDialog: React.FC<CreateTemplateDialogProps> = ({
  open,
  onClose,
  data,
  onChange,
  onSave,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Template</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            fullWidth
            label="Template Name"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="e.g. Premium Consulting Invoice"
            autoFocus
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={data.description}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            placeholder="Briefly describe who this template is for..."
          />
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={data.category}
                onChange={(e) => onChange({ ...data, category: e.target.value })}
                label="Category"
              >
                <MenuItem value="business">Business</MenuItem>
                <MenuItem value="retail">Retail</MenuItem>
                <MenuItem value="service">Service</MenuItem>
                <MenuItem value="consulting">Consulting</MenuItem>
                <MenuItem value="healthcare">Healthcare</MenuItem>
                <MenuItem value="education">Education</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Complexity</InputLabel>
              <Select
                value={data.complexity}
                onChange={(e) => onChange({ ...data, complexity: e.target.value })}
                label="Complexity"
              >
                <MenuItem value="basic">Basic</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={onSave} disabled={!data.name}>
          Create Template
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceTemplateLibrary;
