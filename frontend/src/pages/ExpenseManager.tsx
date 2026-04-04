/* eslint-disable */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    TextField,
    MenuItem,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    useTheme,
    useMediaQuery,
    IconButton,
    InputAdornment
} from '@mui/material';
import {
    Add as AddIcon,
    PieChart as PieChartIcon,
    CurrencyRupee as CurrencyRupeeIcon,
    TrendingUp as TrendingUpIcon,
    CalendarMonth as CalendarIcon,
    Receipt as ReceiptIcon,
    Download as DownloadIcon,
    TrendingDown as TrendingDownIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useExpenses } from '../hooks/useExpenses';
import { formatCurrency } from '../utils/currency';
import { TaxDropdown } from '../components/shared/TaxDropdown';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';
import { useAuth } from '../contexts/AuthContext';
import SecureActionDialog from '../components/shared/SecureActionDialog';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`expenses-tabpanel-${index}`}
            aria-labelledby={`expenses-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

const ExpenseManager: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { expenses, categoryBreakdown, addExpense } = useExpenses();
    const navigate = useNavigate();
    const { user } = useAuth();
    const permissions = useRoleBasedAccess();

    const canManageValue = permissions.canManageExpenses;
    const canViewAnalytics = permissions.canViewReports;
    const canExportExp = permissions.canAccessTaxReports;

    const [open, setOpen] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [dateRange, setDateRange] = useState('last30');
    const [formData, setFormData] = useState({
        title: '',
        category: 'General',
        amount: '',
        gstAmount: '0',
        taxRate: 0,
        description: ''
    });

    // Secure Actions
    const [secureDialogOpen, setSecureDialogOpen] = useState(false);
    const [pendingSave, setPendingSave] = useState(false);
    const isSecureEnabled = localStorage.getItem('secureActionsEnabled') === 'true';

    // Group real expenses by month for the trend chart
    const monthlyData = useMemo(() => {
        const monthMap: Record<string, number> = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Initialize last 6 months
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthMap[months[d.getMonth()]] = 0;
        }

        if (expenses.length > 0) {
            expenses.forEach(exp => {
                const d = new Date(exp.date);
                const m = months[d.getMonth()];
                if (monthMap[m] !== undefined) {
                    monthMap[m] += exp.amount;
                }
            });
        }

        return Object.entries(monthMap).map(([month, amount]) => ({ month, amount }));
    }, [expenses]);

    // Transform breakdown object to array for Recharts
    const chartData = useMemo(() => {
        return Object.entries(categoryBreakdown || {}).map(([name, value]: any) => ({
            name,
            value
        })).filter(item => item.value > 0);
    }, [categoryBreakdown]);

    if (!canManageValue) {
        return (
            <Box sx={{ p: 5, textAlign: 'center', mt: 10 }}>
                <Paper sx={{ p: 5, borderRadius: 3 }}>
                    <Typography variant="h5" color="error">Access Denied</Typography>
                    <Typography color="text.secondary" sx={{ mt: 2 }}>You do not have permission to manage expenses.</Typography>
                    <Button sx={{ mt: 3 }} variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
                </Paper>
            </Box>
        );
    }

    const categories = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Inventory', 'Travel', 'General'];

    const handleCreateTrigger = () => {
        if (!formData.title || !formData.amount) {
            alert('Please fill in required fields');
            return;
        }
        const isSecure = localStorage.getItem('secureActionsEnabled') === 'true';
        if (isSecure) {
            setPendingSave(true);
            setSecureDialogOpen(true);
        } else {
            handleCreate();
        }
    };

    const handleSecureActionConfirm = () => {
        if (pendingSave) {
            handleCreate();
            setPendingSave(false);
            setSecureDialogOpen(false);
        }
    };

    const handleCreate = async () => {
        try {
            await addExpense({
                ...formData,
                amount: parseFloat(formData.amount),
                gstAmount: parseFloat(formData.gstAmount) || 0,
                date: new Date().toISOString()
            });
            setOpen(false);
            setFormData({ title: '', category: 'General', amount: '', gstAmount: '0', taxRate: 0, description: '' });
        } catch (err) {
            console.error('Submission failed:', err);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleExport = () => {
        const now = new Date();
        let cutoffDate = new Date(0);
        switch (dateRange) {
            case 'last7': cutoffDate = new Date(now.getTime() - 7 * 86400000); break;
            case 'last30': cutoffDate = new Date(now.getTime() - 30 * 86400000); break;
            case 'last90': cutoffDate = new Date(now.getTime() - 90 * 86400000); break;
            case 'last12': cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
            default: cutoffDate = new Date(0);
        }

        const filteredExpenses = expenses.filter(e => new Date(e.date) >= cutoffDate);

        const rows = [
            ['Date', 'Title', 'Category', 'Base Amount', 'GST Amount', 'Total Amount', 'Description'],
            ...filteredExpenses.map(e => [
                new Date(e.date).toLocaleDateString('en-IN'),
                e.title,
                e.category,
                e.amount.toFixed(2),
                (e.gstAmount || 0).toFixed(2),
                (e.amount + (e.gstAmount || 0)).toFixed(2),
                e.description || ''
            ])
        ];

        const csvContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Expense_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <Box sx={{ p: { xs: 2, md: 5 } }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Expense Manager
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Track and manage your business operational costs
                </Typography>
            </Box>

            {/* Filter Controls */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: 'space-between',
                    flexWrap: 'wrap'
                }}>
                    <Box sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center',
                        flexDirection: { xs: 'column', sm: 'row' },
                        width: { xs: '100%', sm: 'auto' }
                    }}>
                        <TextField
                            select
                            label="Date Range"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            size="small"
                            sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 150 } }}
                        >
                            <MenuItem value="last7">Last 7 days</MenuItem>
                            <MenuItem value="last30">Last 30 days</MenuItem>
                            <MenuItem value="last90">Last 90 days</MenuItem>
                            <MenuItem value="last12">Last 12 months</MenuItem>
                        </TextField>
                        {canExportExp && (
                            <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={handleExport}
                                sx={{ flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}
                            >
                                Export Report
                            </Button>
                        )}
                    </Box>
                    {canManageValue && (
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<AddIcon />}
                            onClick={() => setOpen(true)}
                            sx={{ flexGrow: { xs: 1, sm: 0 }, width: { xs: '100%', sm: 'auto' } }}
                        >
                            Record Expense
                        </Button>
                    )}
                </Box>
            </Paper>

            {/* KPI Cards */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)'
                },
                gap: 3,
                mb: 4
            }}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CurrencyRupeeIcon sx={{ fontSize: 40, color: 'error.main' }} />
                            <Box>
                                <Typography variant="h5" fontWeight="bold">
                                    {formatCurrency(totalExpense)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Expenses
                                </Typography>
                                {totalExpense > 0 && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <TrendingUpIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                        <Typography variant="caption" color="error.main">
                                            +12.4%
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ReceiptIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                            <Box>
                                <Typography variant="h5" fontWeight="bold">
                                    {expenses.length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Records
                                </Typography>
                                {expenses.length > 0 && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <TrendingUpIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                        <Typography variant="caption" color="warning.main">
                                            +5.2%
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <PieChartIcon sx={{ fontSize: 40, color: 'info.main' }} />
                            <Box>
                                <Typography variant="h5" fontWeight="bold">
                                    {chartData.length > 0 ? chartData[0].name : 'N/A'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Top Category
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Most spent
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CalendarIcon sx={{ fontSize: 40, color: 'success.main' }} />
                            <Box>
                                <Typography variant="h5" fontWeight="bold">
                                    {formatCurrency(totalExpense / (expenses.length || 1))}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Avg. Expense
                                </Typography>
                                {totalExpense > 0 && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <TrendingDownIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                        <Typography variant="caption" color="success.main">
                                            -2.1%
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    {canViewAnalytics && <Tab label="Expense Analytics" />}
                    {canViewAnalytics && <Tab label="Category Breakdown" />}
                    <Tab label="Recent Expenses" />
                </Tabs>

                {/* Expense Analytics Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                        gap: 3
                    }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Monthly Expense Trend
                                </Typography>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={monthlyData} style={{ outline: 'none' }} tabIndex={-1}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip cursor={{ fill: 'transparent' }} formatter={(value) => [formatCurrency(Number(value) || 0), 'Expense']} />
                                        <Legend />
                                        <Bar dataKey="amount" fill="#d32f2f" name="Expense (₹)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Category Distribution
                                </Typography>
                                <Box sx={{ position: 'relative' }}>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart style={{ outline: 'none' }} tabIndex={-1}>
                                            <Pie
                                                data={chartData.length > 0 ? chartData : [{ name: 'No Data', value: 1 }]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={75}
                                                outerRadius={125}
                                                paddingAngle={chartData.length > 0 ? 4 : 0}
                                                dataKey="value"
                                                startAngle={90}
                                                endAngle={-270}
                                            >
                                                {chartData.length > 0
                                                    ? chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))
                                                    : <Cell fill="#e0e0e0" />
                                                }
                                            </Pie>
                                            <Tooltip cursor={{ fill: 'transparent' }} formatter={(value: any) => chartData.length > 0 ? formatCurrency(Number(value) || 0) : '—'} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Centre label */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -62%)',
                                            textAlign: 'center',
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Total Spent
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            fontWeight="bold"
                                            sx={{ color: totalExpense > 0 ? '#d32f2f' : 'text.disabled' }}
                                        >
                                            {totalExpense > 0 ? formatCurrency(totalExpense) : '—'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </TabPanel>

                {/* Category Breakdown Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Detailed Category Breakdown
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Category Name</TableCell>
                                            <TableCell align="right">Total Amount</TableCell>
                                            <TableCell align="right">% of Total</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {chartData.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell align="right">{formatCurrency(item.value)}</TableCell>
                                                <TableCell align="right">
                                                    {((item.value / totalExpense) * 100).toFixed(1)}%
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {chartData.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center">No data available</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </TabPanel>

                {/* Recent Expenses Tab (Original List View) */}
                <TabPanel value={tabValue} index={canViewAnalytics ? 2 : 0}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Recent Expense Records</Typography>
                            {expenses.map((expense) => (
                                <Box key={expense.id} display="flex" justifyContent="space-between" alignItems="center" py={2} borderBottom="1px solid #f0f0f0">
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box p={1.5} bgcolor="error.light" color="white" borderRadius="12px">
                                            <CurrencyRupeeIcon />
                                        </Box>
                                        <div>
                                            <Typography variant="subtitle1" fontWeight="bold">{expense.title}</Typography>
                                            <Typography variant="caption" color="text.secondary">{expense.category} • {new Date(expense.date).toLocaleDateString()}</Typography>
                                        </div>
                                    </Box>
                                    <Typography variant="h6" color="error.main" fontWeight="bold">
                                        - {formatCurrency(expense.amount)}
                                    </Typography>
                                </Box>
                            ))}
                            {expenses.length === 0 && <Typography color="text.secondary" align="center" py={4}>No expenses recorded yet.</Typography>}
                        </CardContent>
                    </Card>
                </TabPanel>
            </Paper>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Record New Expense
                    {isMobile && (
                        <IconButton onClick={() => setOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    )}
                </DialogTitle>
                <DialogContent dividers={isMobile}>
                    <Box display="flex" flexDirection="column" gap={2.5} sx={{ mt: isMobile ? 0 : 1 }}>
                        <TextField
                            label="Expense Title"
                            placeholder="e.g., Office Rent"
                            fullWidth
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <TextField
                            select
                            label="Category"
                            fullWidth
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            SelectProps={{
                                MenuProps: {
                                    PaperProps: {
                                        sx: {
                                            maxHeight: '180px', // Show ~4 items
                                            scrollBehavior: 'smooth',
                                            '&::-webkit-scrollbar': { width: '8px' },
                                            '&::-webkit-scrollbar-thumb': {
                                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                                                borderRadius: '10px',
                                            }
                                        }
                                    }
                                }
                            }}
                        >
                            {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </TextField>
                        <TextField
                            label="Amount (Base)"
                            type="number"
                            fullWidth
                            value={formData.amount}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">₹</InputAdornment>
                            }}
                            onChange={(e) => {
                                const newAmount = e.target.value;
                                let amt = parseFloat(newAmount) || 0;
                                if (amt < 0) amt = 0; // Prevent negative amount
                                const rate = formData.taxRate || 0;
                                setFormData({ ...formData, amount: amt.toString(), gstAmount: ((amt * rate) / 100).toString() });
                            }}
                        />
                        <Box>
                            <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 'bold', color: 'text.secondary' }}>
                                GST & TAX CONFIGURATION
                            </Typography>
                            <TaxDropdown
                                taxRate={formData.taxRate}
                                onChange={(newRate) => {
                                    const amt = parseFloat(formData.amount) || 0;
                                    setFormData({ ...formData, taxRate: newRate, gstAmount: ((amt * newRate) / 100).toString() });
                                }}
                            />
                        </Box>
                        {(parseFloat(formData.amount) || 0) > 0 && formData.taxRate > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'action.hover', p: 1.5, borderRadius: 2 }}>
                                <Typography variant="body2" color="text.secondary">Total (with Tax):</Typography>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    {formatCurrency((parseFloat(formData.amount) || 0) + (parseFloat(formData.gstAmount) || 0))}
                                </Typography>
                            </Box>
                        )}
                        <TextField
                            label="Description"
                            multiline
                            rows={isMobile ? 2 : 3}
                            fullWidth
                            placeholder="Optional additional notes"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1.5, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
                    <Button onClick={() => setOpen(false)} fullWidth={isMobile} variant="outlined" size={isMobile ? 'large' : 'medium'}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateTrigger}
                        variant="contained"
                        color="error"
                        fullWidth={isMobile}
                        size={isMobile ? 'large' : 'medium'}
                        sx={{ borderRadius: 2, fontWeight: 'bold' }}
                    >
                        Save Expense
                    </Button>
                </DialogActions>
            </Dialog>

            <SecureActionDialog 
                open={secureDialogOpen}
                onClose={() => setSecureDialogOpen(false)}
                onConfirm={handleSecureActionConfirm}
                title="Authorize Expense Recording"
                message={`Confirm recording a new expense for <strong>${formData.title}</strong>? Enter security PIN to proceed.`}
                actionLabel="Save Expense"
            />
        </Box>
    );
};

export default ExpenseManager;
