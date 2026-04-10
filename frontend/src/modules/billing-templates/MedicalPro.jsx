import React from 'react';
import './InvoiceTemplates.css';

const MedicalPro = ({ saleData }) => {
    const { summary, items, storeName, storeAddress, storeGSTIN, billNo, billDate, customerName, customerPhone, customerAddress } = saleData;

    return (
        <div className="invoice-container a4-standard-layout pharmacy-theme p-10 bg-white">
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-300">
                <div className="w-2/3">
                    <h1 className="text-3xl bold uppercase text-blue-900 leading-none">{storeName}</h1>
                    <p className="body-text mt-2 italic whitespace-pre-line">{storeAddress}</p>
                    <p className="body-text bold mt-4">GSTIN: {storeGSTIN} | DL No: DL-20-45/21-45</p>
                </div>
                <div className="text-right w-1/3">
                    <h2 className="text-xl bold bg-black text-white p-2 px-4 uppercase tracking-widest inline-block italic mb-4">TAX INVOICE</h2>
                    <div className="text-sm font-mono border p-2 bg-gray-50 uppercase shadow-inner">
                        <p>Invoice: <b className="text-blue-900">{billNo}</b></p>
                        <p>Date: <b>{billDate}</b></p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 italic">
                <div className="p-4 border rounded shadow-sm bg-gray-50/50">
                    <p className="text-[9px] bold uppercase text-blue-800 mb-1">Patient Details</p>
                    <p className="text-lg bold">{customerName}</p>
                    <p className="text-xs">Phone: {customerPhone}</p>
                    <p className="text-xs text-gray-500">{customerAddress || 'Local Area'}</p>
                </div>
                <div className="p-4 border rounded shadow-sm bg-gray-50/50 text-right">
                    <p className="text-[9px] bold uppercase text-blue-800 mb-1">Doctor Reference</p>
                    <p className="text-sm bold">Dr. {saleData.customFields?.doctorName || 'Self / General'}</p>
                    <p className="text-xs">Reg ID: RG-PX-001</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style={{ width: '30%' }}>Medicine / Composition</th>
                        <th style={{ width: '10%' }} className="text-center">HSN</th>
                        <th style={{ width: '12%' }} className="text-center">Batch</th>
                        <th style={{ width: '10%' }} className="text-center">Exp</th>
                        <th style={{ width: '10%' }} className="text-center">Qty</th>
                        <th style={{ width: '12%' }} className="text-right">Rate</th>
                        <th style={{ width: '16%' }} className="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx}>
                            <td>
                                <p className="bold uppercase leading-none">{item.name}</p>
                                <p className="text-[8px] mt-1 text-gray-400 italic">MFG: {item.customFields?.mfgDate || '01/2024'}</p>
                            </td>
                            <td className="text-center font-mono">{item.customFields?.hsn || '3004'}</td>
                            <td className="text-center font-mono">{item.customFields?.batchNo || 'B-' + (200 + idx)}</td>
                            <td className="text-center font-mono bold text-red-600">{item.customFields?.expiryDate || '12/26'}</td>
                            <td className="text-center bold">{item.qty}</td>
                            <td className="text-right font-mono">₹{item.rate.toFixed(2)}</td>
                            <td className="text-right bold font-mono">₹{(item.qty * item.rate).toFixed(2)}</td>
                        </tr>
                    ))}
                    {Array(Math.max(0, 10 - items.length)).fill(0).map((_, i) => (
                        <tr key={`empty-${i}`} style={{ height: '28px' }}>
                            <td colSpan={7}></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-between items-start mt-4 gap-10">
                <div className="w-1/2">
                    <div className="warning-box uppercase tracking-tighter text-[8px] italic">
                        Caution: Scheduled H Drug - Warning: To be sold by retail on the prescription of a Registered Medical Practitioner only.
                    </div>
                </div>
                <div className="w-1/2">
                    <div className="flex justify-between mb-1 py-1 border-b italic">
                        <span>Basic Total</span>
                        <span className="bold font-mono">₹{summary.basicTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-1 py-1 border-b italic">
                        <span>CGST + SGST (12%)</span>
                        <span className="bold font-mono">₹{summary.taxTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-blue-900 text-white rounded shadow-xl mt-4">
                        <span className="text-lg bold uppercase tracking-widest italic">Net Payable</span>
                        <span className="text-2xl bold font-black font-mono">₹{summary.grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-16 flex justify-between items-end italic">
                <div className="w-1/3">
                    <p className="text-[10px] text-gray-400 mb-8 border-b pb-1 font-mono uppercase tracking-widest italic">Original Bill Required for Refunds.</p>
                </div>
                <div className="w-1/3 text-right">
                    <p className="text-[10px] bold text-blue-900 mb-16 uppercase italic">FOR {storeName.toUpperCase()}</p>
                    <div className="border-t border-gray-400 pt-2 px-10">
                        <p className="text-xs bold uppercase tracking-widest text-blue-900 border-l px-4 border-blue-900">Pharmacist Signature</p>
                    </div>
                </div>
            </div>

            <p className="text-center mt-12 text-[10px] text-gray-400 uppercase tracking-[0.4em] font-black opacity-30 italic">Thank you for Choosing Health / Visit Again</p>
        </div>
    );
};

export default MedicalPro;
