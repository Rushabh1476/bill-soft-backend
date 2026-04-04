import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    TextField,
    InputAdornment,
    Chip,
    Paper,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    FormControl,
    InputLabel,
    Select,
    Menu,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { SectionLoader } from '../components/common/LoadingScreen';
import {
    Add as AddIcon,
    Search as SearchIcon,
    GetApp as ExportIcon,
    Delete as DeleteIcon,
    MoreVert as MoreIcon,
    CheckCircle as DoneIcon,
    History as ProcessingIcon,
    PersonAdd as PersonAddIcon,
    Engineering as TechnicianIcon,
    MiscellaneousServices as ServiceIcon
} from '@mui/icons-material';
import { useServiceTickets } from '../hooks/useServiceTickets';
import { useCustomers } from '../hooks/useCustomers';
import { useServices } from '../hooks/useServices';
import { useUsers } from '../hooks/useUsers';
import { format } from 'date-fns';

const ServiceTickets: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { tickets, loading, createTicket, updateTicketStatus, deleteTicket, exportTickets } = useServiceTickets();
    const { customers } = useCustomers();
    const { services } = useServices();
    const { employees } = useUsers();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [openAdd, setOpenAdd] = useState(false);
    const [newTicket, setNewTicket] = useState({
        customerId: '',
        serviceId: '',
        deviceInfo: '',
        problemDescription: '',
        assignedTechnician: '',
        priority: 'MEDIUM'
    });
    
    // Validation
    const formErrors = {
        customerId: !newTicket.customerId ? 'Customer is required' : '',
        serviceId: !newTicket.serviceId ? 'Service is required' : '',
        deviceInfo: !newTicket.deviceInfo.trim() ? 'Device info is required' : '',
        problemDescription: !newTicket.problemDescription.trim() ? 'Problem description is required' : '',
    };
    
    const isFormValid = !formErrors.customerId && !formErrors.serviceId && !formErrors.deviceInfo && !formErrors.problemDescription;
    
    // Status Menu State
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, ticket: any) => {
        setAnchorEl(event.currentTarget);
        setSelectedTicket(ticket);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedTicket(null);
    };

    const handleStatusChange = async (status: string) => {
        if (selectedTicket) {
            try {
                await updateTicketStatus(selectedTicket.id, status);
                handleMenuClose();
            } catch (err) {
                alert(err);
            }
        }
    };

    const handleDelete = async () => {
        if (selectedTicket && window.confirm('Are you sure you want to delete this ticket?')) {
            try {
                await deleteTicket(selectedTicket.id);
                handleMenuClose();
            } catch (err) {
                alert(err);
            }
        }
    };

    const filteredTickets = tickets.filter(t => 
        (t.ticketNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateTicket = async () => {
        try {
            await createTicket(newTicket);
            setOpenAdd(false);
            setNewTicket({
                customerId: '',
                serviceId: '',
                deviceInfo: '',
                problemDescription: '',
                assignedTechnician: '',
                priority: 'MEDIUM'
            });
        } catch (err) {
            alert(err);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'info';
            case 'IN_PROGRESS': return 'warning';
            case 'COMPLETED': return 'success';
            case 'CANCELLED': return 'error';
            default: return 'default';
        }
    };

    const handleExport = async () => {
        const blob = await exportTickets();
        if (blob) {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `service_tickets_${format(new Date(), 'yyyy-MM-dd')}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">Service Tickets</Typography>
                    <Typography variant="subtitle1" color="text.secondary">Track service requests and technician assignments</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
                    <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExport} sx={{ flex: { xs: 1, sm: 'none' } }}>Export</Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)} sx={{ flex: { xs: 1, sm: 'none' } }}>Create Ticket</Button>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        placeholder="Search tickets..."
                        size="small"
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
            </Paper>

            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                {loading ? (
                    <SectionLoader />
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Ticket ID</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Device / Item</TableCell>
                                <TableCell>Priority</TableCell>
                                <TableCell>Technician</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Created Date</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredTickets.map((ticket) => (
                                <TableRow key={ticket.id} hover>
                                    <TableCell sx={{ fontWeight: 'bold' }}>#{ticket.ticketNumber}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{ticket.customer?.name || 'Unknown'}</Typography>
                                        <Typography variant="caption" color="text.secondary">{ticket.customer?.phone || ''}</Typography>
                                    </TableCell>
                                    <TableCell>{ticket.deviceInfo || '-'}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={ticket.priority} 
                                            size="small" 
                                            color={ticket.priority === 'HIGH' ? 'error' : ticket.priority === 'MEDIUM' ? 'warning' : 'default'} 
                                        />
                                    </TableCell>
                                    <TableCell>{ticket.assignedTechnician || 'Unassigned'}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={ticket.status.replace('_', ' ')} 
                                            size="small" 
                                            color={getStatusColor(ticket.status) as any} 
                                        />
                                    </TableCell>
                                    <TableCell>{format(new Date(ticket.createdAt), 'dd MMM yyyy')}</TableCell>
                                    <TableCell align="right">
                                        <IconButton 
                                            color="primary" 
                                            size="small"
                                            onClick={(e) => handleMenuOpen(e, ticket)}
                                        >
                                            <MoreIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </TableContainer>

            {/* Create Ticket Dialog */}
            <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}>
                <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Create Service Ticket
                    {isMobile && <IconButton onClick={() => setOpenAdd(false)} size="small">✕</IconButton>}
                </DialogTitle>
                <DialogContent>

                    {/* ── Pre-check: No Customers ── */}
                    {customers.length === 0 && (
                        <Alert
                            severity="warning"
                            icon={<PersonAddIcon />}
                            sx={{ mb: 2, borderRadius: 2 }}
                            action={
                                <Button
                                    color="warning"
                                    size="small"
                                    variant="contained"
                                    startIcon={<PersonAddIcon />}
                                    onClick={() => { setOpenAdd(false); navigate('/customers/new'); }}
                                >
                                    Add Customer
                                </Button>
                            }
                        >
                            <Typography variant="body2" fontWeight="bold">No customers found!</Typography>
                            <Typography variant="caption">
                                You need at least one customer before creating a service ticket. Please add a customer first.
                            </Typography>
                        </Alert>
                    )}

                    {/* ── Pre-check: No Customers ── */}
                    {customers.length === 0 && (
                        <Alert
                            severity="error"
                            icon={<PersonAddIcon />}
                            sx={{ mb: 2, borderRadius: 2 }}
                            action={
                                <Button
                                    color="error"
                                    size="small"
                                    variant="contained"
                                    startIcon={<PersonAddIcon />}
                                    onClick={() => { setOpenAdd(false); navigate('/customers'); }}
                                >
                                    Add Customer
                                </Button>
                            }
                        >
                            <Typography variant="body2" fontWeight="bold">No customers found!</Typography>
                            <Typography variant="caption">
                                You need at least one customer before creating a service ticket. Please add a customer first.
                            </Typography>
                        </Alert>
                    )}

                    {/* ── Pre-check: No Technicians ── */}
                    {employees.length === 0 && (
                        <Alert
                            severity="info"
                            icon={<TechnicianIcon />}
                            sx={{ mb: 2, borderRadius: 2 }}
                            action={
                                <Button
                                    color="info"
                                    size="small"
                                    variant="contained"
                                    startIcon={<TechnicianIcon />}
                                    onClick={() => { setOpenAdd(false); navigate('/admin/users'); }}
                                >
                                    Add Technician
                                </Button>
                            }
                        >
                            <Typography variant="body2" fontWeight="bold">No technicians found!</Typography>
                            <Typography variant="caption">
                                You need at least one employee/technician to assign tickets. Please add a technician first.
                            </Typography>
                        </Alert>
                    )}

                    {/* ── Pre-check: No Services ── */}
                    {services.length === 0 && (
                        <Alert
                            severity="error"
                            icon={<ServiceIcon />}
                            sx={{ mb: 2, borderRadius: 2 }}
                            action={
                                <Button
                                    color="error"
                                    size="small"
                                    variant="contained"
                                    startIcon={<ServiceIcon />}
                                    onClick={() => { setOpenAdd(false); navigate('/services'); }}
                                >
                                    Add Service
                                </Button>
                            }
                        >
                            <Typography variant="body2" fontWeight="bold">No services found!</Typography>
                            <Typography variant="caption">
                                You need at least one service before creating a ticket. Please add a service first.
                            </Typography>
                        </Alert>
                    )}

                    {/* ── Main Form (only shown when all three exist) ── */}
                    {customers.length > 0 && employees.length > 0 && services.length > 0 && (
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid size={12}>
                                <FormControl fullWidth size="small" error={!!formErrors.customerId && newTicket.customerId !== ''}>
                                    <InputLabel>Customer *</InputLabel>
                                    <Select
                                        value={newTicket.customerId}
                                        label="Customer *"
                                        onChange={(e) => setNewTicket({...newTicket, customerId: e.target.value})}
                                    >
                                        {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={12}>
                                <FormControl fullWidth size="small" error={!!formErrors.serviceId && newTicket.serviceId !== ''}>
                                    <InputLabel>Primary Service *</InputLabel>
                                    <Select
                                        value={newTicket.serviceId}
                                        label="Primary Service *"
                                        onChange={(e) => setNewTicket({...newTicket, serviceId: e.target.value})}
                                    >
                                        {services.map(s => <MenuItem key={s.id} value={s.id}>{s.name} - ₹{s.price}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={12}>
                                <TextField
                                    label="Device / Item Info"
                                    size="small"
                                    fullWidth
                                    required
                                    value={newTicket.deviceInfo}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^a-zA-Z0-9\s,.\-/#:()&'+;]/g, '');
                                        setNewTicket({...newTicket, deviceInfo: val});
                                    }}
                                    error={!!formErrors.deviceInfo && newTicket.deviceInfo !== ''}
                                    helperText="Common symbols like #, /, -, &, () are allowed."
                                />
                            </Grid>
                            <Grid size={12}>
                                <TextField
                                    label="Problem Description *"
                                    size="small"
                                    fullWidth
                                    multiline
                                    required
                                    rows={3}
                                    value={newTicket.problemDescription}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^a-zA-Z0-9\s,.\-/#:()&@'+;!\n]/g, '');
                                        setNewTicket({...newTicket, problemDescription: val});
                                    }}
                                    error={!!formErrors.problemDescription && newTicket.problemDescription !== ''}
                                />
                            </Grid>
                            <Grid size={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Assign Technician</InputLabel>
                                    <Select
                                        value={newTicket.assignedTechnician}
                                        label="Assign Technician"
                                        onChange={(e) => setNewTicket({...newTicket, assignedTechnician: e.target.value})}
                                    >
                                        <MenuItem value=""><em>Unassigned</em></MenuItem>
                                        {employees.map(emp => (
                                            <MenuItem key={emp.id} value={emp.name}>{emp.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Priority</InputLabel>
                                    <Select
                                        value={newTicket.priority}
                                        label="Priority"
                                        onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                                    >
                                        <MenuItem value="LOW">Low</MenuItem>
                                        <MenuItem value="MEDIUM">Medium</MenuItem>
                                        <MenuItem value="HIGH">High</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
                    {customers.length > 0 && employees.length > 0 && services.length > 0 && (
                        <Button variant="contained" onClick={handleCreateTicket} disabled={!isFormValid}>Create</Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => handleStatusChange('OPEN')}>
                    <ProcessingIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }} />
                    Mark as Open
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange('IN_PROGRESS')}>
                    <ProcessingIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />
                    Mark as In Progress
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange('COMPLETED')}>
                    <DoneIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                    Mark as Completed
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange('CANCELLED')}>
                    <DoneIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
                    Mark as Cancelled
                </MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Delete Ticket
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default ServiceTickets;
