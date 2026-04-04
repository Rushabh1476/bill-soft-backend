/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { resolveFileUrl } from '../../../utils/url';
import { Bill } from '../../../types/bill';
import { useAuth } from '../../../contexts/AuthContext';
import { BILL_SIZE_DIMENSIONS, BillSize, InvoiceTemplate } from '../core';
import axios from 'axios';
import { API_URL } from '../../../config/api';

interface A4InvoicePreviewProps {
  template: InvoiceTemplate;
  bill?: Bill;
  preferences?: any;
}

const A4InvoicePreview: React.FC<A4InvoicePreviewProps> = ({ template, bill, preferences: initialPreferences }) => {
  const { user: currentUser } = useAuth();
  const [preferences, setPreferences] = useState<any>(initialPreferences || {
    showLogo: true,
    includeTaxBreakdown: true,
    showPaymentTerms: true
  });

  useEffect(() => {
    if (!initialPreferences) {
      const fetchPrefs = async () => {
        try {
          const token = localStorage.getItem('authToken');
          if (!token) return;
          const res = await axios.get(`${API_URL}/admin/settings/invoice-preferences`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success && res.data.data) {
            setPreferences(res.data.data);
          }
        } catch (err) {
          console.error('[A4InvoicePreview] Settings Hydration Failed:', err);
        }
      };
      fetchPrefs();
    } else {
      setPreferences(initialPreferences);
    }
  }, [initialPreferences]);

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

  const data = bill ? {
    invoiceNumber: bill.billNumber || 'INV-001',
    date: new Date(bill.createdAt).toLocaleDateString(),
    dueDate: new Date(bill.dueDate).toLocaleDateString(),
    company: {
      name: cleanText(ownerUser?.companyName || 'My Business'),
      phone: cleanText(ownerUser?.phone || ''),
      email: cleanText(ownerUser?.email || ''),
      address: cleanText(ownerUser?.address || ''),
      city: cleanText(ownerUser?.city || ''),
      state: cleanText(ownerUser?.state || ''),
      pincode: cleanText(ownerUser?.pincode || ''),
      website: cleanText('www.mybusiness.com')
    },
    customer: {
      name: bill.customerName,
      company: 'Client',
      address: 'Customer Address',
      email: bill.customerEmail || ''
    },
    items: bill.items.map((i: any) => ({ 
      desc: i.productName, 
      qty: i.quantity, 
      rate: i.price, 
      amt: i.total, 
      taxRate: i.taxRate,
      customFields: typeof i.custom_fields === 'string' ? JSON.parse(i.custom_fields) : i.custom_fields || i.customFields || {}
    })),
    subtotal: bill.subtotal,
    tax: bill.taxAmount,
    total: bill.totalAmount
  } : {
    invoiceNumber: 'INV 2024 001',
    date: new Date().toLocaleDateString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    company: {
      name: 'TECHSOLUTIONS INDIA PVT LTD',
      phone: '+91 98765 43210',
      email: 'billing@techsolutions.in',
      address: '123 Business Hub',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      website: 'www.techsolutions.in'
    },
    customer: {
      name: 'Rajesh Kumar',
      company: 'Client',
      address: '456 Corporate Park, Bangalore',
      email: 'rajesh@globalenterprises.com'
    },
    items: [
      { desc: 'Web Development Services', qty: 1, rate: 85000, amt: 85000, taxRate: 18 },
      { desc: 'Mobile App Development', qty: 1, rate: 120000, amt: 120000, taxRate: 18 }
    ],
    subtotal: 205000,
    tax: 36900,
    total: 241900
  };

  const showLogo = preferences?.includeCompanyLogo !== false;
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
    <div
      style={{
        width: billDimensions.width,
        minHeight: billDimensions.height,
        backgroundColor: 'white',
        margin: '0 auto',
        boxSizing: 'border-box',
        border: settings.showBorder ? "1px solid #ddd" : "none",
        borderRadius: "8px",
        padding: `${settings.margins?.top || 20}mm ${settings.margins?.right || 20}mm ${settings.margins?.bottom || 20}mm ${settings.margins?.left || 20}mm`,
        fontFamily: settings.fontFamily || "Helvetica, Arial, sans-serif",
        fontSize: settings.fontSize ? `${settings.fontSize}px` : "12px",
        color: "#374151",
        display: 'flex',
        flexDirection: 'column',
        boxShadow: settings.showBorder ? '0 4px 20px rgba(0, 0, 0, 0.08)' : 'none',
      }}
    >
      {/* Top Header */}
      {isVisible("1") && (
        <div style={{
          width: '100%',
          textAlign: 'center',
          marginBottom: '30px',
          paddingBottom: '10px',
          borderBottom: '1px solid #eee'
        }}>
          <h1 style={{
            color: '#1A1A1A',
            margin: 0,
            letterSpacing: '4px',
            fontWeight: 800,
            fontSize: `${settings.titleFontSize || 32}px`,
            textTransform: 'uppercase'
          }}>
            {getLabel("1", "INVOICE")}
          </h1>
        </div>
      )}

      {/* Branding Area */}
      <div style={{ 
        display: 'flex', 
        justifyContent: logoAlign,
        width: '100%',
        marginBottom: '20px',
        paddingTop: `${ownerUser?.logoOffsetY || 0}px`,
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: logoAlign,
          marginLeft: logoAlign === 'flex-start' ? `${ownerUser?.logoOffsetX || 0}px` : 0,
          marginRight: logoAlign === 'flex-end' ? `${ownerUser?.logoOffsetX || 0}px` : 0,
          maxWidth: '100%'
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
            <div style={{ 
              marginTop: '8px', 
              fontWeight: 'bold', 
              fontSize: '1.2em', 
              color: colorScheme, 
              textTransform: 'uppercase',
              textAlign: logoAlign === 'center' ? 'center' : logoAlign === 'flex-end' ? 'right' : 'left'
            }}>
              {data.company.name}
            </div>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div style={{ width: '50%' }}>
          <p style={{ color: '#000000', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.9em', marginBottom: '10px' }}>Invoice Details</p>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '5px' }}>
            {isVisible("2") && (
              <>
                <span style={{ fontWeight: 'bold' }}>{getLabel("2", "Invoice #")}:</span>
                <span>{data.invoiceNumber}</span>
              </>
            )}
            {isVisible("3") && (
              <>
                <span style={{ fontWeight: 'bold' }}>{getLabel("3", "Date")}:</span>
                <span>{data.date}</span>
              </>
            )}
            <span style={{ fontWeight: 'bold' }}>Due Date:</span>
            <span>{data.dueDate}</span>
          </div>
        </div>
        <div style={{ width: '50%', textAlign: 'right' }}>
           <p style={{ color: colorScheme, fontWeight: 'bold', marginBottom: '5px' }}>{data.company.name}</p>
           <p style={{ display: 'block', margin: '2px 0', fontSize: '0.85em' }}>{data.company.address}</p>
           <p style={{ display: 'block', margin: '2px 0', fontSize: '0.85em' }}>{data.company.city}, {data.company.state} {data.company.pincode}</p>
           <p style={{ display: 'block', margin: '2px 0', fontSize: '0.85em' }}>Phone: {data.company.phone}</p>
           <p style={{ display: 'block', margin: '2px 0', fontSize: '0.85em' }}>Email: {data.company.email}</p>
        </div>
      </div>

      {/* Bill To */}
      <div style={{ marginBottom: '40px' }}>
        {isVisible("4") && (
          <>
            <p style={{ color: '#000000', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.9em', marginBottom: '10px' }}>{getLabel("4", "Bill To")}:</p>
            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '1.1em' }}>{data.customer.name}</p>
            <p style={{ margin: '2px 0', color: '#666' }}>{data.customer.address}</p>
            <p style={{ margin: '2px 0', color: '#666' }}>Email: {data.customer.email}</p>
          </>
        )}
      </div>

      {/* Items Table */}
      {isVisible("5") && (() => {
        let cols = ["Product Name", "Quantity", "Price", "Total"];
        const snapshot = (bill as any)?.columnsSnapshot;
        if (snapshot) {
          try {
            cols = typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot;
          } catch (e) {
            console.error('[A4Preview] Failed to parse columnsSnapshot:', e);
          }
        } else if (preferences?.customColumns) {
          cols = preferences.customColumns;
        }

        const getColumnValue = (item: any, colLabel: string) => {
          const label = colLabel.toLowerCase();
          if (label === 'product name' || label === 'description' || label === 'product') return item.desc;
          if (label === 'quantity' || label === 'qty') return item.qty;
          if (label === 'price' || label === 'rate') return `₹${(item.rate || 0).toLocaleString('en-IN')}`;
          if (label === 'total' || label === 'amount') return `₹${(item.amt || 0).toLocaleString('en-IN')}`;
          
          const fieldKey = colLabel.toLowerCase().replace(/\s+/g, '_');
          return item.customFields?.[fieldKey] || item.customFields?.[colLabel] || '--';
        };

        const getColumnAlign = (colLabel: string): "left" | "center" | "right" => {
          const label = colLabel.toLowerCase();
          if (label === 'product name' || label === 'description' || label === 'product') return "left";
          if (label === 'quantity' || label === 'qty') return "center";
          return "right";
        };

        return (
          <div style={{ marginBottom: '40px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #eee' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9f9f9' }}>
                  {cols.map((col, idx) => (
                    <th key={idx} style={{ textAlign: getColumnAlign(col), padding: '12px', fontWeight: 'bold', borderBottom: '2px solid #eee' }}>{col}</th>
                  ))}
                  {preferences?.includeTaxBreakdown && <th style={{ textAlign: 'right', padding: '12px', fontWeight: 'bold', borderBottom: '2px solid #eee' }}>Tax %</th>}
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    {cols.map((col, cIdx) => (
                      <td key={cIdx} style={{ padding: '12px', textAlign: getColumnAlign(col) }}>{getColumnValue(item, col)}</td>
                    ))}
                    {preferences?.includeTaxBreakdown && <td style={{ textAlign: 'right', padding: '12px' }}>{item.taxRate || 0}%</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* Footer / Total Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', marginBottom: '40px' }}>
        <div style={{ border: '1px dashed #ddd', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.7em', fontWeight: 'bold' }}>Scan to Pay via UPI</p>
          <QRCodeSVG value={`upi://pay?pa=${(ownerUser as any)?.upiVpa || ''}&pn=${data.company.name}&am=${data.total}`} size={80} />
          <p style={{ margin: '10px 0 0 0', fontSize: '0.6em', color: '#888' }}>All UPI Apps Supported</p>
        </div>

        <div style={{ width: '280px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ color: '#888' }}>Subtotal:</span>
            <span>₹{data.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#888' }}>Tax:</span>
            <span>₹{data.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          {isVisible("6") && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '15px', 
              backgroundColor: colorScheme, 
              color: 'white', 
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '1.2em'
            }}>
              <span>{getLabel("6", "Total")}:</span>
              <span>₹{data.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>
      </div>

      {preferences?.showPaymentTerms !== false && (
        <div style={{ marginBottom: '20px', fontSize: '0.85em', color: '#666' }}>
          <p style={{ fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>Payment Terms:</p>
          <p>{preferences?.paymentTerms || 'Please pay by the due date mentioned above.'}</p>
        </div>
      )}

      <div style={{ textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px', color: '#aaa', fontSize: '0.8em' }}>
        <p>Thank you for your business!</p>
        <p>Generated via {template.name} Template</p>
      </div>
    </div>
  );
};

export default A4InvoicePreview;