/* eslint-disable */
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
} from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { resolveFileUrl } from '../../../utils/url';
import { Bill } from '../../../types/bill';
import { BILL_SIZE_DIMENSIONS, BillSize, InvoiceTemplate } from '../core';

interface CreativeModernPreviewProps {
  template: InvoiceTemplate;
  bill?: Bill;
  preferences?: any;
}

const CreativeModernPreview: React.FC<CreativeModernPreviewProps> = ({ template, bill, preferences }) => {
  const { user: currentUser } = useAuth();
  const { settings } = template;
  
  const ownerUser = (bill as any)?.user || currentUser;
  const [logoLoaded, setLogoLoaded] = React.useState(false);
  const [logoError, setLogoError] = React.useState(false);

  const fieldsMap = (template.fields || []).reduce((acc: any, f: any) => {
    acc[f.id] = f;
    return acc;
  }, {});

  const getLabel = (key: string, defaultLabel: string) => {
    const label = fieldsMap[key]?.label || defaultLabel;
    return (label?.toLowerCase() === 'test' || label?.toLowerCase() === 'test name') ? '' : label;
  };
  const isVisible = (key: string) => fieldsMap[key]?.visible !== false;
  const logoUrl = settings.logoUrl || ownerUser?.logoUrl;
  const colorScheme = settings.colorScheme || '#10B981';

  const processedLogoUrl = logoUrl ? resolveFileUrl(logoUrl) : null;
  const logoWidth = (ownerUser as any)?.logoWidth || 100;
  const logoOffsetX = (ownerUser as any)?.logoOffsetX || 0;
  const logoOffsetY = (ownerUser as any)?.logoOffsetY || 0;

  const cleanText = (text: string | undefined) => {
    if (!text) return '';
    const t = text.trim();
    return (t.toLowerCase() === 'test' || t.toLowerCase() === 'test name') ? '' : t;
  };

  const invoiceData = bill ? {
    invoiceNumber: bill.billNumber || 'CREATIVE-001',
    date: new Date(bill.createdAt).toLocaleDateString(),
    dueDate: new Date(bill.dueDate).toLocaleDateString(),
    company: {
      name: cleanText(ownerUser?.companyName || 'Creative Agency'),
      address: cleanText(ownerUser?.address || ''),
      phone: cleanText(ownerUser?.phone || ''),
      email: cleanText(ownerUser?.email || 'contact@creative.hub'),
    },
    customer: {
      name: bill.customerName,
      address: 'Studio Hub, Bangalore',
      email: bill.customerEmail || ''
    },
    items: bill.items.map((item: any) => ({
      description: item.productName,
      quantity: item.quantity,
      rate: item.price,
      amount: item.total,
      taxRate: item.taxRate,
      taxAmt: item.taxAmt
    })),
    subtotal: bill.subtotal,
    tax: bill.taxAmount,
    total: bill.totalAmount,
    status: bill.status,
  } : {
    invoiceNumber: 'CM-2024-005',
    date: new Date().toLocaleDateString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    status: 'Paid',
    company: {
      name: 'Creative Design Studio',
      address: 'Design Hub, Koramangala, Bangalore',
      phone: '+91 89765 43210',
      email: 'studio@creativedesign.in',
    },
    customer: {
      name: 'Meera Krishnan',
      address: 'Innovation Street, Kochi',
      email: 'meera@startupventures.com'
    },
    items: [
      { description: 'Creative Logo Design Package', quantity: 1, rate: 65000, amount: 65000, taxRate: 18, taxAmt: 11700 },
      { description: 'Social Media Design Kit', quantity: 1, rate: 45000, amount: 45000, taxRate: 18, taxAmt: 8100 }
    ],
    subtotal: 110000,
    tax: 19800,
    total: 129800
  };

  const showLogo = preferences?.includeCompanyLogo !== false;
  const showTaxBreakdown = preferences?.includeTaxBreakdown === true;
  const showPaymentTerms = preferences?.showPaymentTerms !== false;
  const userLogoPosition = ownerUser?.logoPosition || settings.logoPosition || 'top-left';
  const logoAlign = (({
    "top-left": "flex-start",
    "left": "flex-start",
    "top-center": "center",
    "center": "center",
    "top-right": "flex-end",
    "right": "flex-end"
  } as any)[userLogoPosition]);
  const billDimensions = BILL_SIZE_DIMENSIONS[(settings.billSize as BillSize) || 'A4'];

  return (
    <Paper
      elevation={0}
      sx={{
        width: billDimensions.width,
        minHeight: billDimensions.height,
        height: billDimensions.height,
        maxWidth: '100%',
        margin: '0 auto',
        backgroundColor: 'white',
        p: `${settings.margins?.top || 20}mm ${settings.margins?.right || 20}mm ${settings.margins?.bottom || 20}mm ${settings.margins?.left || 20}mm`,
        fontFamily: settings.fontFamily || 'Outfit, sans-serif',
        fontSize: settings.fontSize ? `${settings.fontSize}px` : '12px',
        color: '#374151',
        lineHeight: 1.5,
        border: settings.showBorder ? `1px solid ${colorScheme}40` : "none",
        borderRadius: "20px",
        boxShadow: settings.showBorder ? `0 20px 40px ${colorScheme}15` : 'none',
        display: 'flex',
        flexDirection: 'column',
        '@media print': {
          boxShadow: 'none',
          border: 'none',
          width: billDimensions.width,
          height: billDimensions.height,
          maxHeight: billDimensions.height,
          m: 0,
        },
      }}
    >
      {/* Header with Gradient */}
      <Box sx={{
        background: `linear-gradient(135deg, ${colorScheme} 0%, ${colorScheme}dd 100%)`,
        color: 'white',
        p: 4,
        mx: -4,
        mt: -4,
        mb: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}>
        {/* TOP ROW: INVOICE TITLE */}
        {isVisible("1") && (
          <Box sx={{ 
            textAlign: 'center', 
            width: '100%', 
            pb: 2, 
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            mb: 2
          }}>
            <Typography sx={{ 
              fontWeight: '800', 
              letterSpacing: '8px', 
              color: "#FFFFFF", 
              fontSize: `${settings.titleFontSize || 40}px`,
              textTransform: 'uppercase'
            }}>
              {getLabel("1", "INVOICE")}
            </Typography>
            <Chip 
              label={invoiceData.status?.toUpperCase() || 'PAID'} 
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold', mt: 1 }} 
            />
          </Box>
        )}

        {/* MIDDLE ROW: BRANDING - 100% Width */}
        <Box sx={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: logoAlign,
          mb: 2,
          flexDirection: 'column',
          alignItems: logoAlign
        }}>
            {showLogo && logoUrl ? (
              <Box sx={{ 
                width: `${logoWidth}px`, 
                height: 'auto', 
                bgcolor: 'rgba(255,255,255,0.2)', 
                borderRadius: '15px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                p: 1,
                ml: logoAlign === 'flex-start' ? `${logoOffsetX}px` : 0,
                mr: logoAlign === 'flex-end' ? `${logoOffsetX}px` : 0,
                mt: `${logoOffsetY}px`,
              }}>
                <img 
                  src={processedLogoUrl || ''} 
                  alt="Logo" 
                  onLoad={() => setLogoLoaded(true)}
                  onError={() => setLogoError(true)}
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    objectFit: 'contain', 
                    filter: 'brightness(0) invert(1)',
                    opacity: logoLoaded ? 1 : 0.5
                  }} 
                />
              </Box>
            ) : (
                isVisible("companyName") && (
                    <Typography variant="h4" fontWeight="bold" color="white">
                        {invoiceData.company.name.charAt(0).toUpperCase()}
                    </Typography>
                )
            )}
            {isVisible("companyName") && (
              <Typography variant="h6" fontWeight="bold" sx={{ mt: 1, color: "#FFFFFF", textAlign: logoAlign === 'center' ? 'center' : logoAlign === 'flex-end' ? 'right' : 'left' }}>
                {invoiceData.company.name}
              </Typography>
            )}
        </Box>
        <Box sx={{ 
          textAlign: logoAlign === 'center' ? 'center' : 'right',
          width: '100%',
          opacity: 0.8
        }}>
          <Typography variant="body2" sx={{ color: 'white' }}>{invoiceData.company.email}</Typography>
        </Box>
      </Box>

      {/* Details */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, mb: 6 }}>
        {isVisible("4") && (
          <Box sx={{ p: 3, bgcolor: `${colorScheme}08`, borderRadius: '20px', borderLeft: `5px solid ${colorScheme}` }}>
            <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>{getLabel("4", "Billed To")}</Typography>
            <Typography variant="h6" fontWeight="bold">{invoiceData.customer.name}</Typography>
            <Typography variant="body2">{invoiceData.customer.address}</Typography>
          </Box>
        )}
        <Box sx={{ textAlign: 'right' }}>
           <Typography variant="h6" fontWeight="bold" sx={{ color: colorScheme }}>ID: {invoiceData.invoiceNumber}</Typography>
           <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{getLabel("3", "Issue Date")}: {invoiceData.date}</Typography>
           <Typography variant="body2" sx={{ color: '#888' }}>Due: {invoiceData.dueDate}</Typography>
        </Box>
      </Box>

      {/* Table */}
      {isVisible("5") && (
        <TableContainer sx={{ mb: 6 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: colorScheme, borderBottom: `2px solid ${colorScheme}` }}>Description</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', borderBottom: `2px solid ${colorScheme}` }}>Qty</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', borderBottom: `2px solid ${colorScheme}` }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoiceData.items.map((item: any, i: number) => (
                <TableRow key={i} sx={{ '& td': { py: 3, borderBottom: '1px solid #eee' } }}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell align="center">{item.quantity}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: colorScheme }}>₹{item.amount.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Totals */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
        <Box sx={{ width: '300px', p: 3, bgcolor: '#f9f9f9', borderRadius: '20px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: '#888' }}>Subtotal</Typography>
            <Typography variant="body2" fontWeight="bold">₹{invoiceData.subtotal.toLocaleString('en-IN')}</Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          {isVisible("6") && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" fontWeight="900" sx={{ color: colorScheme }}>{getLabel('6', 'TOTAL')}</Typography>
              <Typography variant="h5" fontWeight="900" sx={{ color: colorScheme }}>₹{invoiceData.total.toLocaleString('en-IN')}</Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ mt: 'auto', textAlign: 'center', p: 4, borderRadius: '20px', bgcolor: `${colorScheme}05`, border: `1px dashed ${colorScheme}40` }}>
        {showPaymentTerms && (
          <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
            {preferences?.paymentTerms || 'Payment is due within 30 days.'}
          </Typography>
        )}
        <Typography variant="h6" fontWeight="bold" sx={{ color: colorScheme, mb: 1 }}>Let's build something great together!</Typography>
        <Typography variant="body2" sx={{ color: '#888' }}>Thank you for your trust. Generated via {template.name}.</Typography>
      </Box>
    </Paper>
  );
};

export default CreativeModernPreview;
