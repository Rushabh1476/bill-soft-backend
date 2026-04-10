
import React, { useState, useEffect } from 'react';
import {
    Button,
    Menu,
    MenuItem,
    Typography,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import { Store as StoreIcon, Check as CheckIcon, ArrowDropDown } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Branch {
    id: string;
    name: string;
}

const BranchSwitcher: React.FC = () => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

    useEffect(() => {
        // Fetch branches from API
        // For now, mock it or try-fetch
        const fetchBranches = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const res = await fetch('/api/admin/branches', { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) {
                    const data = await res.json();
                    setBranches(data.branches || []);
                    if (data.branches && data.branches.length > 0) {
                        // Need logic to strictly select current branch, but for now select first
                        setSelectedBranch(data.branches[0]);
                    } else {
                        setBranches([{ id: 'main', name: 'Main Branch' }]);
                        setSelectedBranch({ id: 'main', name: 'Main Branch' });
                    }
                } else {
                    setBranches([{ id: 'main', name: 'Main Branch' }]);
                    setSelectedBranch({ id: 'main', name: 'Main Branch' });
                }
            } catch {
                setBranches([{ id: 'main', name: 'Main Branch' }]);
                setSelectedBranch({ id: 'main', name: 'Main Branch' });
            }
        };
        fetchBranches();
    }, []);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSelect = (branch: Branch) => {
        setSelectedBranch(branch);
        // Ideally update global context or localStorage
        localStorage.setItem('currentBranchId', branch.id);
        handleClose();
    };

    if (!selectedBranch) return null;

    return (
        <>
            <Button
                color="inherit"
                onClick={handleClick}
                startIcon={<StoreIcon />}
                endIcon={<ArrowDropDown />}
                sx={{
                    textTransform: 'none',
                    borderColor: 'divider',
                    border: '1px solid',
                    borderRadius: 2,
                    height: 32,
                    px: 2
                }}
            >
                <Typography variant="body2" fontWeight="medium">
                    {selectedBranch.name}
                </Typography>
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                {branches.map((branch) => (
                    <MenuItem key={branch.id} onClick={() => handleSelect(branch)}>
                        <ListItemIcon>
                            <StoreIcon fontSize="small" color={selectedBranch.id === branch.id ? 'primary' : 'action'} />
                        </ListItemIcon>
                        <ListItemText primary={branch.name} />
                        {selectedBranch.id === branch.id && (
                            <CheckIcon fontSize="small" color="primary" sx={{ ml: 2 }} />
                        )}
                    </MenuItem>
                ))}
                <Divider />
                <MenuItem onClick={() => {
                    handleClose();
                    navigate('/admin/settings');
                }}>
                    <Typography variant="caption">Manage Branches (Admin)</Typography>
                </MenuItem>
            </Menu>
        </>
    );
};

export default BranchSwitcher;
