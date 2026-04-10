import React from 'react';

const ModernBlue = ({ saleData, activeColumns, size = 'A4' }) => {
    // 🛠️ Optimized Layouts - A4, A5, 80mm, 58mm are EXACTLY your original code
    const layouts = {
        'A4': { width: '210mm', minHeight: '297mm', padding: '15mm', fontSize: '12pt', headerSize: '0.9em', rowHeight: '40px' },
        'A5': { width: '148mm', minHeight: '210mm', padding: '10mm', fontSize: '10pt', headerSize: '0.8em', rowHeight: '30px' },
        '1/4': { width: '105mm', minHeight: '148mm', padding: '6mm', fontSize: '8pt', headerSize: '0.75em', rowHeight: '24px' },
        '1/5': { width: '84mm', minHeight: '140mm', padding: '5mm', fontSize: '7.5pt', headerSize: '0.7em', rowHeight: '22px' },
        '1/6': { width: '70mm', minHeight: '130mm', padding: '4mm', fontSize: '7pt', headerSize: '0.7em', rowHeight: '20px' },
        '1/7': { width: '60mm', minHeight: '120mm', padding: '3mm', fontSize: '6.5pt', headerSize: '0.65em', rowHeight: '18px' },
        '1/8': { width: '52mm', minHeight: '105mm', padding: '2mm', fontSize: '6pt', headerSize: '0.6em', rowHeight: '16px' },
        '80mm': { width: '80mm', padding: '3mm', fontSize: '7.5pt', headerSize: '0.7em', rowHeight: '25px' }, // UNTOUCHED
        '58mm': { width: '58mm', padding: '2mm', fontSize: '6pt', headerSize: '0.65em', rowHeight: '20px' }, // UNTOUCHED
    };

    // Robust Size Matcher
    const normalizedSize = size.split(' ')[0]; // Handles '1/4 Size' -> '1/4'
    const config = layouts[normalizedSize] || layouts[size] || layouts['A4'];
    const isFraction = ['1/4', '1/5', '1/6', '1/7', '1/8'].includes(normalizedSize);

    const {
        summary = {}, items = [], storeName = 'BUSINESS NAME', storeAddress = 'Address Line, City',
        storeGSTIN = 'URD', billNo = '000', billDate = '01-01-2024', customerName = 'Walking Customer',
        customerPhone = '', customerAddress = '', customerGSTIN = '', paymentMode = 'Cash',
        upiId = '', bankName = '', accountNumber = '', ifscCode = ''
    } = saleData || {};

    const baseCols = activeColumns || ['S.No', 'Item Name', 'HSN', 'Qty', 'Rate', 'Amount'];
    const cols = [...baseCols.filter(c => c !== 'Amount'), 'Amount'];

    const getColLabel = (col) => {
        if (isFraction) {
            switch (col) {
                case 'S.No': return 'SN';
                case 'Item Name': return 'ITEM';
                case 'Qty': return 'QTY';
                case 'Rate': return 'RATE';
                case 'HSN': return 'HSN';
                case 'Amount': return 'AMT';
                default: return col;
            }
        }
        switch (col) {
            case 'S.No': return 'SR.';
            case 'Item Name': return 'DESCRIPTION';
            case 'Qty': return 'QTY';
            case 'Rate': return 'RATE';
            case 'HSN': return 'HSN';
            case 'Amount': return 'AMOUNT';
            default: return col;
        }
    };

    // 🎯 Fixed Widths for fractions to ensure 100% visibility
    const getColWidth = (col) => {
        if (isFraction) {
            switch (col) {
                case 'S.No': return '8%';
                case 'Item Name': return '34%';
                case 'Qty': return '12%';
                case 'HSN': return '14%';
                case 'Rate': return '16%';
                case 'Amount': return '16%';
                default: return 'auto';
            }
        }
        return 'auto';
    };

    return (
        <div style={{
            width: config.width,
            minHeight: config.minHeight || 'auto',
            padding: config.padding,
            fontSize: config.fontSize,
            fontFamily: "'Inter', sans-serif",
            backgroundColor: '#fff',
            color: '#000',
            margin: 'auto',
            boxSizing: 'border-box',
            overflow: 'hidden',
            border: size !== 'A4' ? '1px solid #ddd' : 'none'
        }}>

            {/* 🟦 Header - Layout untouched for A4/80mm */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #1e3a8a', paddingBottom: '10px', marginBottom: '10px' }}>
                <div style={{ flex: 2 }}>
                    <h1 style={{ margin: 0, fontSize: isFraction ? '1.2em' : '1.6em', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase' }}>{storeName}</h1>
                    <p style={{ margin: '4px 0', fontSize: '0.85em', color: '#4b5563', lineHeight: '1.2' }}>{storeAddress}</p>
                    <div style={{ fontWeight: '800', fontSize: '0.9em' }}>GST: {storeGSTIN}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                    <h2 style={{ margin: 0, fontSize: '0.9em', fontWeight: '900', color: '#6b7280' }}>TAX INVOICE</h2>
                    <div style={{ marginTop: '5px', padding: '4px', backgroundColor: '#f3f4f6', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                        <div style={{ fontSize: '0.65em', fontWeight: '800' }}>#{billNo} | {billDate}</div>
                    </div>
                </div>
            </div>

            {/* 👤 Customer Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '6px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <div style={{ flex: 1.5 }}>
                    <div style={{ fontSize: '0.6em', fontWeight: '900', color: '#1e3a8a' }}>BILLED TO:</div>
                    <div style={{ fontSize: '1em', fontWeight: '900' }}>{customerName}</div>
                    <div style={{ fontSize: '0.8em', color: '#4b5563' }}>{customerAddress}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8em' }}>Mode: <b>{paymentMode}</b></div>
                    {customerGSTIN && <div style={{ fontSize: '0.8em', fontWeight: '800' }}>GST: {customerGSTIN}</div>}
                </div>
            </div>

            {/* 📋 Table Grid - The Main Fix */}
            <div style={{ width: '100%', overflowX: 'hidden' }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '1px solid #000',
                    tableLayout: isFraction ? 'fixed' : 'auto'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#1e3a8a', color: '#fff' }}>
                            {cols.map((col, idx) => (
                                <th key={idx} style={{
                                    width: getColWidth(col),
                                    padding: '4px 2px',
                                    border: '1px solid #000',
                                    fontSize: config.headerSize,
                                    fontWeight: '900',
                                    textAlign: 'center'
                                }}>{getColLabel(col)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx} style={{ minHeight: config.rowHeight }}>
                                {cols.map((col, cIdx) => (
                                    <td key={cIdx} style={{
                                        padding: '4px 2px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '0.95em',
                                        fontWeight: (col === 'Item Name' || col === 'Amount') ? '800' : '500',
                                        textAlign: 'center',
                                        wordBreak: 'break-all',
                                        lineHeight: '1.1'
                                    }}>
                                        {col === 'S.No' ? idx + 1 :
                                            col === 'Item Name' ? item.name :
                                                col === 'HSN' ? item.hsn || '-' :
                                                    col === 'Qty' ? item.qty :
                                                        col === 'Rate' ? (item.rate || 0).toFixed(0) :
                                                            col === 'Amount' ? (item.total || 0).toFixed(0) : '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot style={{ borderTop: '2px solid #1e3a8a' }}>
                        <tr>
                            <td colSpan={cols.length - 1} style={{ padding: '4px', textAlign: 'right', fontWeight: '800', border: '1px solid #000', background: '#f9fafb' }}>TOTAL:</td>
                            <td style={{ padding: '4px', textAlign: 'center', fontWeight: '900', border: '1px solid #000' }}>{(summary.basicTotal || 0).toFixed(0)}</td>
                        </tr>
                        <tr style={{ backgroundColor: '#111827', color: '#fff' }}>
                            <td colSpan={cols.length - 1} style={{ padding: '6px', textAlign: 'right', fontWeight: '900', fontSize: '0.9em' }}>NET PAYABLE:</td>
                            <td style={{ padding: '6px', textAlign: 'center', fontWeight: '950', fontSize: '1em' }}>₹{(summary.grandTotal || 0).toFixed(0)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* 🖊️ Footer */}
            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ border: '1px solid #e5e7eb', padding: '6px', borderRadius: '4px', background: '#f9fafb', flex: 1.5 }}>
                    <div style={{ fontSize: '0.6em', fontWeight: '900', color: '#1e3a8a' }}>BANK INFO</div>
                    <div style={{ fontSize: '0.7em', fontWeight: '700' }}>{bankName}</div>
                    <div style={{ fontSize: '0.7em' }}>A/C: {accountNumber}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7em', marginBottom: '20px', fontWeight: '800' }}>For, {storeName}</div>
                    <div style={{ borderTop: '1px solid #000', width: '80%', margin: '0 auto', fontSize: '0.6em', fontWeight: '900' }}>AUTH. SIGN</div>
                </div>
            </div>
        </div>
    );
};

export default ModernBlue;