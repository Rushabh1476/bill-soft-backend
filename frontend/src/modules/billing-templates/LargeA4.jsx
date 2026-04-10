import React from 'react';
import './InvoiceTemplates.css';
import UPIQRCode from './core/UPIQRCode';

/**
 * LargeA4.jsx
 * Detailed version with an 'HSN-wise Tax Summary' table at the bottom.
 * Optimized for Standard A4 Printers for large orders.
 */
const LargeA4 = ({ saleData }) => {
    if (!saleData) return null;

    const {
        storeName,
        storeAddress,
        storeGSTIN,
        billNo,
        billDate,
        customerName,
        customerPhone,
        customerAddress,
        customerGSTIN,
        items = [],
        summary = {},
        irn,
        ewayBill,
        paymentMode,
        businessLogo,
        upiId
    } = saleData;

    const isInterState = saleData.isInterState || false;

    // Logic: Calculate HSN-wise tax summary table
    const hsnSummary = items.reduce((acc, item) => {
        const hsn = item.hsn || '9999';
        if (!acc[hsn]) {
            acc[hsn] = {
                taxableVal: 0,
                cgst: 0,
                sgst: 0,
                igst: 0,
                taxRate: item.taxRate
            };
        }
        acc[hsn].taxableVal += item.taxableAmount;
        acc[hsn].cgst += item.cgst || 0;
        acc[hsn].sgst += item.sgst || 0;
        acc[hsn].igst += item.igst || 0;
        return acc;
    }, {});

    return (
        <div className="invoice-container large-a4-layout p-14 bg-white text-gray-900 shadow-2xl relative font-sans leading-relaxed">
            <div className="letter-header grid grid-cols-2 gap-10 border-b-4 border-gray-900 pb-10 mb-10 items-center">
                <div className="store-details flex items-center">
                     {businessLogo ? (
                        <img src={businessLogo} alt="Logo" className="logo-img w-24 h-24 object-contain mr-8" />
                    ) : (
                        <div className="logo-placeholder w-20 h-20 bg-gray-900 flex items-center justify-center rounded-lg text-white font-black text-3xl mr-8">L</div>
                    )}
                    <div>
                        <h1 className="text-4xl font-black uppercase text-gray-900 tracking-tighter">{storeName || 'BillSoft Solutions'}</h1>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">GSTIN: {storeGSTIN || '12ABCDE1234F1Z1'}</p>
                        <p className="text-xs text-gray-500 max-w-sm mt-1 whitespace-pre-wrap">{storeAddress}</p>
                    </div>
                </div>
                <div className="invoice-title text-right uppercase italic font-black">
                    <p className="text-6xl text-gray-100 absolute right-14 top-14 -z-10 select-none">INVOICE</p>
                    <h2 className="text-5xl text-gray-900 m-0">TAX INVOICE</h2>
                    <div className="mt-8">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-0 tracking-widest">Serial Number</p>
                        <p className="text-2xl font-black text-gray-900 border-b-2 border-black inline-block">{billNo}</p>
                    </div>
                </div>
            </div>

            <div className="info-section grid grid-cols-3 gap-10 mb-12 border-b pb-12 border-gray-100">
                <div className="bill-to col-span-2 p-6 border rounded-2xl bg-gray-50/50 border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100/30 rounded-full -mr-16 -mt-16"></div>
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">BILL TO:</h3>
                    <p className="font-extrabold text-gray-900 text-2xl mb-1">{customerName || 'Consumer Customer'}</p>
                    <p className="text-sm text-gray-600 max-w-md whitespace-pre-wrap leading-relaxed">{customerAddress || 'Customer address not specified in system records.'}</p>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Phone Contact</p>
                            <p className="text-sm font-bold text-gray-700">{customerPhone || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Client GSTIN</p>
                            <p className="text-sm font-black text-blue-900">{customerGSTIN || 'Unregistered'}</p>
                        </div>
                    </div>
                </div>
                <div className="system-details flex flex-col gap-6">
                    <div className="p-4 border rounded-2xl bg-gray-50/50 border-gray-100">
                         <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">INVOICE DATED:</h3>
                         <p className="text-sm font-black text-gray-900">{billDate}</p>
                    </div>
                    <div className="p-4 border rounded-2xl bg-gray-50/50 border-gray-100">
                         <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">PAYMENT MODE:</h3>
                         <p className="text-sm font-black text-green-700 uppercase">Mode: {paymentMode === 'Credit' ? 'Credit (Udhaar)' : (paymentMode || 'Cash')}</p>
                    </div>
                </div>
            </div>

            {/* Payment QR Section (Conditional) */}
            {(paymentMode === 'UPI' || paymentMode === 'QR') && (
                <div className="flex justify-end mb-8">
                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className="bg-white p-2 border border-black rounded-lg">
                            <UPIQRCode upiId={upiId} amount={summary.grandTotal} name={storeName} size={80} />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Scan to Pay</p>
                            <p className="text-xl font-black text-gray-900 leading-none">₹{summary.grandTotal.toFixed(0)}</p>
                        </div>
                    </div>
                </div>
            )}

            <table className="items-table w-full border-collapse mb-12">
                <thead className="bg-gray-900 text-white font-black text-[11px] uppercase tracking-widest">
                    <tr>
                        <th className="p-5 text-left rounded-tl-lg">NAME & DESCRIPTION</th>
                        <th className="p-5 text-center">HSN</th>
                        <th className="p-5 text-center">QTY</th>
                        <th className="p-5 text-center">RATE</th>
                        <th className="p-5 text-center">DISC%</th>
                        <th className="p-5 text-right rounded-tr-lg">AMOUNT</th>
                    </tr>
                </thead>
                <tbody className="text-gray-800">
                    {items.map((item, idx) => (
                        <tr key={idx} className="border-b last:border-0 border-gray-50">
                            <td className="p-5">
                                <p className="font-bold text-lg text-gray-900">{item.name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                            </td>
                            <td className="p-5 text-center text-xs font-mono text-gray-400">{item.hsn || '9999'}</td>
                            <td className="p-5 text-center text-gray-900 font-bold">{item.qty} {item.unit || 'UNITS'}</td>
                            <td className="p-5 text-center text-gray-500 font-mono italic">₹{item.rate?.toFixed(2)}</td>
                            <td className="p-5 text-center text-red-400">-{item.discountPercent || 0}%</td>
                            <td className="p-5 text-right font-black text-xl text-gray-900">₹{(item.qty * item.rate).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* HSN-Wise Tax Summary (Requirement 3: LargeA4) */}
            <div className="hsn-summary-section mt-12 mb-12 p-8 border-2 border-gray-100 rounded-3xl bg-gray-50/20">
                <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-[.3em] mb-6 border-b border-gray-100 pb-2 text-center">GST TAX COMPLIANCE SUMMARY (HSN CODE WISE)</h4>
                <table className="w-full text-xs font-mono">
                    <thead className="text-gray-400 border-b border-gray-100">
                        <tr>
                            <th className="p-3 text-left">HSN/SAC</th>
                            <th className="p-3 text-center">TAXABLE VAL.</th>
                            {isInterState ? (
                                <th className="p-3 text-center">IGST (%)</th>
                            ) : (
                                <>
                                    <th className="p-3 text-center">CGST (%)</th>
                                    <th className="p-3 text-center">SGST (%)</th>
                                </>
                            )}
                            <th className="p-3 text-right">TOTAL TAX</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(hsnSummary).map(([hsn, data]) => (
                            <tr key={hsn} className="border-t border-gray-50 border-dotted align-top">
                                <td className="p-3 font-bold text-gray-900">{hsn}</td>
                                <td className="p-3 text-center">₹{data.taxableVal.toFixed(2)}</td>
                                {isInterState ? (
                                    <td className="p-3 text-center">₹{data.igst.toFixed(2)} ({data.taxRate}%)</td>
                                ) : (
                                    <>
                                        <td className="p-3 text-center">₹{data.cgst.toFixed(2)} ({data.taxRate/2}%)</td>
                                        <td className="p-3 text-center">₹{data.sgst.toFixed(2)} ({data.taxRate/2}%)</td>
                                    </>
                                )}
                                <td className="p-3 text-right font-bold text-gray-900">₹{(data.cgst + data.sgst + data.igst).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="compliance-grid grid grid-cols-2 gap-10 mb-12 items-end">
                <div className="irn-block flex-1 border border-gray-100 p-6 rounded-2xl flex gap-6 bg-white shadow-sm overflow-hidden">
                    <div className="qr-box w-20 h-20 bg-gray-100 border border-gray-200"></div>
                    <div className="flex-1 min-w-0">
                         <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">E-INVOICE IRN</p>
                         <p className="text-[10px] font-mono text-gray-500 break-all leading-tight italic bg-gray-50 p-2 rounded border border-gray-100 mb-3">{irn || 'N/A'}</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">E-WAY BILL NUMBER</p>
                         <p className="text-sm font-black text-gray-900">{ewayBill || 'NOT GENERATED'}</p>
                    </div>
                </div>
                <div className="totals-block w-96 space-y-3">
                    <div className="row flex justify-between text-sm py-1 border-b border-gray-50">
                        <span className="text-gray-500">Value Before Tax</span>
                        <span className="font-bold">₹{summary.basicTotal?.toFixed(2)}</span>
                    </div>
                    <div className="row flex justify-between text-sm py-1 border-b border-gray-50">
                        <span className="text-gray-500">Total Tax Amount</span>
                        <span className="font-bold">₹{summary.taxTotal?.toFixed(2)}</span>
                    </div>
                    {summary.tcsAmount > 0 && (
                        <div className="row flex justify-between text-sm py-1 border-b border-gray-50 text-red-600">
                            <span className="font-bold">TCS Amount</span>
                            <span className="font-black">₹{summary.tcsAmount?.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="row flex justify-between text-xs italic text-gray-300 py-1 border-b border-gray-50">
                        <span>Round Off Difference</span>
                        <span>{summary.roundOff}</span>
                    </div>
                    <div className="grand-total-block bg-gray-900 text-white rounded-3xl p-10 flex flex-col justify-center items-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-20 h-2 w-full bg-blue-500"></div>
                        <p className="text-[11px] font-black uppercase tracking-[.4em] mb-2 opacity-50">FINAL INVOICE VALUE</p>
                        <h3 className="text-5xl font-black m-0 tracking-tighter">₹{summary.grandTotal}</h3>
                        <p className="text-[9px] mt-4 italic opacity-30 text-center uppercase">Certified by BillSoft POS Compliant Engine</p>
                    </div>
                </div>
            </div>

            <div className="certified-footer mt-20 border-t border-gray-900 pt-10 grid grid-cols-3 gap-10 text-[10px] text-gray-400">
                <div className="col-span-2">
                    <h5 className="font-black text-gray-900 uppercase underline decoration-gray-100 mb-2">TERMS & DECLARATION:</h5>
                    <p className="leading-relaxed">Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged and there is no flow of additional consideration directly or indirectly from the buyer. Subject to state jurisdiction. Goods once sold are not returnable.</p>
                </div>
                <div className="text-right flex flex-col justify-end">
                    <p className="font-black text-gray-900 uppercase">For {storeName}</p>
                    <div className="h-16"></div>
                    <p className="font-black text-gray-500 uppercase border-t border-gray-100 pt-2 border-dotted">Authorized Signatory</p>
                </div>
            </div>
        </div>
    );
};

export default LargeA4;
