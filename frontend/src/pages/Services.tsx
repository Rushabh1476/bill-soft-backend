/* eslint-disable */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Typography,
    IconButton,
    InputAdornment,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Fab,
    useTheme,
    useMediaQuery,
    Alert,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    DesignServices as ServicesIcon,
    Receipt as ReceiptIcon,
    ConfirmationNumber as TicketIcon
} from '@mui/icons-material';
import { formatCurrency } from '../utils/currency';
import { useServices } from '../hooks/useServices';
import { Service } from '../types/service';
import { TaxDropdown } from '../components/shared/TaxDropdown';
import { useAuth } from '../contexts/AuthContext';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';
import SecureActionDialog from '../components/shared/SecureActionDialog';

const SERVICE_CATEGORIES = [
    'Installation',
    'Repair & Maintenance',
    'Consulting',
    'AMC (Annual Maintenance Contract)',
    'Labor / Workforce',
    'Technical Support',
    'Software / Subscription'
];

const Services: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const { services, loading, error, addService, updateService, deleteService, fetchServices } = useServices();
    const navigate = useNavigate();
    const { user } = useAuth();
    const permissions = useRoleBasedAccess();
    const canManage = permissions.canManageServices;

    // ── All hooks must be called before any early return ──
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    // Secure Actions
    const [secureDialogOpen, setSecureDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<'edit' | 'delete' | null>(null);
    const [pendingService, setPendingService] = useState<Service | null>(null);
    const isSecureEnabled = localStorage.getItem('secureActionsEnabled') === 'true';

    // Form Interaction States
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const [formData, setFormData] = useState<Partial<Service>>({
        name: '',
        description: '',
        price: '' as any,
        taxRate: '' as any,
        category: '',
        duration: '',
        isActive: true
    });

    if (!canManage) {
        return (
            <Box sx={{ p: 5, textAlign: 'center', mt: 10 }}>
                <Paper sx={{ p: 5, borderRadius: 3 }}>
                    <Typography variant="h5" color="error">Access Denied</Typography>
                    <Typography color="text.secondary" sx={{ mt: 2 }}>You do not have permission to manage services.</Typography>
                    <Button sx={{ mt: 3 }} variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
                </Paper>
            </Box>
        );
    }

    const calculateErrors = (data: Partial<Service>) => {
        let errs: Record<string, string> = {};
        if (!data.name?.trim()) errs.name = 'Service Name is required';
        else if (data.name.trim().length < 3) errs.name = 'Service Name must be at least 3 characters';
        else if (data.name.trim().length > 30) errs.name = 'Service Name must be 30 characters or less';

        if (data.price === undefined || data.price === null || data.price === '' as any || isNaN(Number(data.price)) || Number(data.price) < 0) {
            errs.price = 'Valid base price is required';
        }

        if (data.taxRate === undefined || data.taxRate === null || data.taxRate === '' as any || isNaN(Number(data.taxRate)) || Number(data.taxRate) < 0 || Number(data.taxRate) > 100) {
            errs.taxRate = 'Valid tax rate (0-100) is required';
        }

        return errs;
    };

    const formErrors = calculateErrors(formData);
    const isFormValid = Object.keys(formErrors).length === 0 && Boolean(formData.name?.trim());

    const handleOpenAdd = () => {
        setEditMode(false);
        setCurrentServiceId(null);
        setFormData({ name: '', description: '', price: '' as any, taxRate: '' as any, category: '' });
        setActionError(null);
        setTouched({});
        setSubmitAttempted(false);
        setOpen(true);
    };

    const handleEditTrigger = (service: Service) => {
        const isSecure = localStorage.getItem('secureActionsEnabled') === 'true';
        if (isSecure) {
            setPendingAction('edit');
            setPendingService(service);
            setSecureDialogOpen(true);
        } else {
            handleOpenEdit(service);
        }
    };

    const handleOpenEdit = (service: Service) => {
        setEditMode(true);
        setCurrentServiceId(service.id);
        setFormData({
            name: service.name,
            description: service.description || '',
            price: service.price,
            taxRate: service.taxRate || 0,
            category: service.category || '',
            duration: service.duration || '',
            isActive: service.isActive !== undefined ? service.isActive : true
        });
        setActionError(null);
        setTouched({});
        setSubmitAttempted(false);
        setOpen(true);
    };

    const handleSave = async () => {
        setActionError(null);
        setSubmitAttempted(true);

        const errors = calculateErrors(formData);
        if (Object.keys(errors).length > 0) return;

        if (editMode && currentServiceId) {
            const res = await updateService(currentServiceId, formData);
            if (res.success) {
                setOpen(false);
            } else {
                setActionError(res.error || 'Failed to update service');
            }
        } else {
            const res = await addService(formData);
            if (res.success) {
                setOpen(false);
            } else {
                setActionError(res.error || 'Failed to add service');
            }
        }
    };

    const handleDeleteRequested = (service: Service) => {
        const isSecure = localStorage.getItem('secureActionsEnabled') === 'true';
        if (isSecure) {
            setPendingAction('delete');
            setPendingService(service);
            setSecureDialogOpen(true);
        } else {
            setServiceToDelete(service);
            setDeleteConfirmOpen(true);
        }
    };

    const handleSecureActionConfirm = () => {
        if (!pendingService || !pendingAction) return;

        if (pendingAction === 'edit') {
            handleOpenEdit(pendingService);
        } else {
            handleConfirmDelete(pendingService);
        }
        setSecureDialogOpen(false);
        setPendingAction(null);
        setPendingService(null);
    };

    const handleConfirmDelete = async (service?: Service) => {
        const targetService = service || serviceToDelete;
        if (targetService) {
            await deleteService(targetService.id);
            setDeleteConfirmOpen(false);
            setServiceToDelete(null);
            setSearchTerm(''); // Reset search bar after successful deletion
        }
    };

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.category && s.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
            <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Services
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Manage your service offerings and pricing
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
                    <Button 
                        variant="outlined" 
                        startIcon={<TicketIcon />} 
                        onClick={() => navigate('/service-tickets')}
                        sx={{ flex: { xs: 1, sm: 'none' } }}
                    >
                        Service Tickets
                    </Button>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={handleOpenAdd}
                        sx={{ flex: { xs: 1, sm: 'none' } }}
                    >
                        Add Service
                    </Button>
                </Box>
            </Box>

            {/* Controls Bar */}
            <Paper sx={{ p: 2, mb: 4 }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 2,
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', md: 'center' }
                }}>
                    <Box sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
                        <TextField
                            placeholder="Search services..."
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoComplete="off"
                            name="service-search-catalog-main"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                                autoComplete: 'off'
                            }}
                            sx={{ minWidth: { xs: '100%', sm: 300 } }}
                        />
                    </Box>
                    {/* Button moved to header */}
                </Box>
            </Paper>

            {/* Content Area */}
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={32} /></Box>
            ) : (
                <>
                    {filteredServices.length > 0 ? (
                        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                            <Table sx={{ minWidth: 600 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Service Name</TableCell>
                                        <TableCell>Category</TableCell>
                                        <TableCell align="right">Duration</TableCell>
                                        <TableCell align="right">Base Price</TableCell>
                                        <TableCell align="right">Status</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredServices.map((service) => (
                                        <TableRow key={service.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <ServicesIcon color="primary" />
                                                    <Box>
                                                        <Typography fontWeight="bold">{service.name}</Typography>
                                                        {service.description && (
                                                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 200 }}>
                                                                {service.description}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                {service.category ? (
                                                    <Chip label={service.category} size="small" variant="outlined" />
                                                ) : (
                                                    <Typography variant="body2" color="text.disabled">None</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2">{ service.duration || '-' }</Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography fontWeight="bold">
                                                    {formatCurrency(service.price)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Chip 
                                                    label={service.isActive !== false ? 'Active' : 'Inactive'} 
                                                    size="small" 
                                                    color={service.isActive !== false ? 'success' : 'default'} 
                                                    variant="outlined" 
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {canManage && (
                                                    <>
                                                        <IconButton size="small" onClick={() => handleEditTrigger(service)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" color="error" onClick={() => handleDeleteRequested(service)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'background.paper', borderRadius: 4, border: '1px dashed divider' }}>
                            <ServicesIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="subtitle1" color="text.secondary">No services found</Typography>
                            {searchTerm && (
                                <Button variant="text" onClick={() => setSearchTerm('')} sx={{ mt: 1 }}>
                                    Clear Search
                                </Button>
                            )}
                        </Box>
                    )}
                </>
            )}

            {/* Mobile View FAB */}
            {isMobile && canManage && (
                <Fab color="primary" sx={{ position: 'fixed', bottom: 85, right: 16, zIndex: 1000 }} onClick={handleOpenAdd}>
                    <AddIcon />
                </Fab>
            )}

            {/* Form Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}>
                <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {editMode ? 'Edit Service' : 'Add New Service'}
                    {isMobile && <IconButton onClick={() => setOpen(false)} size="small">✕</IconButton>}
                </DialogTitle>
                <DialogContent>
                    {actionError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{actionError}</Alert>}
                    <Grid container spacing={2.5} sx={{ mt: 1 }}>
                        <Grid size={12}>
                            <TextField
                                label="Service Name"
                                fullWidth
                                required
                                value={formData.name}
                                error={!!formErrors.name && (touched.name || submitAttempted)}
                                helperText={(touched.name || submitAttempted) ? formErrors.name : ''}
                                inputProps={{ maxLength: 30 }}
                                onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^a-zA-Z0-9\s,.\-/#:()&'+;]/g, '');
                                    setFormData({ ...formData, name: val });
                                }}
                            />
                        </Grid>
                        <Grid size={12}>
                                <TextField
                                    label="Description"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^a-zA-Z0-9\s,.\-/#:()&@'+;!\n]/g, '');
                                        setFormData({ ...formData, description: val });
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Duration (e.g. 1hr)"
                                    fullWidth
                                    value={formData.duration}
                                    onBlur={() => setTouched(prev => ({ ...prev, duration: true }))}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^a-zA-Z0-9\s.,\-:()]/g, ''); // Simplified duration regex
                                        setFormData({ ...formData, duration: val });
                                    }}
                                />
                            </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Base Price"
                                fullWidth
                                required
                                value={formData.price}
                                error={!!formErrors.price && (touched.price || submitAttempted)}
                                helperText={(touched.price || submitAttempted) ? formErrors.price : ''}
                                inputProps={{ min: 0, step: '0.01' }}
                                onBlur={() => setTouched(prev => ({ ...prev, price: true }))}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    let priceValue = val === '' ? ('' as any) : parseFloat(val);
                                    if (typeof priceValue === 'number' && priceValue < 0) priceValue = 0;
                                    setFormData({ ...formData, price: priceValue });
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <ReceiptIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={formData.category || ''}
                                    label="Category"
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <MenuItem key="none" value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {SERVICE_CATEGORIES.map((cat) => (
                                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={12}>
                            <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 'bold', color: 'text.secondary' }}>
                                TAX & GST CONFIGURATION
                            </Typography>
                        <TaxDropdown
                                taxRate={Number(formData.taxRate) || 0}
                                onChange={(newRate) => {
                                    setFormData({ ...formData, taxRate: newRate as any });
                                    setTouched(prev => ({ ...prev, taxRate: true }));
                                }}
                                error={!!formErrors.taxRate && (touched.taxRate || submitAttempted) ? formErrors.taxRate : undefined}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!isFormValid} variant="contained" sx={{ borderRadius: 2, px: 3 }}>
                        {editMode ? 'Update' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <SecureActionDialog 
                open={secureDialogOpen}
                onClose={() => setSecureDialogOpen(false)}
                onConfirm={handleSecureActionConfirm}
                title={pendingAction === 'edit' ? "Authorize Service Edit" : "Authorize Service Deletion"}
                message={pendingAction === 'edit' ? `Editing service offerings is a critical action. Enter your security PIN to proceed.` : `Deleting <strong>${pendingService?.name}</strong> is a critical action. Enter your security PIN to proceed.`}
                actionLabel={pendingAction === 'edit' ? "Edit Service" : "Delete Service"}
            />

            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Delete Service?</DialogTitle>
                <DialogContent>
                    <Typography>Confirm deletion of <strong>{serviceToDelete?.name}</strong>. This action cannot be undone unless tied to an invoice.</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={() => handleConfirmDelete()} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Services;
