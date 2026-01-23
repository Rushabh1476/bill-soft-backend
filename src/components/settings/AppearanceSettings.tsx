import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';

/**
 * AppearanceSettings component handles theme and visual customization
 * Follows Single Responsibility Principle by focusing only on appearance settings
 */
const AppearanceSettings: React.FC = () => {
  return (
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
  );
};

export default AppearanceSettings;