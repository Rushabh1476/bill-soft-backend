
import React, { useState, useRef } from 'react';
import {
  Dialog,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudDownload as DownloadIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { API_URL } from '../../config/api';

interface BulkProductManagerV2Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: (jobId: string) => void;
}

const BulkProductManagerV2: React.FC<BulkProductManagerV2Props> = ({ open, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const downloadTemplate = async () => {
    try {
      const headers = ['Name', 'Description', 'Price', 'Stock', 'Tax Rate (%)', 'Category', 'SKU'];
      const rows = [
        ['Product A', 'Sample description', '499.00', '100', '18', 'Electronics', 'SKU001'],
        ['Product B', 'Another description', '299.00', '50', '12', 'Groceries', 'SKU002'],
      ];
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'billsoft_product_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download template error:', err);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/products/bulk-import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import products');
      }

      if (onSuccess) {
        onSuccess(data.jobId);
      }
      onClose();
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isImporting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#383838', // Muted dark grey seen in screenshot
          borderRadius: '1rem',
          backgroundImage: 'none',
          color: 'white',
          overflow: 'hidden',
        }
      }}
    >
      <div className="relative p-7 flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <h2 className="text-[17px] font-semibold text-white">Bulk Product Management</h2>
          <IconButton 
            onClick={onClose} 
            disabled={isImporting} 
            size="small" 
            className="text-white hover:bg-white/10"
            sx={{ mt: -0.5, mr: -0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        {/* Step 1 Section */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-white">Step 1: Download Template</h3>
          <p className="text-zinc-400 text-[13px] leading-snug">
            Download the CSV template with the correct format for bulk product import.
          </p>
          <button
            onClick={downloadTemplate}
            className="flex items-center w-fit gap-2 px-3 py-1.5 mt-1 border border-blue-500 text-blue-500 rounded-lg text-sm font-medium hover:bg-blue-500/10 transition-colors"
          >
            <DownloadIcon sx={{ fontSize: 18 }} />
            Download CSV Template
          </button>
        </div>

        {/* Step 2 Section */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-white">Step 2: Upload Your File</h3>
          <p className="text-zinc-400 text-[13px] leading-snug">
            Upload your completed CSV file with product data.
          </p>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center w-fit gap-2 px-3 py-1.5 mt-1 border border-blue-500 text-blue-500 rounded-lg text-sm font-medium hover:bg-blue-500/10 transition-colors"
          >
            <UploadIcon sx={{ fontSize: 18 }} />
            {file ? file.name : 'Choose CSV File'}
          </button>
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end items-center gap-7 mt-6">
          <button
            onClick={onClose}
            disabled={isImporting}
            className="text-blue-500 text-[14px] font-medium hover:underline"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || isImporting}
            className={`px-8 py-2 rounded-xl text-sm font-semibold transition-all ${
              !file || isImporting
                ? 'bg-zinc-600/50 text-zinc-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isImporting ? 'Importing...' : 'Import Products'}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default BulkProductManagerV2;
