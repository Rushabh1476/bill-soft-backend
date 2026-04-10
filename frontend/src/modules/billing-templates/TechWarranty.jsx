import React from 'react';
import './InvoiceTemplates.css';
import InvoiceHeader from './core/InvoiceHeader';
import InvoiceFooter from './core/InvoiceFooter';

const TechWarranty = ({ saleData, activeColumns }) => {
    const { 
        summary, items, storeName, storeAddress, storeGSTIN, 
        billNo, billDate, customerName, customerPhone, customerAddress, 
        customerGSTIN, paymentMode, upiId, bankName, accountNumber, ifscCode
    } = saleData;

    // Dynamic Columns Logic
    const defaultCols = ['S.No', 'Item Name', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];
    const cols = activeColumns || defaultCols;

    const getColLabel = (col) => {
        switch(col) {
            case 'S.No': return '#';
            case 'Item Name': return 'Device Description & Serial Matrix';
            case 'HSN': return 'HSN';
            case 'Qty': return 'Qty';
            case 'Rate': return 'Unit Price';
            case 'Tax': return 'GST%';
            case 'Amount': return 'Total';
            default: return col;
        }
    };

    const getColWidth = (col) => {
        switch(col) {
            case 'S.No': return '40px';
            case 'Item Name': return 'auto';
            case 'HSN': return '70px';
            case 'Qty': return '80px';
            case 'Rate': return '110px';
            case 'Tax': return '70px';
            case 'Amount': return '120px';
            default: return '80px';
        }
    };

    return (
        <div className="invoice-container tech-theme a4-standard-layout shadow-none p-10 bg-white border-0">
            {/* Tech Header */}
            <InvoiceHeader 
                storeName={storeName}
                storeAddress={storeAddress}
                storeGSTIN={storeGSTIN}
                billNo={billNo}
                billDate={billDate}
                customerName={customerName}
                customerPhone={customerPhone}
                customerAddress={customerAddress}
                customerGSTIN={customerGSTIN}
                title="TECH SALES & SERVICE INVOICE"
                extraHeaderInfo={
                    <>
                        <span className="text-gray-400">SERVICE REP:</span>
                        <span className="text-gray-900 font-950">TECH-SUPPORT-01</span>
                    </>
                }
            />

            {/* Asset Table with IMEI/SN Matrix */}
            <div className="min-h-[460px]">
                <table className="a4-grid-table w-full table-fixed">
                    <thead>
                        <tr className="border-b-2 border-black">
                            {cols.map((col, idx) => (
                                <th key={idx} style={{ width: getColWidth(col) }} className="p-2 text-center truncate">
                                    {getColLabel(col)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                                {cols.map((col, cIdx) => {
                                    const style = { width: getColWidth(col), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
                                    const baseClass = "p-2 align-top";
                                    switch(col) {
                                        case 'S.No': return <td key={cIdx} style={style} className={`${baseClass} text-center font-bold text-gray-400`}>{idx + 1}</td>;
                                        case 'Item Name': return (
                                            <td key={cIdx} className={`${baseClass} py-4`} style={{ width: 'auto' }}>
                                                <div className="font-950 uppercase truncate">{item.name}</div>
                                                <div className="warranty-box bg-gray-50 border border-dashed border-black p-2 mt-2">
                                                    <span className="text-[7pt] font-black opacity-50 uppercase tracking-widest block mb-1 underline">Unique Identity (Serial/IMEI):</span>
                                                    <span className="imei-label text-blue-800 font-mono text-[9pt] font-black underline decoration-blue-200">
                                                        {item.customFields?.imeiNumber || item.customFields?.serialNumber || 'SN-' + (idx+1) + '-CERT-2026'}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex gap-4 text-[7pt] text-gray-400 font-bold italic uppercase">
                                                    <span>Model: {item.customFields?.model || 'Elite-X'}</span>
                                                    <span>/</span>
                                                    <span>Warranty: 1 Year Limited</span>
                                                </div>
                                            </td>
                                        );
                                        case 'HSN': return <td key={cIdx} style={style} className={`${baseClass} text-center font-mono font-bold opacity-60`}>{item.hsn || '8471'}</td>;
                                        case 'Qty': return <td key={cIdx} style={style} className={`${baseClass} text-center font-950`}>{item.qty} UNIT</td>;
                                        case 'Rate': return <td key={cIdx} style={style} className={`${baseClass} text-right font-mono px-2`}>₹{(item.rate || 0).toFixed(2)}</td>;
                                        case 'Tax': return <td key={cIdx} style={style} className={`${baseClass} text-center font-bold opacity-80`}>{item.taxRate || 0}%</td>;
                                        case 'Amount': return <td key={cIdx} style={style} className={`${baseClass} text-right font-950 px-2`}>₹{(item.total || 0).toFixed(2)}</td>;
                                        default: return <td key={cIdx} style={style} className={baseClass}>{item[col.toLowerCase()] || '-'}</td>;
                                    }
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Tech Footer with Warranty Policy */}
            <div className="mt-4">
                <InvoiceFooter 
                    summary={summary}
                    paymentMode={paymentMode}
                    upiId={upiId}
                    storeName={storeName}
                    bankDetails={{
                        bankName,
                        accountNumber,
                        ifscCode
                    }}
                    terms={
                        <div className="flex flex-col gap-1">
                            <div>1. Warranty handled by Brand Service Centers directly.</div>
                            <div>2. Official Invoice & Original Box required for warranty claim.</div>
                            <div>3. Software, moisture, or physical damage not covered under warranty.</div>
                            <div>4. Replacement only for Dead-On-Arrival (DOA) within 24 hours.</div>
                        </div>
                    }
                    note="Technology / Innovation / Digital-Future POS"
                />
            </div>
        </div>
    );
};

export default TechWarranty;

