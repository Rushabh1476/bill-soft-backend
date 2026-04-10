import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Engineering as TechIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmployee: boolean;
}

const EmployeeManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'OPERATOR', // Default role for technicians
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err: any) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployeeStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`${API_URL}/admin/users/${userId}`, 
        { isEmployee: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(users.map(u => u.id === userId ? { ...u, isEmployee: !currentStatus } : u));
    } catch (err: any) {
      alert('Failed to update employee status');
    }
  };

  const handleAddTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (newUserData.phone.length !== 10) {
      setError('Mobile number must be exactly 10 digits');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.post(`${API_URL}/admin/users`, {
        ...newUserData,
        isEmployee: true,
        permissions: ['view_tasks', 'update_ticket_status'] // Default technician permissions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setUsers([res.data.data, ...users]);
        setOpenAddDialog(false);
        setNewUserData({ name: '', email: '', phone: '', role: 'OPERATOR' });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add technician');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>Technician Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Enable or disable technicians for Service Tickets.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setError(null);
              setOpenAddDialog(true);
            }}
            sx={{ borderRadius: 2 }}
          >
            New Technician
          </Button>
          <IconButton onClick={fetchUsers} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TechIcon color="primary" />
            Allowed Service Technicians
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Only users marked as "Employee" here will appear in the Technician dropdown when creating/editing Service Tickets.
          </Alert>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Staff Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email Address</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Current Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Technician Access</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{user.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{user.email}</TableCell>
                    <TableCell>
                        <Chip label={user.role} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={user.isEmployee}
                            onChange={() => toggleEmployeeStatus(user.id, user.isEmployee)}
                            color="primary"
                          />
                        }
                        label={user.isEmployee ? "Enabled" : "Disabled"}
                        labelPlacement="start"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add Technician Dialog */}
      <Dialog 
        open={openAddDialog} 
        onClose={() => !isSubmitting && setOpenAddDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Add New Technician</DialogTitle>
        <form onSubmit={handleAddTechnician}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              <TextField
                label="Full Name"
                fullWidth
                required
                value={newUserData.name}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\s.-]/g, '').slice(0, 30);
                  setNewUserData({ ...newUserData, name: val });
                }}
                placeholder="e.g. John Doe"
                inputProps={{ maxLength: 30 }}
              />
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                required
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value.toLowerCase().trim() })}
                placeholder="john@example.com"
                helperText="An invitation email will be sent to this address."
              />
              <TextField
                label="Phone Number"
                fullWidth
                required
                value={newUserData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setNewUserData({ ...newUserData, phone: val });
                }}
                error={newUserData.phone.length > 0 && newUserData.phone.length !== 10}
                helperText={newUserData.phone.length > 0 && newUserData.phone.length !== 10 ? "Must be exactly 10 digits" : "10 digit mobile number"}
                inputProps={{ 
                  maxLength: 10,
                  inputMode: 'numeric',
                  pattern: '[0-9]*'
                }}
              />
               <Alert severity="info">
                New technicians are automatically invited as "Operators" with service ticket permissions.
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenAddDialog(false)} color="inherit" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <AddIcon />}
            >
              {isSubmitting ? 'Sending Invite...' : 'Add Technician'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default EmployeeManagement;
