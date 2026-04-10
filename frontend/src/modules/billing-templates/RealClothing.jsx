import React from 'react';
import './InvoiceTemplates.css';
import UPIQRCode from './core/UPIQRCode';

const RealClothing = ({ saleData, size = 'A4', activeColumns }) => {
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
            case 'Item Name': return 'Ensemble';
            case 'HSN': return 'HSN';
            case 'Unit': return 'Unit';
            case 'Qty': return 'Qty';
            case 'Batch': return 'Batch';
            case 'Exp': return 'Exp';
            case 'Rate': return 'Rate';
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
            case 'HSN': return 'w-[70px] text-center';
            case 'Unit': return 'w-[50px] text-center';
            case 'Qty': return 'w-[60px] text-center';
            case 'Batch': return 'w-[80px] text-center';
            case 'Exp': return 'w-[70px] text-center';
            case 'Rate': return 'w-[80px] text-right';
            case 'Tax': return 'w-[50px] text-center';
            case 'Discount': return 'w-[50px] text-center';
            case 'Amount': return 'w-[100px] text-right';
            default: return '';
        }
    };

    return (
        <div className={`invoice-container ${isA4 ? 'a4-standard-layout' : (isA5 ? 'a5-half-layout' : 'thermal-layout')} real-print-theme ${isA4 ? 'p-10' : 'p-5'} bg-white shadow-none border-none`}>
            {/* Minimalist Logo/Header */}
            <div className="text-center mb-8 border-b border-gray-100 pb-8 italic">
                <div className="text-[9px] uppercase font-bold tracking-[0.4em] mb-2 opacity-30 font-black italic">RETAIL TAX INVOICE V7- LUXURY</div>
                <h1 className={`${isA4 ? 'text-5xl' : 'text-3xl'} bold uppercase text-gray-950 tracking-[0.4em] mb-2 font-black italic`}>{storeName}</h1>
                <p className="text-[10px] text-gray-400 italic mb-4 whitespace-pre-line font-mono opacity-40 uppercase">{storeAddress}</p>
                <div className="flex justify-between text-[10px] p-2 bg-gray-50/20 rounded-full border border-gray-50 italic uppercase font-black tracking-widest opacity-20">
                    <span>Folio: #{billNo}</span>
                    <span>GSTIN: {storeGSTIN || 'URD'}</span>
                    <span>Date: {billDate}</span>
                </div>
            </div>

            {/* Customer Info */}
            <div className={`flex justify-between items-start ${isA4 ? 'mb-12' : 'mb-6'} italic`}>
                <div className="w-1/2 border-r border-dashed border-gray-200 pr-8">
                    <p className="text-[9px] bold uppercase text-gray-400 mb-4 tracking-[0.2em] italic opacity-40">Patron Folio</p>
                    <p className={`${isA4 ? 'text-3xl' : 'text-xl'} bold text-gray-950 italic tracking-[0.1em] font-black uppercase`}>{customerName || 'Luxury Guest'}</p>
                    <p className="text-[10px] font-mono tracking-widest text-gray-300 opacity-40 font-black">PH: {customerPhone}</p>
                </div>
                <div className="text-right w-1/2 opacity-30 font-black flex flex-col gap-1">
                    <div className="text-[10px] uppercase font-black font-mono">
                        <p>GRADE: PRM-V7</p>
                        <p>ID: {billNo}</p>
                    </div>
                </div>
            </div>

            {/* Clothing Matrix Table */}
            <table className="w-full mb-8 rounded-2xl border border-gray-100 overflow-hidden bg-white italic cursor-default">
                <thead>
                    <tr className="bg-gray-50/50 uppercase tracking-[0.2em] italic border-b border-gray-950">
                        {cols.map((col, idx) => (
                            <th key={col} className={`${getColClass(col)} p-4 text-[10px] border-r border-gray-100 last:border-r-0`}>
                                {getColLabel(col)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="text-[11px] italic">
                    {items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-50 text-gray-950">
                            {cols.map((col, cIdx) => {
                                const baseClass = `${getColClass(col)} p-4 italic border-r border-gray-100 last:border-r-0 border-dashed`;
                                
                                switch(col) {
                                    case 'S.No': return <td key={col} className={baseClass + " text-center"}>{idx + 1}</td>;
                                    case 'Item Name': return (
                                        <td key={col} className={baseClass}>
                                            <p className="font-black text-xl text-gray-950 uppercase italic leading-none break-words">{item.name}</p>
                                            <div className="text-[8px] text-gray-300 italic mt-2 opacity-40 uppercase font-black">Grade-A Fabric Ensemble {item.customFields?.size ? `(Size: ${item.customFields.size})` : ''}</div>
                                        </td>
                                    );
                                    case 'HSN': return <td key={col} className={baseClass}>{item.hsn || '-'}</td>;
                                    case 'Unit': return <td key={col} className={baseClass}>{item.unit || 'Nos'}</td>;
                                    case 'Qty': return <td key={col} className={baseClass + " text-center italic font-black text-lg"}>{item.qty} PC</td>;
                                    case 'Batch': return <td key={col} className={baseClass}>{item.batch || '-'}</td>;
                                    case 'Exp': return <td key={col} className={baseClass}>{item.exp || '-'}</td>;
                                    case 'Rate': return <td key={col} className={baseClass + " text-right opacity-30 font-mono"}>₹{item.rate.toFixed(0)}</td>;
                                    case 'Tax': return <td key={col} className={baseClass}>{item.taxRate}%</td>;
                                    case 'Discount': return <td key={col} className={baseClass}>{item.discount || 0}%</td>;
                                    case 'Amount': return <td key={col} className={baseClass + " text-right font-black text-2xl bg-gray-50/10"}>₹{(item.qty * item.rate).toFixed(0)}</td>;
                                    default: return <td key={col} className={baseClass}>-</td>;
                                }
                            })}
                        </tr>
                    ))}
                    {items.length < (isA4 ? 4 : 3) && Array((isA4 ? 4 : 3) - items.length).fill(0).map((_, i) => (
                        <tr key={`empty-${i}`} className="h-10 border-b border-gray-50">
                            <td colSpan={cols.length}></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Injected Payment Matrix */}
            {showQR && (
                <div className="w-full p-4 border-4 border-dashed border-gray-100 bg-gray-50 rounded-2xl mb-8 flex justify-between items-center italic">
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
                        <span className="uppercase font-black">Basic Dossier Value</span>
                        <span className="font-mono">₹{summary.basicTotal.toFixed(0)}</span>
                    </div>
                    {summary.taxTotal > 0 && (
                        <div className="flex justify-between italic opacity-60 border-b pb-2 border-gray-100 text-[12px]">
                            <span className="uppercase font-black">Tax Ledger Sum</span>
                            <span className="font-mono">₹{summary.taxTotal.toFixed(0)}</span>
                        </div>
                    )}
                    <div className="flex justify-between p-4 bg-gray-950 rounded-xl items-center border-[8px] border-white shadow-xl scale-105">
                        <span className="text-lg bold uppercase text-white italic font-black">Total Net Sum</span>
                        <span className="text-2xl bold text-white font-black italic font-mono px-4 bg-gray-900 rounded-lg">₹{summary.grandTotal.toFixed(0)}/-</span>
                    </div>
                </div>
            </div>

            {/* Signature Area */}
            <div className={`mt-12 flex justify-between items-end border-t-2 pt-8 border-gray-950 uppercase italic opacity-20 font-mono text-[9px]`}>
                <div className="text-left w-1/2">
                    <p className="mb-8 font-black">Authenticated for {storeName.toUpperCase()}</p>
                    <div className="border-t border-gray-950 pt-2 mt-2">
                        <p className="bold text-gray-950 italic uppercase font-black text-[12px]">Atelier Director / sign</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 text-center opacity-10 pointer-events-none uppercase font-black tracking-[1em] italic">
                <p className="text-[7px] text-gray-950">Texture / Silk / Atelier-V7-Lux / visit again</p>
            </div>
        </div>
    );
};

export default RealClothing;
