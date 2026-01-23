import React, { useState } from 'react';
import { Box, Typography, Tab, Tabs, Paper } from '@mui/material';
import {
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

// Import your sub-components
import BusinessProfileSettings from '../components/settings/BusinessProfileSettings';
import InvoiceSettings from '../components/settings/InvoiceSettings';
import AppearanceSettings from '../components/settings/AppearanceSettings';
import SecuritySettings from '../components/settings/SecuritySettings';

/** 1. Centralized Configuration */
const SETTINGS_TABS = [
  { label: 'Business Profile', icon: <BusinessIcon />, component: <BusinessProfileSettings /> },
  { label: 'Invoice Settings', icon: <ReceiptIcon />, component: <InvoiceSettings /> },
  { label: 'Appearance', icon: <PaletteIcon />, component: <AppearanceSettings /> },
  { label: 'Security', icon: <SecurityIcon />, component: <SecuritySettings /> },
];

/** 2. Accessibility Helper */
function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
  if (newValue !== tabValue) {
    setTabValue(newValue);
  }
};


  /** 🔥 UPDATED STYLE: Touch karne par EK DUM DARK BLUE */
  const tabButtonStyle = {
    textTransform: 'none',
    fontSize: '0.875rem',
    fontWeight: 700, // Thoda extra bold taaki white text chamke
    borderRadius: '12px',
    minHeight: 44,
    minWidth: 'auto',
    px: 3,
    mx: 0.5,
    transition: 'background-color 0.05s linear',
    // Fast transition for touch feeling
    
    // ⚪ NORMAL STATE (Bina select wala)
    color: '#475569', 
    backgroundColor: 'transparent',
    '& .MuiTab-iconWrapper': { color: '#475569' },

    // 🔵 SELECTED STATE (Touch/Click karne par)
    '&.Mui-selected': {
      backgroundColor: '#1e3a8a !important', // ✅ Solid Dark Blue
      color: '#ffffff !important',          // ✅ Fully White Text
      opacity: 1,                           // ✅ No transparency
      '& .MuiTab-iconWrapper': { 
        color: '#ffffff !important'         // ✅ Fully White Icon
      },
    },
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="800">Settings</Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your business and app preferences
        </Typography>
      </Box>

      <Box>
      <Tabs
  value={tabValue}
  onChange={handleTabChange}
  variant="scrollable"
  scrollButtons={false}      // ❌ scroll delay off
  allowScrollButtonsMobile={false}
  selectionFollowsFocus     // ⚡ instant tab select
  sx={{
    mb: 2,
    '& .MuiTabs-indicator': { display: 'none' },
    '& .MuiTabs-flexContainer': { gap: 1 },
  }}
>

          {SETTINGS_TABS.map((tab, index) => (
            <Tab
              key={tab.label}
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
              disableRipple // Ripple hatane se touch ek dum solid feel hota hai
              sx={tabButtonStyle}
              {...a11yProps(index)}
            />
          ))}
        </Tabs>

        {/* Content Section */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
          {SETTINGS_TABS.map((tab, index) => (
            <TabPanel key={index} value={tabValue} index={index}>
              {tab.component}
            </TabPanel>
          ))}
        </Paper>
      </Box>
    </Box>
  );
};

export default Settings;