import React, { useState, useMemo } from 'react';
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
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import CustomerForm from '../components/customers/CustomerForm';
import { useCustomers } from '../hooks/useCustomers';

const Customers: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // useCustomers hook se data fetch kar rahe hain
  const { customers, deleteCustomer } = useCustomers();

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleDelete = (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteCustomer(customerId);
    }
  };

  // --- CRASH PREVENTION START ---
  // Agar 'customers' array nahi hai, to empty array use karega taaki crash na ho
  const safeCustomers = Array.isArray(customers) ? customers : [];

  const filteredCustomers = safeCustomers.filter(customer => {
    const nameMatch = customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = customer?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || emailMatch;
  });
  // --- CRASH PREVENTION END ---

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Customer Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your customer database and contact information
        </Typography>
      </Box>

      {/* Search and Actions Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { sm: 'center' },
          justifyContent: 'space-between'
        }}>
          <TextField
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, maxWidth: { sm: 400 } }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpen}
            sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
          >
            Add Customer
          </Button>
        </Box>
      </Paper>

      {/* Customers Grid Layout */}
      {filteredCustomers.length > 0 ? (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            lg: 'repeat(3, 1fr)' 
          }, 
          gap: 3 
        }}>
          {filteredCustomers.map((customer) => (
            <Card sx={{ height: '100%', position: 'relative' }} key={customer.id || Math.random()}>
              <CardContent sx={{ pb: 2 }}>
                  {/* Customer Header with Action Buttons */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" noWrap>
                      {customer.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ minWidth: 32, width: 32, height: 32, p: 0 }}
                      >
                        <EditIcon fontSize="small" />
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDelete(customer.id)}
                        sx={{ minWidth: 32, width: 32, height: 32, p: 0 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    </Box>
                  </Box>

                  {/* Customer Details Section */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {customer.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {customer.email}
                        </Typography>
                      </Box>
                    )}
                    
                    {customer.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {customer.phone}
                        </Typography>
                      </Box>
                    )}
                    
                    {customer.address && (
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <LocationIcon fontSize="small" color="action" sx={{ mt: 0.25 }} />
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {customer.address}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Card Footer with Status and Date */}
                  <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        label="Active"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Added {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        /* Empty State */
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm ? 'No customers found' : 'No customers yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Start by adding your first customer to get started'
            }
          </Typography>
          {!searchTerm && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
              Add Your First Customer
            </Button>
          )}
        </Paper>
      )}

      {/* Floating Action Button for Mobile Users */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add customer"
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Add/Edit Customer Dialog Modal */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          {/* CustomerForm is responsible for the actual submission */}
          <CustomerForm onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Customers;