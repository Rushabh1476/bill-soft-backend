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

interface MinimalCleanPreviewProps {
  template: InvoiceTemplate;
  bill?: Bill;
  preferences?: any;
}

const MinimalCleanPreview: React.FC<MinimalCleanPreviewProps> = ({ template, bill, preferences }) => {
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
  const userLogoPosition = ownerUser?.logoPosition || settings.logoPosition || 'top-left';
  const logoAlign = (({
    "top-left": "flex-start",
    "left": "flex-start",
    "top-center": "center",
    "center": "center",
    "top-right": "flex-end",
    "right": "flex-end"
  } as any)[userLogoPosition]);


  const cleanText = (text: string | undefined) => {
    if (!text) return '';
    const t = text.trim();
    return (t.toLowerCase() === 'test' || t.toLowerCase() === 'test name') ? '' : t;
  };

  const invoiceData = bill ? {
    invoiceNumber: bill.billNumber || 'MC-001',
    date: new Date(bill.createdAt).toLocaleDateString(),
    dueDate: new Date(bill.dueDate).toLocaleDateString(),
    company: {
      name: cleanText(ownerUser?.companyName || 'Minimal Studios'),
      address: cleanText(ownerUser?.address || 'Design Hub, Pune'),
      phone: cleanText(ownerUser?.phone || ''),
      email: cleanText(ownerUser?.email || ''),
    },
    customer: {
      name: bill.customerName,
      company: '',
      address: 'Customer Address',

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
    invoiceNumber: 'INV-2024-003',
    date: new Date().toLocaleDateString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    status: 'Paid',
    company: {
      name: 'Minimal Studios',
      address: '456 Design Street, Pune',
      email: 'hello@minimalstudios.in',
    },
    customer: {
      name: 'Arjun Patel',
      address: '789 Tech Park, Hyderabad',
      email: 'arjun@techinnovations.com'
    },
    items: [
      { description: 'Brand Identity Design', quantity: 1, rate: 95000, amount: 95000, taxRate: 18, taxAmt: 17100 },
      { description: 'Website UI/UX Design', quantity: 1, rate: 125000, amount: 125000, taxRate: 18, taxAmt: 22500 },

    ],
    subtotal: 220000,
    tax: 39600,
    total: 259600
  };

  const showLogo = preferences?.includeCompanyLogo !== false;
  const showTaxBreakdown = preferences?.includeTaxBreakdown === true;
  const showPaymentTerms = preferences?.showPaymentTerms !== false;
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
        fontFamily: settings.fontFamily || 'Inter, sans-serif',
        fontSize: settings.fontSize ? `${settings.fontSize}px` : '12px',
        color: '#374151',
        lineHeight: 1.6,
        p: `${settings.margins?.top || 20}mm ${settings.margins?.right || 20}mm ${settings.margins?.bottom || 20}mm ${settings.margins?.left || 20}mm`,
        border: settings.showBorder ? "1px solid #eee" : "none",
        borderRadius: "8px",
        boxShadow: settings.showBorder ? '0 10px 40px rgba(0,0,0,0.03)' : 'none',
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
      {/* Header */}
      <Box sx={{
        mb: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        {/* TOP ROW: INVOICE TITLE */}
        {isVisible("1") && (
          <Box sx={{ 
            textAlign: 'center', 
            width: '100%', 
            pb: 2, 
            borderBottom: '1px solid #f0f0f0',
            mb: 4
          }}>
            <Typography sx={{ 
              fontWeight: '300', 
              letterSpacing: '12px', 
              color: '#1A1A1A', 
              fontSize: `${settings.titleFontSize || 28}px`,
              textTransform: 'uppercase'
            }}>
              {getLabel("1", "INVOICE")}
            </Typography>
            <Typography variant="caption" sx={{ mt: 1, display: 'block', letterSpacing: '4px', color: colorScheme, opacity: 0.6 }}>
              {invoiceData.status?.toUpperCase() || 'PAID'}
            </Typography>
          </Box>
        )}

        {/* MIDDLE ROW: BRANDING - 100% Width */}
        <Box sx={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: logoAlign,
          mb: 2
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: logoAlign,
            maxWidth: '100%',
            ml: logoAlign === 'flex-start' ? `${(ownerUser as any)?.logoOffsetX || 0}px` : 0,
            mr: logoAlign === 'flex-end' ? `${(ownerUser as any)?.logoOffsetX || 0}px` : 0,
            mt: `${(ownerUser as any)?.logoOffsetY || 0}px`,
          }}>
            {showLogo && logoUrl ? (
              <img 
                src={resolveFileUrl(logoUrl)} 
                alt="Logo" 
                onLoad={() => setLogoLoaded(true)}
                onError={() => setLogoError(true)}
                style={{ 
                  width: `${(ownerUser as any)?.logoWidth || 60}px`, 
                  height: 'auto', 
                  maxHeight: '120px',
                  objectFit: 'contain',
                  opacity: logoLoaded ? 1 : 0.5
                }} 
              />
            ) : (
                isVisible("companyName") && (
                    <Typography variant="h4" sx={{ fontWeight: 300, color: colorScheme }}>
                        {invoiceData.company.name.charAt(0).toUpperCase()}
                    </Typography>
                )
            )}
            {isVisible("companyName") && (
              <Typography variant="h6" fontWeight="bold" sx={{ mt: 1, color: colorScheme, textAlign: logoAlign === 'center' ? 'center' : logoAlign === 'flex-end' ? 'right' : 'left' }}>
                {invoiceData.company.name}
              </Typography>
            )}
          </Box>
        </Box>

        {/* BOTTOM ROW: COMPANY SHORT INFO */}
        <Box sx={{ 
          textAlign: logoAlign === 'center' ? 'center' : 'right',
          width: '100%'
        }}>
          <Typography variant="caption" color="text.secondary">{invoiceData.company.email}</Typography>
        </Box>
      </Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        mb: 8,
        alignItems: 'center'
      }}>
        {/* Header content was already here, but now we add the right side reference */}
        <Box sx={{ flex: 1 }}>
            {/* This is intentionally empty if we want to follow the previous layout, OR we move things around */}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" sx={{ color: '#aaa', textTransform: 'uppercase', letterSpacing: '2px', display: 'block' }}>Reference</Typography>
          <Typography variant="body1" fontWeight="600">{invoiceData.invoiceNumber}</Typography>
        </Box>
      </Box>


      {/* Details */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 8 }}>
        {isVisible("4") && (
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#888' }}>{getLabel("4", "Bill To")}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>{invoiceData.customer.name}</Typography>
            <Typography variant="body2" color="text.secondary">{invoiceData.customer.address}</Typography>
          </Box>
        )}
        <Box sx={{ textAlign: 'right' }}>
           <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#888' }}>{getLabel("3", "Date")}</Typography>
           <Typography variant="body1">{invoiceData.date}</Typography>
        </Box>
      </Box>

      {/* Table */}
      {isVisible("5") && (
        <TableContainer sx={{ mb: 6 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ borderBottom: '2px solid #000', px: 0, py: 2, fontWeight: '700' }}>Description</TableCell>
                <TableCell align="center" sx={{ borderBottom: '2px solid #000', py: 2, fontWeight: '700' }}>Qty</TableCell>
                <TableCell align="right" sx={{ borderBottom: '2px solid #000', px: 0, py: 2, fontWeight: '700' }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoiceData.items.map((item: any, i: number) => (
                <TableRow key={i} sx={{ '& td': { px: 0, py: 2, borderBottom: '1px solid #f5f5f5' } }}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell align="center">{item.quantity}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>₹{item.amount.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Totals */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
        <Box sx={{ width: '250px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Subtotal</Typography>
            <Typography variant="body2">₹{invoiceData.subtotal.toLocaleString('en-IN')}</Typography>
          </Box>
          {isVisible('6') && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 3, borderTop: '2px solid #000' }}>
              <Typography variant="h5" fontWeight="700" sx={{ color: colorScheme }}>{getLabel('6', 'Total')}</Typography>
              <Typography variant="h5" fontWeight="700" sx={{ color: colorScheme }}>₹{invoiceData.total.toLocaleString('en-IN')}</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Minimal Footer */}
      <Box sx={{ mt: 'auto', textAlign: 'left' }}>
        {showPaymentTerms && (
          <Typography variant="caption" sx={{ color: '#ccc', letterSpacing: '1px', display: 'block', mb: 1 }}>
            {preferences?.paymentTerms || 'Payment due within 30 days.'}
          </Typography>
        )}
        <Typography variant="caption" sx={{ color: '#ccc', letterSpacing: '1px' }}>
          Thank you. • Generated via {template.name}
        </Typography>
      </Box>

    </Paper>

  );
};

export default MinimalCleanPreview;
