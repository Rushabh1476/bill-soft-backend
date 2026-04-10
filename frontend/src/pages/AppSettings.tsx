import React from 'react';
import { Box } from '@mui/material';
import UserSettings from './UserSettings';

/**
 * AppSettings component - Wrapper for application-wide settings
 * This is accessed from the Admin Panel's "Admin Settings" card
 * and displays the user settings interface with admin controls
 */
const AppSettings: React.FC = () => {
    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
            <UserSettings />
        </Box>
    );
};

export default AppSettings;
