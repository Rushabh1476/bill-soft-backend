import React from 'react';

const VyaparSharpInvoice = ({ saleData, size = 'A4' }) => {
    // Basic guard clause
    if (!saleData) return null;

    // Destructuring with all required fields (Fixed: added paymentMode)
    const {
        summary = { basicTotal: 0, taxTotal: 0, grandTotal: 0 },
        items = [],
        storeName = "BUSINESS NAME",
        storeAddress = "",
        storeGSTIN = "",
        billNo = "001",
        billDate = "",
        customerName = "Customer",
        customerPhone = "",
        paymentMode = "Cash", // Now defined
    } = saleData;

    // 📏 Precision Layout Mapping
    const layouts = {
        'a4': { w: '210mm', minH: '290mm', p: '25px', f: '13px', h: '32px', b: '18px', rowH: '35px', sr: '8%', name: '45%', rate: '15%', qty: '12%', amt: '20%' },
        'a5': { w: '148mm', minH: '200mm', p: '15px', f: '11px', h: '24px', b: '15px', rowH: '28px', sr: '10%', name: '40%', rate: '15%', qty: '15%', amt: '20%' },
        '80mm': { w: '80mm', minH: 'auto', p: '10px', f: '10px', h: '18px', b: '12px', rowH: '22px', sr: '12%', name: '40%', rate: '0%', qty: '20%', amt: '28%' },
        '58mm': { w: '58mm', minH: 'auto', p: '5px', f: '8.5px', h: '16px', b: '11px', rowH: '18px', sr: '15%', name: '45%', rate: '0%', qty: '15%', amt: '25%' },
        '1/8': { w: '52mm', minH: 'auto', p: '4px', f: '8px', h: '14px', b: '10px', rowH: '16px', sr: '15%', name: '45%', rate: '0%', qty: '15%', amt: '25%' },
    };

    const s = layouts[size.toLowerCase()] || layouts['a4'];
    const brandColor = '#1e3a8a';
    const isA4 = size.toLowerCase() === 'a4';

    // Internal cell style to maintain consistency
    const cellStyle = (width, textAlign = 'center', isHeader = false) => ({
        width: width,
        padding: isA4 ? '10px 5px' : '4px 2px',
        border: '1px solid #1e3a8a',
        textAlign: textAlign,
        fontSize: s.f,
        fontWeight: isHeader ? 'bold' : '500',
        color: isHeader ? '#fff' : '#000',
        backgroundColor: isHeader ? brandColor : 'transparent',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        boxSizing: 'border-box'
    });

    return (
        <div style={{
            width: s.w,
            minHeight: s.minH || 'auto',
            padding: s.p,
            backgroundColor: '#fff',
            color: '#000',
            margin: 'auto',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            boxSizing: 'border-box',
            border: isA4 ? '1px solid #ddd' : 'none',
        }} className="classic-sharp-template">

            {/* Header Design */}
            <div style={{ height: '6px', background: brandColor, marginBottom: '20px' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ width: '60%' }}>
                    <h1 style={{ margin: 0, fontSize: s.h, color: brandColor, fontWeight: '900', textTransform: 'uppercase' }}>{storeName}</h1>
                    <p style={{ margin: '4px 0', fontSize: s.f, color: '#444' }}>{storeAddress}</p>
                    <p style={{ margin: 0, fontSize: s.f, fontWeight: 'bold' }}>GST: <span style={{ color: brandColor }}>{storeGSTIN}</span></p>
                </div>
                <div style={{ textAlign: 'right', width: '35%' }}>
                    <div style={{ background: brandColor, color: '#fff', padding: '4px 12px', display: 'inline-block', fontWeight: 'bold', marginBottom: '5px' }}>TAX INVOICE</div>
                    <p style={{ margin: 0, fontSize: s.f }}>Invoice No: <b>{billNo}</b></p>
                    <p style={{ margin: 0, fontSize: s.f }}>Date: <b>{billDate}</b></p>
                </div>
            </div>

            {/* Customer Section */}
            <div style={{
                border: `1px solid ${brandColor}`,
                padding: isA4 ? '12px' : '8px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: '#f9fafb'
            }}>
                <div>
                    <span style={{ fontSize: '10px', color: brandColor, fontWeight: 'bold' }}>BILL TO</span>
                    <p style={{ margin: '2px 0', fontSize: s.b, fontWeight: 'bold' }}>{customerName}</p>
                    <p style={{ margin: 0, fontSize: s.f }}>{customerPhone}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '10px', color: brandColor, fontWeight: 'bold' }}>PAYMENT</span>
                    <p style={{ margin: '2px 0', fontSize: s.b, fontWeight: 'bold' }}>{paymentMode}</p>
                </div>
            </div>

            {/* Table Section */}
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                    <tr>
                        <th style={cellStyle(s.sr, 'center', true)}>SR</th>
                        <th style={cellStyle(s.name, 'left', true)}>ITEM DESCRIPTION</th>
                        {s.rate !== '0%' && <th style={cellStyle(s.rate, 'center', true)}>RATE</th>}
                        <th style={cellStyle(s.qty, 'center', true)}>QTY</th>
                        <th style={cellStyle(s.amt, 'right', true)}>AMOUNT</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx} style={{ height: s.rowH }}>
                            <td style={cellStyle(s.sr)}>{idx + 1}</td>
                            <td style={{ ...cellStyle(s.name, 'left'), fontWeight: '600' }}>{item.name}</td>
                            {s.rate !== '0%' && <td style={cellStyle(s.rate)}>{item.rate}</td>}
                            <td style={cellStyle(s.qty)}>{item.qty}</td>
                            <td style={{ ...cellStyle(s.amt, 'right'), fontWeight: 'bold' }}>{item.total}</td>
                        </tr>
                    ))}
                    {isA4 && items.length < 8 && Array(8 - items.length).fill(0).map((_, i) => (
                        <tr key={`blank-${i}`} style={{ height: s.rowH }}>
                            <td style={cellStyle(s.sr)}></td>
                            <td style={cellStyle(s.name)}></td>
                            {s.rate !== '0%' && <td style={cellStyle(s.rate)}></td>}
                            <td style={cellStyle(s.qty)}></td>
                            <td style={cellStyle(s.amt)}></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Total Calculation */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <div style={{ width: isA4 ? '35%' : '50%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                        <span style={{ fontSize: s.f }}>Sub Total</span>
                        <span style={{ fontSize: s.f, fontWeight: 'bold' }}>₹{summary.basicTotal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #ddd' }}>
                        <span style={{ fontSize: s.f }}>Total Tax</span>
                        <span style={{ fontSize: s.f, fontWeight: 'bold' }}>₹{summary.taxTotal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 5px', background: brandColor, color: '#fff', marginTop: '5px' }}>
                        <span style={{ fontWeight: 'bold' }}>TOTAL</span>
                        <span style={{ fontSize: isA4 ? '18px' : s.f, fontWeight: '900' }}>₹{summary.grandTotal}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: isA4 ? '50px' : '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '10px', color: '#666' }}>
                    <p style={{ margin: 0 }}>* Computer generated invoice.</p>
                    <p style={{ margin: 0 }}>* Goods once sold will not be returned.</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 35px 0', fontSize: s.f, fontWeight: 'bold' }}>Authorised Signatory</p>
                    <div style={{ borderTop: '1px solid #000', width: isA4 ? '160px' : '100px' }}></div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: ${size === '58mm' ? '58mm auto' : size === '80mm' ? '80mm auto' : 'A4'}; margin: 0; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
};

export default VyaparSharpInvoice;