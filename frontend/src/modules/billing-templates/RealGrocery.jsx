import React from 'react';
import './InvoiceTemplates.css';
import UPIQRCode from './core/UPIQRCode';

/**
 * RetailAdvanced Premium - FIXED (No-Wrap & Center Aligned)
 * Sizes Supported: A4, A5, 58mm, 80mm, 1/4, 1/5, 1/6, 1/7, 1/8
 */
const RealGrocery = ({ saleData, size = 'A4', activeColumns }) => {
    if (!saleData) return null;

    const {
        summary = {}, items = [], storeName = "RETAIL ADVANCED", storeAddress = "",
        storeGSTIN = "", billNo = "AUTO", billDate = "", customerName = "",
        customerPhone = "", paymentMode = "Cash", upiId = ""
    } = saleData;

    const lowerSize = size.toLowerCase();
    const isA4 = lowerSize === 'a4';
    const isA5 = lowerSize === 'a5';

    // 📏 Dynamic Scaling Engine (Retail High-Fidelity)
    const getScale = () => {
        switch (lowerSize) {
            case 'a4': return { w: '210mm', minH: '290mm', p: '40px', f: '13px', h: '36px', b: '16px', logo: '50px' };
            case 'a5': return { w: '148mm', minH: '200mm', p: '25px', f: '11px', h: '28px', b: '14px', logo: '40px' };
            case '1/4': return { w: '105mm', minH: 'auto', p: '15px', f: '8.5px', h: '16px', b: '10px', logo: '30px' };
            case '1/8': return { w: '52mm', minH: 'auto', p: '6px', f: '5.5px', h: '10px', b: '7.5px', logo: '20px' };
            case '80mm': return { w: '80mm', minH: 'auto', p: '15px', f: '8.5px', h: '16px', b: '10px', logo: '32px' };
            case '58mm': return { w: '58mm', minH: 'auto', p: '8px', f: '6.5px', h: '12px', b: '8px', logo: '22px' };
            default: return { w: '100%', minH: 'auto', p: '20px', f: '10px', h: '20px', b: '12px', logo: '30px' };
        }
    };

    const s = getScale();
    const isSmall = !['a4', 'a5'].includes(lowerSize);

    const noWrap = {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    };

    const cellStyle = (width, textAlign = 'center') => ({
        width: width,
        fontSize: s.f,
        padding: lowerSize === '1/8' ? '2px 1px' : (isSmall ? '6px 2px' : '15px 10px'),
        textAlign: textAlign,
        ...noWrap,
        boxSizing: 'border-box'
    });

    return (
        <div style={{
            width: s.w, minHeight: s.minH, padding: s.p, backgroundColor: '#fff',
            color: '#0f172a', margin: 'auto', fontFamily: "'Inter', sans-serif",
            boxSizing: 'border-box', lineHeight: 1.3
        }}>
            {/* Dark Premium Header */}
            <div style={{ background: '#0f172a', color: '#fff', padding: isSmall ? '15px' : '30px', borderRadius: '12px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '70%' }}>
                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#3b82f6', letterSpacing: '2px', marginBottom: '5px' }}>OFFICIAL TAX INVOICE</div>
                    <h1 style={{ fontSize: s.h, fontWeight: '900', margin: 0, letterSpacing: '-1px', ...noWrap }}>{storeName}</h1>
                    <p style={{ fontSize: s.f, opacity: 0.7, margin: '5px 0 0 0', ...noWrap }}>{storeAddress}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: s.b, fontWeight: '950', background: 'rgba(255,255,255,0.1)', padding: '5px 15px', borderRadius: '8px' }}>#{billNo}</div>
                    <p style={{ fontSize: '10px', opacity: 0.5, marginTop: '8px', fontWeight: 'bold' }}>{billDate}</p>
                </div>
            </div>

            {/* Entity Details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 5px 25px 5px', borderBottom: '2px solid #f1f5f9', marginBottom: '25px' }}>
                <div style={{ width: '100%' }}>
                    <p style={{ fontSize: '8px', fontWeight: '900', color: '#64748b', marginBottom: '5px', letterSpacing: '1px' }}>BILLING TO</p>
                    <h2 style={{ fontSize: s.b, fontWeight: '900', margin: 0 }}>{customerName || 'Walking Customer'}</h2>
                    <p style={{ fontSize: s.f, color: '#64748b', margin: '2px 0' }}>Phone: {customerPhone}</p>
                </div>
            </div>

            {/* Table Area */}
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '2px solid #0f172a', borderRadius: '8px 8px 0 0' }}>
                    <div style={cellStyle('10%', 'center')}>SR.</div>
                    <div style={cellStyle('50%', 'left')}>PRODUCT DESCRIPTION</div>
                    <div style={cellStyle('15%', 'center')}>QTY</div>
                    <div style={cellStyle('25%', 'right')}>TOTAL</div>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    {items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                            <div style={cellStyle('10%', 'center')}>{idx + 1}</div>
                            <div style={{ ...cellStyle('50%', 'left'), fontWeight: '700', color: '#1e293b' }}>{item.name}</div>
                            <div style={cellStyle('15%', 'center')}>{item.qty}</div>
                            <div style={{ ...cellStyle('25%', 'right'), fontWeight: '950', color: '#0f172a' }}>₹{item.total}</div>
                        </div>
                    ))}
                    {(isA4 || isA5) && items.length < 8 && Array(8 - items.length).fill(0).map((_, i) => (
                        <div key={i} style={{ height: isA4 ? '50px' : '35px', borderBottom: '1px solid #f1f5f9' }}></div>
                    ))}
                </div>
            </div>

            {/* Bottom Summary Block */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '30px' }}>
                <div style={{ width: '40%' }}>
                    <div style={{ background: '#f8fafc', padding: isSmall ? '10px' : '20px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <UPIQRCode upiId={upiId} amount={summary.grandTotal} size={isSmall ? 45 : 70} />
                        <div>
                            <p style={{ fontSize: '8px', fontWeight: '900', color: '#64748b', marginBottom: '2px' }}>MODE</p>
                            <p style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>{paymentMode}</p>
                        </div>
                    </div>
                </div>

                <div style={{ width: isSmall ? '55%' : '300px' }}>
                    <div style={{ padding: '0 10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: s.f, fontWeight: 'bold', color: '#64748b' }}>
                            <span>SUBTOTAL</span>
                            <span>₹{summary.basicTotal}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: s.f, fontWeight: 'bold', color: '#64748b' }}>
                            <span>TAX VALUE</span>
                            <span>₹{summary.taxTotal}</span>
                        </div>
                    </div>
                    <div style={{ backgroundColor: '#0f172a', padding: isSmall ? '12px' : '25px', borderRadius: '15px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '9px', fontWeight: '900', opacity: 0.5 }}>NET PAYABLE</span>
                            <span style={{ fontSize: isSmall ? '18px' : '32px', fontWeight: '950', fontStyle: 'italic' }}>₹{summary.grandTotal}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Signatures */}
            <div style={{ marginTop: '50px', borderTop: '1px dashed #cbd5e1', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ width: '60%' }}>
                    <p style={{ fontSize: '8px', color: '#94a3b8', lineHeight: 1.5, textTransform: 'uppercase' }}>
                        * E. & O.E. Goods once sold will not be taken back.<br />
                        * Interest @ 18% p.a. will be charged for delayed payment.
                    </p>
                </div>
                <div style={{ textAlign: 'center', width: '30%' }}>
                    <div style={{ borderBottom: '2px solid #0f172a', marginBottom: '8px' }}></div>
                    <p style={{ fontSize: '9px', fontWeight: '900' }}>AUTH. SIGNATORY</p>
                </div>
            </div>

            <p style={{ textAlign: 'center', marginTop: '30px', fontSize: '7px', letterSpacing: '8px', opacity: 0.2, fontWeight: '900' }}>RETAIL PRO SERIES V10</p>
        </div>
    );
};

export default RealGrocery;