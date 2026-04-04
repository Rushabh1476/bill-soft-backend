/* eslint-disable */
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  CircularProgress,
  useTheme,
  InputAdornment
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  CurrencyRupee as CurrencyRupeeIcon,
  DateRange as DateRangeIcon,
  Download as DownloadIcon,
  BarChart as BarChartIcon,
  PersonOff as InactiveIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency } from '../utils/currency';
import { useBills } from '../hooks/useBills';
import { useCustomers } from '../hooks/useCustomers';
import { useProducts } from '../hooks/useProducts';
import { useExpenses } from '../hooks/useExpenses';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';
import { useAuth } from '../contexts/AuthContext';
import { useReports } from '../hooks/useReports';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ message }: { message: string }) => (
  <Box sx={{ textAlign: 'center', py: 8 }}>
    <BarChartIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
    <Typography variant="subtitle1" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_COLORS: Record<string, string> = {
  PAID: '#4caf50',
  PENDING: '#ff9800',
  OVERDUE: '#f44336',
  DRAFT: '#9e9e9e',
};

const COLORS = ['#1976d2', '#2e7d32', 'var(--primary-color)', '#d32f2f', '#9c27b0', '#0288d1', '#757575'];

// ─── Main Component ───────────────────────────────────────────────────────────

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState('last30');
  const [reportSearch, setReportSearch] = useState('');
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const { bills = [], loading: billsLoading, refetch: refetchBills } = useBills() as any;
  const { customers = [], loading: customersLoading } = useCustomers() as any;
  const { products = [], loading: productsLoading, loadProducts } = useProducts() as any;
  const { expenses = [], loading: expensesLoading } = useExpenses() as any;
  const { inactiveCustomers = [], loading: reportsLoading, loadInactiveCustomers } = useReports() as any;
  const { user } = useAuth();
  const permissions = useRoleBasedAccess();

  const canViewDetail = permissions.canViewReports;
  const canExportGST = permissions.canAccessTaxReports;

  useEffect(() => {
    const initializeReports = async () => {
      try {
        await Promise.all([
          refetchBills && refetchBills(),
          loadProducts && loadProducts(),
          loadInactiveCustomers && loadInactiveCustomers()
        ]);
      } catch (err) {
        console.error('[Reports] Failed to initialize data:', err);
      }
    };

    if (user) {
      initializeReports();
    }
  }, [user, refetchBills, loadProducts]);

  const isLoading = billsLoading || customersLoading || productsLoading || expensesLoading || reportsLoading;

  // Filter inactive customers by search
  const filteredInactive = useMemo(() => {
    if (!reportSearch.trim()) return inactiveCustomers;
    const search = reportSearch.toLowerCase();
    return inactiveCustomers.filter((c: any) =>
      c.name.toLowerCase().includes(search) ||
      (c.city || '').toLowerCase().includes(search) ||
      (c.state || '').toLowerCase().includes(search)
    );
  }, [inactiveCustomers, reportSearch]);

  const cutoffDate = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case 'last7': return new Date(now.getTime() - 7 * 86400000);
      case 'last30': return new Date(now.getTime() - 30 * 86400000);
      case 'last90': return new Date(now.getTime() - 90 * 86400000);
      case 'last12': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      default: return new Date(0);
    }
  }, [dateRange]);

  const filteredBills = useMemo(
    () => (bills || []).filter((b: any) => new Date(b.createdAt) >= cutoffDate),
    [bills, cutoffDate]
  );

  const filteredExpenses = useMemo(
    () => (expenses || []).filter((e: any) => new Date(e.date) >= cutoffDate),
    [expenses, cutoffDate]
  );

  const totalRevenue = filteredBills.reduce((s: number, b: any) => s + (b.totalAmount || 0), 0);
  const totalBillCount = filteredBills.length;
  const totalExpAmount = filteredExpenses.reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const avgBillValue = totalBillCount > 0 ? totalRevenue / totalBillCount : 0;

  const monthlyPerformance = useMemo(() => {
    const now = new Date();
    const buckets: { month: string; revenue: number; expenses: number; bills: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ month: MONTH_NAMES[d.getMonth()], revenue: 0, expenses: 0, bills: 0 });
    }

    filteredBills.forEach((b: any) => {
      const d = new Date(b.createdAt);
      for (let i = 0; i < 6; i++) {
        const ref = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        if (d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()) {
          buckets[i].revenue += b.totalAmount || 0;
          buckets[i].bills += 1;
          break;
        }
      }
    });

    filteredExpenses.forEach((e: any) => {
      const d = new Date(e.date);
      for (let i = 0; i < 6; i++) {
        const ref = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        if (d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()) {
          buckets[i].expenses += e.amount || 0;
          break;
        }
      }
    });

    return buckets;
  }, [filteredBills, filteredExpenses]);

  const billStatusData = useMemo(() => {
    const counts: Record<string, number> = { PAID: 0, PENDING: 0, OVERDUE: 0, DRAFT: 0 };
    filteredBills.forEach((b: any) => {
      const key = b.status?.toUpperCase();
      if (key && key in counts) counts[key]++;
    });
    const total = filteredBills.length || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      count,
      color: STATUS_COLORS[name] ?? '#9e9e9e',
    }));
  }, [filteredBills]);

  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; bills: number }>();
    filteredBills.forEach((b: any) => {
      const key = b.customerId || b.customerName;
      const existing = map.get(key);
      if (existing) {
        existing.revenue += (b.totalAmount || 0);
        existing.bills += 1;
      } else {
        map.set(key, { name: b.customerName, revenue: (b.totalAmount || 0), bills: 1 });
      }
    });
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredBills]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; category: string; revenue: number; quantity: number }>();
    filteredBills.forEach((b: any) => {
      (b.items || []).forEach((item: any) => {
        const key = item.productId || item.productName;
        const existing = map.get(key);
        const product = (products || []).find((p: any) => p.id === item.productId);
        if (existing) {
          existing.revenue += (item.total || 0);
          existing.quantity += (item.quantity || 0);
        } else {
          map.set(key, {
            name: item.productName,
            category: product?.category || '—',
            revenue: (item.total || 0),
            quantity: (item.quantity || 0),
          });
        }
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredBills, products]);

  const outstandingAmount = filteredBills
    .filter((b: any) => b.status?.toUpperCase() !== 'PAID')
    .reduce((s: number, b: any) => s + (b.dueAmount ?? b.totalAmount ?? 0), 0);

  const paidCount = filteredBills.filter((b: any) => b.status?.toUpperCase() === 'PAID').length;
  const collectionRate = totalBillCount > 0
    ? ((paidCount / totalBillCount) * 100).toFixed(1)
    : '0.0';

  const handleGSTExport = () => {
    const rows = [
      ['Bill No', 'Date', 'Customer', 'Taxable Amount', 'CGST', 'SGST', 'IGST', 'Total Amount', 'Status'],
      ...filteredBills.map((b: any) => {
        const taxableAmount = b.subtotal ?? (b.totalAmount || 0);
        const taxAmount = (b.totalAmount || 0) - taxableAmount;
        const halfTax = taxAmount / 2;
        return [
          b.billNumber ?? b.id,
          new Date(b.createdAt).toLocaleDateString('en-IN'),
          b.customerName,
          taxableAmount.toFixed(2),
          halfTax.toFixed(2),
          halfTax.toFixed(2),
          '0.00',
          (b.totalAmount || 0).toFixed(2),
          b.status,
        ];
      }),
    ];

    const csvContent = rows.map(r => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GST_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!canViewDetail) {
    return (
      <Box sx={{ p: 5, textAlign: 'center', mt: 10 }}>
        <Paper sx={{ p: 5, borderRadius: 3 }}>
          <Typography variant="h5" color="error">Access Denied</Typography>
          <Typography color="text.secondary" sx={{ mt: 2 }}>You do not have permission to view business reports.</Typography>
          <Button sx={{ mt: 3 }} variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 5 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Reports & Analytics</Typography>
        <Typography variant="subtitle1" color="text.secondary">Comprehensive insights into your business performance</Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            select
            label="Date Range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="last7">Last 7 days</MenuItem>
            <MenuItem value="last30">Last 30 days</MenuItem>
            <MenuItem value="last90">Last 90 days</MenuItem>
            <MenuItem value="last12">Last 12 months</MenuItem>
            <MenuItem value="all">All time</MenuItem>
          </TextField>

          {canExportGST && (
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleGSTExport}>
              Export for CA (GST)
            </Button>
          )}
        </Box>
      </Paper>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 3,
            mb: 4,
          }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ fontSize: 40, color: 'primary.main', fontWeight: 'bold' }}>
                    ₹
                  </Typography>
                  {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AttachMoneyIcon sx={{ fontSize: 40, color: 'primary.main' }} /> */}
                  <Box>
                    <Typography variant="h5" fontWeight="bold">{totalRevenue > 0 ? formatCurrency(totalRevenue) : '—'}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ReceiptIcon sx={{ fontSize: 40, color: 'info.main' }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">{totalBillCount > 0 ? totalBillCount : '—'}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Bills</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PeopleIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">{customers.length > 0 ? customers.length : '—'}</Typography>
                    <Typography variant="body2" color="text.secondary">Active Customers</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <DateRangeIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">{totalBillCount > 0 ? formatCurrency(avgBillValue) : '—'}</Typography>
                    <Typography variant="body2" color="text.secondary">Avg. Bill Value</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Revenue" />
              <Tab label="Customers" />
              <Tab label="Products" />
              <Tab label="Status" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Monthly Revenue</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyPerformance}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                        <Bar dataKey="revenue" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Revenue vs Expenses</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Revenue', value: totalRevenue, color: '#4caf50' },
                            { name: 'Expenses', value: totalExpAmount, color: '#f44336' }
                          ]}
                          innerRadius={60}
                          outerRadius={90}
                          dataKey="value"
                        >
                          <Cell fill="#4caf50" />
                          <Cell fill="#f44336" />
                        </Pie>
                        <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Top Customers</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Customer</TableCell>
                          <TableCell align="right">Revenue</TableCell>
                          <TableCell align="right">Bills</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topCustomers.map((c, i) => (
                          <TableRow key={i}>
                            <TableCell>{c.name}</TableCell>
                            <TableCell align="right">{formatCurrency(c.revenue)}</TableCell>
                            <TableCell align="right">{c.bills}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Top Products</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Revenue</TableCell>
                          <TableCell align="right">Qty</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topProducts.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell>{p.name}</TableCell>
                            <TableCell align="right">{formatCurrency(p.revenue)}</TableCell>
                            <TableCell align="right">{p.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Bills by Status</Typography>
                    {billStatusData.map((s, i) => (
                      <Box key={i} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">{s.name}</Typography>
                          <Typography variant="body2" fontWeight="bold">{s.count} ({s.value}%)</Typography>
                        </Box>
                        <Box sx={{ width: '100%', height: 8, bgcolor: 'grey.200', borderRadius: 4, overflow: 'hidden' }}>
                          <Box sx={{ width: `${s.value}%`, height: '100%', bgcolor: s.color }} />
                        </Box>
                      </Box>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Collection Rate</Typography>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h3" color="success.main" fontWeight="bold">{collectionRate}%</Typography>
                      <Typography color="text.secondary">Overall Collection Rate</Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Outstanding:</Typography>
                      <Typography fontWeight="bold" color="warning.main">{formatCurrency(outstandingAmount)}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </TabPanel>

            {/* ── Tab 4: Inactive Customers ── */}
            <TabPanel value={tabValue} index={4}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">Inactive Customers (30+ Days)</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Customers who haven't generated a bill in the last 30 days
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        placeholder="Search by name, city or state..."
                        value={reportSearch}
                        onChange={(e) => setReportSearch(e.target.value)}
                        sx={{ width: 300 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BarChartIcon sx={{ fontSize: '1.2rem', color: 'text.secondary' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h4" color="warning.main" fontWeight="bold">
                          {filteredInactive.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Filtered Total</Typography>
                      </Box>
                    </Box>
                  </Box>

                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Customer Name</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Contact Info</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Location (City/State)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Loyalty Points</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Last Active Status (Last Bill)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Days Inactive</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredInactive.map((customer: any) => (
                          <TableRow key={customer.id} hover>
                            <TableCell>{customer.name}</TableCell>
                            <TableCell>
                              <Typography variant="body2">{customer.phone || 'No phone'}</Typography>
                              <Typography variant="caption" color="text.secondary">{customer.email || 'No email'}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{customer.city || '—'}</Typography>
                              <Typography variant="caption" color="text.secondary">{customer.state || '—'}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                <Typography fontWeight="bold" color="primary">{customer.loyaltyPoints || 0}</Typography>
                                <Typography variant="caption" color="text.secondary">pts</Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              {customer.lastBillDate ? (
                                <Box>
                                  <Typography variant="body2">
                                    {new Date(customer.lastBillDate).toLocaleDateString()}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(customer.lastBillDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography color="text.disabled">No bills generated</Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Typography color={customer.daysInactive > 60 ? 'error.main' : 'warning.main'} fontWeight="500">
                                {customer.daysInactive} days
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                        {inactiveCustomers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                              <Typography color="text.disabled">No inactive customers found.</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </TabPanel>
          </Paper>
        </>
      )}
    </Box>
  );
};

const Divider = ({ sx }: { sx?: any }) => <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', ...sx }} />;

export default Reports;
