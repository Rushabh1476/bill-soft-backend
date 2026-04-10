import React from 'react';
import './InvoiceTemplates.css';

const ConsultingPro = ({ saleData, size = 'A4', activeColumns }) => {
    if (!saleData) return null;

    const {
        summary = {}, items = [], storeName = "ADVISORY GROUP", storeAddress = "",
        storeGSTIN = "", billNo = "AUTO", billDate = "", customerName = "",
        customerPhone = "", customerAddress = "", paymentMode = "Bank Transfer",
        customFields = {}
    } = saleData;

    const lowerSize = size.toLowerCase();
    const isA4 = lowerSize === 'a4';
    const isA5 = lowerSize === 'a5';

    const getScale = () => {
        switch (lowerSize) {
            case 'a4': return { w: '210mm', minH: '290mm', p: '40px', f: '12px', h: '36px', b: '16px', sr: '12%' };
            case 'a5': return { w: '148mm', minH: '200mm', p: '25px', f: '10px', h: '26px', b: '14px', sr: '12%' };

            // ✅ ONLY SR WIDTH FIX
            case '1/4': return { w: '105mm', minH: 'auto', p: '15px', f: '8.5px', h: '16px', b: '10px', sr: '18%' };
            case '1/8': return { w: '52mm', minH: 'auto', p: '6px', f: '5.2px', h: '10px', b: '7.5px', sr: '22%' };

            case '80mm': return { w: '80mm', minH: 'auto', p: '12px', f: '8px', h: '14px', b: '9.3px', sr: '15%' };
            case '58mm': return { w: '58mm', minH: 'auto', p: '5px', f: '6.5px', h: '12px', b: '8px', sr: '18%' };

            default: return { w: '100%', minH: 'auto', p: '20px', f: '10px', h: '20px', b: '12px', sr: '12%' };
        }
    };

    const s = getScale();
    const isSmall = !['a4', 'a5'].includes(lowerSize);

    // ✅ FIXED (NO TEXT CUT)
    const noWrapStyle = {
        whiteSpace: 'nowrap',
        overflow: 'visible',
        textOverflow: 'clip'
    };

    const cellStyle = (width, textAlign = 'center') => ({
        width: width,
        fontSize: s.f,
        padding: isSmall ? '6px 2px' : '18px 10px',
        textAlign: textAlign,
        whiteSpace: 'nowrap',
        overflow: 'visible',
        textOverflow: 'clip',
        boxSizing: 'border-box',
    });

    return (
        <div style={{
            width: s.w, minHeight: s.minH, padding: s.p, backgroundColor: '#fff',
            color: '#1e1b4b', margin: 'auto', fontFamily: "'Inter', sans-serif",
            boxSizing: 'border-box', lineHeight: 1.4, position: 'relative'
        }} className="consulting-theme">

            <div className="corporate-top-accent"></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: isSmall ? '20px' : '40px' }}>
                <div style={{ width: '60%' }}>
                    <div className="project-badge" style={{ fontSize: isSmall ? '8px' : '10px' }}>Consultation Service</div>
                    <h1 style={{ fontSize: s.h, fontWeight: '900', color: '#1e1b4b', margin: '8px 0 2px 0', textTransform: 'uppercase', ...noWrapStyle }}>{storeName}</h1>
                    <p style={{ fontSize: s.f, color: '#64748b', margin: 0, fontWeight: '500', ...noWrapStyle }}>{storeAddress}</p>
                    <p style={{ fontSize: '9px', fontWeight: '800', color: '#1e1b4b', marginTop: '4px' }}>GSTIN: {storeGSTIN || 'NOT REGISTERED'}</p>
                </div>
                <div style={{ textAlign: 'right', width: '38%' }}>
                    <p style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8', margin: 0 }}>INVOICE RECORD</p>
                    <p style={{ fontSize: s.b, fontWeight: '900', color: '#1e1b4b', margin: '1px 0', ...noWrapStyle }}>{billNo}</p>
                    <p style={{ fontSize: s.f, fontWeight: '700', color: '#64748b', margin: 0 }}>{billDate}</p>
                </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: isSmall ? '10px 0' : '20px 0', marginBottom: isSmall ? '15px' : '30px', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ width: '50%' }}>
                    <p style={{ fontSize: '8px', fontWeight: '900', color: '#3730e3', marginBottom: '4px' }}>PROJECT CLIENT</p>
                    <h2 style={{ fontSize: s.b, fontWeight: '800', margin: 0, textTransform: 'uppercase', ...noWrapStyle }}>{customerName || 'Corporate Client'}</h2>
                    <p style={{ fontSize: s.f, color: '#64748b', marginTop: '2px', ...noWrapStyle }}>{customerPhone}</p>
                </div>
                <div style={{ width: '48%', textAlign: 'right' }}>
                    <p style={{ fontSize: '8px', fontWeight: '900', color: '#3730e3', marginBottom: '4px' }}>ENGAGEMENT</p>
                    <p style={{ fontSize: s.f, fontWeight: '700', ...noWrapStyle }}>{customFields.period || 'Monthly Retainer'}</p>
                    <p style={{ fontSize: '9px', color: '#94a3b8', ...noWrapStyle }}>{customerAddress}</p>
                </div>
            </div>

            <table className="table-consulting mb-10" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                        <th style={cellStyle(s.sr, 'center')}>SR. NO.</th>
                        <th style={cellStyle('45%', 'left')}>SERVICE</th>
                        <th style={cellStyle('15%', 'center')}>QTY</th>
                        <th style={cellStyle('28%', 'right')}>TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={cellStyle(s.sr, 'center')}>{idx + 1}</td>
                            <td style={{ ...cellStyle('45%', 'left'), fontWeight: '600' }}>{item.name}</td>
                            <td style={cellStyle('15%', 'center')}>{item.qty}</td>
                            <td style={{ ...cellStyle('28%', 'right'), fontWeight: '900', color: '#1e1b4b' }}>₹{item.total}</td>
                        </tr>
                    ))}
                    {(isA4 || isA5) && items.length < 6 && Array(6 - items.length).fill(0).map((_, i) => (
                        <tr key={i}><td colSpan="4" style={{ height: isA4 ? '50px' : '35px', borderBottom: '1px solid #f8fafc' }}></td></tr>
                    ))}
                </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <div style={{ width: isSmall ? '100%' : '45%' }}>
                    <div style={{ padding: '0 10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: s.f, fontWeight: '700' }}>
                            <span style={{ color: '#94a3b8' }}>SERVICE VALUE</span>
                            <span>₹{summary.basicTotal}</span>
                        </div>
                    </div>
                    <div className="consulting-total-card" style={{ backgroundColor: '#1e1b4b', color: '#fff', padding: isSmall ? '10px' : '15px', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '9px', fontWeight: '900', opacity: '0.8' }}>GRAND TOTAL</span>
                            <span style={{ fontSize: isSmall ? '18px' : '26px', fontWeight: '900' }}>₹{summary.grandTotal}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: isSmall ? '30px' : '60px', borderTop: '1px solid #f1f5f9', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ width: '55%' }}>
                    <p style={{ fontSize: '9px', fontWeight: '950', color: '#1e1b4b', marginBottom: '4px' }}>Consultant Declaration</p>
                    <p style={{ fontSize: '8px', color: '#94a3b8', lineHeight: '1.4' }}>
                        Professional services rendered as per agreement. Discrepancies reportable within 7 days.
                        Payment Mode: {paymentMode}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '9px', fontWeight: '900', color: '#1e1b4b', marginBottom: isSmall ? '20px' : '40px' }}>FOR {storeName.toUpperCase()}</p>
                    <div style={{ borderTop: '1px solid #1e1b4b', width: isSmall ? '100px' : '180px', display: 'inline-block' }}></div>
                    <p style={{ fontSize: '9px', fontWeight: '800', marginTop: '4px' }}>Authorized Signatory</p>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <p style={{ fontSize: '7px', color: '#cbd5e1', letterSpacing: '4px', fontWeight: '900' }}>CORPORATE SERIES • PROFESSIONAL INVOICE</p>
            </div>
        </div>
    );
};

export default ConsultingPro;