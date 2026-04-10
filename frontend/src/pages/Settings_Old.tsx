import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tab,
  Tabs,
  Paper,
  Card,
  CardContent,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import LogoUpload from '../components/settings/LogoUpload';
import TaxSettings from '../components/settings/TaxSettings';
import ColumnSettings from '../components/settings/ColumnSettings';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
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

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Settings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Configure your application preferences and business settings
        </Typography>
      </Box>

      {/* Settings Tabs */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<BusinessIcon />} 
            label="Business Profile" 
            iconPosition="start"
            sx={{ minHeight: 72 }}
          />
          <Tab 
            icon={<ReceiptIcon />} 
            label="Invoice Settings" 
            iconPosition="start"
            sx={{ minHeight: 72 }}
          />
          <Tab 
            icon={<PaletteIcon />} 
            label="Appearance" 
            iconPosition="start"
            sx={{ minHeight: 72 }}
          />
          <Tab 
            icon={<SecurityIcon />} 
            label="Security" 
            iconPosition="start"
            sx={{ minHeight: 72 }}
          />
        </Tabs>

        {/* Business Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Company Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    defaultValue="Your Company Name"
                    variant="outlined"
                  />
                  <TextField
                    fullWidth
                    label="Company Address"
                    multiline
                    rows={3}
                    defaultValue="123 Business Street, City, State, PIN"
                    variant="outlined"
                  />
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      defaultValue="+91 9876543210"
                      variant="outlined"
                    />
                    <TextField
                      fullWidth
                      label="Email Address"
                      defaultValue="contact@company.com"
                      variant="outlined"
                    />
                  </Box>
                  <TextField
                    fullWidth
                    label="GST Number"
                    defaultValue="22AAAAA0000A1Z5"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Company Logo
                </Typography>
                <LogoUpload />
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Invoice Settings Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Tax Configuration
                </Typography>
                <TaxSettings />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Invoice Columns
                </Typography>
                <ColumnSettings />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Invoice Preferences
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Auto-generate invoice numbers"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Include company logo on invoices"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="Send email notifications for new invoices"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Show payment terms on invoices"
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Appearance Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Theme Settings
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Use dark mode"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Use system theme"
                  />
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Invoice Template
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel 
                      id="invoice-template-select-label"
                      htmlFor="invoice-template-select"
                    >
                      Invoice Template
                    </InputLabel>
                    <Select
                      labelId="invoice-template-select-label"
                      id="invoice-template-select"
                      value="modern"
                      label="Invoice Template"
                      inputProps={{
                        'aria-label': 'Invoice Template Selection',
                        'aria-describedby': 'invoice-template-helper',
                        name: 'invoiceTemplate',
                        title: 'Select an invoice template'
                      }}
                    >
                      <MenuItem value="modern">Modern</MenuItem>
                      <MenuItem value="classic">Classic</MenuItem>
                      <MenuItem value="minimal">Minimal</MenuItem>
                    </Select>
                    <FormHelperText id="invoice-template-helper">
                      Choose the template style for your invoices
                    </FormHelperText>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="Primary Color"
                    type="color"
                    defaultValue="#3B82F6"
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Data & Privacy
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Auto-backup data"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="Share analytics data"
                  />
                  <Divider sx={{ my: 2 }} />
                  <Button variant="outlined" color="primary" fullWidth>
                    Export All Data
                  </Button>
                  <Button variant="outlined" color="error" fullWidth>
                    Delete All Data
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Application Info
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Version"
                      secondary="1.0.0"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Last Updated"
                      secondary={new Date().toLocaleDateString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Total Bills"
                      secondary="0"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Total Customers"
                      secondary="0"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Settings;
