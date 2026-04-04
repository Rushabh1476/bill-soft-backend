/* eslint-disable */
import React, { useState } from 'react';
import { Button, Box, CircularProgress, Tooltip } from '@mui/material';
import { WhatsApp, Email } from '@mui/icons-material';
import { Bill } from '../../types/bill';
import { API_URL } from '../../config/api';

interface ShareButtonProps {
    bill: Bill;
    networkIp?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ bill, networkIp }) => {
    const [loading, setLoading] = useState(false);

    /**
     * WHATSAPP BLUE LINK HACK
     * Trigger link preview by ensuring the message is properly encoded and structured.
     */
    const handleWhatsAppShare = () => {
        // FORCEFUL: Use the specific requested IP
        const targetIp = '192.168.31.132';
        const port = window.location.port || '3000';
        const shareUrl = `http://${targetIp}:${port}/share/invoice/${bill.id}`;

        const billIdShort = bill.billNumber || bill.id.slice(0, 8);

        // WhatsApp Hack: Message starts with URL to force blue link status
        const rawMessage = `${shareUrl} \n\nHello, your Invoice ${billIdShort} is ready. Click here to view it.`;

        // Encode the entire thing strictly
        const encodedMessage = encodeURIComponent(rawMessage);
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
    };

    /**
     * GMAIL / EMAIL ATTACHMENT FIX
     * Sends bill to backend which generates and attaches PDF
     */
    const handleEmailShare = async () => {
        if (!bill) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            // Note: Using the authenticated endpoint for sending, 
            // but the link inside the email points to the public share route.
            const res = await fetch(`${API_URL}/bills/share/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ billId: bill.id })
            });

            const data = await res.json();
            setLoading(false);

            if (res.ok) {
                alert('Success! Invoice PDF has been sent to ' + (bill.customerEmail || 'customer'));
                if (data.previewUrl) {
                    // Open Ethereal preview for immediate local verification
                    window.open(data.previewUrl, '_blank');
                }
            } else {
                alert('Email Error: ' + (data.error || 'Check server logs'));
            }
        } catch (error) {
            setLoading(false);
            console.error('Email caught error:', error);
            alert('CRITICAL: Server is unreachable or SMTP failed.');
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Share on WhatsApp (Blue Link Hack)">
                <Button
                    variant="contained"
                    startIcon={<WhatsApp />}
                    onClick={handleWhatsAppShare}
                    sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#128C7E' } }}
                >
                    WhatsApp
                </Button>
            </Tooltip>

            <Tooltip title="Send PDF via Gmail">
                <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Email />}
                    onClick={handleEmailShare}
                    disabled={loading}
                    sx={{ bgcolor: '#EA4335', '&:hover': { bgcolor: '#C5221F' } }}
                >
                    {loading ? 'Sending...' : 'Email PDF'}
                </Button>
            </Tooltip>
        </Box>
    );
};

export default ShareButton;
