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

interface ClassicProfessionalPreviewProps {
  template: InvoiceTemplate;
  bill?: Bill;
  preferences?: any;
}

const ClassicProfessionalPreview: React.FC<ClassicProfessionalPreviewProps> = ({ template, bill, preferences }) => {
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
    invoiceNumber: bill.billNumber || 'CL-001',
    date: new Date(bill.createdAt).toLocaleDateString(),
    dueDate: new Date(bill.dueDate).toLocaleDateString(),
    company: {
      name: cleanText(ownerUser?.companyName || 'Classic Professional Solutions'),
      address: cleanText(ownerUser?.address || '789 Corporate Plaza, Delhi'),
      phone: cleanText(ownerUser?.phone || '+91 99887 76543'),
      email: cleanText(ownerUser?.email || 'accounts@classicpro.in'),
      gst: ownerUser?.gstNumber || '',
    },
    customer: {
      name: bill.customerName,
      address: 'Client Address',
      email: bill.customerEmail || ''
    },
    items: (bill.items || []).map((i: any) => {
      const cFields = typeof i.custom_fields === 'string' ? JSON.parse(i.custom_fields) : i.custom_fields || i.customFields || {};
      return { 
        description: i.productName, 
        quantity: i.quantity, 
        rate: i.price, 
        amount: i.total, 
        taxRate: i.taxRate,
        taxAmt: i.taxAmt,
        category: i.category || cFields?.category,
        sku: i.sku || cFields?.sku,
        customFields: cFields
      };
    }),
    subtotal: bill.subtotal,
    tax: bill.taxAmount,
    total: bill.totalAmount,
    status: bill.status,
  } : {
    invoiceNumber: 'INV-2024-002',
    date: new Date().toLocaleDateString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    status: 'Paid',
    company: {
      name: 'Classic Professional Solutions',
      address: '789 Corporate Plaza, Delhi',
      phone: '+91 99887 76543',
      email: 'accounts@classicpro.in',
      gst: ''
    },
    customer: {
      name: 'Priya Sharma',
      address: '321 Industrial Area, Gurgaon',
      email: 'priya@elitemanufacturing.com'
    },
    items: [
      { description: 'Business Consulting Services', quantity: 1, rate: 75000, amount: 75000, taxRate: 18, taxAmt: 13500 },
      { description: 'Financial Analysis Report', quantity: 1, rate: 45000, amount: 45000, taxRate: 18, taxAmt: 8100 },
      { description: 'Strategic Planning Workshop', quantity: 1, rate: 65000, amount: 65000, taxRate: 18, taxAmt: 11700 }
    ],
    subtotal: 185000,
    tax: 33300,
    total: 218300
  };

  const showLogo = preferences?.includeCompanyLogo !== false;
  const showTaxBreakdown = preferences?.includeTaxBreakdown === true;
  const showPaymentTerms = preferences?.showPaymentTerms !== false;
  const billDimensions = BILL_SIZE_DIMENSIONS[settings.billSize || 'A4'];

  return (
    <Paper
      elevation={0}
      sx={{
        width: billDimensions.width,
        minHeight: billDimensions.height,
        backgroundColor: 'white',
        position: 'relative',
        zIndex: 1,
        fontFamily: settings.fontFamily || 'Helvetica',
        fontSize: settings.fontSize ? `${settings.fontSize}px` : '12px',
        color: '#374151',
        lineHeight: 1.5,
        p: `${settings.margins?.top || 20}mm ${settings.margins?.right || 20}mm ${settings.margins?.bottom || 20}mm ${settings.margins?.left || 20}mm`,
        boxShadow: settings.showBorder 
          ? `inset 0 0 0 2px #333, 0 10px 30px rgba(0,0,0,0.1)` 
          : 'none',

        borderRadius: "0px",
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        border: 'none', 
      }}
    >
      {/* Header */}
      <Box sx={{
        mb: 3,
        pb: 2,
        borderBottom: `3px double ${colorScheme}`,
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
            borderBottom: `1px solid ${colorScheme}40`,
            mb: 2
          }}>
            <Typography sx={{ 
              fontWeight: 'bold', 
              letterSpacing: '6px', 
              color: '#1A1A1A', 
              fontSize: `${settings.titleFontSize || 36}px`,
              textTransform: 'uppercase'
            }}>
              {getLabel("1", "INVOICE")}
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 1, letterSpacing: '4px', opacity: 0.8 }}>
              {invoiceData.status?.toUpperCase() || 'PAID'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Branding */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        mb: 6
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: logoAlign,
          flex: 1
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
                    <Typography variant="h5" fontWeight="bold" sx={{ color: colorScheme }}>
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

        <Box sx={{ textAlign: logoAlign === 'center' ? 'center' : 'right', flex: 1 }}>
          <Typography variant="body2">{invoiceData.company.address}</Typography>
          <Typography variant="body2">{invoiceData.company.phone} | {invoiceData.company.email}</Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" fontWeight="bold">{getLabel("2", "Invoice Number")}: {invoiceData.invoiceNumber}</Typography>
            <Typography variant="body2">{getLabel("3", "Invoice Date")}: {invoiceData.date}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Details */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 6 }}>
        {isVisible("4") && (
          <Box sx={{ p: 2, bgcolor: `${colorScheme}05`, borderLeft: `6px solid ${colorScheme}` }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ textTransform: 'uppercase', mb: 1 }}>{getLabel("4", "Billed To")}</Typography>
            <Typography variant="h6" fontWeight="bold">{invoiceData.customer.name}</Typography>
            <Typography variant="body2">{invoiceData.customer.address}</Typography>
            <Typography variant="body2">{invoiceData.customer.email}</Typography>
          </Box>
        )}
      </Box>

      {/* Table */}
      {isVisible("5") && (() => {
        let cols = ["Description", "Quantity", "Price", "Amount"];
        const snapshot = (bill as any)?.columnsSnapshot;
        if (snapshot) {
          try {
            cols = typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot;
          } catch (e) {
            console.error('[Classic] Failed to parse columnsSnapshot:', e);
          }
        }

        const getColumnValue = (item: any, colLabel: string) => {
          const label = colLabel.toLowerCase().trim();
          if (label === 'product name' || label === 'description' || label === 'product') return item.description;
          if (label === 'quantity' || label === 'qty') return item.quantity;
          if (label === 'price' || label === 'rate' || label === 'unit price') return `₹${(item.rate || 0).toLocaleString('en-IN')}`;
          if (label === 'total' || label === 'amount') return `₹${(item.amount || 0).toLocaleString('en-IN')}`;
          if (label === 'category') return item.category || '--';
          if (label === 'sku') return item.sku || '--';
          
          const fieldKey_underscored = colLabel.toLowerCase().replace(/\s+/g, '_');
          return item.customFields?.[colLabel] || item.customFields?.[fieldKey_underscored] || '--';
        };

        const getColumnAlign = (colLabel: string): "left" | "center" | "right" => {
          const label = colLabel.toLowerCase();
          if (label === 'description' || label === 'product name') return "left";
          if (label === 'quantity' || label === 'qty') return "center";
          return "right";
        };

        return (
          <TableContainer sx={{ mb: 6 }}>
            <Table size="small" sx={{ border: '1px solid #eee' }}>
              <TableHead>
                <TableRow sx={{ bgcolor: colorScheme, '& th': { color: 'white', fontWeight: 'bold' } }}>
                  {cols.map((col, idx) => (
                    <TableCell key={idx} align={getColumnAlign(col)}>{col}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {invoiceData.items.map((item: any, i: number) => (
                  <TableRow key={i} sx={{ '&:nth-of-type(even)': { bgcolor: '#fdfdfd' } }}>
                    {cols.map((col, cIdx) => (
                      <TableCell key={cIdx} align={getColumnAlign(col)}>{getColumnValue(item, col)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      })()}

      {/* Totals */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
        <Box sx={{ width: '280px' }}>
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
              if (entries.length === 0) return (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1" color="text.secondary">Tax:</Typography>
                  <Typography variant="body1">₹0</Typography>
                </Box>
              );
              return (
                <>
                  {entries.map(([rate, amt]) => (
                    <Box key={rate} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body1" color="text.secondary">GST @ {rate}%:</Typography>
                      <Typography variant="body1">₹{Math.round(amt).toLocaleString('en-IN')}</Typography>
                    </Box>
                  ))}
                  {entries.length > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>Total Tax:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>₹{invoiceData.tax.toLocaleString('en-IN')}</Typography>
                    </Box>
                  )}
                </>
              );
            })()
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1" color="text.secondary">Tax:</Typography>
              <Typography variant="body1">₹{invoiceData.tax.toLocaleString('en-IN')}</Typography>
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />
          {isVisible('6') && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, backgroundColor: colorScheme + '08', border: `1px solid ${colorScheme}40` }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: colorScheme }}>
                {getLabel('6', 'Total Amount')}:
              </Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ color: colorScheme }}>
                ₹{invoiceData.total.toLocaleString('en-IN')}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 'auto', p: 4, textAlign: 'center', borderTop: `1px solid ${colorScheme}20` }}>
        {showPaymentTerms && (
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontSize: '0.8rem' }}>
            {preferences?.paymentTerms || 'Payment is due within 30 days of invoice date.'}
          </Typography>
        )}
        <Typography variant="body2" sx={{ mb: 1 }}>Thank you for choosing {invoiceData.company.name} for your business needs.</Typography>
        <Typography variant="caption" sx={{ display: 'block', color: '#aaa' }}>Generated using {template.name} Template</Typography>
      </Box>
    </Paper>
  );
};


export default ClassicProfessionalPreview;
