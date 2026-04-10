import React from 'react';

/**
 * MedicalStoreReal - High Density Retail Edition
 * QR Code removed as requested.
 * Zero-Wrap Engine for 1/8 to A4 sizes.
 */
const MedicalStoreReal = ({ saleData, size = 'A5', activeColumns: propColumns }) => {
    if (!saleData) return null;

    const {
        summary = {}, items = [], storeName = "SHREE MEDICAL STORE", storeAddress = "",
        storeGSTIN = "", billNo = "AUTO", billDate = "", customerName = "",
        customerPhone = "", paymentMode = "Cash", customFields = {}
    } = saleData;

    const lowerSize = size.toLowerCase();

    // 📏 Ultra-Dense Scaling Engine
    const getScale = () => {
        switch (lowerSize) {
            case 'a4': return { w: '210mm', minH: '290mm', p: '30px', f: '13px', h: '42px', b: '16px', sr: '8%', qty: '12%', batch: '18%', amt: '18%' };
            case 'a5': return { w: '148mm', minH: '200mm', p: '15px', f: '11px', h: '32px', b: '14px', sr: '10%', qty: '14%', batch: '20%', amt: '20%' };
            case '1/4': return { w: '105mm', minH: 'auto', p: '10px', f: '9px', h: '24px', b: '11px', sr: '15%', qty: '15%', batch: '20%', amt: '20%' };
            case '1/8': return { w: '52mm', minH: 'auto', p: '5px', f: '6.5px', h: '14px', b: '8px', sr: '18%', qty: '18%', batch: '0%', amt: '25%' };
            case '80mm': return { w: '80mm', minH: 'auto', p: '10px', f: '9px', h: '22px', b: '11px', sr: '12%', qty: '15%', batch: '18%', amt: '22%' };
            case '58mm': return { w: '58mm', minH: 'auto', p: '5px', f: '7px', h: '16px', b: '9px', sr: '18%', qty: '18%', batch: '0%', amt: '25%' };
            default: return { w: '100%', minH: 'auto', p: '15px', f: '10px', h: '26px', b: '12px', sr: '10%', qty: '15%', batch: '20%', amt: '20%' };
        }
    };

    const s = getScale();
    const isSmall = !['a4', 'a5'].includes(lowerSize);

    // 📏 DYNAMIC COLUMN LOGIC
    const defaultCols = ['S.No', 'Item Name', 'Batch', 'Qty', 'Amount'];
    const displayCols = propColumns && propColumns.length > 0 ? propColumns : defaultCols;

    const noWrapStyle = {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    };

    const cell = (width, textAlign = 'left', extra = {}) => ({
        width: width,
        padding: isSmall ? '4px 2px' : '8px 4px',
        textAlign: textAlign,
        fontSize: s.f,
        ...noWrapStyle,
        boxSizing: 'border-box',
        borderRight: '1px solid #ddd',
        ...extra
    });

    const getColumnWidth = (col) => {
        if (col === 'S.No') return s.sr;
        if (col === 'Item Name' || col === 'PRODUCT DESCRIPTION') return '35%';
        if (col === 'Qty') return s.qty;
        if (col === 'Amount') return s.amt;
        const remaining = 100 - (parseInt(s.sr) + 35 + parseInt(s.qty) + parseInt(s.amt));
        return `${Math.max(10, remaining / 2)}%`;
    };

    const getColumnAlign = (col) => {
        const c = col.toLowerCase();
        if (c.includes('name') || c.includes('desc')) return 'left';
        if (c.includes('s.no') || c.includes('qty') || c.includes('rate') || c.includes('tax') || c.includes('batch') || c.includes('exp')) return 'center';
        return 'right';
    };

    const getColumnValue = (item, col, idx) => {
        const c = col.toLowerCase();
        if (c === 's.no') return idx + 1;
        if (c === 'item name' || c === 'product description') return item.name.toUpperCase();
        if (c === 'batch') return item.batch || item.customFields?.batch || '-';
        if (c === 'qty') return item.qty;
        if (c === 'rate') return item.rate;
        if (c === 'tax') return `${item.taxRate}%`;
        if (c === 'amount') return item.total;
        return item.customFields?.[col] || item.customFields?.[col.toLowerCase()] || '-';
    };

    return (
        <div style={{
            width: s.w, minHeight: s.minH, padding: s.p, backgroundColor: '#fff',
            color: '#1a1a1a', margin: 'auto', fontFamily: "'Courier New', Courier, monospace",
            boxSizing: 'border-box', lineHeight: 1.1, border: '2px solid #333'
        }}>

            <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '10px' }}>
                <h1 style={{ fontSize: s.h, fontWeight: '950', margin: '0 0 5px 0', textTransform: 'uppercase', color: '#004d40', letterSpacing: '-1px' }}>
                    ✚ {storeName} ✚
                </h1>
                <p style={{ fontSize: s.f, fontWeight: '700', margin: 0 }}>{storeAddress}</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '5px', fontWeight: 'bold', fontSize: `calc(${s.f} - 1px)` }}>
                    <span>DL No: {customFields.dlNo || '21B-4554/21C-4555'}</span>
                    <span>GST: {storeGSTIN || 'NOT REGISTERED'}</span>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #333', paddingBottom: '5px', marginBottom: '10px' }}>
                <div style={{ width: '50%' }}>
                    <p style={{ margin: 0, fontSize: s.f }}><b>PATIENT:</b> {customerName.toUpperCase()}</p>
                    <p style={{ margin: 0, fontSize: s.f }}><b>PHONE:</b> {customerPhone || 'N/A'}</p>
                </div>
                <div style={{ width: '45%', textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: s.f }}><b>BILL NO:</b> {billNo}</p>
                    <p style={{ margin: 0, fontSize: s.f }}><b>DATE:</b> {billDate}</p>
                </div>
            </div>

            {/* Table Header */}
            <div style={{ display: 'flex', borderBottom: '2px solid #333', borderTop: '2px solid #333', background: '#f0f0f0', fontWeight: '900' }}>
                {displayCols.map((col, idx) => (
                    <div key={idx} style={cell(getColumnWidth(col), getColumnAlign(col))}>
                        {col.toUpperCase()}
                    </div>
                ))}
            </div>

            {/* Table Body */}
            <div style={{ minHeight: isSmall ? '150px' : '350px' }}>
                {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
                        {displayCols.map((col, cIdx) => (
                            <div key={cIdx} style={{ 
                                ...cell(getColumnWidth(col), getColumnAlign(col)),
                                fontWeight: col === 'Item Name' || col === 'Amount' ? '900' : 'bold'
                            }}>
                                {getColumnValue(item, col, idx)}
                                {col === 'Item Name' && (
                                    <span style={{ fontSize: '7px', display: 'block', opacity: 0.7 }}>{item.mfg || 'GENERIC'}</span>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Total Section: Bhara-bhara look */}
            <div style={{ borderTop: '2px solid #333', marginTop: '10px', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ width: '60%', fontSize: '8px', fontStyle: 'italic' }}>
                        <b>Terms:</b><br />
                        1. Medicine sold without doctor's prescription is prohibited.<br />
                        2. Check Expiry/Batch before use.<br />
                        3. No return for refrigerated items.
                    </div>
                    <div style={{ width: '35%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <span style={{ fontSize: s.f, fontWeight: 'bold' }}>TOTAL:</span>
                            <span style={{ fontSize: s.f, fontWeight: 'bold' }}>₹{summary.basicTotal}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px', background: '#333', color: '#fff', borderRadius: '3px' }}>
                            <span style={{ fontSize: s.f, fontWeight: '900' }}>NET:</span>
                            <span style={{ fontSize: isSmall ? s.f : '18px', fontWeight: '950' }}>₹{summary.grandTotal}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Details */}
            <div style={{ marginTop: '10px', fontSize: s.f, border: '1px solid #333', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>
                PAYMENT MODE: {paymentMode.toUpperCase()} | TOTAL ITEMS: {items.length}
            </div>

            {/* Signatory */}
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '8px', margin: 0 }}>Customer Sign</p>
                    <div style={{ width: '80px', borderBottom: '1px solid #333', marginTop: '15px' }}></div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '9px', fontWeight: 'bold', margin: 0 }}>FOR {storeName}</p>
                    <div style={{ width: '120px', borderBottom: '1px solid #333', marginTop: '25px' }}></div>
                    <p style={{ fontSize: '8px', marginTop: '5px' }}>Authorised Signatory</p>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <p style={{ fontSize: '7px', letterSpacing: '2px' }}>*** THANK YOU - GET WELL SOON ***</p>
            </div>
        </div>
    );
};

export default MedicalStoreReal;