import React from 'react';
import './InvoiceTemplates.css';

const GeneralStoreA4 = ({ saleData }) => {
    const { summary, items, storeName, storeAddress, storeGSTIN, billNo, billDate, customerName, customerPhone, customerAddress } = saleData;

    return (
        <div className="invoice-container a4-standard-layout general-theme p-10 bg-white">
            <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-200">
                <div className="w-2/3">
                    <h1 className="text-4xl bold tracking-tight text-gray-900 leading-none uppercase italic border-l-8 border-gray-900 pl-4">{storeName}</h1>
                    <p className="text-sm mt-3 text-gray-500 font-mono italic">{storeAddress}</p>
                    <p className="bold text-xs mt-4 uppercase tracking-widest text-gray-700 bg-gray-100 p-2 inline-block">GST REG: {storeGSTIN}</p>
                </div>
                <div className="text-right w-1/3">
                    <h2 className="text-2xl bold tracking-widest uppercase italic mb-8 underline decoration-double decoration-gray-900">Retail Invoice</h2>
                    <div className="font-mono text-sm border-4 border-double border-gray-900 p-4 rotate-1 group hover:rotate-0 transition-transform">
                        <p className="flex justify-between opacity-50"><span>ID:</span> <b className="text-gray-900">{billNo}</b></p>
                        <p className="flex justify-between mt-2"><span>Date:</span> <b className="text-gray-900">{billDate}</b></p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-10 mb-10 p-8 border-l-8 border-r-8 border-gray-900 bg-gray-50 flex items-stretch">
                <div className="flex flex-column justify-center border-r border-dashed border-gray-300 pr-10 italic">
                    <p className="text-[10px] bold uppercase text-gray-400 mb-2 underline decoration-dotted">MEMBER / PATRON BILLED</p>
                    <p className="text-3xl bold text-gray-900 tracking-tight underline decoration-gray-900 decoration-4 underline-offset-8">{customerName}</p>
                    <p className="text-md mt-4 bold font-black text-gray-500">MOB: {customerPhone}</p>
                    <p className="text-[11px] mt-2 text-gray-400 leading-loose uppercase tracking-widest leading-none font-mono italic">{customerAddress || 'Local Market Area'}</p>
                </div>
                <div className="text-right flex flex-column justify-center italic h-full py-4 opacity-50 font-black">
                   <p className="text-[10px] underline mb-4">LOGISTICS & COMPLIANCE</p>
                   <p className="text-[12px] uppercase leading-relaxed font-mono italic tracking-tighter decoration-dotted underline">Fast-Track Delivery Enabled<br/>Point of Sale V2 Certified<br/>Consumer Rights Act 2024 Applied</p>
                </div>
            </div>

            <table className="w-full no-round border-4 border-gray-900 shadow-xl overflow-hidden rounded-3xl">
                <thead>
                    <tr className="bg-gray-900 text-white italic">
                        <th className="p-4 uppercase tracking-widest text-center" style={{width: '5%'}}>S.L.</th>
                        <th className="p-4 uppercase tracking-widest text-left" style={{width: '45%'}}>Itemized Commodity Description</th>
                        <th className="p-4 uppercase tracking-widest text-center" style={{width: '15%'}}>SAC/HSN</th>
                        <th className="p-4 uppercase tracking-widest text-center" style={{width: '10%'}}>Qty / Unit</th>
                        <th className="p-4 uppercase tracking-widest text-right" style={{width: '25%'}}>Total Net Value (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx} className="border-b transition-colors hover:bg-gray-50 group italic border-gray-100">
                            <td className="p-6 text-center text-gray-300 bold opacity-50 font-mono text-lg italic">{idx + 1}</td>
                            <td className="p-6">
                                <p className="bold text-xl text-gray-900 overflow-hidden tracking-tighter uppercase italic font-black shadow-sm mb-2 leading-none">{item.name}</p>
                                <div className="text-[10px] text-gray-400 italic flex gap-4 uppercase font-black opacity-30 mt-4 px-2 border-l-4 border-gray-100">
                                   <span>Retail-Grade Quality Assured</span>
                                   <span className="bold underline decoration-dotted">MFR: Batch-2024-X</span>
                                </div>
                            </td>
                            <td className="p-6 text-center italic font-black tracking-widest text-gray-900 bg-gray-50/50 uppercase border-x-4 border-white h-full align-middle font-mono">2106</td>
                            <td className="p-6 text-center bold text-lg text-gray-800 italic underline decoration-double decoration-gray-400">{item.qty} {item.customFields?.unit || 'pc'}</td>
                            <td className="p-6 text-right font-mono italic text-xl bold p-6 bg-gray-50/10">₹{(item.qty * item.rate).toFixed(2)}</td>
                        </tr>
                    ))}
                    {Array(Math.max(0, 4 - items.length)).fill(0).map((_, i) => (
                        <tr key={`empty-${i}`} style={{ height: '80px' }} className="bg-gray-50/5 text-gray-100 text-center opacity-5 uppercase tracking-[3em] font-black pointer-events-none">
                            <td colSpan={5}>RETAIL COMMODITY DOCKET / STANDARDIZED</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-between items-end mt-16 mb-20 gap-16 font-mono italic">
                <div className="w-1/2 p-10 border-8 border-double border-gray-100 bg-gray-50/50 group hover:rotate-1 hover:shadow-2xl transition-all shadow-inner scale-95 group-hover:scale-100">
                  <h4 className="text-[12px] bold uppercase mb-8 text-gray-900 tracking-[0.4em] italic font-black underline decoration-gray-900 decoration-8 underline-offset-10 shadow-sm leading-none opacity-20">Terms of Purchase</h4>
                  <ul className="text-[11px] text-gray-400 list-disc pl-8 italic leading-loose font-mono uppercase tracking-[0.1em] opacity-50 group-hover:opacity-100 italic">
                    <li>Exchange possible within 7 days with original Invoice.</li>
                    <li>Open/Used items cannot be returned due to hygiene.</li>
                    <li>Refunds are processed as Store Credit only.</li>
                    <li>Subject to local market jurisdiction and laws.</li>
                  </ul>
                </div>
                <div className="w-1/3 text-right">
                    <div className="flex justify-between mb-2 italic opacity-50">
                        <span className="uppercase text-[12px] bold tracking-widest underline decoration-double decoration-gray-100 leading-none">Net Total Value</span>
                        <span className="bold font-950 font-mono text-[16px] tracking-tighter italic">₹{summary.basicTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-8 italic border-b-8 pb-6 border-gray-900 mb-10 group-hover:animate-pulse shadow-sm opacity-50">
                        <span className="uppercase text-[12px] bold tracking-widest underline decoration-double decoration-gray-100 leading-none italic font-black">Consolidated GST Amt</span>
                        <span className="bold font-950 font-mono text-[16px] tracking-tighter italic">₹{summary.taxTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-8 bg-gray-900 text-white rounded-[3rem] shadow-2xl items-center border-[10px] border-white ring-8 ring-gray-1 ring-gray-50 translate-x-8 group hover:scale-105 transition-transform p-10">
                        <span className="text-xl bold uppercase italic tracking-[0.2em] font-black underline decoration-white decoration-4 underline-offset-10 shadow-lg leading-none italic">Total Grandeur</span>
                        <span className="text-5xl bold font-black tracking-tighter italic font-mono p-4 bg-gray-800 rounded-[2rem] border-8 border-dashed border-gray-700 shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)]">₹{summary.grandTotal.toFixed(0)}/-</span>
                    </div>
                    <p className="mt-8 italic text-[12px] text-gray-500 bold italic tracking-[0.4em] opacity-30 uppercase mr-10 font-black decoration-dotted underline underline-offset-4 decoration-gray-900">Adj: ₹{summary.roundOff}</p>
                </div>
            </div>

            <div className="mt-36 flex justify-between items-end border-t-8 pt-16 border-gray-900 font-black tracking-[0.6em] uppercase italic opacity-10 decoration-double underline decoration-gray-500 underline-offset-10 mb-10">
                <div className="text-center w-1/3">
                    <p className="text-[14px] text-gray-200 mb-12 underline italic font-mono tracking-widest opacity-20">E. & O.E. / STATUTORY</p>
                </div>
                <div className="text-right w-1/2">
                    <p className="text-[14px] text-gray-900 mb-28 italic font-mono tracking-widest decoration-dotted italic opacity-20">Validated for {storeName.toUpperCase()}</p>
                    <div className="border-t-8 border-gray-900 pt-6">
                        <p className="text-[14px] bold text-gray-900 italic uppercase underline tracking-widest shadow-sm leading-none opacity-40">Store Manager / Sign</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-20 text-center border-t-8 border-dashed pt-8 border-gray-50 opacity-10 font-black tracking-[1.5em] italic">
                <p className="text-xs text-gray-400 bold italic font-black uppercase opacity-20">General Retail POS / Professional Output / Visit Again</p>
            </div>
        </div>
    );
};

export default GeneralStoreA4;
