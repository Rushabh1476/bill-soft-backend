/* eslint-disable */
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    CircularProgress,
    IconButton,
    Chip,
    Card,
    Dialog,
    DialogTitle,
    DialogContent,
    CardActionArea,
    CardContent,
    DialogActions,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { ArrowBack, Download, Delete, Print, Email, Settings as SettingsIcon, WhatsApp, Close as CloseIcon, Edit as EditIcon } from '@mui/icons-material';
import { useBills } from '../hooks/useBills';
import { useSettingsContext } from '../contexts/SettingsContext';
import { Bill } from '../types/bill';
import { MOCK_TEMPLATES, InvoiceTemplate } from '../modules/billing-templates/core';
import { MOCK_TEMPLATES as CORE_MOCK_TEMPLATES } from '../modules/billing-templates/core/mockData';
import BillTemplateRenderer from '../modules/billing-templates/BillTemplateRenderer';
import { shareOnWhatsApp } from '../utils/exportUtils';
import { API_URL } from '../config/api';

const ViewBill: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { bills, deleteBill, refetch } = useBills();
    const { templateOverrides, appearanceSettings } = useSettingsContext();
    const [bill, setBill] = useState<Bill | null>(null);
    const [loading, setLoading] = useState(true);
    
    // ─── Direct Context-Driven Template Sync ───────────────
    const mergedTemplates = useMemo(() => {
        return MOCK_TEMPLATES.map(t => {
            const sizeKey = `${t.id}:${appearanceSettings.defaultBillSize || 'A4'}`;
            const o = templateOverrides[sizeKey] || templateOverrides[t.id];
            
            const template = { ...t };
            template.isDefault = t.id === (appearanceSettings.activeTemplateId || 'default');
            
            if (!o) return template;
            return {
                ...template,
                ...(o.settings ? { settings: { ...t.settings, ...o.settings } } : {}),
                ...(o.fields   ? { fields: o.fields } : {}),
            };
        });
    }, [templateOverrides, appearanceSettings]);

    // Default to the template specified in the bill, or default from settings
    const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate>(mergedTemplates[0]);
    // ─────────────────────────────────────────────────────────────────────────
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
    const [networkIp, setNetworkIp] = useState<string>('');

    const componentRef = useRef(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: bill ? `Invoice-${bill.billNumber || bill.id}` : 'Invoice',
        onAfterPrint: () => console.log('Print finished'),
    });

    useEffect(() => {
        // Fetch network IP for local remote sharing
        fetch(`${API_URL}/system/network-ip`)
            .then(res => res.json())
            .then(data => setNetworkIp(data.ip))
            .catch(err => console.error("Error fetching network IP:", err));
    }, []);

    useEffect(() => {
        const loadDefaultTemplate = async () => {
             try {
                 const { templateAPI } = await import('../services/api');
                 const res = await templateAPI.fetchSettings('invoice', 'default_template');
                 if (res.success && res.data) {
                     const defaultTmpl = CORE_MOCK_TEMPLATES.find(t => t.id === res.data);
                     if (defaultTmpl) {
                         setSelectedTemplate(defaultTmpl);
                     }
                 }
             } catch (err) {
                 console.error("Error loading default template:", err);
             }
        };

        const fetchBill = async () => {
            if (!id) return;
            
            // 1. Initial template load
            loadDefaultTemplate();

            // 2. Check if we already have it in the bills list
            const foundBill = bills.find(b => b.id === id || b.billNumber === id);

            // 3. If found and has items, use it
            if (foundBill && (foundBill as any).items) {
                setBill(foundBill);
                setLoading(false);
                return;
            }

            // 4. Otherwise fetch from API
            try {
                setLoading(true);
                const token = localStorage.getItem('authToken');
                const res = await fetch(`${API_URL}/bills/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setBill(data.bill);
                } else {
                    console.error("Failed to fetch bill by ID");
                }
            } catch (err) {
                console.error("Error fetching bill details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBill();
    }, [id, bills]);

    useEffect(() => {
        if (bill) {
            const found = mergedTemplates.find(t => t.id === bill.templateId) || mergedTemplates.find(t => t.isDefault) || mergedTemplates[0];
            setSelectedTemplate(found);
        }
    }, [bill, mergedTemplates]);

    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get('autoDownload') === 'true' && bill && !loading) {
            // Short delay to ensure rendering is complete
            const timer = setTimeout(() => {
                handleDownload();
                // Remove the query param so it doesn't redownload on refresh
                navigate(location.pathname, { replace: true });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [location.search, bill, loading]);

    const handleDelete = async () => {
        if (!bill) return;
        if (window.confirm('Are you sure you want to delete this bill? This cannot be undone.')) {
            await deleteBill(bill.id);
            navigate('/bills');
        }
    };

    const handleDownload = async () => {
        if (!componentRef.current) return;

        try {
            setLoading(true);
            const element = componentRef.current;

            // Capture the element
            const canvas = await html2canvas(element, {
                scale: 2, // High resolution
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // To ensure it fits on ONE page, we scale it to A4 height if it's too long
            const a4Height = pdf.internal.pageSize.getHeight();
            let finalWidth = pdfWidth;
            let finalHeight = pdfHeight;

            if (pdfHeight > a4Height) {
                finalHeight = a4Height;
                finalWidth = (imgProps.width * finalHeight) / imgProps.height;
            }

            // Center horizontally if scaled down
            const xOffset = (pdfWidth - finalWidth) / 2;

            pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);
            pdf.save(`Invoice-${bill?.billNumber || 'Downloaded'}.pdf`);
            setLoading(false);
        } catch (err) {
            console.error('Download failed:', err);
            setLoading(false);
            alert('Failed to download PDF. Please try Print -> Save as PDF.');
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `Invoice ${bill?.billNumber}`,
                text: `Check out invoice ${bill?.billNumber} from ${bill?.customerName}`,
                url: window.location.href,
            })
                .catch((error) => console.log('Error sharing', error));
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!bill) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5" color="error" gutterBottom>Bill not found</Typography>
                <Button startIcon={<ArrowBack />} onClick={() => navigate('/bills')}>
                    Back to Bills
                </Button>
            </Box>
        );
    }

    const handleWhatsAppShare = async () => {
        if (!bill) return;
        shareOnWhatsApp(bill, networkIp);
    };

    const handleEmailShare = async () => {
        if (!bill) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/bills/share/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ billId: bill.id })
            });

            const data = await res.json();
            setLoading(false);

            if (res.ok) {
                alert('Email sent successfully with PDF Attachment!');
                if (data.previewUrl) {
                    // Open the test Ethereal message to view email format instantly
                    window.open(data.previewUrl, '_blank');
                }
            } else {
                alert(data.error || 'Failed to send email');
            }
        } catch (error) {
            setLoading(false);
            console.error(error);
            alert('Failed to send email');
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
            {/* Header Actions */}
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                mb: 4,
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 2
            }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/bills')}
                    variant="outlined"
                    fullWidth={isMobile}
                    sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, borderRadius: 2 }}
                >
                    Back to Bills
                </Button>

                <Box sx={{
                    display: 'flex',
                    gap: 1.5,
                    flexWrap: 'wrap',
                    justifyContent: { xs: 'center', sm: 'flex-end' }
                }}>
                    <Button
                        startIcon={<EditIcon />}
                        variant="contained"
                        color="secondary"
                        onClick={() => navigate('/bills', { state: { triggerEditId: bill.id } })}
                        sx={{ borderRadius: 2, flexGrow: { xs: 1, sm: 0 }, minWidth: { xs: '45%', sm: 'auto' } }}
                    >
                        Edit Invoice
                    </Button>
                    <Button
                        startIcon={<SettingsIcon />}
                        variant="contained"
                        onClick={() => setTemplateDialogOpen(true)}
                        sx={{ borderRadius: 2, flexGrow: { xs: 1, sm: 0 }, minWidth: { xs: '45%', sm: 'auto' } }}
                    >
                        Template
                    </Button>
                    <Button
                        startIcon={<WhatsApp />}
                        variant="contained"
                        color="success"
                        onClick={handleWhatsAppShare}
                        sx={{ borderRadius: 2, flexGrow: { xs: 1, sm: 0 }, minWidth: { xs: '45%', sm: 'auto' } }}
                    >
                        WhatsApp
                    </Button>
                    <Button
                        startIcon={<Email />}
                        variant="contained"
                        color="primary"
                        onClick={handleEmailShare}
                        sx={{ borderRadius: 2, flexGrow: { xs: 1, sm: 0 }, minWidth: { xs: '45%', sm: 'auto' } }}
                    >
                        Send Email
                    </Button>
                    <Button
                        startIcon={<Print />}
                        variant="outlined"
                        onClick={handlePrint}
                        sx={{ borderRadius: 2, flexGrow: { xs: 1, sm: 0 }, minWidth: { xs: '45%', sm: 'auto' } }}
                    >
                        Print
                    </Button>
                    <Button
                        startIcon={<Download />}
                        variant="outlined"
                        onClick={handleDownload}
                        sx={{ borderRadius: 2, flexGrow: { xs: 1, sm: 0 }, minWidth: { xs: '45%', sm: 'auto' } }}
                    >
                        PDF
                    </Button>
                    <Button
                        startIcon={<Delete />}
                        color="error"
                        variant="outlined"
                        onClick={handleDelete}
                        sx={{ borderRadius: 2, flexGrow: { xs: 1, sm: 0 }, minWidth: { xs: '100%', sm: 'auto' } }}
                    >
                        Delete Invoice
                    </Button>
                </Box>
            </Box>

            {/* Template Selector Dialog */}
            <Dialog
                open={templateDialogOpen}
                onClose={() => setTemplateDialogOpen(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 3,
                        backgroundImage: 'none' // Remove MUI dark mode elevation overlay
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Select Invoice Template
                    {isMobile && (
                        <IconButton onClick={() => setTemplateDialogOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    )}
                </DialogTitle>
                <DialogContent dividers={isMobile}>
                    <Grid container spacing={2.5} sx={{ pt: isMobile ? 0 : 1 }}>
                        {mergedTemplates.map((tmpl) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tmpl.id}>
                                <Card
                                    sx={{
                                        border: selectedTemplate.id === tmpl.id ? '2px solid' : '1px solid',
                                        borderColor: selectedTemplate.id === tmpl.id ? 'primary.main' : 'divider',
                                        boxShadow: selectedTemplate.id === tmpl.id ? 4 : 1,
                                        transition: 'all 0.2s',
                                        borderRadius: 3
                                    }}
                                >
                                    <CardActionArea onClick={() => {
                                        setSelectedTemplate(tmpl);
                                        setTemplateDialogOpen(false);
                                    }}>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Typography variant="h6" fontWeight="bold" gutterBottom>{tmpl.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {tmpl.description}
                                            </Typography>
                                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                                {selectedTemplate.id === tmpl.id ? (
                                                    <Chip label="Selected" size="small" color="primary" />
                                                ) : (
                                                    <Typography variant="caption" color="primary">Select Template</Typography>
                                                )}
                                            </Box>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                {isMobile && (
                    <DialogActions sx={{ p: 2 }}>
                        <Button fullWidth variant="outlined" onClick={() => setTemplateDialogOpen(false)}>Close</Button>
                    </DialogActions>
                )}
            </Dialog>

            {/* Display Invoice Container */}
            <Box
                sx={{
                    width: '100%',
                    overflowX: 'auto',
                    py: { xs: 2, md: 4 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    bgcolor: isMobile ? 'background.default' : 'transparent'
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        p: { xs: 1, sm: 2 }
                    }}
                >
                    <Box
                        ref={componentRef}
                        id="printable-invoice"
                        sx={{
                            backgroundColor: 'white',
                            borderRadius: { xs: 1, md: 0 },
                            boxShadow: isMobile ? 3 : 'none',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transform: isMobile ? `scale(${Math.min(1, (window.innerWidth - 32) / 800)})` : 'none',
                            transformOrigin: 'top center',
                            minWidth: selectedTemplate.id === 'thermal' ? '80mm' : '210mm',
                            maxWidth: selectedTemplate.id === 'thermal' ? '80mm' : '100%',
                            height: 'auto',
                            mb: isMobile ? -20 : 0, 
                            '@media print': {
                                width: (selectedTemplate.id === 'thermal' ? '80mm' : '210mm') + ' !important',
                                height: 'auto',
                                overflow: 'visible',
                                p: 0,
                                m: 0,
                                transform: 'none !important',
                                boxShadow: 'none'
                            }
                        }}
                    >
                        <BillTemplateRenderer template={selectedTemplate} bill={bill} />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default ViewBill;
