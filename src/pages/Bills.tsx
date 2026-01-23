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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import BillForm from '../components/bills/BillForm';
import { useBills } from '../hooks/useBills';

const Bills: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pehle check karein ki hooks se bills mil rahe hain ya nahi (default to empty array)
  const { bills = [], deleteBill } = useBills();

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleDelete = (billId: string) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      deleteBill(billId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Pending': return 'warning';
      case 'Overdue': return 'error';
      case 'Draft': return 'default';
      default: return 'default';
    }
  };

  // ✅ FIX: added Array.isArray check to prevent .filter crash
  const filteredBills = Array.isArray(bills) ? bills.filter(bill =>
    bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Bill Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Create, manage and track all your bills and invoices
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
            placeholder="Search bills..."
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
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
            >
              Export Bills
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpen}
              sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
            >
              Create Bill
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Bills Table */}
      {filteredBills.length > 0 ? (
        <Paper sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Bill #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBills.map((bill) => (
                  <TableRow key={bill.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReceiptIcon fontSize="small" color="action" />
                        <Typography variant="body2" fontWeight="medium">
                          #{bill.billNumber || bill.id.slice(0, 8)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {bill.customerName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        ₹{bill.totalAmount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={bill.status}
                        size="small"
                        color={getStatusColor(bill.status) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(bill.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <IconButton size="small" color="primary">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDelete(bill.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm ? 'No bills found' : 'No bills yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Start by creating your first bill'
            }
          </Typography>
          {!searchTerm && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
              Create Your First Bill
            </Button>
          )}
        </Paper>
      )}

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="create bill"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={handleOpen}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Create Bill Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Create New Bill</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <BillForm onClose={handleClose} showTitle={false} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Bills;