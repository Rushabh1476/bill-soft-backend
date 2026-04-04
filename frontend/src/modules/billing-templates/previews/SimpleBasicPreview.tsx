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
  Divider,
  Chip,
} from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { resolveFileUrl } from '../../../utils/url';
import { Bill } from '../../../types/bill';
import { BILL_SIZE_DIMENSIONS, BillSize, InvoiceTemplate } from '../core';

interface SimpleBasicPreviewProps {
  template: InvoiceTemplate;
  bill?: Bill;
  preferences?: any;
}

const SimpleBasicPreview: React.FC<SimpleBasicPreviewProps> = ({ template, bill, preferences }) => {
  const { user: currentUser } = useAuth();
  const { settings } = template;
  
  const [logoLoaded, setLogoLoaded] = React.useState(false);
  const [logoError, setLogoError] = React.useState(false);

  const ownerUser = (bill as any)?.user || currentUser;

  const fieldsMap = (template.fields || []).reduce((acc: any, f: any) => {
    acc[f.id] = f;
    return acc;
  }, {});

  const getLabel = (key: string, defaultLabel: string) => {
    const label = fieldsMap[key]?.label || defaultLabel;
    return (label?.toLowerCase() === 'test' || label?.toLowerCase() === 'test name') ? '' : label;
  };
  const isVisible = (key: string) => fieldsMap[key]?.visible !== false;
  
  const colorScheme = settings.colorScheme || '#10B981';
  const logoUrl = settings.logoUrl || ownerUser?.logoUrl;
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

  // Sample or Real Data
  const invoiceData = bill ? {
    invoiceNumber: bill.billNumber || 'SB-001',
    date: new Date(bill.createdAt).toLocaleDateString(),
    dueDate: new Date(bill.dueDate).toLocaleDateString(),
    company: {
      name: cleanText(ownerUser?.companyName || 'Simple Basic Store'),
      address: cleanText(ownerUser?.address || '456 Market Road, Mumbai'),
      phone: cleanText(ownerUser?.phone || '+91 91234 56789'),
      email: cleanText(ownerUser?.email || 'sales@simplebasic.in'),
    },
    customer: {
      name: bill.customerName,
      company: 'Local Partner',
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
    invoiceNumber: 'SB-2024-006',
    date: new Date().toLocaleDateString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    status: 'Paid',
    company: {
      name: 'Simple Services Ltd',
      address: '123 Main Street, Jaipur',
      phone: '+91 94567 89012',
      email: 'contact@simpleservices.in',
    },
    customer: {
      name: 'Vikram Singh',
      company: 'Local Business Co',
      address: '456 Market Road, Udaipur',
      email: 'vikram@localbusiness.com'
    },
    items: [
      { description: 'Consultation Services', quantity: 4, rate: 2500, amount: 10000, taxRate: 18, taxAmt: 1800 },
      { description: 'Document Preparation', quantity: 2, rate: 1500, amount: 3000, taxRate: 18, taxAmt: 5400 },
    ],
    subtotal: 13000,
    tax: 7200,
    total: 20200
  };

  const showLogo = preferences?.includeCompanyLogo !== false;
  const showTaxBreakdown = preferences?.includeTaxBreakdown === true;
  const showPaymentTerms = preferences?.showPaymentTerms !== false;
  const billDimensions = BILL_SIZE_DIMENSIONS[(settings.billSize as BillSize) || 'A4'];

  return (
    <Paper
      className="invoice-container"
      elevation={0}
      sx={{
        width: billDimensions.width,
        minHeight: billDimensions.height,
        height: billDimensions.height,
        maxWidth: '100%',
        margin: '0 auto',
        backgroundColor: 'white',
        fontFamily: settings.fontFamily || 'Helvetica',
        fontSize: settings.fontSize ? `${settings.fontSize}px` : '12px',
        color: '#374151',
        lineHeight: 1.5,
        p: `${settings.margins?.top || 20}mm ${settings.margins?.right || 20}mm ${settings.margins?.bottom || 20}mm ${settings.margins?.left || 20}mm`,
        border: settings.showBorder ? "1px solid #ddd" : "none",
        borderRadius: "8px",
        boxShadow: settings.showBorder ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
        overflow: 'hidden',
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
      <Box sx={{ 
        pb: 2, 
        borderBottom: `2px solid ${colorScheme}`,
        display: 'flex',
        justifyContent: logoAlign,
        alignItems: 'center',
        textAlign: logoAlign === 'center' ? 'center' : (logoAlign === 'flex-end' ? 'right' : 'left'),
        mb: 4
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: logoAlign,
          flex: 1
        }}>
          {showLogo && logoUrl ? (
            <Box sx={{
              width: `${(ownerUser as any)?.logoWidth || 100}px`,
              mt: `${(ownerUser as any)?.logoOffsetY || 0}px`,
              ml: logoAlign === 'flex-start' ? `${(ownerUser as any)?.logoOffsetX || 0}px` : 0,
              mr: logoAlign === 'flex-end' ? `${(ownerUser as any)?.logoOffsetX || 0}px` : 0,
              mb: 1,
              '& img': {
                width: '100%',
                height: 'auto',
                objectFit: 'contain'
              }
            }}>
              <img
                src={resolveFileUrl(logoUrl)}
                alt="Company Logo"
                onLoad={() => setLogoLoaded(true)}
                onError={() => setLogoError(true)}
                style={{ opacity: logoLoaded ? 1 : 0.5 }}
              />
            </Box>
          ) : (
            isVisible("companyName") && (
              <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                {invoiceData.company.name}
              </Typography>
            )
          )}
          {isVisible("companyName") && <Typography variant="h6" fontWeight="bold" sx={{ color: colorScheme }}>{invoiceData.company.name}</Typography>}
          <Typography variant="caption">{invoiceData.company.address}</Typography>
        </Box>
      </Box>

      {/* Bill Details */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 4 }}>
        {isVisible("4") && (
          <Box>
            <Typography variant="body2" sx={{ color: "#000000", fontWeight: 'bold', textTransform: 'uppercase', mb: 1 }}>
              {getLabel("4", "Bill To")}:
            </Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ color: "#374151" }}>{invoiceData.customer.name}</Typography>
            <Typography variant="body2" sx={{ color: "#374151" }}>{invoiceData.customer.address}</Typography>
            <Typography variant="body2" sx={{ color: "#374151" }}>{invoiceData.customer.email}</Typography>

          </Box>
        )}
        <Box sx={{ textAlign: 'right' }}>
           <Typography variant="h4" fontWeight="bold" sx={{ color: colorScheme, mb: 1 }}>{getLabel("1", "INVOICE")}</Typography>
           <Typography variant="body2"><strong>{getLabel("2", "No")}:</strong> {invoiceData.invoiceNumber}</Typography>
           <Typography variant="body2"><strong>{getLabel("3", "Date")}:</strong> {invoiceData.date}</Typography>
           <Chip 
             label={invoiceData.status?.toUpperCase() || 'PAID'} 
             size="small" 
             sx={{ mt: 1, backgroundColor: colorScheme, color: 'white', fontWeight: 'bold' }} 
           />
        </Box>
      </Box>

      {/* Table */}
      {isVisible("5") && (
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Rate</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoiceData.items.map((item: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell align="center">{item.quantity}</TableCell>
                  <TableCell align="right">₹{item.rate.toLocaleString('en-IN')}</TableCell>
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
            <Typography variant="body2">Subtotal:</Typography>
            <Typography variant="body2">₹{invoiceData.subtotal.toLocaleString('en-IN')}</Typography>
          </Box>
          
          {showTaxBreakdown ? (
            (() => {
              const rateMap = new Map<number, number>();
              invoiceData.items.forEach((item: any) => {
                const r = item.taxRate ?? 0;
                if (r > 0) rateMap.set(r, (rateMap.get(r) || 0) + (item.taxAmt ?? 0));
              });
              const entries = Array.from(rateMap.entries());
              return entries.map(([rate, amt]) => (
                <Box key={rate} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">GST @ {rate}%</Typography>
                  <Typography variant="body2">₹{Math.round(amt).toLocaleString('en-IN')}</Typography>
                </Box>
              ));
            })()
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Tax:</Typography>
              <Typography variant="body2">₹{invoiceData.tax.toLocaleString('en-IN')}</Typography>
            </Box>
          )}

          <Divider sx={{ my: 1 }} />
          {isVisible('6') && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colorScheme }}>
                {getLabel('6', 'Total')}:
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colorScheme }}>
                ₹{invoiceData.total.toLocaleString('en-IN')}
              </Typography>
            </Box>
          )}

        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 'auto', textAlign: 'center', pt: 4, borderTop: `1px solid #eee` }}>
        {showPaymentTerms && (
          <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
            {preferences?.paymentTerms || 'Payment is due within 30 days.'}
          </Typography>
        )}
        <Typography variant="body2" sx={{ color: '#888' }}>Generated using {template.name} Template</Typography>

        <Typography variant="caption" color="text.secondary">Thank you for your business!</Typography>
      </Box>
    </Paper>
  );
};

export default SimpleBasicPreview;
