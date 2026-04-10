import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button, Paper } from '@mui/material';
import { Download, Print } from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Bill } from '../types/bill';
import { API_URL } from '../config/api';
import BillTemplateRenderer from '../modules/billing-templates/BillTemplateRenderer';
import { MOCK_TEMPLATES } from '../modules/billing-templates/core';

const PublicInvoice: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [bill, setBill] = useState<Bill | null>(null);
    const [preferences, setPreferences] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const componentRef = useRef(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: bill ? `Invoice-${bill.billNumber || bill.id}` : 'Invoice',
    });

    useEffect(() => {
        const fetchPublicBill = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const res = await fetch(`${API_URL}/public-share/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setBill(data.bill);
                    setPreferences(data.preferences);
                } else {
                    setError("Invoice not found or invalid link.");
                }
            } catch (err) {
                console.error("Error fetching public invoice:", err);
                setError("Failed to load the invoice.");
            } finally {
                setLoading(false);
            }
        };

        fetchPublicBill();
    }, [id]);

    const handleDownload = async () => {
        if (!componentRef.current) return;
        try {
            setLoading(true);
            const canvas = await html2canvas(componentRef.current, {
                scale: 2,
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

            const a4Height = pdf.internal.pageSize.getHeight();
            let finalWidth = pdfWidth;
            let finalHeight = pdfHeight;

            if (pdfHeight > a4Height) {
                finalHeight = a4Height;
                finalWidth = (imgProps.width * finalHeight) / imgProps.height;
            }

            const xOffset = (pdfWidth - finalWidth) / 2;

            pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);
            pdf.save(`Invoice-${bill?.billNumber || 'Downloaded'}.pdf`);
            setLoading(false);
        } catch (err) {
            console.error('Download failed:', err);
            setLoading(false);
            alert('Failed to download PDF.');
        }
    };

    const getTemplatesWithOverrides = (): any[] => {
        try {
            const raw = localStorage.getItem('billsoft_template_overrides');
            const overrides: Record<string, { settings?: any; fields?: any }> = raw ? JSON.parse(raw) : {};
            const defaultId = localStorage.getItem('billsoft_default_template_id');
            return MOCK_TEMPLATES.map(t => {
                const o = overrides[t.id];
                const template = { ...t };
                if (defaultId) {
                    template.isDefault = t.id === defaultId;
                }
                if (!o) return template;
                return {
                    ...template,
                    ...(o.settings ? { settings: { ...t.settings, ...o.settings } } : {}),
                    ...(o.fields   ? { fields: o.fields } : {}),
                };
            });
        } catch {
            return MOCK_TEMPLATES;
        }
    };
    
    // Default template or the one from bill.templateId
    const mergedTemplates = useMemo(() => getTemplatesWithOverrides(), []);
    const template = mergedTemplates.find(t => t.id === bill?.templateId) || mergedTemplates.find(t => t.isDefault) || mergedTemplates[0];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f4f6f8' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !bill) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f4f6f8' }}>
                <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
                    <Typography variant="h5" color="error" gutterBottom>Oops!</Typography>
                    <Typography color="text.secondary">{error || 'Unable to display invoice'}</Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8', py: 4, px: 2 }}>
            <Box sx={{ maxWidth: 900, mx: 'auto', mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" fontWeight="bold" color="primary">BillSoft Invoice</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Print />}
                        onClick={handlePrint}
                        sx={{ bgcolor: 'white' }}
                    >
                        Print
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Download />}
                        onClick={handleDownload}
                    >
                        Download PDF
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ maxWidth: 900, mx: 'auto', overflow: 'hidden', boxShadow: 3 }}>
                <Box
                    ref={componentRef}
                    id="printable-public-invoice"
                    sx={{
                        width: '100%',
                        overflowX: 'auto',
                        p: 2,
                        '@media print': { m: 0, p: 0, overflow: 'hidden' }
                    }}
                >
                    <BillTemplateRenderer template={template} bill={bill} preferences={preferences} />
                </Box>
            </Paper>
        </Box>
    );
};

export default PublicInvoice;
