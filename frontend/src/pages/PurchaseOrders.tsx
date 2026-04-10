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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Divider,
    useTheme,
    useMediaQuery,
    Fab
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Visibility as ViewIcon,
    ShoppingCart as POIcon,
    LocalShipping as ReceivedIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { usePurchaseOrders } from '../hooks/usePurchaseOrders';
import { useSuppliers } from '../hooks/useSuppliers';
import { useProducts } from '../hooks/useProducts';
import { formatCurrency } from '../utils/currency';
import { format } from 'date-fns';
import SecureActionDialog from '../components/shared/SecureActionDialog';
import { SectionLoader } from '../components/common/LoadingScreen';

const PurchaseOrders: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const { orders, loading, updateOrderStatus, createOrder, deleteOrder } = usePurchaseOrders();
    const { suppliers } = useSuppliers();
    const { products } = useProducts();
    const [searchTerm, setSearchTerm] = useState('');
    const [openAdd, setOpenAdd] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Item Addition State
    const [selectedProductId, setSelectedProductId] = useState('');
    const [itemQuantity, setItemQuantity] = useState(1);
    const [itemPrice, setItemPrice] = useState(0);

    const [newOrder, setNewOrder] = useState({
        supplierId: '',
        notes: '',
        items: [] as any[]
    });

    // Secure Actions
    const [secureDialogOpen, setSecureDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'status' | 'delete', id: string, status?: string } | null>(null);

    const filteredOrders = orders.filter(o => 
        o.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddItem = () => {
        const product = products.find(p => p.id === selectedProductId);
        if (product) {
            const price = itemPrice || product.price;
            setNewOrder({
                ...newOrder,
                items: [
                    ...newOrder.items,
                    {
                        productId: product.id,
                        itemName: product.name,
                        quantity: itemQuantity,
                        price: price,
                        total: itemQuantity * price
                    }
                ]
            });
            setSelectedProductId('');
            setItemQuantity(1);
            setItemPrice(0);
        }
    };

    const handleRemoveItem = (index: number) => {
        const updatedItems = [...newOrder.items];
        updatedItems.splice(index, 1);
        setNewOrder({ ...newOrder, items: updatedItems });
    };

    const handleCreateOrder = async () => {
        if (!newOrder.supplierId || newOrder.items.length === 0) return;
        
        setIsSaving(true);
        try {
            await createOrder(newOrder);
            setOpenAdd(false);
            setNewOrder({ supplierId: '', notes: '', items: [] });
        } catch (err: any) {
            alert(err.message || 'Failed to create order');
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        const isSecure = localStorage.getItem('secureActionsEnabled') === 'true';
        if (isSecure) {
            setPendingAction({ type: 'status', id, status });
            setSecureDialogOpen(true);
        } else {
            if (window.confirm(`Mark this order as ${status}?`)) {
                await performStatusUpdate(id, status);
            }
        }
    };

    const performStatusUpdate = async (id: string, status: string) => {
        try {
            await updateOrderStatus(id, status);
        } catch (err: any) {
            alert(err.message || err);
        }
    };

    const handleDeleteOrder = async (id: string) => {
        const isSecure = localStorage.getItem('secureActionsEnabled') === 'true';
        if (isSecure) {
            setPendingAction({ type: 'delete', id });
            setSecureDialogOpen(true);
        } else {
            if (window.confirm('Are you sure you want to delete this draft order?')) {
                await performDeleteOrder(id);
            }
        }
    };

    const performDeleteOrder = async (id: string) => {
        try {
            await deleteOrder(id);
        } catch (err: any) {
            alert(err.message || err);
        }
    };

    const handleSecureActionConfirm = async () => {
        if (!pendingAction) return;

        if (pendingAction.type === 'status') {
            await performStatusUpdate(pendingAction.id, pendingAction.status!);
        } else {
            await performDeleteOrder(pendingAction.id);
        }
        setSecureDialogOpen(false);
        setPendingAction(null);
    };

    const handleViewOrder = (order: any) => {
        setSelectedOrder(order);
        setOpenView(true);
    };

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">Purchase Orders</Typography>
                    <Typography variant="subtitle1" color="text.secondary">Procurement and stock management from suppliers</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)} sx={{ width: { xs: '100%', sm: 'auto' } }}>Create PO</Button>
            </Box>

            <Paper sx={{ p: 2, mb: 4 }}>
                <TextField
                    placeholder="Search POs..."
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
            </Paper>

            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                {loading ? (
                    <SectionLoader message="Syncing procurement logs..." />
                ) : filteredOrders.length === 0 ? (
                    <Box sx={{ p: 5, textAlign: 'center', color: 'text.secondary' }}>
                        <POIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
                        <Typography>No purchase orders found</Typography>
                    </Box>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>PO Number</TableCell>
                                <TableCell>Supplier</TableCell>
                                <TableCell>Order Date</TableCell>
                                <TableCell>Items</TableCell>
                                <TableCell>Total Amount</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredOrders.map((order) => (
                                <TableRow key={order.id} hover>
                                    <TableCell sx={{ fontWeight: 'bold' }}>{order.poNumber}</TableCell>
                                    <TableCell>{order.supplier.name}</TableCell>
                                    <TableCell>{format(new Date(order.orderDate), 'dd MMM yyyy')}</TableCell>
                                    <TableCell>{order.items.length} items</TableCell>
                                    <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={order.status} 
                                            size="small" 
                                            color={order.status === 'RECEIVED' ? 'success' : order.status === 'ORDERED' ? 'info' : 'default'} 
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            {order.status === 'DRAFT' && (
                                                <>
                                                    <Button size="small" variant="outlined" onClick={() => handleStatusUpdate(order.id, 'ORDERED')}>Send Order</Button>
                                                    <IconButton size="small" color="error" onClick={() => handleDeleteOrder(order.id)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </>
                                            )}
                                            {order.status === 'ORDERED' && (
                                                <Button size="small" variant="contained" color="success" startIcon={<ReceivedIcon />} onClick={() => handleStatusUpdate(order.id, 'RECEIVED')}>Receive Stock</Button>
                                            )}
                                            <IconButton color="primary" size="small" onClick={() => handleViewOrder(order)}>
                                                <ViewIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </TableContainer>

            {/* Create PO Dialog */}
            <Dialog open={openAdd} onClose={() => !isSaving && setOpenAdd(false)} maxWidth="md" fullWidth fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Create Purchase Order
                    {isMobile && <IconButton onClick={() => setOpenAdd(false)} size="small" disabled={isSaving}>✕</IconButton>}
                </DialogTitle>
                <DialogContent dividers>
                    {/* ── Pre-check: No Suppliers or Products ── */}
                    {(suppliers.length === 0 || products.length === 0) && (
                        <Box sx={{ mb: 3 }}>
                            <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
                                <Typography variant="body2" fontWeight="bold">Setup Required!</Typography>
                                <Typography variant="caption" sx={{ display: 'block', mb: 2 }}>
                                    Before you can create a purchase order, you need at least:
                                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                                        {suppliers.length === 0 && <li>One Supplier defined</li>}
                                        {products.length === 0 && <li>One Product in your catalog</li>}
                                    </ul>
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    {suppliers.length === 0 && (
                                        <Button size="small" variant="contained" color="error" onClick={() => navigate('/suppliers')}>Add Supplier</Button>
                                    )}
                                    {products.length === 0 && (
                                        <Button size="small" variant="contained" color="error" onClick={() => navigate('/products')}>Add Product</Button>
                                    )}
                                </Box>
                            </Alert>
                        </Box>
                    )}

                    {suppliers.length > 0 && products.length > 0 && (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Supplier</InputLabel>
                                <Select
                                    value={newOrder.supplierId}
                                    label="Supplier"
                                    onChange={(e) => setNewOrder({...newOrder, supplierId: e.target.value})}
                                >
                                    {suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField 
                                label="Notes" 
                                fullWidth 
                                multiline 
                                rows={1} 
                                size="small" 
                                value={newOrder.notes} 
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^a-zA-Z0-9 .,\-\n]/g, '');
                                    setNewOrder({...newOrder, notes: val});
                                }}/>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1 }}><Chip label="Add Items" size="small" /></Divider>
                        </Grid>

                        <Grid size={{ xs: 12, md: 5 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Select Product</InputLabel>
                                <Select
                                    value={selectedProductId}
                                    label="Select Product"
                                    onChange={(e) => {
                                        const prod = products.find(p => p.id === e.target.value);
                                        setSelectedProductId(e.target.value);
                                        if (prod) setItemPrice(prod.price);
                                    }}
                                >
                                    {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name} ({p.sku || 'No SKU'}) - Stock: {p.stock}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                            <TextField 
                                type="number" 
                                label="Qty" 
                                fullWidth 
                                size="small" 
                                value={itemQuantity} 
                                onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)} 
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <TextField 
                                type="number" 
                                label="Unit Price" 
                                fullWidth 
                                size="small" 
                                value={itemPrice} 
                                onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                            <Button fullWidth variant="outlined" onClick={handleAddItem} disabled={!selectedProductId}>Add</Button>
                        </Grid>

                        {newOrder.items.length > 0 && (
                            <Grid size={{ xs: 12 }}>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                                            <TableRow>
                                                <TableCell>Item</TableCell>
                                                <TableCell align="right">Qty</TableCell>
                                                <TableCell align="right">Price</TableCell>
                                                <TableCell align="right">Total</TableCell>
                                                <TableCell align="right"></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {newOrder.items.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{item.itemName}</TableCell>
                                                    <TableCell align="right">{item.quantity}</TableCell>
                                                    <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                                                    <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                                                    <TableCell align="right">
                                                        <IconButton size="small" color="error" onClick={() => handleRemoveItem(index)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow>
                                                <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>Grand Total</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                    {formatCurrency(newOrder.items.reduce((sum, item) => sum + item.total, 0))}
                                                </TableCell>
                                                <TableCell />
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        )}
                    </Grid>
                )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAdd(false)} disabled={isSaving}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        disabled={!newOrder.supplierId || newOrder.items.length === 0 || isSaving} 
                        onClick={handleCreateOrder}
                    >
                        {isSaving ? <CircularProgress size={24} /> : 'Create Purchase Order (Draft)'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View PO Dialog */}
            <Dialog open={openView} onClose={() => setOpenView(false)} maxWidth="md" fullWidth fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Purchase Order Details</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                                label={selectedOrder?.status} 
                                color={selectedOrder?.status === 'RECEIVED' ? 'success' : selectedOrder?.status === 'ORDERED' ? 'info' : 'default'} 
                            />
                            {isMobile && <IconButton onClick={() => setOpenView(false)} size="small">✕</IconButton>}
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedOrder && (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Typography variant="caption" color="text.secondary">PO Number</Typography>
                                <Typography variant="body1" fontWeight="bold">{selectedOrder.poNumber}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Typography variant="caption" color="text.secondary">Supplier</Typography>
                                <Typography variant="body1">{selectedOrder.supplier?.name}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Typography variant="caption" color="text.secondary">Order Date</Typography>
                                <Typography variant="body1">{format(new Date(selectedOrder.orderDate), 'dd MMM yyyy')}</Typography>
                            </Grid>
                            
                            <Grid size={12}>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                                            <TableRow>
                                                <TableCell>Item</TableCell>
                                                <TableCell align="right">Qty</TableCell>
                                                <TableCell align="right">Unit Price</TableCell>
                                                <TableCell align="right">Total</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {selectedOrder.items?.map((item: any, idx: number) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{item.itemName}</TableCell>
                                                    <TableCell align="right">{item.quantity}</TableCell>
                                                    <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                                                    <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow>
                                                <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>Grand Total</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(selectedOrder.totalAmount)}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>

                            {selectedOrder.notes && (
                                <Grid size={12}>
                                    <Typography variant="caption" color="text.secondary">Notes</Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedOrder.notes}</Typography>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenView(false)}>Close</Button>
                    {selectedOrder?.status === 'RECEIVED' && (
                        <Button variant="contained" onClick={() => window.print()}>Print PO</Button>
                    )}
                </DialogActions>
            </Dialog>
            <SecureActionDialog 
                open={secureDialogOpen}
                onClose={() => setSecureDialogOpen(false)}
                onConfirm={handleSecureActionConfirm}
                title={pendingAction?.type === 'status' ? "Authorize Status Change" : "Authorize Order Deletion"}
                message={pendingAction?.type === 'status' ? `Confirm changing order status to <strong>${pendingAction.status}</strong>? Enter security PIN to proceed.` : "Deleting a draft order is a critical action. Enter your security PIN to proceed."}
                actionLabel={pendingAction?.type === 'status' ? "Update Status" : "Delete Order"}
            />

            {/* FAB for Mobile */}
            {isMobile && (
                <Fab
                    color="primary"
                    aria-label="add order"
                    onClick={() => setOpenAdd(true)}
                    sx={{
                        position: 'fixed',
                        bottom: 85,
                        right: 16,
                        boxShadow: 4,
                        zIndex: 1000
                    }}
                >
                    <AddIcon />
                </Fab>
            )}
        </Box>
    );
};

export default PurchaseOrders;
