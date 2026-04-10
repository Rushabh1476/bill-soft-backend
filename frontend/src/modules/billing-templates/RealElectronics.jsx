import React from 'react';
import './InvoiceTemplates.css';
import UPIQRCode from './core/UPIQRCode';

const RealElectronics = ({ saleData, size = 'A4', activeColumns }) => {
    const { summary, items, storeName, storeAddress, storeGSTIN, billNo, billDate, customerName, customerPhone, customerAddress, paymentMode, upiId } = saleData;

    const lowerSize = size.toLowerCase();
    const isA4 = lowerSize === 'a4';
    const isA5 = lowerSize === 'a5';
    const isThermal = lowerSize.includes('mm');

    const showQR = (paymentMode === 'UPI' || paymentMode === 'QR') && !isThermal;

    const getPaymentLabel = (mode) => {
        if (!mode) return 'CASH SETTLEMENT';
        if (mode === 'Credit') return 'CREDIT (UDHAAR)';
        if (mode === 'Cash') return 'CASH SETTLEMENT';
        if (mode === 'Card') return 'CARD SETTLEMENT';
        if (mode === 'UPI') return 'UPI SETTLEMENT';
        if (mode === 'QR') return 'QR SCAN & PAY';
        return mode.toUpperCase() + ' SETTLEMENT';
    };

    // Dynamic Columns Logic
    const defaultCols = isThermal ? ['Item Name', 'Qty', 'Amount'] : ['S.No', 'Item Name', 'Qty', 'Rate', 'Amount'];
    const cols = activeColumns || defaultCols;

    const getColLabel = (col) => {
        switch(col) {
            case 'S.No': return 'S.No';
            case 'Item Name': return 'Product Name';
            case 'HSN': return 'HSN';
            case 'Unit': return 'Unit';
            case 'Qty': return 'Qty';
            case 'Batch': return 'Batch';
            case 'Exp': return 'Exp';
            case 'Rate': return 'Price';
            case 'Tax': return 'GST%';
            case 'Discount': return 'Disc%';
            case 'Amount': return 'Total';
            default: return col;
        }
    };

    const getColClass = (col) => {
        switch(col) {
            case 'S.No': return 'w-[40px] text-center';
            case 'Item Name': return 'text-left flex-1 min-w-[120px]';
            case 'HSN': return 'w-[70px] text-center px-1';
            case 'Unit': return 'w-[50px] text-center';
            case 'Qty': return 'w-[60px] text-center';
            case 'Batch': return 'w-[80px] text-center';
            case 'Exp': return 'w-[70px] text-center';
            case 'Rate': return 'w-[80px] text-right px-1';
            case 'Tax': return 'w-[50px] text-center';
            case 'Discount': return 'w-[50px] text-center';
            case 'Amount': return 'w-[100px] text-right';
            default: return '';
        }
    };

    return (
        <div className={`invoice-container ${isA4 ? 'a4-standard-layout' : (isA5 ? 'a5-half-layout' : 'thermal-layout')} real-print-theme ${isA4 ? 'p-12' : 'p-6'} bg-white shadow-none border-none`}>
            {/* Header Tech Section */}
            <div className={`flex justify-between items-start ${isA4 ? 'mb-12 pb-10 border-b-8' : 'mb-6 pb-4 border-b-4'} border-black bg-gray-50/10 p-6 rounded-2xl border-l-[10px] border-black`}>
                <div className="w-2/3">
                    <h1 className={`${isA4 ? 'text-4xl' : 'text-2xl'} bold text-gray-950 uppercase leading-none font-black italic tracking-tighter`}>{storeName}</h1>
                    <p className="text-[10px] mt-2 whitespace-pre-line text-gray-950 italic font-mono uppercase tracking-[0.2em] opacity-60 leading-relaxed font-black">{storeAddress}</p>
                    <div className="flex gap-6 mt-6 opacity-60 uppercase font-black tracking-widest text-[8px]">
                       <p className="bg-gray-950 text-white p-2 px-4 rounded-lg italic">GSTIN: {storeGSTIN || 'URD'}</p>
                    </div>
                </div>
                <div className="text-right w-1/3 border-l-2 border-black pl-6 flex flex-column justify-center h-full">
                    <h2 className={`${isA4 ? 'text-2xl' : 'text-lg'} bold text-gray-950 uppercase italic tracking-[0.2em]`}>TAX INVOICE</h2>
                    <div className="mt-4 font-mono border-2 border-dashed border-gray-200 p-2 bg-white rounded-xl font-black uppercase text-[10px]">
                        <div className="flex justify-between mb-1 items-center">
                            <span className="opacity-50 italic">Folio:</span>
                            <span className="text-gray-950 font-black italic underline">#{billNo}</span>
                        </div>
                        <div className="flex justify-between italic opacity-30">
                            <span>Date:</span>
                            <span>{billDate}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Consignee Folio */}
            <div className={`grid grid-cols-2 gap-8 ${isA4 ? 'mb-12' : 'mb-6'} p-6 bg-gray-50/20 rounded-2xl border-2 border-dashed border-gray-100 italic`}>
                <div className="border-black border-l-8 pl-4">
                  <h3 className="text-[9px] uppercase text-gray-400 bold mb-2 tracking-[0.2em] italic">Consignee Ledger</h3>
                  <p className={`${isA4 ? 'text-2xl' : 'text-xl'} bold text-gray-950 italic tracking-[0.1em] font-black uppercase`}>{customerName || 'Cash-Customer'}</p>
                  <p className="text-[10px] font-mono text-gray-400 italic opacity-60 font-black">PH: {customerPhone}</p>
                </div>
                <div className="text-right flex flex-column justify-center opacity-40">
                    <div className="text-[9px] uppercase font-black tracking-widest space-y-1">
                        <p>CASHIER: ADMIN</p>
                        <p>GRADE: PRM-V7</p>
                    </div>
                </div>
            </div>

            {/* Electronics V7 Table */}
            <table className="w-full mb-8 rounded-xl border-2 border-gray-950 overflow-hidden bg-white italic">
                <thead className="bg-gray-950 text-white uppercase tracking-[0.2em]">
                    <tr className="text-[9px]">
                        {cols.map((col, idx) => (
                            <th key={col} className={`${getColClass(col)} p-3 ${idx > 0 ? 'border-l border-gray-700' : ''}`}>
                                {getColLabel(col)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="text-[10px] italic">
                    {items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100 text-gray-950 last:border-b-0">
                            {cols.map((col, cIdx) => {
                                const baseClass = `${getColClass(col)} p-3 italic border-r border-gray-100 last:border-r-0 border-dashed`;
                                
                                switch(col) {
                                    case 'S.No': return <td key={col} className={baseClass + " text-center"}>{idx + 1}</td>;
                                    case 'Item Name': return (
                                        <td key={col} className={baseClass}>
                                            <p className="font-black text-sm text-gray-950 uppercase italic leading-none break-words">{item.name}</p>
                                            <span className="text-[8px] opacity-60 mt-1 block">SN: {item.customFields?.serialNo || 'N/A'}</span>
                                        </td>
                                    );
                                    case 'HSN': return <td key={col} className={baseClass}>{item.hsn || '-'}</td>;
                                    case 'Unit': return <td key={col} className={baseClass}>{item.unit || 'Nos'}</td>;
                                    case 'Qty': return <td key={col} className={baseClass + " text-center"}>{item.qty}</td>;
                                    case 'Batch': return <td key={col} className={baseClass}>{item.batch || '-'}</td>;
                                    case 'Exp': return <td key={col} className={baseClass}>{item.exp || '-'}</td>;
                                    case 'Rate': return <td key={col} className={baseClass + " text-right font-mono opacity-40"}>₹{item.rate.toFixed(0)}</td>;
                                    case 'Tax': return <td key={col} className={baseClass}>{item.taxRate}%</td>;
                                    case 'Discount': return <td key={col} className={baseClass}>{item.discount || 0}%</td>;
                                    case 'Amount': return <td key={col} className={baseClass + " text-right font-black text-sm bg-gray-50/30"}>₹{(item.qty * item.rate).toFixed(0)}</td>;
                                    default: return <td key={col} className={baseClass}>-</td>;
                                }
                            })}
                        </tr>
                    ))}
                    {items.length < (isA4 ? 8 : 4) && Array((isA4 ? 8 : 4) - items.length).fill(0).map((_, i) => (
                        <tr key={`empty-${i}`} className="h-10 border-b border-gray-50">
                            <td colSpan={cols.length}></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Injected Payment Matrix */}
            {showQR && (
                <div className="w-full p-4 border-4 border-dashed border-gray-200 bg-gray-50 rounded-2xl mb-8 flex justify-between items-center italic">
                    <div className="flex gap-8 items-center">
                        <span className="text-xs tracking-widest font-black opacity-40">Payment:</span>
                        <span className="text-lg text-gray-950 font-black italic">
                            {getPaymentLabel(paymentMode)}
                        </span>
                        <div className="ml-4 border-2 border-white p-1 bg-white">
                             <UPIQRCode upiId={upiId} amount={summary.grandTotal} name={storeName} size={60} />
                        </div>
                    </div>
                </div>
            )}

            {/* Totals Section */}
            <div className="flex justify-end mt-4 mb-12">
                <div className={`${isA4 ? 'w-1/2' : 'w-full'} text-right space-y-2`}>
                    <div className="flex justify-between italic opacity-60 border-b pb-2 border-gray-100 text-[12px]">
                        <span className="uppercase font-black">Net Asset Sum</span>
                        <span className="font-mono">₹{summary.basicTotal.toFixed(0)}</span>
                    </div>
                    {summary.taxTotal > 0 && (
                        <div className="flex justify-between italic opacity-60 border-b pb-2 border-gray-100 text-[12px]">
                            <span className="uppercase font-black">GST Consolidated</span>
                            <span className="font-mono">₹{summary.taxTotal.toFixed(0)}</span>
                        </div>
                    )}
                    <div className="flex justify-between p-4 bg-gray-950 rounded-xl items-center border-4 border-white shadow-xl">
                        <span className="text-lg bold uppercase text-white italic font-black">Net Payable</span>
                        <span className="text-2xl bold text-white font-black italic font-mono px-4 bg-gray-900 rounded-lg">₹{summary.grandTotal.toFixed(0)}/-</span>
                    </div>
                </div>
            </div>

            {/* Footer Bottom */}
            <div className={`mt-12 flex justify-between items-end border-t-4 pt-4 border-gray-950 uppercase italic opacity-40 font-mono text-[9px]`}>
                <div className="text-left w-1/2">
                    <p className="mb-8 italic shadow-inner font-black shadow-sm">Authenticated for {storeName.toUpperCase()} / ASSET LEDGER</p>
                    <div className="border-t border-gray-950 pt-2 mt-2">
                        <p className="bold text-gray-950 italic uppercase font-black">Authorized Signatory</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 text-center opacity-10 pointer-events-none uppercase font-black tracking-[1em] italic">
                <p className="text-[8px] text-gray-950">Technology POS V7 / Authorized Output / 2026</p>
            </div>
        </div>
    );
};

export default RealElectronics;
