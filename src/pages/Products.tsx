import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  Fab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import ProductForm from '../components/products/ProductForm';
import BulkProductManager from '../components/products/BulkProductManager';
import { useProducts } from '../hooks/useProducts';
import { Product } from '../types/product';

const Products: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pehle check karein ki hooks se products mil rahe hain ya nahi (default to empty array)
  const { products = [], deleteProduct, createProduct } = useProducts();

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleBulkOpen = () => {
    setBulkOpen(true);
  };

  const handleBulkClose = () => {
    setBulkOpen(false);
  };

  const handleBulkImport = async (bulkProducts: Product[]) => {
    for (const product of bulkProducts) {
      const { id, createdAt, updatedAt, ...productData } = product;
      await createProduct(productData);
    }
  };

  const handleDelete = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(productId);
    }
  };

  // ✅ FIX: added Array.isArray check to prevent .filter crash
  const filteredProducts = Array.isArray(products) ? products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Product Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your product catalog and inventory
        </Typography>
      </Box>

      {/* Search and Actions */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between'
        }}>
          <TextField
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              flexGrow: 1,
              maxWidth: { sm: 400 }
            }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={handleBulkOpen}
              sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
            >
              Bulk Import
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpen}
              sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
            >
              Add Product
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)'
          },
          gap: 3
        }}>
          {filteredProducts.map((product) => (
            <Card sx={{ height: '100%', position: 'relative' }} key={product.id}>
              <CardContent sx={{ pb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold" noWrap>
                    {product.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Button size="small" variant="outlined" sx={{ minWidth: 'auto', p: 0.5 }}>
                      <EditIcon fontSize="small" />
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleDelete(product.id)}
                      sx={{ minWidth: 'auto', p: 0.5 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {product.description && (
                    <Typography variant="body2" color="text.secondary">
                      {product.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachMoneyIcon fontSize="small" color="action" />
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      ₹{product.price}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InventoryIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Stock: {product.stock || 0} units
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={product.stock && product.stock > 0 ? "In Stock" : "Out of Stock"}
                      size="small"
                      color={product.stock && product.stock > 0 ? "success" : "error"}
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Added {new Date(product.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm ? 'No products found' : 'No products yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Start by adding your first product to get started'
            }
          </Typography>
          {!searchTerm && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
              Add Your First Product
            </Button>
          )}
        </Paper>
      )}

      {isMobile && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleOpen}
        >
          <AddIcon />
        </Fab>
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent className="product-dialog-content">
          <ProductForm onClose={handleClose} />
        </DialogContent>
      </Dialog>

      <BulkProductManager
        open={bulkOpen}
        onClose={handleBulkClose}
        onBulkImport={handleBulkImport}
      />
    </Box>
  );
};

export default Products;