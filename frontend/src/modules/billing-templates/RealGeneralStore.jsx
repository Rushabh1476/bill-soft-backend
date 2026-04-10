import React from 'react';
import './InvoiceTemplates.css';
import UPIQRCode from './core/UPIQRCode';

const RealGeneralStore = ({ saleData, size = 'A4', activeColumns }) => {
    const { summary, items, storeName, storeAddress, storeGSTIN, billNo, billDate, customerName, customerPhone, paymentMode, upiId } = saleData;

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
            case 'Item Name': return 'Description';
            case 'HSN': return 'HSN';
            case 'Unit': return 'Unit';
            case 'Qty': return 'Qty';
            case 'Batch': return 'Batch';
            case 'Exp': return 'Exp';
            case 'Rate': return 'Rate';
            case 'Tax': return 'Tax%';
            case 'Discount': return 'Disc%';
            case 'Amount': return 'Total';
            default: return col;
        }
    };

    const getColClass = (col) => {
        switch(col) {
            case 'S.No': return 'w-[40px] text-center';
            case 'Item Name': return 'text-left flex-1 min-w-[120px]';
            case 'HSN': return 'w-[70px] text-center';
            case 'Unit': return 'w-[50px] text-center';
            case 'Qty': return 'w-[60px] text-center';
            case 'Batch': return 'w-[80px] text-center';
            case 'Exp': return 'w-[70px] text-center';
            case 'Rate': return 'w-[70px] text-center';
            case 'Tax': return 'w-[50px] text-center';
            case 'Discount': return 'w-[50px] text-center';
            case 'Amount': return 'w-[90px] text-right';
            default: return '';
        }
    };

    return (
        <div className={`invoice-container ${isA4 ? 'a4-standard-layout' : (isA5 ? 'a5-half-layout' : 'thermal-layout')} real-print-theme ${isA4 ? 'p-10' : 'p-5'} bg-white shadow-none border-none`}>
            {/* General Retail Header */}
            <div className="text-center mb-6 border-b-2 border-black pb-6 italic">
                <div className="text-[9px] uppercase font-bold tracking-[0.4em] mb-2 opacity-50 font-black italic">RETAIL TAX INVOICE V7-STD</div>
                <div className={`${isA4 ? 'text-4xl' : 'text-2xl'} bold uppercase leading-none font-black`}>{storeName}</div>
                <div className="text-[10px] italic uppercase mt-2 opacity-60 font-black">{storeAddress}</div>
                <div className="text-[10px] bold mt-4 border-t border-b border-black py-2 inline-block px-8 italic tracking-[0.4em] uppercase">Trade Folio / Bill of Supply</div>
                <div className="text-[10px] mt-2 opacity-40 font-black flex justify-center gap-8 underline decoration-gray-100">
                   <span>GSTIN: {storeGSTIN || 'URD'}</span>
                </div>
            </div>

            {/* Bill Info */}
            <div className={`flex justify-between text-[10px] ${isA4 ? 'mb-8' : 'mb-4'} border-b-2 border-gray-100 pb-4 mt-4 italic`}>
                <div className="w-1/2 space-y-2">
                    <p><span className="bold uppercase opacity-30 tracking-[0.2em] leading-none">CONSUMER:</span> <b className="text-gray-950 text-lg uppercase font-black">{customerName || 'Cash-Guest'}</b></p>
                    <p><span className="bold uppercase opacity-30 tracking-[0.2em] leading-none">CONTACT:</span> <b className="text-gray-950 font-mono tracking-widest font-black">{customerPhone}</b></p>
                </div>
                <div className="w-1/2 text-right space-y-2">
                    <p><span className="bold uppercase opacity-30 tracking-[0.2em] leading-none">FOLIO:</span> <b className="text-2xl font-black italic underline decoration-gray-950">#{billNo}</b></p>
                    <p><span className="bold uppercase opacity-30 tracking-[0.2em] leading-none">DATE:</span> <b className="italic font-black">{billDate}</b></p>
                </div>
            </div>

            {/* General Table */}
            <table className="w-full text-[10px] mb-8 overflow-hidden rounded-xl border-2 border-gray-100 italic">
                <thead>
                    <tr className="border-t border-b-2 border-black bg-gray-50 italic uppercase tracking-[0.2em] font-black">
                        {cols.map((col, idx) => (
                            <th key={col} className={`${getColClass(col)} p-4 border-r border-gray-100 last:border-r-0`}>
                                {getColLabel(col)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="text-[11px] italic">
                    {items.map((item, idx) => (
                        <tr key={idx} className="border-b italic border-gray-100">
                            {cols.map((col, cIdx) => {
                                const baseClass = `${getColClass(col)} p-4 italic border-r border-gray-100 last:border-r-0 border-dashed`;
                                
                                switch(col) {
                                    case 'S.No': return <td key={col} className={baseClass + " text-center"}>{idx + 1}</td>;
                                    case 'Item Name': return (
                                        <td key={col} className={baseClass}>
                                            <p className="leading-none text-base font-black uppercase break-words">{item.name}</p>
                                            <span className="text-[9px] opacity-20 tracking-widest italic uppercase font-black">General Retail Standard V7</span>
                                        </td>
                                    );
                                    case 'HSN': return <td key={col} className={baseClass}>{item.hsn || '-'}</td>;
                                    case 'Unit': return <td key={col} className={baseClass}>{item.unit || 'Nos'}</td>;
                                    case 'Qty': return <td key={col} className={baseClass + " text-center font-black text-xl"}>{item.qty}</td>;
                                    case 'Batch': return <td key={col} className={baseClass}>{item.batch || '-'}</td>;
                                    case 'Exp': return <td key={col} className={baseClass}>{item.exp || '-'}</td>;
                                    case 'Rate': return <td key={col} className={baseClass + " text-center opacity-40 font-mono text-[12px]"}>{item.rate.toFixed(2)}</td>;
                                    case 'Tax': return <td key={col} className={baseClass}>{item.taxRate}%</td>;
                                    case 'Discount': return <td key={col} className={baseClass}>{item.discount || 0}%</td>;
                                    case 'Amount': return <td key={col} className={baseClass + " text-right font-black text-2xl font-mono bg-gray-50/20"}>₹{(item.qty * item.rate).toFixed(2)}</td>;
                                    default: return <td key={col} className={baseClass}>-</td>;
                                }
                            })}
                        </tr>
                    ))}
                    {items.length < (isA4 ? 5 : 3) && Array((isA4 ? 5 : 3) - items.length).fill(0).map((_, i) => (
                        <tr key={`empty-${i}`} className="h-10 border-b border-gray-50">
                            <td colSpan={cols.length}></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Injected Payment Matrix */}
            {showQR && (
                <div className="w-full p-6 border-4 border-dashed border-gray-100 bg-gray-50 rounded-2xl mb-8 flex justify-between items-center italic">
                    <div className="flex gap-10 items-center">
                        <span className="text-xs tracking-widest font-black opacity-40">Payment:</span>
                        <span className="text-xl text-gray-950 font-black italic">
                             Mode: {getPaymentLabel(paymentMode)}
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
                        <span className="uppercase font-black">Sub-Total Value</span>
                        <span className="font-mono">₹{summary.basicTotal.toFixed(2)}</span>
                    </div>
                    {summary.taxTotal > 0 && (
                        <div className="flex justify-between italic opacity-60 border-b pb-2 border-gray-100 text-[12px]">
                            <span className="uppercase font-black">Tax Ledger Sum</span>
                            <span className="font-mono">₹{summary.taxTotal.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between p-4 bg-gray-950 rounded-xl items-center border-[8px] border-white shadow-xl scale-105">
                        <span className="text-lg bold uppercase text-white italic font-black">GRAND TOTAL</span>
                        <span className="text-2xl bold text-white font-black italic font-mono px-4 bg-gray-900 rounded-lg">₹{summary.grandTotal.toFixed(0)}/-</span>
                    </div>
                </div>
            </div>

            {/* Footer Bottom */}
            <div className={`mt-12 flex justify-between items-end border-t-2 pt-4 border-gray-950 uppercase italic opacity-40 font-mono text-[9px]`}>
                <div className="text-left w-1/2">
                    <p className="mb-4 font-black">Authenticated for {storeName.toUpperCase()}</p>
                    <div className="border-t border-gray-950 pt-2 mt-2">
                        <p className="bold text-gray-950 italic uppercase font-black">Authorized Sign</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 text-center opacity-10 pointer-events-none uppercase font-black tracking-[1em] italic">
                <p className="text-[8px] text-gray-950 font-mono">GENERAL TRADE POS V7-STD / 2026</p>
            </div>
        </div>
    );
};

export default RealGeneralStore;
