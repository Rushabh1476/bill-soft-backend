/* eslint-disable */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Typography,
  Chip,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import {
  TemplateComplexity,
  IndustryColumnSuggestion,
  UNIFIED_TEMPLATES,
  INDUSTRY_CATEGORIES,
  BillPreview
} from '../../types/billTemplate';
import A4BillPreview from './A4BillPreview';

interface UnifiedTemplateSelectorProps {
  onSelectionChange?: (selection: TemplateSelection) => void;
  initialSelection?: TemplateSelection;
  showPreview?: boolean;
  compact?: boolean;
}

interface TemplateSelection {
  templateComplexity: TemplateComplexity;
  industryId?: string;
  selectedColumns: string[];
  customizations?: any;
}

const UnifiedTemplateSelector: React.FC<UnifiedTemplateSelectorProps> = ({
  onSelectionChange,
  initialSelection,
  showPreview = true,
  compact = false
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [selectedComplexity, setSelectedComplexity] = useState<TemplateComplexity | ''>(
    initialSelection?.templateComplexity || ''
  );
  const [selectedIndustry, setSelectedIndustry] = useState<string>(
    initialSelection?.industryId || ''
  );
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    initialSelection?.selectedColumns || []
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState<BillPreview | null>(null);

  const selectedTemplate = selectedComplexity ? UNIFIED_TEMPLATES[selectedComplexity] : null;
  const selectedIndustryData = INDUSTRY_CATEGORIES.find(ind => ind.id === selectedIndustry);
  const availableColumns = selectedIndustryData?.suggestedColumns || [];

  useEffect(() => {
    if (selectedComplexity && onSelectionChange) {
      const selection: TemplateSelection = {
        templateComplexity: selectedComplexity,
        industryId: selectedIndustry || undefined,
        selectedColumns
      };
      onSelectionChange(selection);
    }
  }, [selectedComplexity, selectedIndustry, selectedColumns, onSelectionChange]);

  const handleComplexityChange = (complexity: TemplateComplexity) => {
    setSelectedComplexity(complexity);
    setSelectedColumns([]); // Reset columns when template changes
    setShowColumnSelector(true);
  };

  const handleIndustryChange = (industryId: string) => {
    setSelectedIndustry(industryId);
    setSelectedColumns([]); // Reset columns when industry changes
  };

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const generatePreviewData = (): BillPreview => {
    return {
      templateId: selectedTemplate?.id || '',
      companyInfo: {
        name: 'Your Company Name',
        address: '123 Business Street, City, State 12345',
        phone: '+91 98765 43210',
        email: 'info@yourcompany.com',
        website: 'www.yourcompany.com',
        taxId: 'GST123456789'
      },
      customerInfo: {
        name: 'Sample Customer',
        address: '456 Customer Lane, Customer City, State 67890',
        phone: '+91 87654 32109',
        email: 'customer@email.com',
        taxId: 'CUST123456'
      },
      invoiceDetails: {
        invoiceNumber: 'INV-2024-001',
        invoiceDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        poNumber: 'PO-2024-001',
        currency: 'INR'
      },
      items: [
        {
          description: 'Professional Service - Consultation',
          quantity: 5,
          rate: 2000,
          amount: 10000,
          taxRate: 18,
          unit: 'hours',
          category: selectedIndustryData?.displayName || 'General'
        },
        {
          description: 'Software License - Annual',
          quantity: 1,
          rate: 25000,
          amount: 25000,
          taxRate: 18,
          unit: 'license'
        },
        {
          description: 'Implementation Support',
          quantity: 3,
          rate: 3000,
          amount: 9000,
          taxRate: 18,
          unit: 'days'
        }
      ],
      calculations: {
        subtotal: 44000,
        taxAmount: 7920,
        discountAmount: 0,
        shippingAmount: 0,
        totalAmount: 51920,
        paidAmount: 20000,
        balanceAmount: 31920
      },
      additionalInfo: {
        notes: 'Thank you for choosing our services. Payment is due within 30 days.',
        terms: 'Payment terms: Net 30 days. Late payment charges may apply.',
        paymentMethods: ['Bank Transfer', 'UPI', 'Cheque'],
        bankDetails: 'Bank: Sample Bank\nAccount: 1234567890\nIFSC: SAMP0001234\nBranch: Main Branch'
      }
    };
  };

  const handlePreview = () => {
    const preview = generatePreviewData();
    setPreviewData(preview);
    setShowPreviewDialog(true);
  };

  const resetSelection = () => {
    setSelectedComplexity('');
    setSelectedIndustry('');
    setSelectedColumns([]);
    setShowColumnSelector(false);
  };

  const getComplexityColor = (complexity: TemplateComplexity) => {
    switch (complexity) {
      case TemplateComplexity.EASY:
        return 'success';
      case TemplateComplexity.BETTER:
        return 'info';
      case TemplateComplexity.COMPLEX:
        return 'warning';
      case TemplateComplexity.DETAILED:
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Card elevation={compact ? 1 : 3}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Choose Your Invoice Template
          </Typography>

          {/* Template Complexity Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              1. Select Template Complexity
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
              {Object.values(TemplateComplexity).map((complexity) => {
                const template = UNIFIED_TEMPLATES[complexity];
                const isSelected = selectedComplexity === complexity;

                return (
                  <Card
                    key={complexity}
                    variant={isSelected ? 'elevation' : 'outlined'}
                    elevation={isSelected ? 4 : 1}
                    sx={{
                      cursor: 'pointer',
                      border: isSelected ? 2 : 1,
                      borderColor: isSelected ? `${getComplexityColor(complexity)}.main` : 'divider',
                      transition: 'all 0.2s',
                      '&:hover': { elevation: 3 }
                    }}
                    onClick={() => handleComplexityChange(complexity)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Chip
                          label={template.displayName}
                          color={getComplexityColor(complexity) as any}
                          size="small"
                          variant={isSelected ? 'filled' : 'outlined'}
                        />
                        {isSelected && <CheckCircleIcon color="success" />}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem' }}>
                        {template.description}
                      </Typography>
                      <Typography variant="caption" color="primary">
                        {template.fieldCount} fields • {template.pricing}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {template.features.slice(0, 2).map((feature, index) => (
                          <Chip
                            key={index}
                            label={feature}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
                          />
                        ))}
                        {template.features.length > 2 && (
                          <Typography variant="caption" color="text.secondary">
                            +{template.features.length - 2} more features
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Box>

          {/* Industry Selection */}
          {selectedComplexity && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                2. Select Your Industry (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose your industry to get recommended fields specific to your business type.
              </Typography>

              <FormControl fullWidth>
                <InputLabel>Industry Category</InputLabel>
                <Select
                  value={selectedIndustry}
                  label="Industry Category"
                  onChange={(e) => handleIndustryChange(e.target.value)}
                >
                  <MenuItem value="">
                    <em>None (Use generic template)</em>
                  </MenuItem>
                  {INDUSTRY_CATEGORIES.map((industry) => (
                    <MenuItem key={industry.id} value={industry.id}>
                      <Box>
                        <Typography variant="body1">{industry.displayName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {industry.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Column Selection */}
          {selectedIndustry && availableColumns.length > 0 && (
            <Accordion expanded={showColumnSelector} onChange={() => setShowColumnSelector(!showColumnSelector)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  3. Customize Fields ({selectedColumns.length} selected)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Select additional fields specific to your {selectedIndustryData?.displayName} business.
                  These will be added to your invoice template.
                </Alert>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                  {Object.entries(
                    availableColumns.reduce((acc, column) => {
                      if (!acc[column.category]) acc[column.category] = [];
                      acc[column.category].push(column);
                      return acc;
                    }, {} as Record<string, IndustryColumnSuggestion[]>)
                  ).map(([category, columns]) => (
                    <Box key={category}>
                      <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', mb: 1, fontWeight: 'medium' }}>
                        {category} Fields
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 1 }}>
                        <List dense>
                          {columns.map((column, index) => (
                            <ListItem key={column.id} sx={{ px: 1 }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={selectedColumns.includes(column.id)}
                                      onChange={() => handleColumnToggle(column.id)}
                                      size="small"
                                    />
                                  }
                                  label=""
                                  sx={{ m: 0 }}
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={column.displayName}
                                secondary={column.description}
                                primaryTypographyProps={{ variant: 'body2' }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                              />
                              <Chip label={column.type} size="small" variant="outlined" />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Box>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Action Buttons */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={resetSelection}
              disabled={!selectedComplexity}
            >
              Reset
            </Button>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={handlePreview}
              disabled={!selectedComplexity}
            >
              Preview Invoice
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={!selectedComplexity}
            >
              Use This Template
            </Button>
          </Box>

          {/* Selection Summary */}
          {selectedComplexity && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Selected:</strong> {selectedTemplate?.displayName}
                {selectedIndustryData && ` for ${selectedIndustryData.displayName}`}
                {selectedColumns.length > 0 && ` with ${selectedColumns.length} custom fields`}
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      {showPreviewDialog && previewData && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.8)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2
          }}
          onClick={() => setShowPreviewDialog(false)}
        >
          <Box
            sx={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              bgcolor: isDarkMode ? 'background.paper' : 'white',
              borderRadius: 2
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Invoice Preview - {selectedTemplate?.displayName}</Typography>
              <Button variant="outlined" onClick={() => setShowPreviewDialog(false)}>
                Close
              </Button>
            </Box>
            <A4BillPreview
              billData={previewData}
              templateComplexity={selectedComplexity as TemplateComplexity}
              showControls={true}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default UnifiedTemplateSelector;
