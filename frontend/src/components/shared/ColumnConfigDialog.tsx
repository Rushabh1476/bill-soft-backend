import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useCustomColumns } from '../../hooks/useCustomColumns';

interface ColumnConfigDialogProps {
  open: boolean;
  onClose: () => void;
  entity: 'product' | 'bill';
}

const ColumnConfigDialog: React.FC<ColumnConfigDialogProps> = ({ open, onClose, entity }) => {
  const { columns, addColumn, removeColumn, loading, error: hookError } = useCustomColumns(entity);
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState('text');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newColLabel.trim()) return;
    
    // Check if name is already a default column
    const defaultCols = ['name', 'quantity', 'price', 'total', 'category', 'stock', 'status', 'description', 'sku', 'supplier'];
    const colName = newColLabel.toLowerCase().trim().replace(/\s+/g, '_');
    
    if (defaultCols.includes(colName)) {
      setError(`'${newColLabel}' is a reserved column name.`);
      return;
    }

    try {
      await addColumn({
        label: newColLabel.trim(),
        name: colName,
        type: newColType,
        entity,
        required: false,
      });
      setNewColLabel('');
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeColumn(id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <SettingsIcon color="primary" />
            <Typography variant="h6">Configure {entity === 'product' ? 'Product' : 'Bill'} Columns</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
            Default Columns (Locked)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
            {(entity === 'bill' 
              ? ['Bill Number', 'Customer', 'Amount', 'Status', 'Date'] 
              : ['Product Name', 'Price', 'Stock', 'Category', 'Description']
            ).map(col => (
              <Chip 
                key={col} 
                label={col} 
                disabled 
                variant="outlined" 
                size="medium"
                sx={{ 
                  borderRadius: 2, 
                  fontWeight: 600, 
                  px: 1, 
                  borderColor: 'divider',
                  '&.Mui-disabled': { opacity: 0.8, color: 'text.secondary' } 
                }}
              />
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Custom Columns
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {!error && hookError && <Alert severity="error" sx={{ mb: 2 }}>{hookError}</Alert>}
          
          <List>
            {columns.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                No custom columns added yet.
              </Typography>
            ) : (
              columns.map((col) => (
                <ListItem
                  key={col.id}
                  secondaryAction={
                    <IconButton edge="end" color="error" onClick={() => handleRemove(col.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText 
                    primary={col.label} 
                    secondary={`${col.type.toUpperCase()} • Key: ${col.name}`} 
                  />
                </ListItem>
              ))
            )}
          </List>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Add New Column
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Column Label (e.g. HSN Code)"
              value={newColLabel}
              onChange={(e) => setNewColLabel(e.target.value)}
              placeholder="HSN Code"
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={newColType}
                onChange={(e) => setNewColType(e.target.value)}
                label="Type"
              >
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="number">Number</MenuItem>
                <MenuItem value="date">Date</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={handleAdd}
              disabled={!newColLabel.trim() || loading}
              startIcon={<AddIcon />}
            >
              Add
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ColumnConfigDialog;
