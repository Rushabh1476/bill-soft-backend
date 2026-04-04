import React, { useEffect, useState } from 'react';
import { Badge, Box, Tooltip } from '@mui/material';
import { Inventory as InventoryIcon } from '@mui/icons-material';

interface LowStockBadgeProps {
    showIcon?: boolean;
    size?: 'small' | 'medium' | 'large';
}

export const LowStockBadge: React.FC<LowStockBadgeProps> = ({ showIcon = true, size = 'medium' }) => {
    const [lowStockCount, setLowStockCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLowStockCount();
        // Refresh every 30 seconds
        const interval = setInterval(fetchLowStockCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchLowStockCount = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/inventory/alerts', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setLowStockCount(data.summary?.totalAlerts || 0);
            }
        } catch (error) {
            console.error('Failed to fetch low stock count:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || lowStockCount === 0) {
        return null;
    }

    const badgeContent = (
        <Badge
            badgeContent={lowStockCount}
            color="error"
            sx={{
                '& .MuiBadge-badge': {
                    animation: lowStockCount > 0 ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                        '0%': {
                            transform: 'scale(1)',
                            opacity: 1,
                        },
                        '50%': {
                            transform: 'scale(1.1)',
                            opacity: 0.8,
                        },
                        '100%': {
                            transform: 'scale(1)',
                            opacity: 1,
                        },
                    },
                },
            }}
        >
            {showIcon && <InventoryIcon color="error" fontSize={size} />}
        </Badge>
    );

    return (
        <Tooltip title={`${lowStockCount} product${lowStockCount > 1 ? 's' : ''} with low stock (< 10 units)`}>
            <Box
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: 1,
                    borderRadius: 1,
                    '&:hover': {
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    },
                }}
            >
                {badgeContent}
            </Box>
        </Tooltip>
    );
};

export default LowStockBadge;
