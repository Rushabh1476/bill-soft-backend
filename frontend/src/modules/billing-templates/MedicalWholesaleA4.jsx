import React from 'react';
import './InvoiceTemplates.css';

const MedicalWholesaleA4 = ({ saleData }) => {
    const { summary, items, storeName, storeAddress, storeGSTIN, billNo, billDate, customerName, customerPhone, customerAddress, customerGSTIN } = saleData;

    const renderInvoiceSection = (isBottom = false) => (
        <div className={`wholesale-medical-theme p-4 bg-white ${isBottom ? 'border-t-2 border-dashed border-gray-400 mt-10' : ''}`} style={{ minHeight: '148mm' }}>
            {/* Header Identity */}
            <div className="header-title uppercase tracking-widest mb-0 border-b-0">TAX- INVOICE</div>

            <div className="border-all flex">
                <div className="w-1/2 border-r p-2 leading-tight">
                    <h1 className="text-xl bold tracking-tighter shadow-sm mb-1">GMED ENTERPRISES</h1>
                    <p className="text-[9pt] italic mb-1">{storeAddress || 'SHOP NO-4, GR FLR, P.NO-6, SR.NO-42/1/4, PUNE-411048'}</p>
                    <p className="bold text-[8pt]">LICENSE NO- MH/PD/PUN-ZONE-2/6/MD-42/009/2022</p>
                    <p className="bold text-[8pt]">GSTIN: {storeGSTIN} | Mfg Reg No: MH/PUN/8892</p>
                </div>
                <div className="w-1/2 p-2">
                    <div className="grid grid-cols-2 gap-x-2 text-[9pt] font-mono">
                        <span className="bold italic">INV NO:</span>
                        <span className="bold text-lg leading-none">{billNo}</span>
                        <span className="bold italic">DATE:</span>
                        <span className="bold">{billDate}</span>
                        <span className="bold italic">MODE:</span>
                        <span className="bold">CREDIT/CASH</span>
                    </div>
                </div>
            </div>

            {/* Bill To / Details Row */}
            <div className="border-all border-t-0 flex">
                <div className="w-1/2 border-r p-2 leading-tight bg-gray-50/20">
                    <p className="bold text-[8pt] italic underline decoration-dotted mb-1 uppercase">Bill To (Party Details)</p>
                    <p className="text-lg bold tracking-tighter">{customerName}</p>
                    <p className="text-[9pt] italic">{customerAddress || 'Local Service Region'}</p>
                    <p className="bold text-[8pt]">GSTIN: {customerGSTIN || 'URD'}</p>
                    <p className="bold text-[8pt]">MOB: {customerPhone}</p>
                </div>
                <div className="w-1/2 p-2 bg-gray-50/20">
                    <p className="bold text-[8pt] italic underline decoration-dotted mb-1 uppercase">Invoice Logic Details</p>
                    <div className="grid grid-cols-2 text-[8pt]">
                        <span>DL NO:</span> <span className="bold">MH-PUN-0092/2022</span>
                        <span>PLACE:</span> <span className="bold">PUNE (MAHARASHTRA)</span>
                        <span>CODE:</span> <span className="bold">27</span>
                    </div>
                </div>
            </div>

            {/* Strict Wholesale Table (13 Columns Matrix) */}
            <table className="w-full mt-0 border-t-0 border-b-0">
                <thead>
                    <tr className="bg-gray-50">
                        <th style={{ width: '4%' }}>#</th>
                        <th style={{ width: '25%' }}>Product Name</th>
                        <th style={{ width: '8%' }}>Code</th>
                        <th style={{ width: '8%' }}>HSN</th>
                        <th style={{ width: '8%' }}>Batch</th>
                        <th style={{ width: '7%' }}>Exp</th>
                        <th style={{ width: '7%' }}>Size</th>
                        <th style={{ width: '6%' }}>Qty</th>
                        <th style={{ width: '4%' }}>Uom</th>
                        <th style={{ width: '7%' }}>Price</th>
                        <th style={{ width: '7%' }}>Taxable</th>
                        <th style={{ width: '6%' }}>Gst%</th>
                        <th style={{ width: '8%' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="text-center">{idx + 1}</td>
                            <td className="bold uppercase whitespace-nowrap overflow-hidden">{item.name}</td>
                            <td className="text-center">#00{idx + 1}</td>
                            <td className="text-center">{item.customFields?.hsn || '3004'}</td>
                            <td className="text-center font-black">{item.customFields?.batchNo || 'B445'}</td>
                            <td className="text-center bold text-red-600">{item.customFields?.expDate || '12/26'}</td>
                            <td className="text-center">{item.customFields?.size || 'STD'}</td>
                            <td className="text-center bold">{item.qty}</td>
                            <td className="text-center italic">{item.customFields?.unit || 'NOS'}</td>
                            <td className="text-right">₹{(item.rate || 0).toFixed(2)}</td>
                            <td className="text-right font-mono">₹{((item.qty || 0) * (item.rate || 0)).toFixed(2)}</td>
                            <td className="text-center">{item.taxRate || 0}%</td>
                            <td className="text-right bold font-mono">₹{((item.qty || 0) * (item.rate || 0) * (1 + (item.taxRate || 0) / 100)).toFixed(2)}</td>
                        </tr>
                    ))}
                    {Array(Math.max(0, (isBottom ? 4 : 8) - items.length)).fill(0).map((_, i) => (
                        <tr key={`empty-${i}`} style={{ height: '24px' }}>
                            {Array(13).fill(0).map((__, j) => <td key={j}></td>)}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Calculations & GST Breakup */}
            <div className="border-all border-t-0 flex">
                <div className="w-1/2 border-r p-2">
                    <p className="bold text-[8pt] underline uppercase italic mb-1">GST Tax Breakup Header</p>
                    <table className="text-[7pt] border-none select-none">
                        <thead className="border-none">
                            <tr className="border-none">
                                <th className="p-1">HSN</th>
                                <th className="p-1">Val</th>
                                <th className="p-1">CGST%</th>
                                <th className="p-1">Amt</th>
                                <th className="p-1">SGST%</th>
                                <th className="p-1">Amt</th>
                                <th className="p-1">Total</th>
                            </tr>
                        </thead>
                        <tbody className="border-none">
                            <tr className="border-none">
                                <td className="p-1 text-center font-mono">3004</td>
                                <td className="p-1 text-right">₹{(summary.basicTotal || 0).toFixed(0)}</td>
                                <td className="p-1 text-center">6%</td>
                                <td className="p-1 text-right">₹{((summary.taxTotal || 0) / 2).toFixed(2)}</td>
                                <td className="p-1 text-center">6%</td>
                                <td className="p-1 text-right">₹{((summary.taxTotal || 0) / 2).toFixed(2)}</td>
                                <td className="p-1 text-right bold">₹{(summary.taxTotal || 0).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="w-1/2 p-2 leading-none">
                    <div className="flex justify-between border-b pb-1 mb-1 text-[9pt]">
                        <span>Sub-Total Before Tax:</span>
                        <span className="bold font-mono">₹{(summary.basicTotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1 mb-1 text-[9pt]">
                        <span>Add Tax Total Amnt:</span>
                        <span className="bold font-mono">₹{(summary.taxTotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 border-2 border-black items-center mt-2">
                        <span className="bold text-[10pt] italic">NET INVOICE VALUE:</span>
                        <span className="text-xl bold font-black underline decoration-double">₹{(summary.grandTotal || 0).toFixed(0)}/-</span>
                    </div>
                    <p className="text-[7pt] italic mt-1 text-right opacity-50">Amnt In Words: RUPEES {summary.grandTotalInWords || 'ZERO ONLY'}</p>
                </div>
            </div>

            {/* Footer Matrix (Bank & Sign) */}
            <div className="border-all border-t-0 flex">
                <div className="w-1/3 border-r p-2 bg-gray-50 font-mono text-[7pt] leading-tight">
                    <p className="bold underline italic mb-1 uppercase">Remittance / Bank Info</p>
                    <p>AC Name: <b>GMED ENTERPRISES</b></p>
                    <p>AC NO: <b>50200067744321</b></p>
                    <p>IFSC: <b>HDFC0000001</b></p>
                    <p>Bank: <b>HDFC BANK, PUNE</b></p>
                </div>
                <div className="w-1/3 border-r p-2 text-[7pt] italic opacity-50 font-black">
                    <p className="underline mb-1">NOTIFICATIONS & TERMS</p>
                    <p>Certified that the particulars given above are true and correct & the amount indicated represents the price actually charged and there is no addition in flow of money etc. Subject to Pune jurisdiction.</p>
                </div>
                <div className="w-1/3 p-2 text-right">
                    <p className="bold text-[8pt] uppercase mb-16 italic">For GMED ENTERPRISES (AUTH SIGN)</p>
                    <br />
                    <p className="bold underline italic text-[9pt]">Authorized Signatory / Stamp</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="invoice-container a4-standard-layout shadow-none m-0 p-0 bg-transparent">
            {/* Page 1: Original Invoice */}
            {renderInvoiceSection(false)}

            {/* Page Break / Repeater for Dual-Section functionality */}
            {renderInvoiceSection(true)}
        </div>
    );
};

export default MedicalWholesaleA4;
