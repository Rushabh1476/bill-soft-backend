import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
} from '@mui/material';
import TaxSettings from './TaxSettings';
import ColumnSettings from './ColumnSettings';

/**
 * InvoiceSettings component
 * Business-grade UI with clean spacing & hierarchy
 * Logic untouched – UI polished only
 */
const InvoiceSettings: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        maxWidth: 900,
      }}
    >
      {/* ================= TAX CONFIGURATION ================= */}
      <Card elevation={2}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{ letterSpacing: 0.3 }}
              >
                Tax Configuration
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Manage tax rules applied to invoices
              </Typography>
            </Box>

            <Divider />

            <TaxSettings />
          </Stack>
        </CardContent>
      </Card>

      {/* ================= INVOICE COLUMNS ================= */}
      <Card elevation={2}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{ letterSpacing: 0.3 }}
              >
                Invoice Columns
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Control which fields appear on invoices
              </Typography>
            </Box>

            <Divider />

            <ColumnSettings />
          </Stack>
        </CardContent>
      </Card>

      {/* ================= INVOICE PREFERENCES ================= */}
      <Card elevation={2}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{ letterSpacing: 0.3 }}
              >
                Invoice Preferences
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Default behavior and automation options
              </Typography>
            </Box>

            <Divider />

            <Stack spacing={1.5}>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label={
                  <Typography fontSize={14}>
                    Auto-generate invoice numbers
                  </Typography>
                }
              />

              <FormControlLabel
                control={<Switch defaultChecked />}
                label={
                  <Typography fontSize={14}>
                    Include company logo on invoices
                  </Typography>
                }
              />

              <FormControlLabel
                control={<Switch />}
                label={
                  <Typography fontSize={14}>
                    Send email notifications for new invoices
                  </Typography>
                }
              />

              <FormControlLabel
                control={<Switch defaultChecked />}
                label={
                  <Typography fontSize={14}>
                    Show payment terms on invoices
                  </Typography>
                }
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InvoiceSettings;
