/* eslint-disable */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { ModuleConfig, UserRole, InvoiceNumberConfig } from '../../types/adminSettings';
import BillPreviewDemo from '../bills/BillPreviewDemo';

interface AdminSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

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
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ isOpen, onClose }) => {
  const [tabValue, setTabValue] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Module configurations
  const [moduleConfigs, setModuleConfigs] = useState<ModuleConfig[]>([
    {
      moduleName: 'products',
      displayName: 'Products',
      columns: [
        { id: 'name', label: 'Product Name', visible: true, editable: true, required: true, dataType: 'string' },
        { id: 'description', label: 'Description', visible: true, editable: true, required: false, dataType: 'string' },
        { id: 'price', label: 'Price', visible: true, editable: true, required: true, dataType: 'currency' },
        { id: 'category', label: 'Category', visible: true, editable: true, required: false, dataType: 'string' },
        { id: 'stock', label: 'Stock Quantity', visible: true, editable: true, required: false, dataType: 'number' },
        { id: 'sku', label: 'SKU', visible: true, editable: true, required: false, dataType: 'string' },
        { id: 'createdAt', label: 'Created Date', visible: true, editable: false, required: false, dataType: 'date' },
      ],
      permissions: {
        view: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'VIEWER'],
        edit: ['ADMIN', 'MANAGER'],
        delete: ['ADMIN'],
        create: ['ADMIN', 'MANAGER'],
      },
    },
    {
      moduleName: 'customers',
      displayName: 'Customers',
      columns: [
        { id: 'name', label: 'Customer Name', visible: true, editable: true, required: true, dataType: 'string' },
        { id: 'email', label: 'Email', visible: true, editable: true, required: true, dataType: 'email' },
        { id: 'phone', label: 'Phone', visible: true, editable: true, required: false, dataType: 'phone' },
        { id: 'address', label: 'Address', visible: true, editable: true, required: false, dataType: 'string' },
        { id: 'company', label: 'Company', visible: true, editable: true, required: false, dataType: 'string' },
        { id: 'totalPurchases', label: 'Total Purchases', visible: true, editable: false, required: false, dataType: 'currency' },
        { id: 'createdAt', label: 'Created Date', visible: true, editable: false, required: false, dataType: 'date' },
      ],
      permissions: {
        view: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'VIEWER'],
        edit: ['ADMIN', 'MANAGER'],
        delete: ['ADMIN'],
        create: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
      },
    },
    {
      moduleName: 'bills',
      displayName: 'Bills',
      columns: [
        { id: 'invoiceNumber', label: 'Invoice Number', visible: true, editable: false, required: true, dataType: 'string' },
        { id: 'customerName', label: 'Customer', visible: true, editable: true, required: true, dataType: 'string' },
        { id: 'totalAmount', label: 'Total Amount', visible: true, editable: true, required: true, dataType: 'currency' },
        { id: 'status', label: 'Status', visible: true, editable: true, required: true, dataType: 'string' },
        { id: 'dueDate', label: 'Due Date', visible: true, editable: true, required: false, dataType: 'date' },
        { id: 'taxAmount', label: 'Tax Amount', visible: true, editable: true, required: false, dataType: 'currency' },
        { id: 'createdAt', label: 'Created Date', visible: true, editable: false, required: false, dataType: 'date' },
      ],
      permissions: {
        view: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'VIEWER'],
        edit: ['ADMIN', 'MANAGER'],
        delete: ['ADMIN'],
        create: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
      },
    },
  ]);

  // User roles
  const [userRoles, setUserRoles] = useState<UserRole[]>([
    {
      id: 'ADMIN',
      name: 'Administrator',
      description: 'Full access to all features and settings',
      permissions: ['*'],
      modules: {
        products: { access: 'full' },
        customers: { access: 'full' },
        bills: { access: 'full' },
      },
    },
    {
      id: 'MANAGER',
      name: 'Manager',
      description: 'Can manage products, customers, and bills',
      permissions: ['read:*', 'write:*'],
      modules: {
        products: { access: 'full' },
        customers: { access: 'full' },
        bills: { access: 'full' },
      },
    },
    {
      id: 'ACCOUNTANT',
      name: 'Accountant',
      description: 'Can view and create bills, limited product access',
      permissions: ['read:*', 'write:bills', 'write:customers'],
      modules: {
        products: { access: 'read', restrictedFields: ['price'] },
        customers: { access: 'full' },
        bills: { access: 'write' },
      },
    },
  ]);

  // Invoice number configuration
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceNumberConfig>({
    pattern: 'INV{COUNTER}',
    prefix: 'INV',
    suffix: '',
    length: 5,
    includeDate: false,
    counter: 1,
    examples: ['INV00001', 'INV00002', 'INV00003'],
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleColumnVisibilityChange = (moduleIndex: number, columnIndex: number, visible: boolean) => {
    const updatedModules = [...moduleConfigs];
    updatedModules[moduleIndex].columns[columnIndex].visible = visible;
    setModuleConfigs(updatedModules);
  };

  const handleColumnEditableChange = (moduleIndex: number, columnIndex: number, editable: boolean) => {
    const updatedModules = [...moduleConfigs];
    updatedModules[moduleIndex].columns[columnIndex].editable = editable;
    setModuleConfigs(updatedModules);
  };

  const updateInvoicePattern = (pattern: string) => {
    const examples = generateInvoiceExamples(pattern);
    setInvoiceConfig(prev => ({
      ...prev,
      pattern,
      examples,
    }));
  };

  const generateInvoiceExamples = (pattern: string): string[] => {
    const examples = [];
    const today = new Date();

    for (let i = 1; i <= 3; i++) {
      let example = pattern
        .replace('{COUNTER}', i.toString().padStart(invoiceConfig.length, '0'))
        .replace('{PREFIX}', invoiceConfig.prefix)
        .replace('{SUFFIX}', invoiceConfig.suffix)
        .replace('{YEAR}', today.getFullYear().toString())
        .replace('{MONTH}', (today.getMonth() + 1).toString().padStart(2, '0'))
        .replace('{DAY}', today.getDate().toString().padStart(2, '0'))
        .replace('{TIMESTAMP}', Date.now().toString());

      examples.push(example);
    }

    return examples;
  };

  const handleSaveSettings = () => {
    // Save logic here - would typically call an API
    console.log('Saving admin settings:', {
      modules: moduleConfigs,
      roles: userRoles,
      invoiceConfig,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const getModuleIcon = (moduleName: string) => {
    switch (moduleName) {
      case 'products': return <InventoryIcon />;
      case 'customers': return <PeopleIcon />;
      case 'bills': return <ReceiptIcon />;
      default: return <SettingsIcon />;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" />
          <Typography variant="h6">Admin Settings</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Admin settings saved successfully!
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Field Access Control" />
            <Tab label="Invoice Configuration" />
            <Tab label="Invoice Templates" />
            <Tab label="User Roles" />
          </Tabs>
        </Box>



        {/* Field Access Control Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Role-Based Field Access
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Define which user roles can view or edit specific fields.
          </Typography>

          {userRoles.map((role) => (
            <Card key={role.id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {role.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {role.description}
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  {Object.entries(role.modules).map(([moduleName, moduleAccess]) => (
                    <Card variant="outlined" key={moduleName}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {getModuleIcon(moduleName)}
                          <Typography variant="subtitle2" textTransform="capitalize">
                            {moduleName}
                          </Typography>
                        </Box>
                        <Chip
                          label={moduleAccess.access}
                          color={moduleAccess.access === 'full' ? 'success' : 'primary'}
                          size="small"
                        />
                        {moduleAccess.restrictedFields && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Restricted: {moduleAccess.restrictedFields.join(', ')}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))}
        </TabPanel>

        {/* Invoice Configuration Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Invoice Number Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Configure the format and pattern for invoice numbers.
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Pattern Configuration
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    label="Pattern"
                    value={invoiceConfig.pattern}
                    onChange={(e) => updateInvoicePattern(e.target.value)}
                    fullWidth
                    helperText="Use {COUNTER}, {PREFIX}, {SUFFIX}, {YEAR}, {MONTH}, {DAY}, {TIMESTAMP}"
                  />

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                    <TextField
                      label="Prefix"
                      value={invoiceConfig.prefix}
                      onChange={(e) => setInvoiceConfig(prev => ({ ...prev, prefix: e.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="Suffix"
                      value={invoiceConfig.suffix}
                      onChange={(e) => setInvoiceConfig(prev => ({ ...prev, suffix: e.target.value }))}
                      fullWidth
                    />
                  </Box>

                  <TextField
                    label="Counter Length"
                    type="number"
                    value={invoiceConfig.length}
                    onChange={(e) => setInvoiceConfig(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                    fullWidth
                    inputProps={{ min: 1, max: 10 }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={invoiceConfig.includeDate}
                        onChange={(e) => setInvoiceConfig(prev => ({ ...prev, includeDate: e.target.checked }))}
                      />
                    }
                    label="Include Date in Pattern"
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Preview Examples
                </Typography>

                <Stack spacing={1}>
                  {invoiceConfig.examples.map((example, index) => (
                    <Box key={index} sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" fontFamily="monospace">
                        {example}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Invoice Templates Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Invoice Template Management
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Configure invoice templates and preview A4-sized invoices with PDF download capability.
          </Typography>

          <BillPreviewDemo />
        </TabPanel>

        {/* User Roles Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            User Role Management
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Manage user roles and their permissions.
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Role Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{role.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {role.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {role.permissions.slice(0, 2).map((permission, index) => (
                          <Chip key={index} label={permission} size="small" />
                        ))}
                        {role.permissions.length > 2 && (
                          <Chip label={`+${role.permissions.length - 2} more`} size="small" variant="outlined" />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSaveSettings}
          variant="contained"
          startIcon={<SaveIcon />}
        >
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminSettings;
