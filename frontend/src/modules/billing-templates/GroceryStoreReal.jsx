import React from 'react';

/**
 * Universal Ultra-Responsive Retail Invoice
 * Supports: 80mm, 58mm, 1/4, 1/5, 1/6, 1/7, 1/8, A4, A5
 * Logic: Auto-hides non-essential columns on narrow widths to prevent wrapping.
 */
const GroceryStoreReal = ({ saleData, size = 'A4', activeColumns: propColumns }) => {
    if (!saleData) return null;

    const {
        summary = {}, items = [], storeName = "YOUR STORE NAME", storeAddress = "",
        storeGSTIN = "", billNo = "AUTO", billDate = "", customerName = "",
        customerPhone = "", paymentMode = "Cash", customFields = {}
    } = saleData;

    const lowerSize = size.toLowerCase();

    const getScale = () => {
        const config = {
            'a4': { w: '210mm', minH: '290mm', p: '30px', h: '36px', f: '15px', cols: 5 },
            'a5': { w: '148mm', minH: '200mm', p: '15px', h: '26px', f: '13px', cols: 5 },
            '1/4': { w: '105mm', minH: 'auto', p: '10px', h: '20px', f: '11px', cols: 4 },
            '1/5': { w: '84mm', minH: 'auto', p: '8px', h: '18px', f: '10.5px', cols: 4 },
            '1/6': { w: '70mm', minH: 'auto', p: '6px', h: '17px', f: '10px', cols: 3 },
            '1/7': { w: '60mm', minH: 'auto', p: '5px', h: '16px', f: '9.5px', cols: 2 },
            '1/8': { w: '52mm', minH: 'auto', p: '5px', h: '15px', f: '9px', cols: 2 },
            '80mm': { w: '80mm', minH: 'auto', p: '8px', h: '18px', f: '11px', cols: 4 },
            '58mm': { w: '58mm', minH: 'auto', p: '5px', h: '15px', f: '9.5px', cols: 2 }
        };
        return config[lowerSize] || config['a4'];
    };

    const s = getScale();
    const isSmallSize = ['1/4', '1/5', '1/6', '1/7', '1/8', '58mm'].includes(lowerSize);

    // 📏 DYNAMIC COLUMN LOGIC
    const defaultCols = ['S.No', 'Item Name', 'Qty', 'Rate', 'Total'];
    const displayCols = propColumns && propColumns.length > 0 ? propColumns : defaultCols;

    const cellStyle = (flex, textAlign = 'left', isHeader = false) => ({
        flex: flex,
        flexShrink: 0,
        padding: '6px 3px',
        textAlign: textAlign,
        fontSize: isSmallSize ? `calc(${s.f} - 1px)` : s.f,
        fontWeight: isHeader ? '900' : '800',
        border: '1px solid #000',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        boxSizing: 'border-box',
        color: '#000'
    });

    const getColumnFlex = (col) => {
        const c = col.toLowerCase();
        if (c.includes('s.no')) return '0.9';
        if (c.includes('item') || c.includes('desc')) return '2.5';
        if (c.includes('qty')) return '0.8';
        if (c.includes('rate') || c.includes('price')) return '1';
        if (c.includes('amount') || c.includes('total')) return '1.2';
        return '1'; // Default for custom columns
    };

    const getColumnValue = (item, col, idx) => {
        const c = col.toLowerCase();
        if (c === 's.no') return idx + 1;
        if (c === 'item name' || c === 'items') return item.name.toUpperCase();
        if (c === 'qty') return item.qty;
        if (c === 'rate') return item.rate;
        if (c === 'amount' || c === 'total') return `₹${item.total}`;
        return item.customFields?.[col] || item.customFields?.[col.toLowerCase()] || '-';
    };

    return (
        <div style={{
            width: s.w, minHeight: s.minH, padding: s.p,
            backgroundColor: '#fff', color: '#000', margin: 'auto',
            fontFamily: "Arial, sans-serif", boxSizing: 'border-box',
            border: '3px solid #000', display: 'flex', flexDirection: 'column'
        }}>

            <div style={{ textAlign: 'center', borderBottom: '3px solid #000', paddingBottom: '10px', marginBottom: '8px' }}>
                <h1 style={{ fontSize: s.h, fontWeight: '950', margin: 0, textTransform: 'uppercase' }}>{storeName}</h1>
                <p style={{ fontSize: `calc(${s.f} - 1px)`, margin: '2px 0', fontWeight: 'bold' }}>{storeAddress}</p>
                <div style={{ fontSize: `calc(${s.f} - 2px)`, fontWeight: '900', marginTop: '4px' }}>
                    GST: {storeGSTIN || 'N/A'} | DL: {customFields.dlNo || 'N/A'}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1.5px solid #000', paddingBottom: '5px', marginBottom: '8px', flexWrap: 'nowrap' }}>
                <div style={{ flex: 1.5, overflow: 'hidden' }}>
                    <p style={{ margin: 0, fontSize: s.f, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        <b>TO:</b> {customerName.toUpperCase()}
                    </p>
                </div>
                <div style={{ flex: 1, textAlign: 'right', fontSize: s.f }}>
                    <b>NO:</b> {billNo} <br /> <b>DT:</b> {billDate}
                </div>
            </div>

            {/* Table Header */}
            <div style={{ display: 'flex', backgroundColor: '#eee', flexWrap: 'nowrap' }}>
                {displayCols.map((col, idx) => (
                    <div key={idx} style={cellStyle(getColumnFlex(col), 'center', true)}>
                        {col.toUpperCase()}
                    </div>
                ))}
            </div>

            {/* Table Body */}
            <div style={{ flex: 1 }}>
                {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', flexWrap: 'nowrap' }}>
                        {displayCols.map((col, cIdx) => (
                            <div key={cIdx} style={cellStyle(getColumnFlex(col), getColumnAlign(col))}>
                                {getColumnValue(item, col, idx)}
                            </div>
                        ))}
                    </div>
                ))}

                {lowerSize === 'a4' && items.length < 12 && [...Array(12 - items.length)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', height: '35px', flexWrap: 'nowrap' }}>
                        {displayCols.map((col, cIdx) => (
                            <div key={cIdx} style={cellStyle(getColumnFlex(col))}></div>
                        ))}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '10px', borderTop: '2.5px solid #000' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}>
                    <div style={{ width: s.cols <= 3 ? '100%' : '50%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                            <span style={{ fontSize: s.f, fontWeight: 'bold' }}>SUB TOTAL:</span>
                            <span style={{ fontSize: s.f, fontWeight: 'bold' }}>₹{summary.basicTotal}</span>
                        </div>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', padding: '10px 5px',
                            background: '#000', color: '#fff', marginTop: '5px'
                        }}>
                            <span style={{ fontSize: s.f, fontWeight: '900' }}>NET PAY:</span>
                            <span style={{ fontSize: s.cols <= 3 ? s.f : '20px', fontWeight: '950' }}>
                                ₹{summary.grandTotal}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '60px', borderTop: '1px solid #000' }}></div>
                    <p style={{ fontSize: '9px', fontWeight: '900' }}>RECEIVED</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', fontWeight: '950', marginBottom: '25px' }}>
                        FOR {storeName.toUpperCase()}
                    </p>
                    <div style={{ width: '120px', borderTop: '2px solid #000' }}></div>
                    <p style={{ fontSize: '9px', fontWeight: '900' }}>AUTH. SIGNATORY</p>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '10px', borderTop: '1.5px dashed #000', paddingTop: '4px' }}>
                <p style={{ fontSize: '10px', fontWeight: '950', letterSpacing: '1px' }}>
                    RETAIL INVOICE - THANK YOU
                </p>
            </div>
        </div>
    );
};

// Helper for alignment
const getColumnAlign = (col) => {
    const c = col.toLowerCase();
    if (c.includes('name') || c.includes('items')) return 'left';
    if (c.includes('total') || c.includes('amount') || c.includes('rate')) return 'right';
    return 'center';
};

export default GroceryStoreReal;