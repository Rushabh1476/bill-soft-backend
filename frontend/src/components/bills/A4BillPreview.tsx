import React, { forwardRef, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Button
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { resolveFileUrl } from '../../utils/url';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BillPreview, TemplateComplexity } from '../../types/billTemplate';

interface A4BillPreviewProps {
  billData: BillPreview;
  templateComplexity: TemplateComplexity;
  showControls?: boolean;
  onDownload?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
}

const A4BillPreview = forwardRef<HTMLDivElement, A4BillPreviewProps>(({
  billData,
  templateComplexity,
  showControls = true,
  onDownload,
  onPrint,
  onShare
}, ref) => {
  const { user: currentUser } = useAuth();
  const previewRef = React.useRef<HTMLDivElement>(null);
  const [logoLoaded, setLogoLoaded] = React.useState(false);
  const [logoError, setLogoError] = React.useState(false);
  const [preferences, setPreferences] = React.useState<any>({
    autoGenerateInvoiceNumbers: true,
    showLogo: true,
    includeTaxBreakdown: true,
    showPaymentTerms: true,
    sendEmailNotifications: true,
    requireApproval: false
  });

  // Fetch preferences on mount to ensure live settings are applied
  React.useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const { default: axios } = await import('axios');
        const { API_URL } = await import('../../config/api');
        const token = localStorage.getItem('authToken');

        const res = await axios.get(`${API_URL}/admin/settings/invoice-preferences`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success && res.data.data) {
          console.log(' Current Settings Received in Preview:', res.data.data);
          const s = res.data.data;
          setPreferences({
            autoGenerateInvoiceNumbers: s.autoGenerateInvoiceNumbers ?? true,
            showLogo: s.showLogo ?? true,
            includeTaxBreakdown: s.includeTaxBreakdown ?? true,
            showPaymentTerms: s.showPaymentTerms ?? true,
            sendEmailNotifications: s.sendEmailNotifications ?? true,
            requireApproval: s.requireApproval ?? false
          });
        } else {
          console.warn(' Settings fetch returned no data, using local defaults');
        }
      } catch (err) {
        console.error(' Failed to fetch preferences:', err);
      }
    };
    fetchPrefs();
  }, []);

  // Use the owner from the bill if available
  const ownerUser = (billData as any)?.user || currentUser;

  const logoUrl = ownerUser?.logoUrl;
  const userLogoPosition = ownerUser?.logoPosition || 'left';
  const logoWidth = (ownerUser as any)?.logoWidth || 100;
  const logoOffsetX = (ownerUser as any)?.logoOffsetX || 0;
  const logoOffsetY = (ownerUser as any)?.logoOffsetY || 0;

  const processedLogoUrl = logoUrl ? resolveFileUrl(logoUrl) : null;

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;

    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`invoice-${billData.invoiceDetails.invoiceNumber}.pdf`);

      if (onDownload) onDownload();
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handlePrint = () => {
    if (!previewRef.current) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${billData.invoiceDetails.invoiceNumber}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              @media print { body { margin: 0; } }
              @page { size: A4; margin: 0.5in; }
            </style>
          </head>
          <body>
            ${previewRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }

    if (onPrint) onPrint();
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getTemplateStyles = () => {
    switch (templateComplexity) {
      case TemplateComplexity.EASY:
        return {
          headerBg: '#f5f5f5',
          accentColor: '#1976d2',
          fontFamily: 'Arial, sans-serif'
        };
      case TemplateComplexity.BETTER:
        return {
          headerBg: '#e3f2fd',
          accentColor: '#1565c0',
          fontFamily: 'Roboto, sans-serif'
        };
      case TemplateComplexity.COMPLEX:
        return {
          headerBg: '#e8f5e8',
          accentColor: '#2e7d32',
          fontFamily: 'Open Sans, sans-serif'
        };
      case TemplateComplexity.DETAILED:
        return {
          headerBg: '#fff3e0',
          accentColor: '#f57c00',
          fontFamily: 'Lato, sans-serif'
        };
      default:
        return {
          headerBg: '#f5f5f5',
          accentColor: '#1976d2',
          fontFamily: 'Arial, sans-serif'
        };
    }
  };

  const styles = getTemplateStyles();

  return (
    <Box>
      {showControls && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            size="small"
          >
            Print
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={onShare}
            size="small"
          >
            Share
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPDF}
            size="small"
          >
            Download PDF
          </Button>
        </Box>
      )}

      <Paper
        ref={ref || previewRef}
        elevation={3}
        sx={{
          width: '210mm',
          minHeight: '297mm',
          maxWidth: '100%',
          margin: '0 auto',
          padding: '20mm',
          backgroundColor: 'white',
          fontFamily: styles.fontFamily,
          fontSize: '10pt',
          lineHeight: 1.4,
          boxSizing: 'border-box',
          '@media print': {
            boxShadow: 'none',
            margin: 0,
            width: '210mm',
            height: '297mm'
          }
        }}
      >
        {/* Header Section */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 4,
          pb: 1,
          borderBottom: `1px solid ${styles.accentColor}20`
        }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 'bold',
              color: '#1A1A1A',
              letterSpacing: '4px',
              fontSize: '2.5rem',
              textTransform: 'uppercase'
            }}
          >
            INVOICE
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          {/* Company Branding & Info */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 3,
            flexDirection: userLogoPosition === 'right' ? 'row-reverse' : 'row'
          }}>
            {/* Logo/Branding */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: userLogoPosition === 'center' ? 'center' : (userLogoPosition === 'right' ? 'flex-end' : 'flex-start'),
              textAlign: userLogoPosition === 'center' ? 'center' : (userLogoPosition === 'right' ? 'right' : 'left'),
              flex: 1
            }}>
              {preferences.showLogo && (processedLogoUrl && !logoError) ? (
                <Box sx={{
                  mb: 2,
                  marginTop: `${logoOffsetY}px`,
                  marginLeft: userLogoPosition === 'left' ? `${logoOffsetX}px` : 0,
                  marginRight: userLogoPosition === 'right' ? `${logoOffsetX}px` : 0,
                  width: `${logoWidth}px`,
                  maxWidth: '100%'
                }}>
                  <img
                    src={processedLogoUrl}
                    alt="Company Logo"
                    onLoad={() => setLogoLoaded(true)}
                    onError={() => setLogoError(true)}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      opacity: logoLoaded ? 1 : 0.5
                    }}
                  />
                </Box>
              ) : (
                !preferences.showLogo ? null : (
                  <Box sx={{
                    width: 50,
                    height: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#eeeeee',
                    color: '#666666',
                    borderRadius: '1',
                    mb: 2,
                    mt: `${logoOffsetY}px`,
                    ml: userLogoPosition === 'left' ? `${logoOffsetX}px` : 0
                  }}>
                    <Typography variant="h5" fontWeight="bold">
                      {billData.companyInfo.name ? billData.companyInfo.name.charAt(0).toUpperCase() : 'B'}
                    </Typography>
                  </Box>
                )
              )}
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: styles.accentColor, mb: 1 }}>
                {billData.companyInfo.name}
              </Typography>
              <Typography variant="body2">{billData.companyInfo.address}</Typography>
              <Typography variant="body2">
                Phone: {billData.companyInfo.phone} | Email: {billData.companyInfo.email}
              </Typography>
              {billData.companyInfo.taxId && (
                <Typography variant="body2">Tax ID: {billData.companyInfo.taxId}</Typography>
              )}
            </Box>

            {/* Invoice Meta Details */}
            <Box sx={{
              textAlign: 'right',
              bgcolor: styles.headerBg,
              p: 2,
              borderRadius: 1,
              minWidth: '200px'
            }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Invoice #: {billData.invoiceDetails.invoiceNumber}
              </Typography>
              <Typography variant="body2">
                Date: {new Date(billData.invoiceDetails.invoiceDate).toLocaleDateString()}
              </Typography>
              {billData.invoiceDetails.dueDate && (
                <Typography variant="body2">
                  Due Date: {new Date(billData.invoiceDetails.dueDate).toLocaleDateString()}
                </Typography>
              )}
              {billData.invoiceDetails.poNumber && (
                <Typography variant="body2">
                  PO: {billData.invoiceDetails.poNumber}
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 3, borderColor: styles.accentColor, borderWidth: 1, opacity: 0.3 }} />

          {/* Customer (Bill To) */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: styles.accentColor, textTransform: 'uppercase' }}>
              Bill To:
            </Typography>
            <Box sx={{ p: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{billData.customerInfo.name}</Typography>
              <Typography variant="body2">{billData.customerInfo.address}</Typography>
              <Typography variant="body2">
                {billData.customerInfo.phone && `Phone: ${billData.customerInfo.phone}`}
                {billData.customerInfo.email && ` | Email: ${billData.customerInfo.email}`}
              </Typography>
              {billData.customerInfo.taxId && (
                <Typography variant="body2">Tax ID: {billData.customerInfo.taxId}</Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Items Table */}
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: styles.accentColor }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Qty</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Rate</TableCell>
                {templateComplexity !== TemplateComplexity.EASY && preferences.includeTaxBreakdown && (
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Tax</TableCell>
                )}
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {billData.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{item.description}</Typography>
                    {item.category && (
                      <Typography variant="caption" color="text.secondary">({item.category})</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">{item.quantity} {item.unit || ''}</TableCell>
                  <TableCell align="right">{formatCurrency(item.rate, billData.invoiceDetails.currency)}</TableCell>
                  {templateComplexity !== TemplateComplexity.EASY && preferences.includeTaxBreakdown && (
                    <TableCell align="right">{item.taxRate ? `${item.taxRate}%` : '0%'}</TableCell>
                  )}
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(item.amount, billData.invoiceDetails.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Financial Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
          <Box sx={{ minWidth: '250px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2">{formatCurrency(billData.calculations.subtotal, billData.invoiceDetails.currency)}</Typography>
            </Box>
            {billData.calculations.discountAmount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, color: 'error.main' }}>
                <Typography variant="body2">Discount:</Typography>
                <Typography variant="body2">-{formatCurrency(billData.calculations.discountAmount, billData.invoiceDetails.currency)}</Typography>
              </Box>
            )}
            {billData.calculations.taxAmount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2">Tax:</Typography>
                <Typography variant="body2">{formatCurrency(billData.calculations.taxAmount, billData.invoiceDetails.currency)}</Typography>
              </Box>
            )}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              py: 1,
              mt: 1,
              borderTop: `2px solid ${styles.accentColor}`,
              color: styles.accentColor
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Total Amount:</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(billData.calculations.totalAmount, billData.invoiceDetails.currency)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Footer Info */}
        <Box sx={{ mt: 'auto' }}>
          {(billData.additionalInfo.notes || (preferences.showPaymentTerms && billData.additionalInfo.terms)) && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#fcfcfc', borderRadius: 1 }}>
              {billData.additionalInfo.notes && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>Notes:</Typography>
                  <Typography variant="caption">{billData.additionalInfo.notes}</Typography>
                </Box>
              )}
              {preferences.showPaymentTerms && billData.additionalInfo.terms && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>Terms:</Typography>
                  <Typography variant="caption">{billData.additionalInfo.terms}</Typography>
                </Box>
              )}
            </Box>
          )}

          <Box sx={{ textAlign: 'center', pt: 4, borderTop: '1px solid #eee' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              Thank you for your business!
            </Typography>
            {billData.additionalInfo.signature && (
              <Typography variant="body2" sx={{ fontStyle: 'italic', fontWeight: 'bold' }}>
                {billData.additionalInfo.signature}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
});

A4BillPreview.displayName = 'A4BillPreview';

export default A4BillPreview;

