import React from 'react';
import './InvoiceTemplates.css';

/**
 * HealthcareAdvanced Premium - FIXED (No-Wrap & No-QR)
 * Sizes Supported: A4, A5, 58mm, 80mm, 1/4, 1/5, 1/6, 1/7, 1/8
 */
const RealMedical = ({ saleData, size = 'A4', activeColumns }) => {
    if (!saleData) return null;

    const {
        summary = {}, items = [], storeName = "HEALTHCARE PRO", storeAddress = "",
        storeGSTIN = "", billNo = "AUTO", billDate = "", customerName = "",
        customerPhone = "", customerAddress = "", paymentMode = "Cash",
        customFields = {}
    } = saleData;

    const lowerSize = size.toLowerCase();

    // 📏 Precision Scaling Engine to stop wrapping in any size
    const getScale = () => {
        switch (lowerSize) {
            case 'a4': return { w: '210mm', p: '30px', f: '12px', h: '36px', b: '14px', badge: '10px' };
            case 'a5': return { w: '148mm', p: '20px', f: '10px', h: '26px', b: '12px', badge: '8px' };
            case '1/4': return { w: '105mm', p: '12px', f: '8.5px', h: '18px', b: '10px', badge: '7px' };
            case '1/5': return { w: '84mm', p: '10px', f: '7.8px', h: '16px', b: '9px', badge: '6.5px' };
            case '1/6': return { w: '70mm', p: '8px', f: '7.2px', h: '14px', b: '8.5px', badge: '6px' };
            case '1/7': return { w: '60mm', p: '6px', f: '6.5px', h: '12px', b: '8px', badge: '5.5px' };
            case '1/8': return { w: '52mm', p: '5px', f: '5.8px', h: '11px', b: '7.5px', badge: '5px' };
            case '80mm': return { w: '80mm', p: '10px', f: '8px', h: '16px', b: '9.5px', badge: '7px' };
            case '58mm': return { w: '58mm', p: '5px', f: '6.2px', h: '12px', b: '8px', badge: '5.5px' };
            default: return { w: '100%', p: '20px', f: '10px', h: '22px', b: '12px', badge: '8px' };
        }
    };

    const s = getScale();

    // Strict No-Wrap Style
    const noWrapStyle = {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    };

    const cellStyle = (width, textAlign = 'left') => ({
        width: width,
        fontSize: s.f,
        padding: '6px 2px',
        textAlign: textAlign,
        ...noWrapStyle,
        boxSizing: 'border-box'
    });

    return (
        <div style={{
            width: s.w, padding: s.p, backgroundColor: '#fff', color: '#1e293b',
            margin: 'auto', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
            lineHeight: 1.2
        }}>
            {/* Medical Top Bar Strip */}
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #0d9488, #3b82f6)', marginBottom: '15px' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div style={{ width: '65%' }}>
                    <div style={{ fontSize: `calc(${s.f} + 4px)`, fontWeight: '900', color: '#0d9488', marginBottom: '2px' }}>Rx</div>
                    <h1 style={{ fontSize: s.h, fontWeight: '900', color: '#0f172a', margin: 0, ...noWrapStyle }}>{storeName}</h1>
                    <p style={{ fontSize: `calc(${s.f} - 1px)`, color: '#64748b', margin: '2px 0', ...noWrapStyle }}>{storeAddress}</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <span style={{ fontSize: s.badge, fontWeight: 'bold', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>GST: {storeGSTIN || 'URD'}</span>
                        <span style={{ fontSize: s.badge, fontWeight: 'bold', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>DL: {customFields.dlNo || 'DL-20-B-4455'}</span>
                    </div>
                </div>
                <div style={{ width: '30%', textAlign: 'right' }}>
                    <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                        <p style={{ fontSize: '7px', fontWeight: '900', color: '#94a3b8', margin: 0, letterSpacing: '1px' }}>INVOICE NO</p>
                        <p style={{ fontSize: s.b, fontWeight: '900', margin: '2px 0' }}>{billNo}</p>
                        <p style={{ fontSize: '7px', fontWeight: '900', color: '#94a3b8', margin: '4px 0 0 0' }}>DATE</p>
                        <p style={{ fontSize: `calc(${s.f} - 1px)`, fontWeight: 'bold', margin: 0 }}>{billDate}</p>
                    </div>
                </div>
            </div>

            {/* Patient Info Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', padding: '8px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: '50%' }}>
                    <p style={{ fontSize: '7px', fontWeight: '900', color: '#0d9488', margin: 0 }}>PATIENT DETAILS</p>
                    <p style={{ fontSize: s.f, fontWeight: '900', margin: 0, textTransform: 'uppercase', ...noWrapStyle }}>{customerName || 'Walk-in Patient'}</p>
                    <p style={{ fontSize: `calc(${s.f} - 1px)`, margin: 0 }}>PH: {customerPhone}</p>
                </div>
                <div style={{ width: '50%', textAlign: 'right' }}>
                    <p style={{ fontSize: '7px', fontWeight: '900', color: '#0d9488', margin: 0 }}>REF. DOCTOR</p>
                    <p style={{ fontSize: s.f, fontWeight: '700', margin: 0, ...noWrapStyle }}>{customFields.doctorName || 'General Practitioner'}</p>
                </div>
            </div>

            {/* Table Header */}
            <div style={{ display: 'flex', background: '#0f172a', borderRadius: '4px', color: '#fff' }}>
                <div style={cellStyle('8%', 'center')}>SR.</div>
                <div style={cellStyle('42%')}>DESCRIPTION</div>
                <div style={cellStyle('15%')}>BATCH</div>
                <div style={cellStyle('10%')}>EXP</div>
                <div style={cellStyle('10%', 'right')}>QTY</div>
                <div style={cellStyle('15%', 'right')}>TOTAL</div>
            </div>

            {/* Items List */}
            <div style={{ minHeight: '100px' }}>
                {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={cellStyle('8%', 'center')}>{idx + 1}</div>
                        <div style={{ ...cellStyle('42%'), fontWeight: '700' }}>{item.name}</div>
                        <div style={{ ...cellStyle('15%'), color: '#0d9488', fontWeight: 'bold' }}>{item.batch || '—'}</div>
                        <div style={{ ...cellStyle('10%'), color: '#e11d48' }}>{item.exp || '—'}</div>
                        <div style={cellStyle('10%', 'right')}>{item.qty}</div>
                        <div style={{ ...cellStyle('15%', 'right'), fontWeight: '900' }}>₹{item.total}</div>
                    </div>
                ))}
            </div>

            {/* Total Section */}
            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: (lowerSize === '58mm' || lowerSize === '1/8') ? '100%' : '200px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px' }}>
                        <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#64748b' }}>TAXABLE AMT</span>
                        <span style={{ fontSize: s.f, fontWeight: 'bold' }}>₹{summary.basicTotal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#0d9488', color: '#fff', borderRadius: '6px', marginTop: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '900' }}>GRAND TOTAL</span>
                        <span style={{ fontSize: s.b, fontWeight: '900' }}>₹{summary.grandTotal}</span>
                    </div>
                </div>
            </div>

            {/* Legal Warning */}
            <div style={{ marginTop: '15px', borderLeft: '2px solid #e11d48', paddingLeft: '8px' }}>
                <p style={{ fontSize: '7px', color: '#64748b', margin: 0, fontStyle: 'italic' }}>
                    * SCHEDULE H DRUG: Warning - Not to be sold by retail without the prescription of a Registered Medical Practitioner.
                </p>
            </div>

            {/* Bottom Footer */}
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ width: '40%' }}>
                    <p style={{ fontSize: '8px', fontWeight: 'bold', color: '#94a3b8', margin: 0 }}>PAYMENT MODE</p>
                    <p style={{ fontSize: s.f, fontWeight: '900', margin: 0, color: '#0f172a' }}>{paymentMode.toUpperCase()}</p>
                </div>
                <div style={{ width: '40%', textAlign: 'center' }}>
                    <p style={{ fontSize: '8px', fontWeight: 'bold', color: '#0d9488', marginBottom: '25px' }}>AUTHORIZED SIGNATORY</p>
                    <div style={{ borderTop: '1px solid #cbd5e1', width: '100%' }}></div>
                    <p style={{ fontSize: '7px', color: '#94a3b8', marginTop: '2px' }}>Seal & Signature</p>
                </div>
            </div>
        </div>
    );
};

export default RealMedical;