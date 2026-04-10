import React from 'react';
import './InvoiceTemplates.css';

const ElectronicsPro = ({ saleData, activeColumns }) => {
    const { summary, items, storeName, storeAddress, storeGSTIN, billNo, billDate, customerName, customerPhone, customerAddress } = saleData;

    // Dynamic Columns Logic
    const defaultCols = ['S.No', 'Item Name', 'Qty', 'Rate', 'Tax', 'Amount'];
    const cols = activeColumns || defaultCols;

    const getColLabel = (col) => {
        switch(col) {
            case 'S.No': return 'S.L.';
            case 'Item Name': return 'Product Specification & Serial / IMEI';
            case 'HSN': return 'HSN';
            case 'Qty': return 'Qty';
            case 'Rate': return 'Rate (₹)';
            case 'Tax': return 'GST%';
            case 'Amount': return 'Total (₹)';
            case 'Warranty': return 'Warranty';
            default: return col;
        }
    };

    const getColWidth = (col) => {
        switch(col) {
            case 'S.No': return '40px';
            case 'Item Name': return 'auto';
            case 'HSN': return '80px';
            case 'Qty': return '80px';
            case 'Rate': return '100px';
            case 'Tax': return '80px';
            case 'Amount': return '120px';
            case 'Unit': return '70px';
            case 'Discount': return '90px';
            default: return '80px';
        }
    };

    return (
        <div className="invoice-container a4-standard-layout market-layout bg-white p-10 shadow-2xl border-0">
            {/* Professional Electronics Header */}
            <div className="flex justify-between items-start border-b-4 mb-6 pb-6 border-blue-900 bg-gray-50 p-6 rounded-t-3xl shadow-inner scroll-m-2">
                <div className="w-2/3">
                    <h1 className="text-4xl bold text-blue-900 uppercase leading-none font-black italic tracking-tighter">{storeName}</h1>
                    <p className="body-text mt-2 whitespace-pre-line text-gray-700 italic border-l-2 pl-2 border-blue-900">{storeAddress}</p>
                    <div className="flex gap-4 mt-6">
                       <p className="body-text bold italic bg-blue-900 text-white p-2 rounded shadow-lg uppercase tracking-widest text-[10px]">GSTIN: {storeGSTIN}</p>
                       <p className="body-text bold italic bg-gray-900 text-white p-2 rounded shadow-lg uppercase tracking-widest text-[10px]">PAN: AA-BB-1234-C</p>
                    </div>
                </div>
                <div className="text-right w-1/3">
                    <h2 className="text-3xl bold text-gray-900 uppercase italic underline decoration-blue-900 decoration-4 underline-offset-8">TAX INVOICE</h2>
                    <div className="mt-8 font-mono border-2 border-dashed border-gray-400 p-3 bg-white rounded-2xl shadow-xl">
                        <div className="flex justify-between border-b pb-1 mb-1">
                            <span className="bold uppercase italic">Bill No:</span>
                            <span className="bold text-blue-900 underline">{billNo}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="bold uppercase italic">Date:</span>
                            <span className="bold italic">{billDate}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer Box (High-Fidelity) */}
            <div className="grid grid-cols-2 gap-10 mb-8 p-6 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-400 shadow-xl">
                <div>
                  <h3 className="text-xs uppercase text-blue-900 bold italic mb-4 p-2 bg-blue-100/50 rounded-3xl w-fit px-6 tracking-widest border border-blue-200">Customer Details (Payor)</h3>
                  <p className="text-2xl bold text-gray-900 italic tracking-tighter decoration-double underline decoration-blue-200">{customerName}</p>
                  <p className="body-text mt-2 bold font-black text-blue-900">Mob: {customerPhone}</p>
                  <p className="body-text italic text-gray-500 whitespace-normal leading-tight mt-2">{customerAddress || 'Local Area / Region'}</p>
                </div>
                <div className="text-right flex flex-column justify-center">
                    <h3 className="text-xs uppercase text-blue-900 bold italic mb-4 p-2 bg-blue-100/50 rounded-3xl w-fit px-6 tracking-widest border border-blue-200 ml-auto mr-0">Store Copy QR</h3>
                    <div className="w-16 h-16 border rounded bg-white flex items-center justify-center p-2 shadow-inner ml-auto mr-6 italic">
                       <p className="text-[7px] text-gray-400 text-center uppercase leading-none font-black opacity-20">Device Seal</p>
                    </div>
                </div>
            </div>

            {/* Electronics Items Table (Tally Style) */}
            <table className="w-full mb-10 overflow-hidden rounded-3xl border-2 border-gray-900 shadow-2xl">
                <thead className="bg-blue-900 text-white italic">
                    <tr>
                        {cols.map((col, idx) => (
                            <th key={idx} style={{ width: getColWidth(col), minWidth: '60px' }} className="p-4 text-xs uppercase tracking-widest text-center">
                                {getColLabel(col)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="body-text italic text-[9pt]">
                    {items.map((item, idx) => (
                        <tr key={idx} className="border-b-2 hover:bg-blue-50 transition-colors border-blue-50 group">
                            {cols.map((col, cIdx) => {
                                const style = { width: getColWidth(col), wordBreak: 'break-word' };
                                const baseClass = "p-4 align-top";
                                switch(col) {
                                    case 'S.No': return <td key={cIdx} style={style} className={`${baseClass} text-center`}>{idx + 1}</td>;
                                    case 'Item Name': return (
                                        <td key={cIdx} className={`${baseClass}`} style={{ width: 'auto', minWidth: '150px' }}>
                                            <p className="bold text-lg text-gray-900 tracking-tighter uppercase italic">{item.name}</p>
                                            <div className="mt-3 p-3 bg-blue-900/5 rounded-2xl border border-dashed border-blue-200 gap-2 flex flex-column">
                                                <p className="text-[11px] text-blue-900 bold tracking-widest italic decoration-double underline decoration-blue-200 uppercase font-black">IMEI/SN: {item.customFields?.imei || 'IMEI-2024-' + (idx+1) + 'X'}</p>
                                                <p className="text-[10px] text-gray-500 italic uppercase opacity-75">Model Color: {item.customFields?.color || 'Jet Midnight'}</p>
                                            </div>
                                        </td>
                                    );
                                    case 'HSN': return <td key={cIdx} style={style} className={`${baseClass} text-center opacity-60 font-mono`}>{item.hsn || '-'}</td>;
                                    case 'Qty': return <td key={cIdx} style={style} className={`${baseClass} text-center bold`}>{item.qty} {item.unit || 'Unit'}</td>;
                                    case 'Rate': return <td key={cIdx} style={style} className={`${baseClass} text-right font-mono italic px-2`}>₹{(item.rate || 0).toFixed(2)}</td>;
                                    case 'Tax': return <td key={cIdx} style={style} className={`${baseClass} text-center font-black uppercase text-blue-900`}>{item.taxRate || 0}%</td>;
                                    case 'Amount': return <td key={cIdx} style={style} className={`${baseClass} text-right bold text-blue-900 font-black tracking-tighter italic px-2`}>₹{(item.total || 0).toFixed(2)}</td>;
                                    case 'Discount': return <td key={cIdx} style={style} className={`${baseClass} text-right`}>₹{(item.discount || 0).toFixed(0)}</td>;
                                    default: return <td key={cIdx} style={style} className={baseClass}>{item[col.toLowerCase()] || '-'}</td>;
                                }
                            })}
                        </tr>
                    ))}
                    {/* Padding cells to maintain height if few items */}
                    {Array(Math.max(0, 3 - items.length)).fill(0).map((_, i) => (
                        <tr key={`empty-${i}`} style={{height: '100px'}}>
                            <td colSpan={6} className="bg-gray-50/20 italic text-gray-300 text-center opacity-10 uppercase tracking-[2em] font-black">Electronics Bill Standard / V1</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Warranty & Totals Summary */}
            <div className="flex justify-between items-end mb-16 gap-10">
                <div className="w-1/2 p-8 border-4 border-dashed border-blue-100 rounded-3xl bg-blue-50/10 shadow-inner group">
                  <h4 className="text-sm bold uppercase mb-6 text-blue-900 tracking-[0.2em] italic font-black underline decoration-blue-900 decoration-2 underline-offset-8">WARRANTY TERMS & CONDITIONS</h4>
                  <ul className="text-[11px] text-gray-500 list-disc pl-6 italic leading-loose font-mono uppercase tracking-tighter opacity-75">
                    <li>Warranty is managed by the Brand directly.</li>
                    <li>Goods once sold will not be exchanged or taken back.</li>
                    <li>No warranty on Display / Liquid Damage.</li>
                    <li>Original Box & Invoice required for warranty claims.</li>
                    <li>Software related issues aren't covered in hardware warranty.</li>
                  </ul>
                </div>
                <div className="w-1/2 text-right">
                    <div className="flex justify-between mb-2 italic">
                        <span className="uppercase body-text tracking-widest text-[11px] bold text-gray-400">Sub Total Amount</span>
                        <span className="bold text-gray-800 font-mono text-[14px]">₹{summary.basicTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-4 italic border-b-4 pb-4 border-blue-900 mb-6 group-hover:animate-pulse">
                        <span className="uppercase body-text tracking-widest text-[11px] bold text-gray-400 underline italic">GST Total (18% TAX)</span>
                        <span className="bold text-gray-800 font-mono text-[14px]">₹{summary.taxTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-6 bg-blue-900 rounded-3xl shadow-2xl items-center border-[6px] border-white ring-4 ring-blue-50 translate-x-4">
                        <span className="text-xl bold uppercase text-white italic tracking-widest font-black underline decoration-white decoration-2 underline-offset-8">Net Bill Amount</span>
                        <span className="text-4xl bold text-white font-black tracking-tighter italic font-mono p-2 bg-blue-800 rounded-2xl border-4 border-dashed border-blue-700 shadow-inner">₹{summary.grandTotal.toFixed(0)}/-</span>
                    </div>
                    <p className="mt-4 italic text-[11px] text-blue-900 bold italic tracking-widest opacity-50 uppercase mr-6">Round-off Adj: ₹{summary.roundOff}</p>
                </div>
            </div>

            {/* Signature & End Note Area */}
            <div className="mt-24 flex justify-between items-end border-t-4 pt-12 border-blue-900 font-black tracking-[0.4em] uppercase italic opacity-20">
                <div className="text-center w-1/3">
                    <p className="text-[12px] text-gray-400 mb-10 underline italic font-mono tracking-widest">E. & O.E.</p>
                </div>
                <div className="text-right w-1/2">
                    <p className="text-[12px] text-blue-900 mb-20 italic font-mono tracking-widest">CERTIFIED FOR {storeName.toUpperCase()}</p>
                    <div className="border-t-4 border-blue-900 pt-4">
                        <p className="text-xs bold text-blue-900 italic uppercase underline tracking-widest">Authorized Head Signature</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-16 text-center border-t-2 border-dashed pt-6 border-blue-100 opacity-20">
                <p className="text-xs text-blue-900 bold italic tracking-[0.6em] font-black uppercase">Innovation / Excellence / Visit Again</p>
            </div>
        </div>
    );
};

export default ElectronicsPro;
