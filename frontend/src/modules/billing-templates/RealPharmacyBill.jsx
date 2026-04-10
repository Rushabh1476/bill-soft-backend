import React from 'react';
import './InvoiceTemplates.css';

/**
 * Pharmacy / Medical (Indian Standard Bill) - High Fidelity Edition
 * Size: A5 (Standard for Chemists) but supports all via Scaling Engine.
 * Features: Regulatory H-Warning, DL Number, HSN/Batch/Exp details.
 */
const RealPharmacyBill = ({ saleData, size = 'A5', activeColumns }) => {
    if (!saleData) return null;

    const {
        summary = {}, items = [], storeName = "MAHALAXMI MEDICALS", storeAddress = "",
        storeGSTIN = "", billNo = "AUTO", billDate = "", customerName = "",
        customerPhone = "", paymentMode = "Cash", customFields = {}
    } = saleData;

    const lowerSize = size.toLowerCase();

    // 📏 Dynamic Scaling Engine (Indian Pharmacy Edition)
    const getScale = () => {
        switch (lowerSize) {
            case 'a4': return { w: '210mm', minH: '290mm', p: '40px', f: '12px', h: '34px', b: '16px', warning: '10px' };
            case 'a5': return { w: '148mm', minH: '200mm', p: '20px', f: '10px', h: '24px', b: '14px', warning: '8.5px' };
            case '1/4': return { w: '105mm', minH: 'auto', p: '12px', f: '8.5px', h: '16px', b: '10px', warning: '7px' };
            case '1/8': return { w: '52mm', minH: 'auto', p: '6px', f: '5.5px', h: '11px', b: '7.5px', warning: '5.5px' };
            case '80mm': return { w: '80mm', minH: 'auto', p: '12px', f: '8px', h: '14px', b: '9.3px', warning: '7px' };
            case '58mm': return { w: '58mm', minH: 'auto', p: '5px', f: '6.5px', h: '12px', b: '8px', warning: '6px' };
            default: return { w: '100%', minH: 'auto', p: '20px', f: '10px', h: '20px', b: '12px', warning: '8px' };
        }
    };

    const s = getScale();
    const isSmall = !['a4', 'a5'].includes(lowerSize);

    const noWrap = {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    };

    const cellStyle = (width, textAlign = 'left') => ({
        width: width,
        fontSize: s.f,
        padding: isSmall ? '4px 2px' : '10px 5px',
        textAlign: textAlign,
        ...noWrap,
        boxSizing: 'border-box'
    });

    return (
        <div style={{
            width: s.w, minHeight: s.minH, padding: s.p, backgroundColor: '#fff',
            color: '#1e293b', margin: 'auto', fontFamily: "'Inter', sans-serif",
            boxSizing: 'border-box', lineHeight: 1.2, border: isSmall ? '1px solid #eee' : 'none'
        }} className="pharmacy-indian-theme">
            
            {/* Pharmacy Top Strip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '15px' }}>
                <div style={{ width: '65%' }}>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#dc2626', marginBottom: '5px' }}>Rx</div>
                    <h1 style={{ fontSize: s.h, fontWeight: '950', margin: 0, color: '#111827', ...noWrap }}>{storeName}</h1>
                    <p style={{ fontSize: `calc(${s.f} - 1px)`, margin: '2px 0', opacity: 0.8, ...noWrap }}>{storeAddress}</p>
                    <p style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '4px' }}>
                        DL NO: {customFields.dlNo || 'MH-PUN-0092B/21'} | GSTIN: {storeGSTIN || 'URD'}
                    </p>
                </div>
                <div style={{ textAlign: 'right', width: '30%' }}>
                    <p style={{ fontSize: '9px', fontWeight: '950', margin: 0, color: '#dc2626' }}>CASH MEMO</p>
                    <p style={{ fontSize: s.f, margin: '2px 0', fontWeight: 'bold' }}>#{billNo}</p>
                    <p style={{ fontSize: s.f, margin: 0 }}>{billDate}</p>
                </div>
            </div>

            {/* Patient Header */}
            <div style={{ display: 'flex', background: '#f8fafc', padding: isSmall ? '5px 8px' : '10px 15px', borderRadius: '4px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '60%', borderRight: '1px solid #cbd5e1' }}>
                    <span style={{ fontSize: '7px', fontWeight: '900', color: '#64748b' }}>PATIENT NAME</span>
                    <p style={{ fontSize: s.f, fontWeight: '900', margin: 0, ...noWrap }}>{customerName || 'Walking Patient'}</p>
                </div>
                <div style={{ width: '40%', paddingLeft: '15px' }}>
                    <span style={{ fontSize: '7px', fontWeight: '900', color: '#64748b' }}>CONTACT</span>
                    <p style={{ fontSize: s.f, fontWeight: 'bold', margin: 0 }}>{customerPhone || 'N/A'}</p>
                </div>
            </div>

            {/* Matrix Table */}
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', background: '#334155', color: '#fff', fontWeight: 'bold' }}>
                    <div style={cellStyle('10%', 'center')}>SR.</div>
                    <div style={cellStyle('45%', 'left')}>MEDICINE / DESCRIPTION</div>
                    <div style={cellStyle('15%', 'center')}>BATCH</div>
                    <div style={cellStyle('15%', 'center')}>EXP.</div>
                    <div style={cellStyle('15%', 'right')}>AMOUNT</div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderTop: 'none' }}>
                    {items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={cellStyle('10%', 'center')}>{idx + 1}</div>
                            <div style={{ ...cellStyle('45%', 'left'), fontWeight: '700' }}>{item.name}</div>
                            <div style={cellStyle('15%', 'center')}>{item.batch || '--'}</div>
                            <div style={{ ...cellStyle('15%', 'center'), color: '#dc2626' }}>{item.exp || '--'}</div>
                            <div style={{ ...cellStyle('15%', 'right'), fontWeight: '900' }}>₹{item.total}</div>
                        </div>
                    ))}

                    {/* Fill Space */}
                    {items.length < (isSmall ? 4 : 10) && Array((isSmall ? 4 : 10) - items.length).fill(0).map((_, i) => (
                        <div key={i} style={{ height: isSmall ? '24px' : '35px', borderBottom: '1px solid #f8fafc' }}></div>
                    ))}
                </div>
            </div>

            {/* Calculations Area */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                <div style={{ width: isSmall ? '100%' : '200px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 5px', fontSize: s.f, fontWeight: 'bold' }}>
                        <span style={{ color: '#64748b' }}>SUB TOTAL</span>
                        <span>₹{summary.basicTotal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#dc2626', color: '#fff', borderRadius: '4px', marginTop: '5px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '900' }}>TOTAL PAYABLE</span>
                        <span style={{ fontSize: s.b, fontWeight: '950' }}>₹{summary.grandTotal}</span>
                    </div>
                </div>
            </div>

            {/* Schedule Warning */}
            <div style={{ marginTop: '20px', border: '1.5px solid #dc2626', padding: '8px', borderRadius: '4px' }}>
                <p style={{ fontSize: s.warning, fontWeight: '900', color: '#dc2626', textAlign: 'center', margin: 0, textTransform: 'uppercase' }}>
                    SCHEDULE H DRUG: Warning - To be sold by retail on the prescription of a Registered Medical Practitioner only.
                </p>
            </div>

            {/* Footer Signatures */}
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ width: '40%' }}>
                    <p style={{ fontSize: '7px', fontWeight: 'bold', color: '#64748b' }}>PAYMENT STATUS: {paymentMode.toUpperCase()}</p>
                    <p style={{ fontSize: '7px', color: '#94a3b8', marginTop: '20px' }}>* No Exchange without Bill / Cash Memo</p>
                </div>
                <div style={{ textAlign: 'center', width: '35%' }}>
                    <div style={{ borderBottom: '1px solid #111827', width: '100%', marginBottom: '5px' }}></div>
                    <p style={{ fontSize: '9px', fontWeight: '950' }}>Pharmacist Sign</p>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
                <p style={{ fontSize: '7px', color: '#cbd5e1', letterSpacing: '4px', fontStyle: 'italic' }}>INDIAN STANDARD MEDICAL SERIES V5</p>
            </div>
        </div>
    );
};

export default RealPharmacyBill;
