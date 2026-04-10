import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Paper,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { Product } from '../../types/product';
import { formatCompactCurrency, formatCompactNumber } from '../../utils/currency';
import { resolveFileUrl } from '../../utils/url';

interface Supplier {
  id: string;
  name: string;
}

interface VirtualizedProductListProps {
  products: Product[];
  suppliers: Supplier[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  selectedIds: string[];
  onSelect: (id: string) => void;
  canEdit: boolean;
  canDelete: boolean;
  height: number;
  selectionMode: boolean;
  onSelectAll: (checked: boolean) => void;
  customColumns?: any[];
}

/**
 * Product List component using a standard Table with table-layout: fixed
 * This ensures perfect vertical alignment between headers and rows as requested.
 */
const VirtualizedProductList: React.FC<VirtualizedProductListProps> = ({
  products,
  suppliers = [],
  onEdit,
  onDelete,
  selectedIds,
  onSelect,
  canEdit,
  canDelete,
  height,
  selectionMode,
  onSelectAll,
  customColumns = []
}) => {
  const getSupplierName = (id?: string | null) => {
    if (!id) return '-';
    const supplier = suppliers.find(s => s.id === id);
    return supplier ? supplier.name : '-';
  };

  // Define column widths - shared by header and body
  const widths = {
    selection: '50px',
    name: '220px',
    description: '280px',
    category: '140px',
    supplier: '140px',
    price: '120px',
    stock: '100px',
    status: '120px',
    actions: '120px'
  };

  // Common padding and alignment for all cells
  const cellSx = {
    px: 4,
    py: 1.5,
    textAlign: 'left',
    borderColor: 'divider',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    verticalAlign: 'middle' // Ensure components like Avatar align nicely with text
  };

  return (
    <TableContainer component={Paper} sx={{ height, maxHeight: height, overflow: 'auto', borderRadius: 2 }}>
      <Table stickyHeader sx={{ tableLayout: 'fixed', minWidth: 1200 }}>
        <TableHead>
          <TableRow>
            {selectionMode && (
              <TableCell sx={{ ...cellSx, width: widths.selection, textAlign: 'center' }}>
                <Checkbox
                  size="small"
                  indeterminate={selectedIds.length > 0 && selectedIds.length < products.length}
                  checked={products.length > 0 && selectedIds.length === products.length}
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </TableCell>
            )}
            <TableCell sx={{ ...cellSx, width: widths.name, fontWeight: 'bold' }}>Product Name</TableCell>
            <TableCell sx={{ ...cellSx, width: widths.description, fontWeight: 'bold' }}>Description</TableCell>
            <TableCell sx={{ ...cellSx, width: widths.category, fontWeight: 'bold' }}>Category</TableCell>
            <TableCell sx={{ ...cellSx, width: widths.supplier, fontWeight: 'bold' }}>Supplier</TableCell>
            <TableCell sx={{ ...cellSx, width: widths.price, fontWeight: 'bold' }}>Price</TableCell>
            <TableCell sx={{ ...cellSx, width: widths.stock, fontWeight: 'bold' }}>Stock</TableCell>
            <TableCell sx={{ ...cellSx, width: widths.status, fontWeight: 'bold' }}>Status</TableCell>
            {customColumns.map(col => (
              <TableCell key={col.id} sx={{ ...cellSx, width: '120px', fontWeight: 'bold' }}>{col.label}</TableCell>
            ))}
            <TableCell sx={{ ...cellSx, width: '180px', fontWeight: 'bold' }}>Other Details</TableCell>
            <TableCell sx={{ ...cellSx, width: widths.actions, fontWeight: 'bold', textAlign: 'center' }}>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => {
            const isSelected = selectedIds.includes(product.id);
            // Get ad-hoc fields only
            const adHocFields = product.customFields ? Object.entries(product.customFields)
              .filter(([key]) => !key.startsWith('_') && key !== 'importJobId' && !customColumns.some(col => col.name === key))
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ') : '';
            return (
              <TableRow 
                key={product.id} 
                hover 
                selected={isSelected}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                {selectionMode && (
                  <TableCell sx={{ ...cellSx, textAlign: 'center' }}>
                    <Checkbox
                      size="small"
                      checked={isSelected}
                      onChange={() => onSelect(product.id)}
                    />
                  </TableCell>
                )}
                
                {/* Product Name */}
                <TableCell sx={cellSx}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      variant="rounded"
                      src={product.imageUrl ? resolveFileUrl(product.imageUrl) : undefined}
                      sx={{ width: 40, height: 40, flexShrink: 0 }}
                    >
                      {!product.imageUrl && <InventoryIcon fontSize="small" />}
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium" noWrap>
                      {product.name}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Description */}
                <TableCell sx={cellSx}>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {product.description || '-'}
                  </Typography>
                </TableCell>

                {/* Category */}
                <TableCell sx={cellSx}>
                  <Chip
                    label={product.category || 'Uncategorized'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>

                {/* Supplier */}
                <TableCell sx={cellSx}>
                  <Typography variant="body2" noWrap>
                    {getSupplierName(product.supplierId)}
                  </Typography>
                </TableCell>

                {/* Price */}
                <TableCell sx={cellSx}>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCompactCurrency(product.price)}
                  </Typography>
                </TableCell>

                {/* Stock */}
                <TableCell sx={cellSx}>
                  <Typography variant="body2" fontWeight="medium">
                    {formatCompactNumber(product.stock)}
                  </Typography>
                </TableCell>

                {/* Status */}
                <TableCell sx={cellSx}>
                  <Chip
                    label={!product.stock || product.stock <= 0 ? 'Out of Stock' : product.stock <= 10 ? 'Low Stock' : 'In Stock'}
                    size="small"
                    color={!product.stock || product.stock <= 0 ? 'error' : product.stock <= 10 ? 'warning' : 'success'}
                    variant={(product.stock && product.stock <= 10) ? 'filled' : 'outlined'}
                  />
                </TableCell>
                
                {customColumns.map(col => (
                  <TableCell key={col.id} sx={cellSx}>
                    <Typography variant="body2">
                      {product.customFields?.[col.name] || '-'}
                    </Typography>
                  </TableCell>
                ))}

                <TableCell sx={cellSx}>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '150px', display: 'block' }}>
                    {adHocFields || '-'}
                  </Typography>
                </TableCell>

                {/* Actions */}
                <TableCell sx={{ ...cellSx, textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                    {canEdit && (
                      <IconButton size="small" onClick={() => onEdit(product)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {canDelete && (
                      <IconButton size="small" color="error" onClick={() => onDelete(product.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default VirtualizedProductList;
