import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment, Grid } from '@mui/material';
import { Receipt as ReceiptIcon } from '@mui/icons-material';

export interface TaxDropdownProps {
    taxRate: number;
    onChange: (newRate: number) => void;
    error?: string;
}

export const commonTaxRates = [
    { label: 'No Tax (0%)', value: 0 },
    { label: 'GST Standard (18%)', value: 18 },
    { label: 'GST Reduced (12%)', value: 12 },
    { label: 'GST Lower (5%)', value: 5 },
    { label: 'IGST (18%)', value: 18 },
    { label: 'Custom Rate', value: -1 }
];

export const TaxDropdown: React.FC<TaxDropdownProps> = ({ taxRate, onChange, error }) => {
    const handleTaxRateSelect = (event: any) => {
        const value = event.target.value;
        if (value === -1) {
            // Custom rate selected, just keep current value or you can set to 0.
            // Usually, it requires checking if current value is standard, if so clear it or let user type.
            return;
        }
        onChange(Number(value));
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        onChange(value === '' ? 0 : parseFloat(value));
    };

    const handleNumberKeyDown = (e: React.KeyboardEvent) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    return (
        <Grid container spacing={1} sx={{ flexGrow: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                    <InputLabel id="tax-rate-label">Tax Rate</InputLabel>
                    <Select
                        labelId="tax-rate-label"
                        value={commonTaxRates.find(rate => rate.value === taxRate)?.value || -1}
                        onChange={handleTaxRateSelect}
                        label="Tax Rate"
                    >
                        {commonTaxRates.map((rate) => (
                            <MenuItem key={rate.value} value={rate.value}>
                                {rate.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    fullWidth
                    label="Rate (%)"
                    type="number"
                    value={taxRate || ''}
                    onChange={handleInputChange}
                    onKeyDown={handleNumberKeyDown}
                    error={Boolean(error)}
                    helperText={error}
                    inputProps={{ min: 0, max: 100, step: 0.01 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <ReceiptIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Grid>
        </Grid>
    );
};
