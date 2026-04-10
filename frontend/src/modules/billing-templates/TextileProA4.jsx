import React from 'react';
import './InvoiceTemplates.css';

const TextileProA4 = ({ saleData }) => {
    const { summary, items, storeName, storeAddress, storeGSTIN, billNo, billDate, customerName, customerPhone, customerAddress } = saleData;

    return (
        <div className="invoice-container a4-standard-layout textile-theme p-12 bg-white shadow-2xl">
            <div className="flex justify-between items-start mb-16 pb-16 border-b-2 border-gray-100 italic gap-10">
                <div className="w-2/3">
                    <h1 className="text-6xl bold text-gray-900 uppercase leading-none tracking-widest italic decoration-double underline decoration-gray-200 mt-[-4px]">{storeName}</h1>
                    <p className="text-sm mt-3 italic tracking-[0.4em] text-gray-400 uppercase leading-relaxed font-mono opacity-50 underline decoration-dotted">{storeAddress}</p>
                    <div className="flex gap-14 mt-12 opacity-30 underline decoration-dotted decoration-gray-200 uppercase font-black tracking-widest text-xs">
                       <p className="bg-gray-100 text-gray-950 p-2 px-8 rounded-full shadow-sm">GST: {storeGSTIN}</p>
                       <p className="bg-white border p-2 px-8 rounded-full shadow-sm">ESTB-1992-TX</p>
                    </div>
                </div>
                <div className="text-right w-1/3 border-l-2 border-gray-100 pl-16 flex flex-column justify-center h-full italic">
                    <h2 className="text-3xl bold text-gray-900 uppercase italic underline decoration-gray-200 decoration-4 underline-offset-10 mb-10 tracking-[0.4em] opacity-30">Tex-Bill</h2>
                    <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] opacity-50 text-right">
                        <div className="flex justify-between items-center mb-2">
                           <span>Serial</span>
                           <span className="bold text-gray-900 italic tracking-tighter">#{billNo}</span>
                        </div>
                        <div className="flex justify-between items-center italic">
                           <span>Epoch</span>
                           <span className="bold tracking-tighter italic">{billDate}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-16 mb-16 p-10 bg-gray-50/50 rounded-[4rem] border-2 border-dashed border-gray-100 italic shadow-[inset_0_4px_8px_rgba(0,0,0,0.02)]">
                <div className="flex flex-column justify-center pr-10 border-r-2 border-gray-100 border-dashed">
                  <h3 className="text-xs uppercase text-gray-400 bold mb-6 p-2 bg-white border-2 border-dashed border-gray-100 rounded-3xl w-fit px-10 tracking-widest italic decoration-double underline shadow-sm opacity-50">Party Dossier</h3>
                  <p className="text-3xl bold text-gray-900 italic tracking-widest decoration-gray-200 underline underline-offset-10 mb-4">{customerName}</p>
                  <p className="text-sm mb-2 font-mono tracking-widest text-gray-400 italic opacity-30 font-black">{customerPhone}</p>
                  <p className="text-sm text-gray-400 italic whitespace-normal mt-2 leading-relaxed tracking-wider opacity-50 uppercase font-black decoration-dotted underline">{customerAddress || 'Maison Region'}</p>
                </div>
                <div className="text-right flex flex-column justify-center italic pr-6 h-full border-r-4 border-gray-100 border-dashed rounded-3xl p-6 bg-white/50">
                    <h3 className="text-xs uppercase text-gray-400 bold mb-10 p-3 bg-white border-2 border-dashed border-gray-100 rounded-[5rem] w-fit px-10 tracking-widest ml-auto mr-0 opacity-10 underline decoration-dotted decoration-gray-200 shadow-xl italic font-black">Trade Quote</h3>
                    <p className="text-sm italic text-gray-400 font-mono tracking-widest opacity-20 leading-loose">"The thread connects the past <br/> to the future of design."</p>
                </div>
            </div>

            <table className="w-full mb-16 overflow-hidden rounded-[5rem] border-2 border-gray-100 shadow-xl bg-white/50 backdrop-blur-sm">
                <thead>
                    <tr className="bg-gray-100/30">
                        <th className="p-10 text-xs uppercase tracking-widest italic text-center" style={{width: '6%'}}>#</th>
                        <th className="p-10 text-xs uppercase tracking-widest italic text-left" style={{width: '45%'}}>Quality / Description / Texture</th>
                        <th className="p-10 text-xs uppercase text-center tracking-widest italic" style={{width: '12%'}}>Width</th>
                        <th className="p-10 text-xs uppercase text-center tracking-widest italic" style={{width: '12%'}}>Mtr/Qty</th>
                        <th className="p-10 text-xs uppercase text-right tracking-widest italic font-black" style={{width: '25%'}}>Sum Net (₹)</th>
                    </tr>
                </thead>
                <tbody className="text-sm italic">
                    {items.map((item, idx) => (
                        <tr key={idx} className="border-b-2 hover:bg-gray-50 transition-all border-gray-100 text-gray-950 group">
                            <td className="p-10 text-center opacity-30 font-black italic">{idx + 1}</td>
                            <td className="p-10">
                                <p className="bold text-2xl text-gray-950 overflow-hidden tracking-widest uppercase italic font-black shadow-sm mb-4 leading-none group-hover:scale-105 transition-transform origin-left">{item.name}</p>
                                <div className="text-[10px] text-gray-400 italic px-4 border-l-4 border-gray-100 opacity-20 group-hover:opacity-100 transition-opacity uppercase font-black tracking-widest italic">Fabric Grade: Export Standard / Dye Lot: {idx + 245}</div>
                                <div className="item-meter uppercase tracking-widest opacity-10 group-hover:opacity-100 italic transition-opacity mt-2">Weight: 240GSM / Composition: Blend-Cotton</div>
                            </td>
                            <td className="p-10 text-center font-mono text-lg bold text-gray-950 underline decoration-double decoration-gray-100 italic scale-125 group-hover:scale-150 transition-transform">{item.customFields?.width || "44'"}</td>
                            <td className="p-10 text-center italic opacity-30 group-hover:opacity-100 transition-opacity font-black text-lg">{item.qty} {item.customFields?.unit || 'Mtrs'}</td>
                            <td className="p-10 text-right bold text-gray-900 font-mono italic shadow-inner scale-110 group-hover:scale-125 transition-transform font-black text-2xl">₹{(item.qty * item.rate).toFixed(2)}</td>
                        </tr>
                    ))}
                    {Array(Math.max(0, 3 - items.length)).fill(0).map((_, i) => (
                        <tr key={`empty-${i}`} style={{height: '140px'}} className="bg-gray-50/5 italic text-gray-100 text-center uppercase tracking-[4em] font-black opacity-10 pointer-events-none italic">
                            <td colSpan={5}>HOUSE OF FABRIC / TEXTILE LEDGER</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-between items-end mb-20 gap-16 italic group">
                <div className="w-1/2 p-12 border-4 border-dashed border-gray-100 rounded-[6rem] bg-gray-50/10 shadow-2xl group hover:shadow-gray-200 transition-all border-double scale-95 group-hover:scale-100">
                  <h4 className="text-[12px] bold uppercase mb-8 text-gray-900 tracking-[0.4em] italic font-black underline decoration-gray-900 decoration-8 underline-offset-10 shadow-sm leading-none opacity-20">Terms of Fabric</h4>
                  <ul className="text-[11px] text-gray-400 list-disc pl-10 italic leading-[2.5] font-mono uppercase tracking-[0.2em] opacity-30 group-hover:opacity-100 italic transition-opacity">
                    <li>Exchange allowed only on uncut/unused fabrics.</li>
                    <li>Color bleeding is not considered a manufacturing defect.</li>
                    <li>Slight shrinkage of 2-5% expected in natural blends.</li>
                    <li>Original Tex-Bill dossier required for all inquiries.</li>
                  </ul>
                </div>
                <div className="w-1/2 text-right">
                    <div className="flex justify-between mb-4 italic opacity-30 group-hover:opacity-50 transition-opacity">
                        <span className="uppercase body-text tracking-widest text-[14px] bold text-gray-400 underline decoration-double decoration-gray-100 leading-none">Net Folio Value</span>
                        <span className="bold text-gray-950 font-mono text-[18px] tracking-tighter italic">₹{summary.basicTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-10 italic border-b-2 pb-6 border-gray-100 mb-12 opacity-30 group-hover:opacity-50 transition-opacity">
                        <span className="uppercase body-text tracking-widest text-[14px] bold text-gray-400 underline decoration-double decoration-gray-100 leading-none italic font-black">Trade Tax Contribution (Consolidated)</span>
                        <span className="bold text-gray-950 font-mono text-[18px] tracking-tighter italic">₹{summary.taxTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-10 bg-gray-900 rounded-[6rem] shadow-[0_20px_40px_rgba(17,24,39,0.3)] items-center border-[10px] border-white ring-[10px] ring-gray-1 ring-gray-50 translate-x-12 scale-105 group-hover:scale-110 transition-transform">
                        <span className="text-xl bold uppercase text-white italic tracking-[0.4em] font-black underline decoration-white decoration-4 underline-offset-10 shadow-lg leading-none italic">Grand Total Sum</span>
                        <span className="text-5xl bold text-white font-black tracking-tighter italic font-mono p-6 bg-gray-800 rounded-[5rem] border-8 border-dashed border-gray-700 shadow-[inset_0_6px_12px_rgba(0,0,0,0.4)]">₹{summary.grandTotal.toFixed(0)}/-</span>
                    </div>
                    <p className="mt-14 italic text-[14px] text-gray-700 bold italic tracking-[0.6em] opacity-10 uppercase mr-16 font-black decoration-dotted underline underline-offset-8 decoration-gray-700 italic">Adjust: ₹{summary.roundOff}</p>
                </div>
            </div>

            <div className="mt-36 flex justify-between items-end border-t-2 pt-20 border-gray-900 font-black tracking-[1em] uppercase italic opacity-20 decoration-dotted underline decoration-gray-400 underline-offset-10 mb-16 italic">
                <div className="text-center w-1/3">
                    <p className="text-[16px] text-gray-200 mb-16 underline italic font-mono tracking-widest opacity-20">E. & O.E.</p>
                </div>
                <div className="text-right w-1/2">
                    <p className="text-[16px] text-gray-900 mb-40 italic font-mono tracking-widest decoration-dotted opacity-20 italic">Curated for your attire by {storeName.toUpperCase()}</p>
                    <div className="border-t-2 border-gray-900 pt-8 mt-10">
                        <p className="text-[16px] bold text-gray-900 italic uppercase underline tracking-widest shadow-sm leading-none opacity-40">House Steward / Authorized Sign</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-28 text-center border-t-2 border-dashed pt-12 border-gray-50 opacity-10 pointer-events-none">
                <p className="text-sm text-gray-900 bold italic tracking-[1.5em] font-black uppercase opacity-20">Texture / Design / Silk-Road-V2 / Visit Again</p>
            </div>
        </div>
    );
};

export default TextileProA4;
