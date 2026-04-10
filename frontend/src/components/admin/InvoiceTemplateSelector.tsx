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
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';

/**
 * Interface Segregation Principle - Component only depends on what it needs
 */
interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  preview?: string;
  isDefault?: boolean;
}

interface InvoiceTemplateSelectorProps {
  value: string;
  onChange: (templateId: string) => void;
  disabled?: boolean;
  onPreview?: (templateId: string) => void;
}

/**
 * Single Responsibility Principle - Component only handles template selection UI
 * Open/Closed Principle - Easy to extend with new template types without modification
 */
const InvoiceTemplateSelector: React.FC<InvoiceTemplateSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  onPreview
}) => {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<InvoiceTemplate | null>(null);

  /**
   * Dependency Inversion Principle - Component depends on API abstraction
   */
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      
      const data = await response.json();
      setTemplates(data.availableTemplates || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    if (!disabled) {
      onChange(templateId);
    }
  };

  const handlePreview = (template: InvoiceTemplate) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
    if (onPreview) {
      onPreview(template.id);
    }
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewTemplate(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading templates...</Typography>
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
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 3,
        }}
      >
        {templates.map((template) => (
          <Card
            key={template.id}
            sx={{
              height: '100%',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              border: value === template.id ? 2 : 1,
              borderColor: value === template.id ? 'primary.main' : 'divider',
              position: 'relative',
              transition: 'all 0.2s ease-in-out',
              '&:hover': disabled ? {} : {
                transform: 'translateY(-4px)',
                boxShadow: 3,
              }
            }}
            onClick={() => handleTemplateSelect(template.id)}
          >
              {/* Selection Indicator */}
              {value === template.id && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 1,
                  }}
                >
                  <CheckIcon color="primary" />
                </Box>
              )}

              {/* Default Badge */}
              {template.isDefault && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    zIndex: 1,
                  }}
                >
                  <Chip
                    label="Current Default"
                    size="small"
                    color="success"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </Box>
              )}

              {/* Template Preview */}
              <CardMedia
                sx={{
                  height: 160,
                  backgroundColor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {template.preview ? (
                  <Box
                    component="img"
                    src={template.preview}
                    alt={`${template.name} preview`}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {template.name}
                  </Typography>
                )}
                
                {/* Preview Button Overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                  }}
                >
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<PreviewIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(template);
                    }}
                    sx={{ minWidth: 'auto', px: 1 }}
                  >
                    Preview
                  </Button>
                </Box>
              </CardMedia>

              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {template.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {template.description}
                </Typography>
              </CardContent>
            </Card>
        ))}
      </Box>

      {/* Template Preview Modal */}
      <Dialog
        open={previewOpen}
        onClose={closePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Template Preview: {previewTemplate?.name}
        </DialogTitle>
        <DialogContent>
          {previewTemplate && (
            <Box>
              <Typography variant="body1" gutterBottom>
                {previewTemplate.description}
              </Typography>
              {previewTemplate.preview && (
                <Box
                  sx={{
                    mt: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    component="img"
                    src={previewTemplate.preview}
                    alt={`${previewTemplate.name} preview`}
                    sx={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePreview}>Close</Button>
          {previewTemplate && (
            <Button
              variant="contained"
              onClick={() => {
                handleTemplateSelect(previewTemplate.id);
                closePreview();
              }}
              disabled={disabled}
            >
              Select This Template
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceTemplateSelector;
