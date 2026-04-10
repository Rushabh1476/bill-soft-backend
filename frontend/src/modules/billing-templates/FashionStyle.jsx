import React from 'react';
import './InvoiceTemplates.css';

const FashionStyle = ({ saleData, activeColumns }) => {
    const { summary, items, storeName, storeAddress, storeGSTIN, billNo, billDate, customerName, customerPhone, customerAddress } = saleData;

    // Dynamic Columns Logic
    const defaultCols = ['Item Name', 'Qty', 'Rate', 'Amount'];
    const cols = activeColumns || defaultCols;

    const getColLabel = (col) => {
        switch(col) {
            case 'S.No': return '#';
            case 'Item Name': return 'Ensemble / Silhouette';
            case 'HSN': return 'HSN';
            case 'Qty': return 'Vol';
            case 'Rate': return 'Value (₹)';
            case 'Tax': return 'GST%';
            case 'Amount': return 'Sum (₹)';
            case 'Size': return 'Gauge/Size';
            default: return col;
        }
    };

    const getColWidth = (col) => {
        switch(col) {
            case 'S.No': return '40px';
            case 'Item Name': return 'auto';
            case 'HSN': return '80px';
            case 'Qty': return '80px';
            case 'Rate': return '120px';
            case 'Tax': return '80px';
            case 'Amount': return '140px';
            case 'Unit': return '70px';
            case 'Discount': return '90px';
            case 'Batch': return '100px';
            case 'Exp': return '90px';
            default: return '80px';
        }
    };

    return (
        <div className="invoice-container a4-standard-layout fashion-theme p-14 bg-white shadow-2xl border-0">
            <div className="flex justify-between items-start mb-16 pb-16 border-b-2 border-pink-100 italic gap-10">
                <div className="w-2/3">
                    <h1 className="text-6xl bold text-pink-700 uppercase leading-none tracking-widest premium-tag shadow-inner mb-4 ml-[-4px]">{storeName}</h1>
                    <p className="text-sm mt-2 italic tracking-[0.3em] text-gray-300 uppercase leading-relaxed">{storeAddress}</p>
                    <div className="flex gap-14 mt-12 opacity-50 underline decoration-dotted decoration-pink-200">
                       <p className="text-xs bold italic bg-pink-50 text-pink-900 p-3 px-8 rounded-[4rem] shadow-sm uppercase tracking-widest border border-pink-100">Reg: {storeGSTIN}</p>
                    </div>
                </div>
                <div className="text-right w-1/3 border-l-2 border-pink-100 pl-16 flex flex-column justify-center h-full">
                    <h2 className="text-3xl bold text-pink-950 uppercase italic underline decoration-pink-200 decoration-4 underline-offset-10 mb-10 tracking-[0.4em] opacity-30">Couture Invoice</h2>
                    <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] opacity-50">
                        <div className="flex justify-between items-center mb-2">
                           <span>Folio</span>
                           <span className="bold text-pink-700 italic">{billNo}</span>
                        </div>
                        <div className="flex justify-between items-center italic">
                           <span>Epoch</span>
                           <span className="bold tracking-tighter italic">{billDate}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-16 mb-16 p-10 bg-pink-50/10 rounded-[4rem] border-2 border-dashed border-pink-100 italic shadow-[inset_0_4px_8px_rgba(0,0,0,0.02)]">
                <div className="vertical-divider border-pink-200 border-l-4 pr-10">
                  <h3 className="text-xs uppercase text-pink-700 bold mb-6 p-3 bg-pink-50 border-r-8 border-pink-700 rounded-3xl w-fit px-10 tracking-widest italic decoration-double underline shadow-sm">Patron Dossier</h3>
                  <p className="text-3xl bold text-pink-950 italic tracking-widest decoration-pink-200 underline underline-offset-10 mb-4">{customerName}</p>
                  <p className="text-sm mb-2 font-mono tracking-widest text-pink-300 italic opacity-50">{customerPhone}</p>
                  <p className="text-sm text-pink-900 italic whitespace-normal mt-2 leading-relaxed tracking-wider">{customerAddress || 'Maison Region'}</p>
                </div>
                <div className="text-right flex flex-column justify-center italic pr-6 h-full border-r-4 border-pink-100 border-dashed rounded-3xl p-6 bg-white/50">
                    <h3 className="text-xs uppercase text-pink-700 bold mb-10 p-3 bg-white border-2 border-dashed border-pink-100 rounded-[5rem] w-fit px-10 tracking-widest ml-auto mr-0 opacity-10 underline decoration-dotted decoration-pink-200 shadow-xl italic font-black">Style Quote</h3>
                    <p className="text-sm italic text-gray-300 font-mono tracking-widest opacity-30 leading-loose">"Style is a way to say who you are <br/> without having to speak."</p>
                </div>
            </div>

            <table className="w-full mb-16 overflow-hidden rounded-[5rem] border-2 border-pink-50 shadow-xl bg-white/50 backdrop-blur-sm table-fixed">
                <thead>
                    <tr className="bg-pink-50/30">
                        {cols.map((col, idx) => (
                            <th key={idx} style={{ width: getColWidth(col) }} className="p-8 text-xs uppercase text-center tracking-widest italic truncate">
                                {getColLabel(col)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="text-sm italic">
                    {items.map((item, idx) => (
                        <tr key={idx} className="border-b-2 hover:bg-pink-100/20 transition-all border-pink-50 text-pink-950 group">
                            {cols.map((col, cIdx) => {
                                const style = { width: getColWidth(col), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
                                const baseClass = "p-10 align-top";
                                switch(col) {
                                    case 'S.No': return <td key={cIdx} style={style} className={`${baseClass} text-center`}>{idx + 1}</td>;
                                    case 'Item Name': return (
                                        <td key={cIdx} className={`${baseClass}`} style={{ width: 'auto' }}>
                                            <p className="bold text-2xl text-pink-950 overflow-hidden tracking-widest uppercase italic font-black shadow-sm mb-4 leading-none group-hover:scale-105 transition-transform origin-left truncate">{item.name}</p>
                                            <div className="text-xs text-pink-700 bold p-3 bg-pink-100 rounded-[3rem] w-fit mt-4 uppercase italic tracking-widest shadow-inner opacity-20 group-hover:opacity-100 transition-opacity">House of {item.customFields?.brand || 'Luxury Atelier'}</div>
                                            <div className="mt-4 flex gap-6 text-[11px] text-pink-300 italic opacity-30 group-hover:opacity-100 transition-opacity px-2 border-l-4 border-pink-100">
                                               <span>Size: {item.customFields?.size || 'UNS'}</span>
                                               <span className="vertical-divider border-pink-100 px-6">Fabric: {item.customFields?.fabric || 'Crepe'}</span>
                                            </div>
                                        </td>
                                    );
                                    case 'HSN': return <td key={cIdx} style={style} className={`${baseClass} text-center opacity-40 font-mono`}>{item.hsn || '-'}</td>;
                                    case 'Qty': return <td key={cIdx} style={style} className={`${baseClass} text-center italic opacity-30 group-hover:opacity-100 transition-opacity`}>{item.qty} Vol</td>;
                                    case 'Rate': return <td key={cIdx} style={style} className={`${baseClass} text-right font-mono italic text-pink-300 opacity-20 group-hover:opacity-100 transition-opacity px-2`}>₹{(item.rate || 0).toLocaleString()}</td>;
                                    case 'Tax': return <td key={cIdx} style={style} className={`${baseClass} text-center text-pink-700 font-black`}>{item.taxRate || 0}%</td>;
                                    case 'Amount': return <td key={cIdx} style={style} className={`${baseClass} text-right bold text-pink-950 font-mono italic shadow-inner scale-110 group-hover:scale-125 transition-transform font-black px-2`}>₹{(item.total || 0).toLocaleString()}</td>;
                                    case 'Discount': return <td key={cIdx} style={style} className={`${baseClass} text-right`}>₹{(item.discount || 0).toLocaleString()}</td>;
                                    default: return <td key={cIdx} style={style} className={baseClass}>{item[col.toLowerCase()] || '-'}</td>;
                                }
                            })}
                        </tr>
                    ))}
                    {Array(Math.max(0, 2 - items.length)).fill(0).map((_, i) => (
                        <tr key={`empty-${i}`} style={{height: '140px'}} className="bg-pink-50/5 italic text-pink-100 text-center uppercase tracking-[4em] font-black opacity-10 pointer-events-none italic">
                            <td colSpan={5}>ELÉGANCE LUXE ATELIER</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-between items-end mb-20 gap-16 italic group">
                <div className="w-1/2 p-12 border-4 border-dashed border-pink-50 rounded-[6rem] bg-pink-50/10 shadow-2xl group hover:shadow-pink-100 group hover:rotate-1 transition-all border-double scale-95 group-hover:scale-100">
                  <h4 className="text-[12px] bold uppercase mb-8 text-pink-900 tracking-[0.4em] italic font-black underline decoration-pink-700 decoration-8 underline-offset-10 shadow-sm leading-none opacity-20">Terms of Atelier</h4>
                  <ul className="text-[11px] text-pink-200 list-disc pl-10 italic leading-[2.5] font-mono uppercase tracking-[0.2em] opacity-30 group-hover:opacity-100 italic transition-opacity">
                    <li>Exchange allowed within 7 days in pristine state.</li>
                    <li>No return on bespoke couture or sale items.</li>
                    <li>Original tag and digital Folio required.</li>
                    <li>Alterations complimentary within 10 days of epoch.</li>
                  </ul>
                </div>
                <div className="w-1/2 text-right">
                    <div className="flex justify-between mb-4 italic opacity-30 group-hover:opacity-50 transition-opacity">
                        <span className="uppercase body-text tracking-widest text-[14px] bold text-pink-300 underline decoration-double decoration-pink-100 leading-none">Net Folio Value</span>
                        <span className="bold text-pink-950 font-mono text-[18px] tracking-tighter italic">₹{summary.basicTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-10 italic border-b-2 pb-6 border-pink-100 mb-12 opacity-30 group-hover:opacity-50 transition-opacity">
                        <span className="uppercase body-text tracking-widest text-[14px] bold text-pink-300 underline decoration-double decoration-pink-100 leading-none italic font-black">Tax Ledger Contribution</span>
                        <span className="bold text-pink-950 font-mono text-[18px] tracking-tighter italic">₹{summary.taxTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-10 bg-pink-700 rounded-[6rem] shadow-[0_20px_40px_rgba(219,39,119,0.3)] items-center border-[10px] border-white ring-[10px] ring-pink-50 translate-x-12 scale-105 group-hover:scale-110 transition-transform">
                        <span className="text-xl bold uppercase text-white italic tracking-[0.4em] font-black underline decoration-white decoration-4 underline-offset-10 shadow-lg leading-none italic">Total Grandeur</span>
                        <span className="text-5xl bold text-white font-black tracking-tighter italic font-mono p-6 bg-pink-600 rounded-[5rem] border-8 border-dashed border-pink-400 shadow-[inset_0_6px_12px_rgba(0,0,0,0.3)]">₹{summary.grandTotal.toLocaleString()}/-</span>
                    </div>
                    <p className="mt-14 italic text-[14px] text-pink-700 bold italic tracking-[0.6em] opacity-10 uppercase mr-16 font-black decoration-dotted underline underline-offset-8 decoration-pink-700 italic">Adjust: ₹{summary.roundOff}</p>
                </div>
            </div>

            <div className="mt-36 flex justify-between items-end border-t-2 pt-20 border-pink-100 font-black tracking-[1em] uppercase italic opacity-20 decoration-dotted underline decoration-pink-300 underline-offset-10 mb-16 italic">
                <div className="text-center w-1/3">
                    <p className="text-[16px] text-pink-100 mb-16 underline italic font-mono tracking-widest opacity-20">E. & O.E.</p>
                </div>
                <div className="text-right w-1/2">
                    <p className="text-[16px] text-pink-500 mb-40 italic font-mono tracking-widest decoration-dotted opacity-20 italic">Curated for you by {storeName.toUpperCase()}</p>
                    <div className="border-t-2 border-pink-700 pt-8 mt-10">
                        <p className="text-[16px] bold text-pink-700 italic uppercase underline tracking-widest shadow-sm leading-none opacity-40">Creative Director / Atelier Sign</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-28 text-center border-t-2 border-dashed pt-12 border-pink-50 opacity-10 pointer-events-none">
                <p className="text-sm text-pink-700 bold italic tracking-[1.5em] font-black uppercase opacity-20">Fashion / Elegance / Eternal-Soul</p>
            </div>
        </div>
    );
};

export default FashionStyle;
