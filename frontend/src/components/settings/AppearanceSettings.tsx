import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid, // Standard Grid in MUI v6+ uses 'size' prop
  useTheme,
  Radio,
} from '@mui/material';
import { LightMode, DarkMode, NightsStay } from '@mui/icons-material';
import { useAppTheme } from '../../contexts/ThemeContext';

/**
 * AppearanceSettings component handles theme and visual customization
 */
const AppearanceSettings: React.FC = () => {
  const { mode, setMode } = useAppTheme();
  const theme = useTheme();

  const themes = [
    { id: 'light', label: 'Light', icon: <LightMode />, desc: 'Classic bright look', color: '#F8F9FA' },
    { id: 'dark', label: 'Dark', icon: <DarkMode />, desc: 'Neutral dark grey', color: '#171717' },
    { id: 'night', label: 'Night', icon: <NightsStay />, desc: 'Deep midnight blue', color: '#0F172A' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Theme Selection */}
      <Box>
        <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 2 }}>
          App Theme
        </Typography>
        <Grid container spacing={2}>
          {themes.map((t) => (
            <Grid key={t.id} size={{ xs: 12, sm: 4 }}>
              <Card
                variant="outlined"
                onClick={() => setMode(t.id as any)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderColor: mode === t.id ? 'primary.main' : 'divider',
                  borderWidth: mode === t.id ? 2 : 1,
                  bgcolor: mode === t.id
                    ? (theme.palette.mode === 'light' ? 'rgba(48, 92, 222, 0.04)' : 'rgba(255, 255, 255, 0.03)')
                    : 'transparent',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  },
                }}
              >
                <CardContent sx={{ p: '16px !important' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: mode === t.id ? 'primary.main' : 'action.selected',
                        color: mode === t.id ? 'white' : 'text.secondary',
                        mr: 1.5
                      }}
                    >
                      {t.icon}
                    </Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {t.label}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Radio
                      checked={mode === t.id}
                      size="small"
                      sx={{ p: 0 }}
                    />
                  </Box>

                  <Box
                    sx={{
                      mt: 2,
                      height: 48,
                      borderRadius: 1,
                      bgcolor: t.color,
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      flexDirection: 'column',
                      p: 0.8,
                      gap: 0.5
                    }}
                  >
                    <Box sx={{ height: 6, width: '40%', borderRadius: 0.5, bgcolor: t.id === 'light' ? '#E5E7EB' : (t.id === 'dark' ? '#333' : '#1E293B') }} />
                    <Box sx={{ height: 6, width: '80%', borderRadius: 0.5, bgcolor: t.id === 'light' ? '#F3F4F6' : (t.id === 'dark' ? '#222' : '#334155') }} />
                    <Box sx={{ height: 12, width: '100%', borderRadius: 0.5, bgcolor: t.id === 'night' ? '#2DD4BF' : 'primary.main', mt: 'auto', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Other Visual Settings */}
      <Box>
        <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 2 }}>
          Document Customization
        </Typography>
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="invoice-template-select-label">Invoice Template</InputLabel>
                  <Select
                    labelId="invoice-template-select-label"
                    id="invoice-template-select"
                    value="modern"
                    label="Invoice Template"
                  >
                    <MenuItem value="modern">Modern Professional</MenuItem>
                    <MenuItem value="classic">Classic Corporate</MenuItem>
                    <MenuItem value="minimal">Minimal Clean</MenuItem>
                  </Select>
                  <FormHelperText>Style used for generated PDF invoices</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                    Branding Primary Color
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 40,
                        backgroundColor: theme.palette.primary.main, // Dynamic theme color
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: '1px solid rgba(0,0,0,0.1)'
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      This color will be used for your invoice headers and logos.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AppearanceSettings;
