import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    Typography,
    TextField,
    Button,
    Box,
    Avatar,
} from '@mui/material';
import { Shield as ShieldIcon } from '@mui/icons-material';

interface SecureActionDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    actionLabel?: string;
}

const SecureActionDialog: React.FC<SecureActionDialogProps> = ({
    open,
    onClose,
    onConfirm,
    title = "Confirm Secure Action",
    message = "Please enter your security PIN to perform this critical action.",
    actionLabel = "Confirm Action"
}) => {
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);

    // Reset state every time the dialog opens or closes
    useEffect(() => {
        if (open) {
            console.log('[SecureActionDialog] Secure check triggered — waiting for PIN.');
        }
        setPin('');
        setPinError(false);
    }, [open]);

    const handleClose = () => {
        console.log('[SecureActionDialog] Dialog cancelled — action blocked.');
        setPin('');
        setPinError(false);
        onClose();
    };

    const handleConfirm = () => {
        const savedPin = localStorage.getItem('appLockPin') || '';

        if (!savedPin) {
            console.warn('[SecureActionDialog] No security PIN configured. Action blocked.');
            setPinError(true);
            return;
        }

        if (pin === savedPin) {
            console.log('[SecureActionDialog] PIN verified — executing secured action.');
            setPinError(false);
            setPin('');
            onConfirm();
        } else {
            console.warn('[SecureActionDialog] Incorrect PIN — action blocked.');
            setPinError(true);
            setPin('');
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            disableEscapeKeyDown={false}
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    p: 2,
                    textAlign: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    minWidth: 320,
                    maxWidth: 380,
                }
            }}
            sx={{
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(0,0,0,0.4)',
            }}
        >
            <DialogContent
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    py: 4,
                }}
            >
                {/* Icon — matches App Lock avatar style */}
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', mb: 1 }}>
                    <ShieldIcon fontSize="large" />
                </Avatar>

                {/* Title & Message */}
                <Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {message}
                    </Typography>
                </Box>

                {/* Hidden decoy field to prevent browser from auto-filling the search box behind the dialog as a 'username' field */}
                <input type="text" name="username" style={{ display: 'none' }} autoComplete="username" />

                {/* PIN input — exact same style as App Lock */}
                <TextField
                    autoFocus
                    type="password"
                    label="Enter PIN"
                    variant="outlined"
                    autoComplete="new-password"
                    name="security-pin-input"
                    value={pin}
                    onChange={(e) => {
                        setPin(e.target.value);
                        setPinError(false);
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
                    error={pinError}
                    helperText={
                        pinError
                            ? (localStorage.getItem('appLockPin')
                                ? 'Incorrect PIN'
                                : 'No PIN configured. Go to Settings → Privacy.')
                            : ''
                    }
                    inputProps={{
                        style: {
                            textAlign: 'center',
                            fontSize: '1.5rem',
                            letterSpacing: '0.5rem',
                        },
                        maxLength: 6,
                        autoComplete: 'new-password'
                    }}
                    sx={{ width: 220 }}
                />

                {/* Confirm button — fullWidth, large, same style as "Unlock Application" */}
                <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleConfirm}
                    disabled={pin.length === 0}
                    sx={{ borderRadius: 2, py: 1.5, fontWeight: 'bold' }}
                >
                    {actionLabel}
                </Button>

                {/* Cancel link — matches "Switch Account" style */}
                <Button variant="text" color="inherit" onClick={handleClose}>
                    Cancel
                </Button>
            </DialogContent>
        </Dialog>
    );
};

export default SecureActionDialog;
