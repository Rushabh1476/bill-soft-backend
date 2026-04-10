import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    IconButton,
    Stack,
    Paper,
    Typography,
    Alert,
    CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { API_URL } from '../../config/api';
import SecureActionDialog from '../shared/SecureActionDialog';

const TaxSettings: React.FC = () => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const [taxes, setTaxes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);

    // Secure Actions
    const [secureDialogOpen, setSecureDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'save' | 'delete', index: number } | null>(null);

    const fetchTaxes = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/admin/tax`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            if (response.data.success) {
                setTaxes(response.data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch taxes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTaxes();
    }, []);

    const handleTaxChange = (index: number, field: string, value: any) => {
        const updatedTaxes = [...taxes];
        updatedTaxes[index] = { ...updatedTaxes[index], [field]: value };
        setTaxes(updatedTaxes);
    };

    const addTaxSlot = () => {
        setTaxes([...taxes, { isNew: true, name: '', displayName: '', rate: 0, type: 'PERCENTAGE', isActive: true }]);
    };

    const handleSaveTaxTrigger = (index: number) => {
        const isSecure = localStorage.getItem('secureActionsEnabled') === 'true';
        if (isSecure) {
            setPendingAction({ type: 'save', index });
            setSecureDialogOpen(true);
        } else {
            handleSaveTax(index);
        }
    };

    const handleSaveTax = async (index: number) => {
        const tax = taxes[index];
        try {
            setSavingId(tax.id || 'new');
            if (tax.isNew) {
                const response = await axios.post(`${API_URL}/admin/tax`, tax, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (response.data.success) {
                    const updatedTaxes = [...taxes];
                    updatedTaxes[index] = response.data.data;
                    setTaxes(updatedTaxes);
                }
            } else {
                await axios.put(`${API_URL}/admin/tax/${tax.id}`, tax, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                });
            }
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to save tax');
        } finally {
            setSavingId(null);
            setSecureDialogOpen(false);
            setPendingAction(null);
        }
    };

    const handleRemoveTaxTrigger = (index: number) => {
        const tax = taxes[index];
        if (tax.isNew) {
            setTaxes(taxes.filter((_, i) => i !== index));
            return;
        }

        const isSecure = localStorage.getItem('secureActionsEnabled') === 'true';
        if (isSecure) {
            setPendingAction({ type: 'delete', index });
            setSecureDialogOpen(true);
        } else {
            if (window.confirm(`Are you sure you want to delete ${tax.displayName || tax.name}?`)) {
                removeTaxSlot(index);
            }
        }
    };

    const removeTaxSlot = async (index: number) => {
        const tax = taxes[index];
        if (!tax || !tax.id) return;

        try {
            await axios.delete(`${API_URL}/admin/tax/${tax.id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            setTaxes(taxes.filter((_, i) => i !== index));
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to delete tax');
        } finally {
            setSecureDialogOpen(false);
            setPendingAction(null);
        }
    };

    const handleSecureConfirm = () => {
        if (!pendingAction) return;
        if (pendingAction.type === 'save') {
            handleSaveTax(pendingAction.index);
        } else {
            removeTaxSlot(pendingAction.index);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

    return (
        <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                Tax Configurations
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Manage your tax rates and slots. Changes affect new bills.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Stack spacing={2}>
                {taxes.map((tax, index) => (
                    <Paper
                        key={tax.id || index}
                        sx={{
                            p: 2,
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'grey.50',
                            border: '1px solid',
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'grey.200',
                            borderRadius: 2
                        }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <TextField
                                label="Tax Name"
                                value={tax.name}
                                onChange={(e) => handleTaxChange(index, 'name', e.target.value)}
                                size="small"
                                fullWidth
                                required
                            />
                            <TextField
                                label="Display Name"
                                value={tax.displayName}
                                onChange={(e) => handleTaxChange(index, 'displayName', e.target.value)}
                                size="small"
                                fullWidth
                            />
                            <TextField
                                label="Rate (%)"
                                type="number"
                                value={tax.rate}
                                onChange={(e) => handleTaxChange(index, 'rate', Number(e.target.value))}
                                size="small"
                                inputProps={{ min: 0, max: 100, step: 0.01 }}
                                sx={{ width: 120 }}
                                required
                            />
                            
                            <Stack direction="row" spacing={1}>
                                <IconButton
                                    color="primary"
                                    onClick={() => handleSaveTaxTrigger(index)}
                                    disabled={savingId === (tax.id || 'new')}
                                >
                                    {savingId === (tax.id || 'new') ? <CircularProgress size={24} /> : <SaveIcon />}
                                </IconButton>
                                <IconButton
                                    color="error"
                                    onClick={() => handleRemoveTaxTrigger(index)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Stack>
                        </Stack>
                    </Paper>
                ))}

                <Box sx={{ mt: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={addTaxSlot}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        Add Tax Slot
                    </Button>
                </Box>
            </Stack>

            <SecureActionDialog 
                open={secureDialogOpen}
                onClose={() => setSecureDialogOpen(false)}
                onConfirm={handleSecureConfirm}
                title={pendingAction?.type === 'save' ? "Authorize Tax Configuration" : "Authorize Tax Removal"}
                message={pendingAction?.type === 'save' ? "Updating tax configurations is a critical action. Enter your security PIN to proceed." : "Removing a tax slot is a critical action. Enter your security PIN to proceed."}
                actionLabel={pendingAction?.type === 'save' ? "Update Tax" : "Delete Tax"}
            />
        </Box>
    );
};

export default TaxSettings;
