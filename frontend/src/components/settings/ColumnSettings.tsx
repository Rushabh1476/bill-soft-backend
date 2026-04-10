import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Stack,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { API_URL } from '../../config/api';

const DEFAULT_COLUMNS = ['Product Name', 'Quantity', 'Price', 'Total'];

const ColumnSettings: React.FC = () => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);
    const [customColumn, setCustomColumn] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchColumns();
    }, []);

    const fetchColumns = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const res = await axios.get(`${API_URL}/admin/settings/invoice-preferences`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success && res.data.data.customColumns) {
                const cols = res.data.data.customColumns;
                setColumns(typeof cols === 'string' ? JSON.parse(cols) : cols);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load columns');
        } finally {
            setLoading(false);
        }
    };
    const [showWarning, setShowWarning] = useState(false);

    const handleAddColumn = async () => {
        if (columns.length >= 6) {
            setShowWarning(true);
            return;
        }
        if (!customColumn.trim()) return;
        const colName = customColumn.trim();

        if (columns.includes(colName)) {
            setCustomColumn('');
            return;
        }

        try {
            setError('');
            const token = localStorage.getItem('authToken');
            const newCols = [...columns, colName];
            
            await axios.put(`${API_URL}/admin/settings/invoice-preferences`, { 
                preferences: { customColumns: newCols } 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setColumns(newCols);
            setCustomColumn('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add column');
        }
    };

    const handleRemoveColumn = async (column: string) => {
        if (DEFAULT_COLUMNS.includes(column) || columns.length <= 2) return;
        
        try {
            setError('');
            const token = localStorage.getItem('authToken');
            const newCols = columns.filter(c => c !== column);

            await axios.put(`${API_URL}/admin/settings/invoice-preferences`, { 
                preferences: { customColumns: newCols } 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setColumns(newCols);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to remove column');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddColumn();
        }
    };

    if (loading) {
        return <CircularProgress size={24} />;
    }

    return (
        <Box>
            <Stack spacing={3}>
                {error && <Alert severity="error">{error}</Alert>}
                {showWarning && (
                    <Alert severity="warning" onClose={() => setShowWarning(false)}>
                        Column limit reached! Remove a column to add a new one.
                    </Alert>
                )}
                
                <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                        <TextField
                            label="Add custom column"
                            placeholder="e.g., Discount, Tax, Notes"
                            value={customColumn}
                            onChange={(e) => setCustomColumn(e.target.value)}
                            onKeyPress={handleKeyPress}
                            size="small"
                            fullWidth
                            disabled={columns.length >= 6}
                        />
                        <Typography variant="caption" color={columns.length >= 6 ? "warning.main" : "text.secondary"} sx={{ mt: 0.5, display: 'block' }}>
                            {columns.length >= 6 ? 'Maximum 6 columns allowed for PDF layout.' : `Currently using ${columns.length} columns (Min: 2, Max: 6)`}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddColumn}
                        disabled={!customColumn.trim() || columns.length >= 6}
                        title={columns.length >= 6 ? "Max 6 columns allowed for PDF layout." : ""}
                        sx={{
                            whiteSpace: 'nowrap',
                            height: '40px',
                            px: 3,
                            boxShadow: isDarkMode ? '0 4px 14px 0 rgba(0, 0, 0, 0.5)' : 'none',
                            '&.Mui-disabled': {
                                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.12)',
                                color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.26)'
                            }
                        }}
                    >
                        Add Column
                    </Button>
                </Stack>

                <Box>
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                        Current Columns ({columns.length})
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {columns.map((col, index) => {
                            const isDefault = DEFAULT_COLUMNS.includes(col);
                            const canDelete = !isDefault && columns.length > 2;
                            return (
                                <Chip
                                    key={index}
                                    label={col}
                                    onDelete={canDelete ? () => handleRemoveColumn(col) : undefined}
                                    color={isDefault ? 'default' : 'primary'}
                                    variant={isDefault ? 'filled' : 'outlined'}
                                    sx={{ mb: 1 }}
                                    title={columns.length <= 2 ? "Minimum 2 columns required" : ""}
                                />
                            );
                        })}
                    </Stack>
                </Box>
            </Stack>
        </Box>
    );
};

export default ColumnSettings;
