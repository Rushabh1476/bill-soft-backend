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
} from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { resolveFileUrl } from '../../../utils/url';
import { Bill } from '../../../types/bill';
import { BILL_SIZE_DIMENSIONS, BillSize, InvoiceTemplate } from '../core';

interface CorporateStandardPreviewProps {
  template: InvoiceTemplate;
  bill?: Bill;
  preferences?: any;
}

const CorporateStandardPreview: React.FC<CorporateStandardPreviewProps> = ({ template, bill, preferences }) => {
  const { user: currentUser } = useAuth();
  const { settings } = template;
  
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

  const logoUrl = settings.logoUrl || ownerUser?.logoUrl;
  const colorScheme = settings.colorScheme || '#10B981';

  const cleanText = (text: string | undefined) => {
    if (!text) return '';
    const t = text.trim();
    return (t.toLowerCase() === 'test' || t.toLowerCase() === 'test name') ? '' : t;
  };

  // Sample or Real Data
  const invoiceData = bill ? {
    invoiceNumber: bill.billNumber || 'CORP-001',
    date: new Date(bill.createdAt).toLocaleDateString(),
    dueDate: new Date(bill.dueDate).toLocaleDateString(),
    company: {
      name: cleanText(ownerUser?.companyName || 'Corporate Global Solutions'),
      address: cleanText(ownerUser?.address || '101 Business Hub, Hyderabad'),
      phone: cleanText(ownerUser?.phone || '+91 40 1234 5678'),
      email: cleanText(ownerUser?.email || ''),
      gst: ownerUser?.gstNumber || '',
    },
    customer: {
      name: bill.customerName,
      company: 'Corporate Client',
      address: 'Client Business Address',
      email: bill.customerEmail || '',
      gst: ''
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
    invoiceNumber: 'CS-INV-2024-004',
    date: new Date().toLocaleDateString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    status: 'Paid',
    company: {
      name: 'Corporate Solutions India Ltd',
      address: '12th Floor, Business Tower, Gurgaon',
      phone: '+91 93456 78901',
      email: 'billing@corporatesolutions.in',
      gst: 'GST06ABCDE1234F5Z6',
    },
    customer: {
      name: 'Sanjay Gupta',
      company: 'Future Technologies Ltd',
      address: '567 IT Park, Chennai',
      email: 'sanjay@futuretech.com',
      gst: 'GST33XYZPQ9876R2S1'
    },
    items: [
      { description: 'Enterprise Software License', quantity: 5, rate: 25000, amount: 125000, taxRate: 18, taxAmt: 22500 },
      { description: 'Implementation Services', quantity: 1, rate: 150000, amount: 150000, taxRate: 18, taxAmt: 27000 },
      { description: 'Training & Support (Annual)', quantity: 1, rate: 85000, amount: 85000, taxRate: 12, taxAmt: 10200 },
    ],
    subtotal: 360000,
    tax: 59700,
    total: 419700
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

  const billDimensions = BILL_SIZE_DIMENSIONS[settings.billSize || 'A4'];

  return (
    <Paper
      className="invoice-container"
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
        p: 0,
        boxShadow: settings.showBorder ? 'inset 0 0 0 1px #ddd, 0 4px 12px rgba(0,0,0,0.05)' : 'none',
        borderRadius: "8px",
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        border: 'none',
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
        backgroundColor: colorScheme,
        color: 'white',
        p: `${settings.margins?.top || 20}mm ${settings.margins?.right || 20}mm 10mm ${settings.margins?.left || 20}mm`,
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
              fontWeight: '900', 
              letterSpacing: '3px', 
              textTransform: 'uppercase', 
              color: "#FFFFFF", 
              fontSize: `${settings.titleFontSize || 36}px` 
            }}>
              {getLabel("1", "INVOICE")}
            </Typography>
            <Chip 
              label={invoiceData.status?.toUpperCase() || 'PAID'} 
              size="small" 
              sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold', mt: 1 }} 
            />
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
            ml: logoAlign === 'flex-start' ? `${ownerUser?.logoOffsetX || 0}px` : 0,
            mr: logoAlign === 'flex-end' ? `${ownerUser?.logoOffsetX || 0}px` : 0,
            mt: `${ownerUser?.logoOffsetY || 0}px`,
          }}>
            {showLogo && logoUrl ? (
              <img 
                src={resolveFileUrl(logoUrl)} 
                alt="Logo" 
                style={{ 
                  width: `${ownerUser?.logoWidth || 60}px`, 
                  height: 'auto', 
                  maxHeight: '120px',
                  objectFit: 'contain' 
                }} 
              />
            ) : null}
            {isVisible("companyName") && (
              <Typography variant="h6" fontWeight="bold" sx={{ mt: 1, color: "#FFFFFF", textAlign: logoAlign === 'center' ? 'center' : logoAlign === 'flex-end' ? 'right' : 'left' }}>
                {invoiceData.company.name}
              </Typography>
            )}
          </Box>
        </Box>

        {/* BOTTOM ROW: COMPANY INFO */}
        <Box sx={{ 
          textAlign: logoAlign === 'center' ? 'center' : 'right',
          width: '100%'
        }}>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>{invoiceData.company.address}</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>{invoiceData.company.phone}</Typography>
        </Box>
      </Box>

      <Box sx={{ 
        p: `10mm ${settings.margins?.right || 20}mm ${settings.margins?.bottom || 20}mm ${settings.margins?.left || 20}mm`,
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Details Row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 4, px: 1, pb: 3, borderBottom: `2px solid ${colorScheme}20` }}>
          {isVisible("4") && (
            <Box>
              <Typography variant="body2" sx={{ color: "#000000", fontWeight: 'bold', textTransform: 'uppercase', mb: 1 }}>
                {getLabel("4", "Bill To")}:
              </Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ color: "#374151" }}>{invoiceData.customer.name}</Typography>
              <Typography variant="body2" sx={{ color: "#374151" }}>{invoiceData.customer.address}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>{invoiceData.customer.email}</Typography>
            </Box>
          )}

          <Box sx={{ textAlign: 'right' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, justifyItems: 'end' }}>
              {isVisible("2") && (
                <>
                  <Typography variant="body2" fontWeight="bold">{getLabel("2", "Invoice #")}:</Typography>
                  <Typography variant="body2">{invoiceData.invoiceNumber}</Typography>
                </>
              )}
              {isVisible("3") && (
                <>
                  <Typography variant="body2" fontWeight="bold">{getLabel("3", "Date")}:</Typography>
                  <Typography variant="body2">{invoiceData.date}</Typography>
                </>
              )}
              <Typography variant="body2" fontWeight="bold">Due Date:</Typography>
              <Typography variant="body2">{invoiceData.dueDate}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Items Table */}
        {isVisible("5") && (() => {
          let cols = ["Description", "Quantity", "Rate", "Amount"];
          const snapshot = (bill as any)?.columnsSnapshot;
          if (snapshot) {
            try {
              cols = typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot;
            } catch (e) {
              console.error('[Corporate] Failed to parse columnsSnapshot:', e);
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
            <TableContainer component={Box} sx={{ mb: 4, border: `1px solid ${colorScheme}30` }}>
              <Table sx={{ '& th': { backgroundColor: `${colorScheme}15`, fontWeight: 'bold', color: colorScheme } }}>
                <TableHead>
                  <TableRow>
                    {cols.map((col, idx) => (
                      <TableCell key={idx} align={getColumnAlign(col)}>{col}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoiceData.items.map((item: any, i: number) => (
                    <TableRow key={i} sx={{ '&:nth-of-type(even)': { backgroundColor: 'grey.50' } }}>
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

        {/* Summary Box */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
          <Box sx={{ p: 2, width: '300px', border: `1px solid ${colorScheme}30`, borderRadius: '4px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2" fontWeight="bold">₹{(invoiceData.subtotal || 0).toLocaleString('en-IN')}</Typography>
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
                    <Typography variant="body2" color="text.secondary">GST @ {rate}%:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>₹{Math.round(amt || 0).toLocaleString('en-IN')}</Typography>
                  </Box>
                ));
              })()
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">Tax:</Typography>
                <Typography variant="body2" fontWeight="bold">₹{(invoiceData.tax || 0).toLocaleString('en-IN')}</Typography>
              </Box>
            )}

            {isVisible("6") && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, backgroundColor: colorScheme, color: 'white', borderRadius: 1, mt: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">{getLabel("6", "Total")}:</Typography>
                <Typography variant="subtitle1" fontWeight="bold">₹{(invoiceData.total || 0).toLocaleString('en-IN')}</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 'auto', p: 3, backgroundColor: colorScheme, color: 'white', textAlign: 'center', mx: `calc(-1 * ${settings.margins?.left || 20}mm)`, mb: `calc(-1 * ${settings.margins?.bottom || 20}mm)`, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
          {showPaymentTerms && (
            <Typography variant="body2" sx={{ mb: 1, color: 'white', opacity: 0.9 }}>
              {preferences?.paymentTerms || 'Payment is due within 30 days.'}
            </Typography>
          )}
          <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
            Thank you for your business! Generated using {template.name} Template.
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', opacity: 0.7, mt: 1 }}>Page 1</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default CorporateStandardPreview;
