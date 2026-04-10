import React, { useMemo } from 'react';
import { Autocomplete, TextField, Box } from '@mui/material';
import stateCityData from '../../data/state_city.json';

interface StateCitySelectorProps {
  selectedState: string;
  selectedCity: string;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  errorState?: string;
  errorCity?: string;
  disabled?: boolean;
}

export const StateCitySelector: React.FC<StateCitySelectorProps> = ({
  selectedState,
  selectedCity,
  onStateChange,
  onCityChange,
  errorState,
  errorCity,
  disabled
}) => {
  // Defensive check for JSON data structure
  const data = useMemo(() => {
    return (stateCityData as any).states ? stateCityData : (stateCityData as any).default;
  }, []);

  const statesList = useMemo(() => data?.states || [], [data]);

  const states = useMemo(() => statesList.map((s: { name: string }) => s.name), [statesList]);
  
  const cities = useMemo(() => {
    const state = statesList.find((s: { name: string }) => s.name === selectedState);
    return state ? state.cities : [];
  }, [selectedState, statesList]);

  return (
    <Box sx={{ display: 'flex', gap: 2, width: '100%', flexDirection: { xs: 'column', md: 'row' } }}>
      <Autocomplete
        fullWidth
        options={states}
        value={selectedState || null}
        getOptionLabel={(option) => option || ''}
        isOptionEqualToValue={(option, value) => option === value}
        onChange={(_, newValue) => {
          onStateChange(newValue || '');
          if (newValue) {
            const stateObj = stateCityData.states.find(s => s.name === newValue);
            if (!stateObj?.cities.includes(selectedCity)) {
              onCityChange('');
            }
          } else {
            onCityChange('');
          }
        }}
        disabled={disabled}
        renderInput={(params) => (
          <TextField
            {...params}
            label="State"
            required
            error={!!errorState}
            helperText={errorState}
            placeholder="Select State"
            InputProps={{
              ...params.InputProps,
              autoComplete: 'new-password' // Disable browser autofill interference
            }}
          />
        )}
        ListboxProps={{
          style: { maxHeight: '350px' }
        }}
      />

      {/* City Selector with Global Search & Auto-State Filling */}
      <Autocomplete
        fullWidth
        options={cities}
        value={selectedCity || null}
        getOptionLabel={(option) => option || ''}
        isOptionEqualToValue={(option, value) => option === value}
        onChange={(_, newValue) => onCityChange(newValue || '')}
        disabled={disabled || !selectedState}
        renderInput={(params) => (
          <TextField
            {...params}
            label="City"
            required
            error={!!errorCity}
            helperText={errorCity}
            placeholder={selectedState ? "Select City" : "Select State First"}
            InputProps={{
              ...params.InputProps,
              autoComplete: 'new-password'
            }}
          />
        )}
        ListboxProps={{
          style: { maxHeight: '350px' }
        }}
      />
    </Box>
  );
};
