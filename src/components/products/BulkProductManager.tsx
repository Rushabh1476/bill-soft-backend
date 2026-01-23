import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CloudDownload,
  CloudUpload,
  Close,
  CheckCircle,
  Error,
  Warning,
} from '@mui/icons-material';
import { Product } from '../../types/product';

interface BulkProductManagerProps {
  open: boolean;
  onClose: () => void;
  onBulkImport: (products: Product[]) => Promise<void>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  products: Product[];
}

const BulkProductManager: React.FC<BulkProductManagerProps> = ({
  open,
  onClose,
  onBulkImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    // Create a sample CSV template
    const headers = [
      'Name',
      'Description',
      'Price',
      'Stock',
      'Tax Rate (%)',
    ];

    const sampleData = [
      ['Sample Product 1', 'High quality product description', '99.99', '50', '18'],
      ['Sample Product 2', 'Another product example', '149.50', '25', '18'],
      ['Sample Product 3', 'Third example product', '299.00', '10', '12'],
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'bulk-products-template.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validateCSV = (content: string): ValidationResult => {
    const lines = content.split('\n').filter(line => line.trim());
    const errors: string[] = [];
    const warnings: string[] = [];
    const products: Product[] = [];

    if (lines.length < 2) {
      errors.push('File must contain at least a header row and one data row');
      return { valid: false, errors, warnings, products };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'description', 'price'];
    const optionalHeaders = ['stock', 'tax rate (%)', 'taxrate'];

    // Check required headers
    const missingHeaders = requiredHeaders.filter(header => 
      !headers.some(h => h.includes(header))
    );

    if (missingHeaders.length > 0) {
      errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim());
      
      if (row.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`);
        continue;
      }

      try {
        const nameIndex = headers.findIndex(h => h.includes('name'));
        const descIndex = headers.findIndex(h => h.includes('description'));
        const priceIndex = headers.findIndex(h => h.includes('price'));
        const stockIndex = headers.findIndex(h => h.includes('stock'));
        const taxIndex = headers.findIndex(h => h.includes('tax'));

        const name = row[nameIndex]?.trim();
        const description = row[descIndex]?.trim();
        const priceStr = row[priceIndex]?.trim();
        const stockStr = row[stockIndex]?.trim();
        const taxStr = row[taxIndex]?.trim();

        if (!name) {
          errors.push(`Row ${i + 1}: Product name is required`);
          continue;
        }

        if (!description) {
          warnings.push(`Row ${i + 1}: Product description is empty`);
        }

        const price = parseFloat(priceStr);
        if (isNaN(price) || price < 0) {
          errors.push(`Row ${i + 1}: Invalid price "${priceStr}"`);
          continue;
        }

        const stock = stockStr ? parseInt(stockStr) : undefined;
        if (stockStr && (isNaN(stock!) || stock! < 0)) {
          warnings.push(`Row ${i + 1}: Invalid stock "${stockStr}", using 0`);
        }

        const taxRate = taxStr ? parseFloat(taxStr) : undefined;
        if (taxStr && (isNaN(taxRate!) || taxRate! < 0 || taxRate! > 100)) {
          warnings.push(`Row ${i + 1}: Invalid tax rate "${taxStr}", using 0`);
        }

        const product: Product = {
          id: `bulk-${Date.now()}-${i}`,
          name,
          description: description || '',
          price,
          stock: stock && stock >= 0 ? stock : 0,
          taxRate: taxRate && taxRate >= 0 && taxRate <= 100 ? taxRate : 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        products.push(product);
      } catch (error) {
        errors.push(`Row ${i + 1}: Failed to parse data`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      products,
    };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = validateCSV(content);
      setValidationResult(result);
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!validationResult || !validationResult.valid || validationResult.products.length === 0) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await onBulkImport(validationResult.products);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setFile(null);
        setValidationResult(null);
        onClose();
      }, 1000);
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      alert('Failed to import products. Please try again.');
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      setValidationResult(null);
      setUploadProgress(0);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Bulk Product Management
          <IconButton onClick={handleClose} disabled={isUploading}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Step 1: Download Template
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Download the CSV template with the correct format for bulk product import.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CloudDownload />}
            onClick={downloadTemplate}
            disabled={isUploading}
          >
            Download CSV Template
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Step 2: Upload Your File
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Upload your completed CSV file with product data.
          </Typography>
          
          <Box
            component="input"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            ref={fileInputRef}
            aria-label="Upload CSV file"
            title="Upload CSV file"
            sx={{ display: 'none' }}
          />
          
          <Button
            variant="outlined"
            startIcon={<CloudUpload />}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {file ? `Selected: ${file.name}` : 'Choose CSV File'}
          </Button>
        </Box>

        {isUploading && (
          <Box mb={3}>
            <Typography variant="body2" mb={1}>
              Importing products... {uploadProgress}%
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}

        {validationResult && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Validation Results
            </Typography>
            
            {validationResult.errors.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Errors Found ({validationResult.errors.length}):
                </Typography>
                <List dense>
                  {validationResult.errors.map((error, index) => (
                    <ListItem key={index}>
                      <Error fontSize="small" sx={{ mr: 1 }} />
                      <ListItemText primary={error} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {validationResult.warnings.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Warnings ({validationResult.warnings.length}):
                </Typography>
                <List dense>
                  {validationResult.warnings.map((warning, index) => (
                    <ListItem key={index}>
                      <Warning fontSize="small" sx={{ mr: 1 }} />
                      <ListItemText primary={warning} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {validationResult.valid && validationResult.products.length > 0 && (
              <Alert severity="success">
                <Box display="flex" alignItems="center">
                  <CheckCircle fontSize="small" sx={{ mr: 1 }} />
                  <Typography>
                    Ready to import {validationResult.products.length} products
                  </Typography>
                </Box>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={!validationResult?.valid || isUploading || validationResult.products.length === 0}
        >
          Import Products
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkProductManager;