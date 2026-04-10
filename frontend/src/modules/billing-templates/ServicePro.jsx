import React from 'react';
import './InvoiceTemplates.css';
import UPIQRCode from './core/UPIQRCode';

/**
 * SERVICE PRO V12 - AERO-MODERN EDITION
 * Guaranteed: No Wrapping, Full Visibility across 58mm to A4.
 */
const ServicePro = ({ saleData, size = 'A4', activeColumns }) => {
    if (!saleData) return null;

    const {
        summary = {}, items = [], storeName = "SERVICE PRO", storeAddress = "",
        storeGSTIN = "", billNo = "AUTO", billDate = "", customerName = "",
        customerPhone = "", paymentMode = "Cash", upiId = ""
    } = saleData;

    const lowerSize = size.toLowerCase();

    // 📏 Multi-Size Scaling Engine (Precision Tuned)
    const getScale = () => {
        switch (lowerSize) {
            case 'a4': return { w: '210mm', p: '30px', f: '12px', h: '32px', b: '14px' };
            case 'a5': return { w: '148mm', p: '20px', f: '10px', h: '24px', b: '12px' };
            case '1/4': return { w: '105mm', p: '12px', f: '8.5px', h: '16px', b: '10px' };
            case '1/5': return { w: '84mm', p: '10px', f: '7.8px', h: '14px', b: '9px' };
            case '1/6': return { w: '70mm', p: '8px', f: '7.2px', h: '13px', b: '8.5px' };
            case '1/7': return { w: '60mm', p: '6px', f: '6.5px', h: '12px', b: '8px' };
            case '1/8': return { w: '52mm', p: '5px', f: '5.8px', h: '10px', b: '7.5px' };
            case '80mm': return { w: '80mm', p: '10px', f: '8px', h: '14px', b: '9.5px' };
            case '58mm': return { w: '58mm', p: '5px', f: '6.2px', h: '11px', b: '8px' };
            default: return { w: '100%', p: '20px', f: '10px', h: '20px', b: '12px' };
        }
    };

    const s = getScale();
    const isSmall = !['a4', 'a5'].includes(lowerSize);

    // Dynamic Columns Width (%)
    const getColWidth = (col) => {
        const widths = { 'S.No': '8%', 'Item Name': '42%', 'Qty': '12%', 'Rate': '18%', 'Amount': '20%' };
        return widths[col] || '15%';
    };

    const cellStyle = (col) => ({
        width: getColWidth(col),
        fontSize: s.f,
        padding: isSmall ? '4px 2px' : '10px 5px',
        whiteSpace: 'nowrap', // ❌ ZERO WRAPPING
        overflow: 'hidden',
        textOverflow: 'ellipsis', // ✨ Names will show '...' if too long
        boxSizing: 'border-box',
        textAlign: (col === 'Qty' || col === 'Rate' || col === 'Amount') ? 'right' : 'left',
        fontWeight: col === 'Amount' ? '800' : '500',
    });

    return (
        <div style={{
            width: s.w, padding: s.p, backgroundColor: '#fff', color: '#111',
            margin: 'auto', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
            lineHeight: 1.1
        }}>
            {/* Header: Creative Strip Design */}
            <div style={{ display: 'flex', borderBottom: '3px solid #3b82f6', paddingBottom: '10px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: s.h, fontWeight: '950', color: '#1e3a8a', margin: 0, letterSpacing: '-1px' }}>{storeName}</h1>
                    <p style={{ fontSize: `calc(${s.f} - 1px)`, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden' }}>{storeAddress}</p>
                    <div style={{ display: 'inline-block', backgroundColor: '#3b82f6', color: '#fff', padding: '2px 6px', fontSize: '7px', fontWeight: 'bold', marginTop: '4px' }}>
                        {storeGSTIN ? `GSTIN: ${storeGSTIN}` : 'TAX INVOICE'}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: s.b, fontWeight: '900', margin: 0 }}>#{billNo}</p>
                    <p style={{ fontSize: `calc(${s.f} - 1px)`, color: '#94a3b8' }}>{billDate}</p>
                </div>
            </div>

            {/* Client Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ borderLeft: '3px solid #e2e8f0', paddingLeft: '8px' }}>
                    <p style={{ fontSize: '8px', fontWeight: '900', color: '#3b82f6' }}>BILLED TO</p>
                    <h2 style={{ fontSize: s.b, fontWeight: '800', margin: 0 }}>{customerName || 'Value Client'}</h2>
                    <p style={{ fontSize: `calc(${s.f} - 1px)` }}>{customerPhone}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '8px', fontWeight: '900', color: '#3b82f6' }}>PAYMENT</p>
                    <p style={{ fontSize: s.f, fontWeight: '700' }}>{paymentMode}</p>
                </div>
            </div>

            {/* Table Header */}
            <div style={{ display: 'flex', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none' }}>
                {['S.No', 'Item Name', 'Qty', 'Rate', 'Amount'].map(col => (
                    <div key={col} style={{ ...cellStyle(col), fontWeight: '900', color: '#1e3a8a', fontSize: `calc(${s.f} - 1px)` }}>
                        {col.toUpperCase()}
                    </div>
                ))}
            </div>

            {/* Table Body */}
            <div>
                {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={cellStyle('S.No')}>{idx + 1}</div>
                        <div style={{ ...cellStyle('Item Name'), fontWeight: '700' }}>{item.name}</div>
                        <div style={cellStyle('Qty')}>{item.qty}</div>
                        <div style={cellStyle('Rate')}>{item.rate}</div>
                        <div style={cellStyle('Amount')}>₹{item.total}</div>
                    </div>
                ))}
            </div>

            {/* Grand Total Area */}
            <div style={{ display: 'flex', marginTop: '15px' }}>
                <div style={{ flex: 1, display: isSmall ? 'none' : 'block' }}>
                    <p style={{ fontSize: '8px', color: '#94a3b8', fontStyle: 'italic' }}>* Digital Services are subject to terms of service.</p>
                </div>
                <div style={{ width: isSmall ? '100%' : '180px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: s.f }}>
                        <span>Subtotal</span>
                        <span style={{ fontWeight: '700' }}>₹{summary.basicTotal}</span>
                    </div>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', padding: '8px',
                        backgroundColor: '#1e3a8a', color: '#fff', borderRadius: '4px', marginTop: '5px'
                    }}>
                        <span style={{ fontSize: '8px', fontWeight: '900' }}>TOTAL</span>
                        <span style={{ fontSize: s.b, fontWeight: '950' }}>₹{summary.grandTotal}</span>
                    </div>
                </div>
            </div>

            {/* QR and Signatures */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <UPIQRCode upiId={upiId} amount={summary.grandTotal} size={isSmall ? 40 : 60} />
                    <p style={{ fontSize: '7px', textAlign: 'center', marginTop: '2px' }}>Scan to Pay</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '80px', borderBottom: '1px solid #111', margin: '0 auto 4px auto' }}></div>
                    <p style={{ fontSize: '8px', fontWeight: '900' }}>PROVIDER SIGN</p>
                </div>
            </div>

            {/* Small Footer Branding */}
            <div style={{ textAlign: 'center', marginTop: '15px', borderTop: '1px dashed #e2e8f0', paddingTop: '5px' }}>
                <p style={{ fontSize: '7px', color: '#cbd5e1', letterSpacing: '3px' }}>PROFESSIONAL SERIES V12</p>
            </div>
        </div>
    );
};

export default ServicePro;