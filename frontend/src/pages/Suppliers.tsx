
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Grid,
    Card,
    CardContent,
    Typography,
    IconButton,
    InputAdornment,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Fab,
    Drawer,
    useTheme,
    useMediaQuery,
    Avatar,
    Divider,
    Stack,
    Alert,
    Paper,
    MenuItem,
    ToggleButton,
    ToggleButtonGroup,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    FormControlLabel,
    Switch
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Phone,
    Email,
    Business,
    Flag,
    Person,
    Home as HomeIcon,
    PinDrop as PinIcon,
    GetApp as ExportIcon,
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useSuppliers, Supplier } from '../hooks/useSuppliers';
import { formatCurrency } from '../utils/currency';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';
import { StateCitySelector } from '../components/common';
import SecureActionDialog from '../components/shared/SecureActionDialog';
import { Snackbar } from '@mui/material';
import { SectionLoader } from '../components/common/LoadingScreen';
import { validateAddressField } from '../utils/addressValidation';
import { validateEmail, validateName, validateMobile, validatePersonalName, validateGST } from '../utils/validation';

const Suppliers: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentSupplierId, setCurrentSupplierId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => (localStorage.getItem('preferredView_Suppliers') as 'list' | 'grid') || 'list');
    const [dateRange, setDateRange] = useState('all');
    const [balanceFilter, setBalanceFilter] = useState('all');
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

    // Secure Actions
    const [secureDialogOpen, setSecureDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<'edit' | 'delete' | null>(null);
    const [pendingSupplier, setPendingSupplier] = useState<Supplier | null>(null);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);

    // ── formData must be declared before any early return ──
    const [formData, setFormData] = useState<Partial<Supplier>>({
        name: '',
        contact: '',
        phone: '',
        email: '',
        address: '',
        state: '',
        city: '',
        pincode: '',
        gstNumber: '',
        balance: '' as any
    });

    const { suppliers, addSupplier, updateSupplier, deleteSupplier, loading, error, exportSuppliers } = useSuppliers();
    const navigate = useNavigate();
    const permissions = useRoleBasedAccess();
    const canView = permissions.canViewCustomers;
    const canManage = permissions.canManageCustomers; // Suppliers are grouped with customers in the matrix

    if (!canView) {
        return (
            <Box sx={{ p: 5, textAlign: 'center', mt: 10 }}>
                <Paper sx={{ p: 5, borderRadius: 3 }}>
                    <Typography variant="h5" color="error">Access Denied</Typography>
                    <Typography color="text.secondary" sx={{ mt: 2 }}>You do not have permission to view suppliers.</Typography>
                    <Button sx={{ mt: 3 }} variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
                </Paper>
            </Box>
        );
    }

    const calculateErrors = (data: Partial<Supplier>) => {
        let errs: Record<string, string> = {};

        const nameVal = validateName(data.name || '');
        if (!nameVal.isValid) errs.name = nameVal.error!;

        if (data.contact && data.contact.trim()) {
            const contactVal = validatePersonalName(data.contact);
            if (!contactVal.isValid) errs.contact = contactVal.error!;
        }

        const emailVal = validateEmail(data.email || '');
        if (!emailVal.isValid && data.email) {
            errs.email = emailVal.error!;
        }

        if (data.phone) {
            const mobileVal = validateMobile(data.phone);
            if (!mobileVal.isValid) errs.phone = mobileVal.error!;
        }

        const addressErr = validateAddressField('address', data.address || '');
        if (addressErr) errs.address = addressErr;

        const stateErr = validateAddressField('state', data.state || '');
        if (stateErr) errs.state = stateErr;

        const cityErr = validateAddressField('city', data.city || '');
        if (cityErr) errs.city = cityErr;

        const pincodeErr = validateAddressField('pincode', data.pincode || '');
        if (pincodeErr) errs.pincode = pincodeErr;

        const gstErr = validateGST(data.gstNumber || '');
        if (gstErr.error) errs.gstNumber = gstErr.error;

        if (data.balance !== undefined && data.balance !== null && data.balance < 0) {
            errs.balance = 'Opening Balance cannot be negative';
        }
        return errs;
    };

    const formErrors = calculateErrors(formData);
    const isFormValid = Object.keys(formErrors).length === 0 && Boolean(formData.name?.trim());

    const handleOpenAdd = () => {
        setEditMode(false);
        setCurrentSupplierId(null);
        setFormData({ name: '', contact: '', phone: '', email: '', address: '', state: '', city: '', pincode: '', gstNumber: '', balance: '' as any });
        setTouched({});
        setSubmitAttempted(false);
        setOpen(true);
    };

    const handleEditTrigger = (supplier: Supplier) => {
        const isSecure = localStorage.getItem('secureActionsEnabled') === 'true';
        if (isSecure) {
            setPendingAction('edit');
            setPendingSupplier(supplier);
            setSecureDialogOpen(true);
        } else {
            handleOpenEdit(supplier);
        }
    };

    const handleOpenEdit = (supplier: Supplier) => {
        setEditMode(true);
        setCurrentSupplierId(supplier.id);
        setFormData({
            name: supplier.name,
            contact: supplier.contact,
            phone: supplier.phone,
            email: supplier.email,
            address: supplier.address,
            state: supplier.state,
            city: supplier.city,
            pincode: supplier.pincode,
            gstNumber: supplier.gstNumber,
            balance: supplier.balance
        });
        setTouched({});
        setSubmitAttempted(false);
        setOpen(true);
    };

    const handleSave = async () => {
        setSubmitAttempted(true);
        if (!isFormValid) return;
        try {
            if (editMode && currentSupplierId) {
                const res = await updateSupplier(currentSupplierId, formData);
                if (res.success) {
                    setOpen(false);
                    setSnackbar({ open: true, message: 'Supplier updated successfully', severity: 'success' });
                } else {
                    setSnackbar({ open: true, message: res.error || 'Update failed', severity: 'error' });
                }
            } else {
                const res = await addSupplier(formData);
                if (res.success) {
                    setOpen(false);
                    setSnackbar({ open: true, message: 'Supplier added successfully', severity: 'success' });
                } else {
                    setSnackbar({ open: true, message: res.error || 'Save failed', severity: 'error' });
                }
            }
        } catch (err: any) {
            setSnackbar({ open: true, message: err.message || 'Operation failed', severity: 'error' });
        }
    };

    const handleDeleteRequested = (supplier: Supplier) => {
        const isSecure = localStorage.getItem('secureActionsEnabled') === 'true';
        if (isSecure) {
            setPendingAction('delete');
            setPendingSupplier(supplier);
            setSecureDialogOpen(true);
        } else {
            setSupplierToDelete(supplier);
            setDeleteConfirmOpen(true);
        }
    };

    const handleSecureActionConfirm = () => {
        if (!pendingSupplier || !pendingAction) return;

        if (pendingAction === 'edit') {
            handleOpenEdit(pendingSupplier);
        } else {
            handleConfirmDelete(pendingSupplier);
        }
        setSecureDialogOpen(false);
        setPendingAction(null);
        setPendingSupplier(null);
    };

    const handleConfirmDelete = async (supplier?: Supplier) => {
        const targetSupplier = supplier || supplierToDelete;
        if (targetSupplier) {
            await deleteSupplier(targetSupplier.id);
            setDeleteConfirmOpen(false);
            setSupplierToDelete(null);
            setSearchTerm(''); // Reset search bar after successful deletion
        }
    };

    const handleViewChange = (event: React.MouseEvent<HTMLElement>, newView: 'list' | 'grid') => {
        if (newView !== null) {
            setViewMode(newView);
            localStorage.setItem('preferredView_Suppliers', newView);
        }
    };

    const filteredSuppliers = suppliers.filter(s => {
        // Search term
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.contact && s.contact.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;

        // Balance filter
        if (balanceFilter === 'outstanding' && s.balance <= 0) return false;
        if (balanceFilter === 'zero' && s.balance !== 0) return false;

        // Date range filter
        if (dateRange !== 'all') {
            const date = new Date(s.createdAt);
            const now = new Date();
            if (dateRange === 'month') {
                const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                if (date < oneMonthAgo) return false;
            } else if (dateRange === 'quarter') {
                const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                if (date < threeMonthsAgo) return false;
            }
        }

        return true;
    });

    const renderSupplierCard = (supplier: Supplier) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={supplier.id}>
            <Card sx={{
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                border: '1px solid',
                borderColor: 'divider',
                position: 'relative',
                '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    borderColor: 'primary.light'
                }
            }}>
                <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 0.5 }}>
                    {canManage && (
                        <>
                            <IconButton size="small" color="primary" onClick={() => handleEditTrigger(supplier)}
                                sx={{ bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' } }}>
                                <EditIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteRequested(supplier)}
                                sx={{ bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}>
                                <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </>
                    )}
                </Box>

                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{
                            bgcolor: theme.palette.info.main,
                            width: 50,
                            height: 50,
                            fontWeight: 'bold',
                            fontSize: '1.25rem'
                        }}>
                            {supplier.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ pr: 6 }}>
                            <Typography variant="subtitle1" fontWeight="700" noWrap sx={{ maxWidth: 140 }}>
                                {supplier.name}
                                {supplier.isMarkedRed && (
                                    <Flag sx={{ color: 'error.main', fontSize: 18, ml: 1, verticalAlign: 'middle' }} />
                                )}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                <Person sx={{ fontSize: 14 }} />
                                <Typography variant="caption" noWrap>
                                    {supplier.contact || 'No Contact'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Stack spacing={1} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">{supplier.phone || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {supplier.email || 'N/A'}
                            </Typography>
                        </Box>
                    </Stack>

                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Balance
                        </Typography>
                        <Typography variant="subtitle2" fontWeight="800" color={supplier.balance > 0 ? 'error.main' : 'success.main'}>
                            {formatCurrency(supplier.balance)}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Grid>
    );

    return (
        <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
            {/* Header Section */}
            <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        Suppliers
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Manage your vendor profiles and outstanding balances
                    </Typography>
                </Box>
                {canManage && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAdd}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                        Add Supplier
                    </Button>
                )}
            </Box>

            {/* Controls Bar */}
            <Paper sx={{ p: 2, mb: 4 }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 2,
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', md: 'center' },
                    flexWrap: 'wrap'
                }}>
                    {/* Left Side: Search & Filters */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flexGrow: 1 }}>
                        <TextField
                            placeholder="Search suppliers..."
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoComplete="off"
                            name="supplier-search-field-main"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                                autoComplete: 'off'
                            }}
                            sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 250 } }}
                        />

                        <TextField
                            select
                            size="small"
                            value={balanceFilter}
                            onChange={(e) => setBalanceFilter(e.target.value)}
                            sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 150 } }}
                            label="Balance"
                        >
                            <MenuItem key="all" value="all">All Suppliers</MenuItem>
                            <MenuItem key="outstanding" value="outstanding">Outstanding Balance</MenuItem>
                            <MenuItem key="zero" value="zero">Zero Balance</MenuItem>
                        </TextField>

                        <TextField
                            select
                            size="small"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 150 } }}
                            label="Date Added"
                        >
                            <MenuItem key="all-time" value="all">All Time</MenuItem>
                            <MenuItem key="month" value="month">This Month</MenuItem>
                            <MenuItem key="quarter" value="quarter">This Quarter</MenuItem>
                        </TextField>
                    </Box>

                    {/* Right Side: Actions */}
                    <Box sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center',
                        width: { xs: '100%', md: 'auto' },
                        justifyContent: { xs: 'space-between', md: 'flex-end' },
                        flexWrap: 'wrap'
                    }}>
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={handleViewChange}
                            size="small"
                            aria-label="view mode"
                        >
                            <ToggleButton value="list" aria-label="list view">
                                <ViewListIcon />
                            </ToggleButton>
                            <ToggleButton value="grid" aria-label="grid view">
                                <ViewModuleIcon />
                            </ToggleButton>
                        </ToggleButtonGroup>

                        {/* <Button
                            variant="outlined"
                            startIcon={<FilterListIcon />}
                            sx={{ flexGrow: { xs: 1, sm: 0 } }}
                            onClick={() => setFilterDrawerOpen(true)}
                        >
                            Filters
                        </Button> */}
                        <Button
                            variant="outlined"
                            startIcon={<ExportIcon />}
                            sx={{ flexGrow: { xs: 1, sm: 0 } }}
                            onClick={async () => {
                                const blob = await exportSuppliers();
                                if (blob) {
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `suppliers_${new Date().toISOString().split('T')[0]}.csv`;
                                    document.body.appendChild(a);
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                }
                            }}
                        >
                            Export
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Content Area */}
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            {loading ? (
                <SectionLoader message="Syncing supplier network..." />
            ) : (
                <>
                    {filteredSuppliers.length > 0 ? (
                        <>
                            {viewMode === 'list' ? (
                                <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                                    <Table sx={{ minWidth: 800 }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Supplier Name</TableCell>
                                                <TableCell>Contact Person</TableCell>
                                                <TableCell>Contact Info</TableCell>
                                                <TableCell>Address</TableCell>
                                                <TableCell align="right">Balance</TableCell>
                                                <TableCell align="right">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredSuppliers.map((supplier) => (
                                                <TableRow key={supplier.id} hover>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                                                                {supplier.name.charAt(0).toUpperCase()}
                                                            </Avatar>
                                                            <Typography fontWeight="medium">{supplier.name}</Typography>
                                                            {supplier.isMarkedRed && (
                                                                <Flag sx={{ color: 'error.main', fontSize: 18 }} titleAccess="Important Vendor" />
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                            <Typography variant="body2">{supplier.contact || 'N/A'}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box display="flex" flexDirection="column">
                                                            {supplier.email && (
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                                    <Typography variant="body2">{supplier.email}</Typography>
                                                                </Box>
                                                            )}
                                                            {supplier.phone && (
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                                    <Typography variant="body2">{supplier.phone}</Typography>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }} noWrap>
                                                            {[supplier.address, supplier.city, supplier.state].filter(Boolean).join(', ') || '-'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Chip
                                                            label={formatCurrency(supplier.balance)}
                                                            color={supplier.balance > 0 ? 'error' : 'success'}
                                                            variant="outlined"
                                                            sx={{ fontWeight: 'bold' }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {canManage && (
                                                            <>
                                                                <IconButton size="small" onClick={() => handleEditTrigger(supplier)}>
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                                <IconButton size="small" color="error" onClick={() => handleDeleteRequested(supplier)}>
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
                                <Grid container spacing={2}>
                                    {filteredSuppliers.map(renderSupplierCard)}
                                </Grid>
                            )}
                        </>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'background.paper', borderRadius: 4, border: '1px dashed divider' }}>
                            <Business sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="subtitle1" color="text.secondary">No suppliers found</Typography>
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

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {editMode ? 'Edit Supplier' : 'Add New Supplier'}
                    {isMobile && (
                        <IconButton onClick={() => setOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    )}
                </DialogTitle>
                <DialogContent dividers={isMobile}>
                    <Stack spacing={2.5} sx={{ mt: isMobile ? 0 : 1 }}>
                        <TextField label="Company Name" fullWidth required value={formData.name}
                            error={(touched.name || submitAttempted) && !!formErrors.name}
                            helperText={(touched.name || submitAttempted) ? formErrors.name : ''}
                            onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                            inputProps={{ maxLength: 50 }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Business fontSize="small" /></InputAdornment>
                            }}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^a-zA-Z0-9 &.'\-(),/]/g, '');
                                setFormData({ ...formData, name: val });
                            }} />

                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <TextField label="Contact Person" fullWidth value={formData.contact}
                                error={(touched.contact || submitAttempted) && !!formErrors.contact}
                                helperText={(touched.contact || submitAttempted) ? formErrors.contact : ''}
                                onBlur={() => setTouched(prev => ({ ...prev, contact: true }))}
                                inputProps={{ maxLength: 30 }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Person fontSize="small" /></InputAdornment>
                                }}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^a-zA-Z ]/g, '');
                                    setFormData(prev => ({ ...prev, contact: val }));
                                }} />

                            <TextField label="Phone Number" fullWidth type="tel" value={formData.phone}
                                error={(touched.phone || submitAttempted) && !!formErrors.phone}
                                helperText={(touched.phone || submitAttempted) ? formErrors.phone : ''}
                                onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                                inputProps={{ maxLength: 10, pattern: '[0-9]*' }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Phone fontSize="small" /></InputAdornment>
                                }}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setFormData(prev => ({ ...prev, phone: val.slice(0, 10) }));
                                }} />
                        </Box>

                        <TextField label="Email Address" fullWidth type="email" value={formData.email}
                            error={(touched.email || submitAttempted) && !!formErrors.email}
                            helperText={(touched.email || submitAttempted) ? formErrors.email : ''}
                            onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                            inputProps={{ maxLength: 50 }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Email fontSize="small" /></InputAdornment>
                            }}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value.toLowerCase().trim() }))} />

                        <TextField label="Address" fullWidth required multiline rows={isMobile ? 1 : 2} value={formData.address}
                            error={(touched.address || submitAttempted) && !!formErrors.address}
                            helperText={(touched.address || submitAttempted) ? formErrors.address : ''}
                            onBlur={() => setTouched(prev => ({ ...prev, address: true }))}
                            placeholder="e.g. 123, MG Road, Near City Mall"
                            inputProps={{ maxLength: 80 }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><HomeIcon fontSize="small" /></InputAdornment>
                            }}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^a-zA-Z0-9\s,.\-/#:()&'+;]/g, '');
                                setFormData(prev => ({ ...prev, address: val }));
                            }} />

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 8 }}>
                                <StateCitySelector
                                    selectedState={formData.state || ''}
                                    selectedCity={formData.city || ''}
                                    onStateChange={(state: string) => {
                                        setTouched(prev => ({ ...prev, state: true }));
                                        setFormData(prev => ({ ...prev, state, city: '' }));
                                    }}
                                    onCityChange={(city: string) => {
                                        setTouched(prev => ({ ...prev, city: true }));
                                        setFormData(prev => ({ ...prev, city }));
                                    }}
                                    errorState={(touched.state || submitAttempted) ? formErrors.state : ''}
                                    errorCity={(touched.city || submitAttempted) ? formErrors.city : ''}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField label="Pincode" fullWidth required value={formData.pincode || ''}
                                    error={(touched.pincode || submitAttempted) && !!formErrors.pincode}
                                    helperText={(touched.pincode || submitAttempted) ? formErrors.pincode : ''}
                                    onBlur={() => setTouched(prev => ({ ...prev, pincode: true }))}
                                    placeholder="e.g. 400001"
                                    inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><PinIcon fontSize="small" /></InputAdornment>
                                    }}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setFormData(prev => ({ ...prev, pincode: val.slice(0, 6) }));
                                    }} />
                            </Grid>
                        </Grid>

                        <TextField label="GST Number" fullWidth value={formData.gstNumber}
                            error={(touched.gstNumber || submitAttempted) && !!formErrors.gstNumber}
                            helperText={(touched.gstNumber || submitAttempted) ? formErrors.gstNumber : 'Optional 15-digit code'}
                            onBlur={() => setTouched(prev => ({ ...prev, gstNumber: true }))}
                            inputProps={{ maxLength: 15 }}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                                setFormData(prev => ({ ...prev, gstNumber: val.slice(0, 15) }));
                            }} />

                        <TextField label="Opening Balance" fullWidth type="number"
                            value={formData.balance ?? ''}
                            placeholder="0"
                            disabled={editMode}
                            inputProps={{ min: 0 }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">₹</InputAdornment>
                            }}
                            onChange={(e) => {
                                let val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                if (val < 0) val = 0;
                                setFormData(prev => ({ ...prev, balance: val }));
                            }} />

                        <Box sx={{ mt: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isMarkedRed || false}
                                            onChange={(e) => setFormData(prev => ({ ...prev, isMarkedRed: e.target.checked }))}
                                            color="error"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body2" fontWeight="medium" color="error.main">
                                                Mark in Red
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Flag this supplier for urgent attention in reports and lists
                                            </Typography>
                                        </Box>
                                    }
                                />
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1.5, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
                    <Button
                        onClick={() => setOpen(false)}
                        fullWidth={isMobile}
                        size={isMobile ? 'large' : 'medium'}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!isFormValid}
                        variant="contained"
                        fullWidth={isMobile}
                        size={isMobile ? 'large' : 'medium'}
                        sx={{ borderRadius: 2 }}
                    >
                        {editMode ? 'Update Supplier' : 'Save Supplier'}
                    </Button>
                </DialogActions>
            </Dialog>

            <SecureActionDialog
                open={secureDialogOpen}
                onClose={() => setSecureDialogOpen(false)}
                onConfirm={handleSecureActionConfirm}
                title={pendingAction === 'edit' ? "Authorize Supplier Edit" : "Authorize Supplier Deletion"}
                message={pendingAction === 'edit' ? `Editing vendor profiles is a critical action. Enter your security PIN to proceed.` : `Deleting <strong>${pendingSupplier?.name}</strong> is a critical action. Enter your security PIN to proceed.`}
                actionLabel={pendingAction === 'edit' ? "Edit Supplier" : "Delete Supplier"}
            />

            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold' }}>Delete Supplier?</DialogTitle>
                <DialogContent>
                    <Typography>Confirm deletion of <strong>{supplierToDelete?.name}</strong>. This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1.5, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
                    <Button onClick={() => setDeleteConfirmOpen(false)} fullWidth={isMobile} variant="outlined">Cancel</Button>
                    <Button onClick={() => handleConfirmDelete()} color="error" variant="contained" fullWidth={isMobile}>Delete Permanently</Button>
                </DialogActions>
            </Dialog>

            <Drawer
                anchor="right"
                open={filterDrawerOpen}
                onClose={() => setFilterDrawerOpen(false)}
                PaperProps={{ sx: { width: { xs: '100%', sm: 320 } } }}
            >
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" fontWeight="bold">Advanced Filters</Typography>
                        <IconButton onClick={() => setFilterDrawerOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="text.secondary">
                                Balance Status
                            </Typography>
                            <ToggleButtonGroup
                                value={balanceFilter}
                                exclusive
                                onChange={(e, val) => val && setBalanceFilter(val)}
                                fullWidth
                                size="small"
                                color="primary"
                            >
                                <ToggleButton value="all">All</ToggleButton>
                                <ToggleButton value="outstanding">Owed</ToggleButton>
                                <ToggleButton value="zero">Zero</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="text.secondary">
                                Date Added
                            </Typography>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                            >
                                <MenuItem key="all" value="all">All Time</MenuItem>
                                <MenuItem key="month" value="month">This Month</MenuItem>
                                <MenuItem key="quarter" value="quarter">This Quarter</MenuItem>
                            </TextField>
                        </Box>

                        <Divider />

                        <Button
                            variant="outlined"
                            color="inherit"
                            fullWidth
                            onClick={() => {
                                setBalanceFilter('all');
                                setDateRange('all');
                                setSearchTerm('');
                            }}
                        >
                            Reset All Filters
                        </Button>

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => setFilterDrawerOpen(false)}
                        >
                            Show Results
                        </Button>
                    </Stack>
                </Box>
            </Drawer>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Suppliers;
