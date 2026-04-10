import React from 'react';
import './InvoiceTemplates.css';

const BoutiquePro = ({ saleData }) => {
    const { summary, items, storeName, storeAddress, storeGSTIN, billNo, billDate, customerName, customerPhone, customerAddress } = saleData;

    return (
        <div className="invoice-container a4-standard-layout p-10 bg-white italic">
            {/* Header Section */}
            <div className="flex justify-between items-start border-b-2 mb-10 pb-10 border-pink-600">
                <div className="w-2/3">
                    <h1 className="text-5xl bold text-pink-700 uppercase leading-none tracking-tighter" style={{fontFamily: 'Outfit, sans-serif'}}>{storeName}</h1>
                    <p className="text-sm mt-1 italic tracking-widest text-gray-500">{storeAddress}</p>
                    <p className="text-xs bold mt-4 p-2 bg-pink-50 border rounded-2xl w-fit text-pink-900 border-pink-200 uppercase tracking-widest">GSTIN: {storeGSTIN}</p>
                </div>
                <div className="text-right w-1/3">
                    <h2 className="text-2xl bold text-gray-800 uppercase italic underline tracking-widest">BOUTIQUE INVOICE</h2>
                    <div className="mt-6 font-mono text-xs uppercase">
                        <p className="text-sm">Bill: <span className="bold text-pink-700">{billNo}</span></p>
                        <p className="text-sm mt-1 italic">Date: <span className="bold tracking-tighter">{billDate}</span></p>
                    </div>
                </div>
            </div>

            {/* Client Section Section */}
            <div className="grid grid-cols-2 gap-10 mb-10 p-6 bg-pink-50/20 rounded-3xl border-2 border-dashed border-pink-200">
                <div>
                  <h3 className="text-xs uppercase text-pink-700 bold mb-4 p-2 bg-pink-100 rounded-3xl w-fit px-4 tracking-widest italic">VALUED CUSTOMER</h3>
                  <p className="text-xl bold text-gray-900 tracking-tighter italic">{customerName}</p>
                  <p className="text-sm mb-1 font-mono">{customerPhone}</p>
                  <p className="text-sm text-gray-600 italic whitespace-normal">{customerAddress || 'N/A'}</p>
                </div>
                <div className="text-right">
                    <h3 className="text-xs uppercase text-pink-700 bold mb-4 p-2 bg-pink-100 rounded-3xl w-fit px-4 ml-auto text-right tracking-widest italic">FASHION QUOTE</h3>
                    <p className="text-sm italic text-gray-500 font-mono">Style is a way to say who you are without having to speak.</p>
                </div>
            </div>

            {/* Garments Items Table */}
            <table className="w-full mb-10 overflow-hidden rounded-3xl border-2 border-pink-100">
                <thead className="bg-pink-700 text-white italic">
                    <tr>
                        <th className="p-4 text-xs uppercase tracking-widest" style={{width: '45%'}}>Gown/Garment Info</th>
                        <th className="p-4 text-xs uppercase text-center tracking-widest" style={{width: '10%'}}>Size</th>
                        <th className="p-4 text-xs uppercase text-center tracking-widest" style={{width: '10%'}}>Qty</th>
                        <th className="p-4 text-xs uppercase text-right tracking-widest" style={{width: '15%'}}>Rate</th>
                        <th className="p-4 text-xs uppercase text-right tracking-widest" style={{width: '20%'}}>Total</th>
                    </tr>
                </thead>
                <tbody className="text-sm italic">
                    {items.map((item, idx) => (
                        <tr key={idx} className="border-b-2 hover:bg-pink-50 transition-colors border-pink-50">
                            <td className="p-6">
                                <p className="bold text-lg text-gray-900 overflow-hidden tracking-tighter">{item.name}</p>
                                <p className="text-xs text-pink-700 bold p-2 bg-pink-50/50 rounded-2xl w-fit mt-2 uppercase italic tracking-tighter">Brand: {item.customFields?.brand || 'Premium Design'}</p>
                                <p className="text-xs text-gray-500 mt-2 italic uppercase">Color: {item.customFields?.color || 'Ivory White'}</p>
                            </td>
                            <td className="p-6 text-center font-mono text-sm bold text-pink-900">{item.customFields?.size || 'Free'}</td>
                            <td className="p-6 text-center italic">{item.qty}</td>
                            <td className="p-6 text-right font-mono italic">₹{item.rate.toFixed(2)}</td>
                            <td className="p-6 text-right bold text-pink-900 font-mono italic">₹{(item.qty * item.rate).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals Summary */}
            <div className="flex justify-between items-end mb-12 gap-10">
                <div className="w-1/2 p-6 border-2 border-dashed border-pink-200 rounded-3xl bg-pink-50/10">
                  <h4 className="text-xs bold uppercase mb-4 text-pink-900 tracking-tighter italic">Exchange Policy</h4>
                  <ul className="text-[10px] text-gray-500 list-disc pl-4 italic leading-loose font-mono">
                    <li>Exchange allowed within 7 days with original tag & bill.</li>
                    <li>No return on Discounted/Sale garments.</li>
                    <li>Items must be in original condition (unworn).</li>
                    <li>Hand wash only recommended for silk fabrics.</li>
                  </ul>
                </div>
                <div className="w-1/2 text-right">
                    <div className="flex justify-between mb-2 text-sm italic">
                        <span className="text-gray-600 uppercase tracking-widest">Sub Total</span>
                        <span className="bold text-gray-800 font-mono">₹{summary.basicTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-4 text-sm italic border-b-2 pb-2 border-pink-100">
                        <span className="text-gray-600 uppercase tracking-widest underline italic">GST Total (Tax)</span>
                        <span className="bold text-gray-800 font-mono">₹{summary.taxTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-pink-700 rounded-3xl shadow-xl">
                        <span className="text-xl bold uppercase text-white italic tracking-tighter">Final Amount</span>
                        <span className="text-3xl bold text-white font-black tracking-tighter italic font-mono">₹{summary.grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Signature & End NoteArea */}
            <div className="mt-24 flex justify-between items-end border-t-2 pt-10 border-pink-200 font-black tracking-[0.2em] uppercase italic">
                <div className="text-center w-1/3">
                    <p className="text-[10px] text-gray-400 mb-10 underline italic font-mono">E. & O.E.</p>
                </div>
                <div className="text-right w-1/3">
                    <p className="text-[10px] text-pink-300 mb-16 italic font-mono">Handcrafted for you by {storeName.toUpperCase()}</p>
                    <div className="border-t-2 border-pink-700 pt-3">
                        <p className="text-xs bold text-pink-700 italic uppercase underline tracking-widest">Designer / Authorized Sign</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-14 text-center border-t border-dashed pt-4 border-pink-200">
                <p className="text-xs text-pink-800 bold italic tracking-[0.4em] font-black uppercase">Stay Fashionable / Visit Again</p>
            </div>
        </div>
    );
};

export default BoutiquePro;
