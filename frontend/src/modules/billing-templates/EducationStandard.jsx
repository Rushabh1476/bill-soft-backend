import React from 'react';
import './InvoiceTemplates.css';

const EducationStandard = ({ saleData, size = 'A4', activeColumns }) => {
    if (!saleData) return null;

    const {
        summary = {}, items = [], storeName = "ACADEMIC INSTITUTE", storeAddress = "",
        storeGSTIN = "", billNo = "AUTO", billDate = "", customerName = "",
        customerPhone = "", paymentMode = "Cash", customFields = {}
    } = saleData;

    const lowerSize = size.toLowerCase();
    const isA4 = lowerSize === 'a4';
    const isA5 = lowerSize === 'a5';
    const isSmall = !isA4 && !isA5;

    // 📏 Dynamic Scaling Engine (No-Wrap Focus)
    const getScale = () => {
        switch (lowerSize) {
            case 'a4': return { w: '210mm', minH: '290mm', p: '40px', f: '13px', h: '38px', b: '16px', icon: '60px' };
            case 'a5': return { w: '148mm', minH: '200mm', p: '25px', f: '11px', h: '28px', b: '14px', icon: '45px' };
            case '1/4': return { w: '105mm', minH: 'auto', p: '12px', f: '8.5px', h: '16px', b: '10px', icon: '30px' };
            // 1/8 size ko optimize kiya gaya hai overlap rokne ke liye
            case '1/8': return { w: '52mm', minH: 'auto', p: '4px', f: '5px', h: '11px', b: '7.5px', icon: '18px' };
            case '80mm': return { w: '80mm', minH: 'auto', p: '10px', f: '8.5px', h: '16px', b: '10px', icon: '30px' };
            case '58mm': return { w: '58mm', minH: 'auto', p: '5px', f: '6.5px', h: '12px', b: '8px', icon: '22px' };
            default: return { w: '100%', minH: 'auto', p: '20px', f: '10px', h: '20px', b: '12px', icon: '35px' };
        }
    };

    const s = getScale();

    const noWrap = {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    };

    const cellStyle = (width, textAlign = 'left') => ({
        width: width,
        fontSize: s.f,
        // 1/8 size mein padding kam ki hai taaki space bache
        padding: lowerSize === '1/8' ? '3px 1px' : (isSmall ? '5px 2px' : '15px 10px'),
        textAlign: textAlign,
        ...noWrap,
        boxSizing: 'border-box'
    });

    return (
        <div style={{
            width: s.w, minHeight: s.minH, padding: s.p, backgroundColor: '#fff',
            color: '#451a03', margin: 'auto', fontFamily: "'Outfit', sans-serif",
            boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
            border: isSmall ? '1px solid #eee' : 'none'
        }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #b45309', paddingBottom: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '70%' }}>
                    <div style={{
                        width: s.icon, height: s.icon, background: '#b45309', color: '#fff',
                        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '900', fontSize: `calc(${s.icon} / 2)`, flexShrink: 0
                    }}>
                        {storeName.charAt(0)}
                    </div>
                    <div style={{ width: '100%' }}>
                        <h1 style={{ fontSize: s.h, fontWeight: '950', margin: 0, color: '#78350f', ...noWrap }}>{storeName}</h1>
                        <p style={{ fontSize: `calc(${s.f} + 1px)`, margin: '2px 0', color: '#b45309', fontWeight: '600', ...noWrap }}>{storeAddress}</p>
                        <p style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px', color: '#92400e' }}>ACADEMIC SESSION: 2024-25</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right', width: '25%' }}>
                    <p style={{ fontSize: s.b, fontWeight: '900', margin: 0, color: '#78350f' }}>FEE RECEIPT</p>
                    <p style={{ fontSize: s.f, margin: 0, fontWeight: 'bold' }}>#{billNo}</p>
                    <p style={{ fontSize: s.f, margin: 0, color: '#94a3b8' }}>{billDate}</p>
                </div>
            </div>

            {/* Student & Parent Info Details */}
            <div style={{ display: 'flex', background: '#fffbeb', padding: isSmall ? '10px' : '20px', borderRadius: '15px', marginBottom: '25px', border: '1px solid #fde68a' }}>
                <div style={{ width: '50%', borderRight: '1px solid #fde68a' }}>
                    <p style={{ fontSize: '8px', fontWeight: '900', color: '#b45309', marginBottom: '5px' }}>STUDENT DETAILS</p>
                    <h2 style={{ fontSize: s.b, fontWeight: '900', margin: 0, ...noWrap }}>{customerName}</h2>
                    <p style={{ fontSize: s.f, margin: '2px 0', fontWeight: 'bold' }}>ID: {customFields.studentId || 'N/A'}</p>
                </div>
                <div style={{ width: '50%', paddingLeft: '20px' }}>
                    <p style={{ fontSize: '8px', fontWeight: '900', color: '#b45309', marginBottom: '5px' }}>ACADEMIC INFO</p>
                    <p style={{ fontSize: s.f, margin: 0, fontWeight: 'bold' }}>CLASS: {customFields.grade || 'General'}</p>
                    <p style={{ fontSize: s.f, margin: 0 }}>PHONE: {customerPhone}</p>
                </div>
            </div>

            {/* Fees Table - Flex Grow handles filling the A4 page */}
            <div style={{ flexGrow: 1 }}>
                <div style={{ display: 'flex', background: '#78350f', color: '#fff', borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
                    <div style={cellStyle('10%', 'center')}>SR.</div>
                    <div style={cellStyle('60%')}>FEE COMPONENT</div>
                    <div style={cellStyle('30%', 'right')}>AMOUNT</div>
                </div>

                <div style={{ border: '1px solid #f1f5f9', borderTop: 'none' }}>
                    {items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fffcf0' }}>
                            <div style={cellStyle('10%', 'center')}>{idx + 1}</div>
                            <div style={{ ...cellStyle('60%'), fontWeight: '700' }}>{item.name}</div>
                            <div style={{ ...cellStyle('30%', 'right'), fontWeight: '900', color: '#78350f' }}>₹{item.total}</div>
                        </div>
                    ))}

                    {/* Empty Rows to fill space on A4/A5 */}
                    {(isA4 || isA5) && items.length < 10 && (
                        Array(10 - items.length).fill(0).map((_, i) => (
                            <div key={i} style={{ display: 'flex', height: isA4 ? '40px' : '30px', borderBottom: '1px solid #f1f5f9' }}></div>
                        ))
                    )}
                </div>
            </div>

            {/* Total Section */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <div style={{ width: isSmall ? '100%' : '250px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', fontSize: s.f, fontWeight: 'bold' }}>
                        <span style={{ color: '#94a3b8' }}>SUBTOTAL</span>
                        <span>₹{summary.basicTotal}</span>
                    </div>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', padding: '15px 10px',
                        background: '#78350f', color: '#fff', borderRadius: '10px', marginTop: '5px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <span style={{ fontSize: '10px', fontWeight: '900' }}>TOTAL PAID</span>
                        <span style={{ fontSize: s.b, fontWeight: '950' }}>₹{summary.grandTotal}</span>
                    </div>
                </div>
            </div>

            {/* Footer / Signatures */}
            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ width: '40%' }}>
                    <p style={{ fontSize: '9px', fontWeight: '900', color: '#b45309', marginBottom: '5px' }}>PAYMENT STATUS</p>
                    <div style={{ display: 'inline-block', padding: '4px 12px', background: '#dcfce7', color: '#166534', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold' }}>
                        ✓ {paymentMode.toUpperCase()}
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: isSmall ? '80px' : '120px', borderBottom: '2px solid #78350f', marginBottom: '8px' }}></div>
                    <p style={{ fontSize: '10px', fontWeight: '900', color: '#78350f', margin: 0 }}>OFFICIAL SEAL & SIGN</p>
                </div>
            </div>

            {/* Branding */}
            <div style={{ textAlign: 'center', marginTop: '30px', borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
                <p style={{ fontSize: '8px', color: '#cbd5e1', letterSpacing: '4px' }}>ACADEMIC PRO • SERIES V4</p>
            </div>
        </div>
    );
};

export default EducationStandard;