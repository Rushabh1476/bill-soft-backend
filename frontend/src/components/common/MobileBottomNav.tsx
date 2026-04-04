import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Dashboard, Receipt, Inventory, Person } from '@mui/icons-material';

const MobileBottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine value based on path
    const getValue = () => {
        const path = location.pathname;
        if (path === '/' || path === '/dashboard') return 0;
        if (path.startsWith('/bills')) return 1;
        if (path.startsWith('/products') || path.startsWith('/inventory')) return 2;
        if (path.startsWith('/profile') || path.startsWith('/customers')) return 3;
        return 0;
    };

    return (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
            <BottomNavigation
                showLabels
                value={getValue()}
                onChange={(event, newValue) => {
                    switch (newValue) {
                        case 0: navigate('/dashboard'); break;
                        case 1: navigate('/bills'); break;
                        case 2: navigate('/products'); break;
                        case 3: navigate('/customers'); break;
                    }
                }}
            >
                <BottomNavigationAction label="Home" icon={<Dashboard />} />
                <BottomNavigationAction label="Bills" icon={<Receipt />} />
                <BottomNavigationAction label="Stock" icon={<Inventory />} />
                <BottomNavigationAction label="Customers" icon={<Person />} />
            </BottomNavigation>
        </Paper>
    );
};

export default MobileBottomNav;
