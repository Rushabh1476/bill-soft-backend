/* eslint-disable */
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  useTheme
} from '@mui/material';
import {
  CloudDownload,
  CloudUpload,
  Close,
  CheckCircle,
  Error as ErrorIcon,
  CheckCircleOutline,
} from '@mui/icons-material';
import { Product } from '../../types/product';
import { getProductService } from '../../services/DIContainer';
import { IProductService } from '../../services/productService';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BulkProductManagerProps {
  open: boolean;
  onClose: () => void;
  onBulkImport: (products: Product[]) => Promise<void>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  products: any[];
}

interface JobStatusResponse {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  processed: number;
  failed?: number;
  total: number;
  progress: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'bulkImportJobId';
const CHUNK_SIZE = 50;

const productService: IProductService = getProductService();

// Simple CSV parser for browsers
function parseCSV(content: string): any[] {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  const products: any[] = [];

  const colIdx = (names: string[]) => headers.findIndex(h => names.some(n => h.includes(n)));

  const nameIdx = colIdx(['name']);
  const priceIdx = colIdx(['price']);
  const descIdx = colIdx(['description', 'desc']);
  const stockIdx = colIdx(['stock', 'qty']);
  const taxIdx = colIdx(['tax']);
  const catIdx = colIdx(['category']);
  const skuIdx = colIdx(['sku']);
  const minIdx = colIdx(['minstock', 'min stock']);

  for (let i = 1; i < lines.length; i++) {
    // Basic CSV splitting (doesn't handle commas in quotes perfectly, but sufficient for template)
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (values.length < 2) continue;

    products.push({
      name: nameIdx >= 0 ? values[nameIdx] : '',
      description: descIdx >= 0 ? values[descIdx] : null,
      price: priceIdx >= 0 ? parseFloat(values[priceIdx]) || 0 : 0,
      stock: stockIdx >= 0 ? parseInt(values[stockIdx]) || 0 : 0,
      taxRate: taxIdx >= 0 ? parseFloat(values[taxIdx]) || 0 : 0,
      category: catIdx >= 0 ? values[catIdx] : null,
      sku: skuIdx >= 0 ? values[skuIdx] : null,
      minStockLevel: minIdx >= 0 ? parseInt(values[minIdx]) || 0 : 0
    });
  }
  return products;
}

// ─── Component ────────────────────────────────────────────────────────────────
const BulkProductManager: React.FC<BulkProductManagerProps> = ({ open, onClose }) => {
  const theme = useTheme();
  // Local state
  const [file, setFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Progress state
  const [isImporting, setIsImporting] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);


  // Control refs
  const stopImportRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetAllStates = useCallback(() => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setParsedProducts([]);
    setValidationErrors([]);
    setProcessed(0);
    setTotal(0);
    setError(null);
    setIsImporting(false);
    setIsDone(false);
    setJobId(null);
    stopImportRef.current = false;
  }, []);

  const isOpen = open || isImporting;

  // Cleanup on close
  const cleanup = () => {
    resetAllStates();
  };

  const downloadTemplate = () => {
    const headers = ['Name', 'Description', 'Price', 'Stock', 'Tax Rate (%)', 'Category', 'SKU', 'Min Stock Level'];
    const rows = [['Sample Item', 'Product Description', '19.99', '50', '18', 'Electronics', 'SKU123', '10']];
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'inventory_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      const products = parseCSV(content);
      const errors: string[] = [];

      if (products.length === 0) errors.push('No valid product rows found in file.');
      if (products.some(p => !p.name)) errors.push('Some rows are missing the required "Name" field.');

      setParsedProducts(products);
      setValidationErrors(errors);
    };
    reader.readAsText(f);
  };

  const startImport = async () => {
    if (parsedProducts.length === 0 || validationErrors.length > 0) return;

    setIsImporting(true);
    setError(null);
    setIsDone(false);
    setProcessed(0);
    setTotal(parsedProducts.length);
    stopImportRef.current = false;

    let currentProcessed = 0;
    let newJobId: string | null = null;

    try {
      // 1. Start Job
      const response = await productService.startChunkedImport(parsedProducts.length);
      newJobId = response.jobId;
      setJobId(newJobId);

      // Prepare chunks
      const chunks: any[][] = [];
      for (let i = 0; i < parsedProducts.length; i += CHUNK_SIZE) {
        chunks.push(parsedProducts.slice(i, i + CHUNK_SIZE));
      }

      // 2. Loop through chunks (Atomic loop killer)
      for (const chunk of chunks) {
        if (stopImportRef.current) {
          console.log('[BulkImport] Emergency break triggered');
          await productService.cancelImport(newJobId);
          break;
        }

        await productService.sendImportChunk(newJobId, chunk);
        currentProcessed += chunk.length;
        setProcessed(currentProcessed);
        console.log(`[BulkImport] CHUNK PROCESSED: ${currentProcessed} / ${parsedProducts.length}`);
      }

      // SUCCESS: 100% Reached
      if (!stopImportRef.current) {
        console.log("[BulkImport] 100% REACHED. Triggering Success UI...");
        setProcessed(parsedProducts.length);
        setIsDone(true); 

        // Let server know we are done in parallel (non-blocking for UI)
        productService.finishImportJob(newJobId, 'completed')
          .then(() => console.log("[BulkImport] Backend job finalized."))
          .catch(err => console.error("[BulkImport] Backend finalization error:", err));

        // TOAST DURATION: 3 Seconds
        setTimeout(() => {
          console.log("[BulkImport] Success window finished. Closing modal...");
          window.dispatchEvent(new Event('inventory-updated'));
          onClose(); // Parent close
          resetAllStates(); // Local state reset (sets isImporting to false)
        }, 3000);
      }
    } catch (err: any) {
      console.error('[BulkImport] CRITICAL ERROR:', err);
      setError(err?.message || 'A network error occurred during import.');
    } finally {
      console.log("[BulkImport] Main import loop exited.");
    }
  };

  const handleStopRequest = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to cancel the import? Atomic Rollback will delete all products added in this session.')) {
      stopImportRef.current = true;
      if (jobId) {
        try {
          await productService.cancelImport(jobId);
        } catch (err) {
          console.error('Rollback failure:', err);
        }
      }
      setIsImporting(false);
      onClose();
      resetAllStates();
    }
  };

  const handleCancelClick = (event?: {}, reason?: string) => {
    // Restrict Cancel Trigger: Do nothing on backdrop/escape during import
    if (isImporting && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return;
    }

    if (isImporting && !isDone) {
      handleStopRequest();
    } else {
      onClose();
      resetAllStates();
    }
  };

  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      <Dialog
        open={isOpen}
        onClose={handleCancelClick}
        disableEscapeKeyDown={isImporting}
        maxWidth="sm"
        fullWidth
      >
      <DialogTitle sx={{ fontWeight: 700 }}>
        Bulk Product Import
      </DialogTitle>

      <DialogContent
        sx={{ minHeight: 200, py: 3 }}
      >
        {isImporting ? (
          <Box textAlign="center" py={2}>
            <Typography variant="h6" color="primary" gutterBottom fontWeight={600}>
              {`Importing: ${Math.min(processed + CHUNK_SIZE, total)} / ${total}`}
            </Typography>

            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
              <Typography variant="h3" fontWeight={900} color="primary">
                {percentage}%
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{ height: 12, borderRadius: 6, mb: 2 }}
            />

            <Typography variant="body2" color="text.secondary">
              Processed: <strong>{processed}</strong> of <strong>{total}</strong>
            </Typography>

            {isDone && (
              <Box 
                mt={2} 
                sx={{ 
                  textAlign: 'center',
                  animation: 'fadeInUp 0.3s ease-out'
                }}
              >
                <Typography 
                  fontWeight={600} 
                  variant="body2"
                  sx={{ 
                    fontSize: '0.9rem',
                    color: 'success.main'
                  }}
                >
                  All products imported successfully!
                </Typography>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Upload a CSV file to add multiple products at once. Download our template to ensure correct formatting.
            </Typography>

            <Box display="flex" gap={2} mb={4}>
              <Button
                variant="outlined"
                startIcon={<CloudDownload />}
                onClick={downloadTemplate}
                fullWidth
              >
                Template
              </Button>
              <Button
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={() => fileInputRef.current?.click()}
                fullWidth
                color={file ? 'success' : 'primary'}
              >
                {file ? 'Refile' : 'Choose File'}
              </Button>
              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileSelect}
              />
            </Box>

            {file && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>Selected: <strong>{file.name}</strong></Typography>
                {validationErrors.length > 0 ? (
                  <Alert severity="error">
                    {validationErrors.map((err, i) => <div key={i}>{err}</div>)}
                  </Alert>
                ) : (
                  <Alert severity="success">
                    {parsedProducts.length} products ready for import.
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        {!isImporting ? (
          <>
            <Button onClick={onClose} disabled={isImporting}>Cancel</Button>
            <Button
              variant="contained"
              onClick={startImport}
              disabled={!file || validationErrors.length > 0}
            >
              Start Import
            </Button>
          </>
        ) : !isDone && (
          <Button color="error" variant="outlined" onClick={handleStopRequest}>
            Stop Import
          </Button>
        )}
      </DialogActions>
    </Dialog>
    </>
  );
};

export default BulkProductManager;
