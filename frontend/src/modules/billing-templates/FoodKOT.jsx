import React from 'react';
import './InvoiceTemplates.css';

const FoodKOT = ({ saleData }) => {
    const { summary, items, storeName, storeAddress, billNo, billDate, customerName, customerPhone } = saleData;

    return (
        <div className="invoice-container thermal-small-receipt market-layout bg-white p-6 shadow-2xl border-4 border-orange-100 italic rounded-3xl">
            {/* Dining Bill Header */}
            <div className="text-center mb-6 pb-6 border-b-4 border-orange-400">
                <h1 className="header-text uppercase text-orange-600 font-black tracking-[0.2em] mb-2 text-2xl animate-pulse">{storeName}</h1>
                <p className="body-text whitespace-pre-line leading-tight text-gray-500 italic uppercase mb-4 opacity-75">{storeAddress}</p>
                
                <div className="grid grid-cols-3 gap-2 px-2 mb-4 bg-orange-50 p-3 rounded-2xl border-2 border-dashed border-orange-400 font-black">
                    <div className="flex flex-column items-start border-r border-orange-200 pr-2">
                        <span className="bold uppercase text-[8px] text-orange-900 tracking-widest">Table</span>
                        <span className="text-xl bold text-orange-700"># {saleData.customFields?.tableNo || '12'}</span>
                    </div>
                    <div className="flex flex-column items-center border-r border-orange-200 px-2">
                        <span className="bold uppercase text-[8px] text-orange-900 tracking-widest">Pax</span>
                        <span className="text-xl bold text-orange-700">{saleData.customFields?.paxCount || '04'}</span>
                    </div>
                    <div className="flex flex-column items-end pl-2">
                        <span className="bold uppercase text-[8px] text-orange-900 tracking-widest">Captain</span>
                        <span className="text-sm bold text-gray-800 uppercase italic opacity-75">{saleData.customFields?.captainName || 'John D.'}</span>
                    </div>
                </div>
                
                <div className="flex justify-between text-[11px] uppercase font-mono mt-4 px-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                    <span className="bold italic tracking-tighter">Order: #{billNo}</span>
                    <span className="bold italic tracking-tighter decoration-double underline decoration-orange-400">{billDate}</span>
                </div>
                <p className="mt-4 text-[15px] bold border-y-4 py-2 border-orange-400 uppercase italic font-black bg-orange-600 text-white rounded-2xl shadow-xl">DINING FINAL BILL</p>
            </div>

            {/* Guest Summary (Brief) */}
            <div className="mb-6 p-4 bg-gray-50/50 rounded-2xl border-2 border-dotted border-gray-400 font-black">
                <div className="flex justify-between items-center italic">
                    <span className="text-sm bold text-gray-800 uppercase tracking-tighter">Guest: {customerName}</span>
                    <span className="text-xs font-mono text-orange-900 opacity-50">{customerPhone}</span>
                </div>
            </div>

            {/* High-Fidelity Menu Items */}
            <div className="mb-8 font-mono">
                <div className="flex justify-between text-[12px] bold border-b-4 border-orange-400 pb-3 mb-4 uppercase text-gray-900 tracking-[0.1em] italic">
                   <span style={{width: '60%'}}>Entrees & Mains</span>
                   <span style={{width: '15%'}} className="text-center underline decoration-orange-200">Qty</span>
                   <span style={{width: '25%'}} className="text-right underline decoration-orange-200 font-black">Amt</span>
                </div>
                {items.map((item, idx) => (
                    <div key={idx} className="mb-4 border-b border-orange-50 pb-2 group">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-sm bold break-all leading-tight uppercase italic text-gray-900 tracking-tighter pr-4">{item.name}</span>
                            <span className="text-sm bold text-center text-orange-900 opacity-75" style={{width: '15%'}}>{item.qty}</span>
                            <span className="text-sm bold text-right text-gray-900 font-black" style={{width: '25%'}}>₹{(item.qty * item.rate).toFixed(0)}</span>
                        </div>
                        {item.customFields?.flavor && (
                            <div className="text-[10px] text-orange-600 bold italic mt-1 px-3 bg-orange-50/50 rounded-lg border-l-4 border-orange-200 opacity-75 uppercase">
                                Note: {item.customFields.flavor}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Dining Totals (Bold Focus) */}
            <div className="border-t-4 border-b-4 border-orange-400 py-6 mb-8 bg-orange-50/50 p-6 rounded-3xl border-dashed border-2 shadow-inner">
                <div className="flex justify-between mb-2 text-sm text-gray-700 tracking-tighter">
                    <span className="uppercase italic bold">Total Food Value</span>
                    <span className="bold">₹{summary.basicTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-4 text-xs text-orange-900 italic tracking-tighter p-2 bg-orange-100/50 rounded-xl border border-orange-200">
                    <span className="uppercase bold tracking-[0.2em] font-black underline decoration-orange-300">Gst (Cgst 2.5% + Sgst 2.5%)</span>
                    <span className="bold font-black">₹{summary.taxTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-4 text-sm text-gray-700 tracking-tighter border-b-2 border-orange-200 pb-2 mb-4">
                   <span className="uppercase italic bold tracking-widest decoration-double underline decoration-orange-300">Service Chg. (2%)</span>
                    <span className="bold">₹{((summary.basicTotal) * 0.02).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-6 items-center">
                    <span className="text-xl bold uppercase text-orange-700 italic font-black tracking-[0.2em] underline decoration-orange-600 decoration-4 underline-offset-8">Final Total</span>
                    <span className="text-4xl bold text-orange-700 font-black tracking-tighter italic font-mono bg-orange-100 rounded-2xl border-4 border-dashed border-orange-400 shadow-2xl p-2 scale-110">₹{(summary.grandTotal + (summary.basicTotal * 0.02)).toFixed(0)}</span>
                </div>
            </div>

            {/* Feedback & Branding Area */}
            <div className="text-center">
                <div className="mt-8 flex flex-column items-center gap-4">
                    <p className="text-lg bold uppercase tracking-widest text-orange-700 italic underline decoration-orange-200 decoration-4 underline-offset-8 font-black">YUMMY EXPERIENCE!</p>
                    <p className="text-2xl bold uppercase tracking-tighter text-gray-900 italic opacity-20">VISIT AGAIN SOON</p>
                    <div className="my-8 border-4 border-dashed border-orange-200 p-6 rounded-[3rem] w-full bg-orange-50/20 shadow-inner group">
                        <p className="text-[11px] text-orange-300 italic uppercase leading-tight font-black tracking-[0.3em] opacity-40 group-hover:opacity-100 transition-opacity">Your Feedback Matters!<br/>Scan QR on the wall</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-12 pt-6 border-t-2 border-dashed border-gray-400 opacity-20">
                <p className="text-[10px] text-gray-400 text-center uppercase tracking-[0.6em] font-black italic opacity-50">Dining Final-Bill V2 / 2026</p>
            </div>
        </div>
    );
};

export default FoodKOT;
