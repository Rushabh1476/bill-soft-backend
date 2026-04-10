import React from 'react';
import UPIQRCode from './UPIQRCode';

const InvoiceFooter = ({ summary, paymentMode, upiId, storeName, bankDetails, terms, note }) => {
    const showQR = paymentMode === 'UPI' || paymentMode === 'QR';
    
    const getPaymentLabel = (mode) => {
        if (!mode) return 'Cash';
        if (mode === 'Credit') return 'Credit (Udhaar)';
        return mode;
    };
    
    return (
        <div className="mt-8">
            <div className="flex justify-between items-start gap-10">
                {/* Left Side: Bank Details & QR */}
                <div className="w-1/2 flex flex-col gap-4">
                    {/* Payment Mode & QR Code Section */}
                    {showQR && (
                        <>
                        <div className="border border-black p-3 bg-gray-50 flex flex-col gap-1">
                            <div className="text-[8pt] font-black uppercase text-gray-500">Selected Payment Mode</div>
                            <div className="text-[12pt] font-950 text-black uppercase underline decoration-double">Mode: {getPaymentLabel(paymentMode)}</div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="border border-black p-2 bg-white">
                                <UPIQRCode upiId={upiId || 'shop@upi'} amount={summary.grandTotal} name={storeName} size={100} />
                            </div>
                            <div className="text-[8pt] font-bold italic leading-tight">
                                Scan to pay securely<br />
                                using any UPI App<br />
                                <span className="text-[10pt] font-950">₹{(summary.grandTotal || 0).toFixed(0)}/-</span>
                            </div>
                        </div>
                        </>
                    )}

                    {/* Bank Details Box */}
                    {bankDetails && (
                        <div className="border border-black p-3 text-[8pt] leading-tight">
                            <div className="font-950 uppercase border-b border-black mb-1 pb-1">Our Bank Details</div>
                            <div>Bank: <span className="bold uppercase">{bankDetails.bankName || 'HDFC Bank'}</span></div>
                            <div>A/c: <span className="bold">{bankDetails.accountNumber || '50200012345678'}</span></div>
                            <div>IFSC: <span className="bold text-blue-800 uppercase">{bankDetails.ifscCode || 'HDFC0001234'}</span></div>
                        </div>
                    )}
                </div>

                {/* Right Side: Totals Summary (Global Market standard) */}
                {!summary.hideSummaryUI && (
                    <div className="w-full flex-1 flex flex-col items-end">
                        <table className="w-[350px] border-collapse border-2 border-black bg-white">
                            <tbody>
                                <tr className="border-b border-black">
                                    <td className="p-2 text-right font-bold text-[9pt] uppercase text-gray-500 w-1/2">Taxable Value:</td>
                                    <td className="p-2 text-center font-black text-[12pt] w-1/2">₹{(summary.basicTotal || 0).toFixed(2)}</td>
                                </tr>
                                <tr className="border-b border-black">
                                    <td className="p-2 text-right font-bold text-[9pt] uppercase text-gray-500 w-1/2">GST Component:</td>
                                    <td className="p-2 text-center font-black text-[12pt] w-1/2">₹{(summary.taxTotal || 0).toFixed(2)}</td>
                                </tr>
                                {summary.roundOff !== 0 && (
                                    <tr className="border-b border-black">
                                        <td className="p-2 text-right font-bold text-[8pt] text-gray-400 italic w-1/2">Round Off:</td>
                                        <td className="p-2 text-center font-bold text-[9pt] text-gray-400 italic w-1/2">₹{(summary.roundOff || 0).toFixed(2)}</td>
                                    </tr>
                                )}
                                <tr className="bg-black text-white">
                                    <td className="px-4 py-3 text-right font-950 text-[12pt] uppercase tracking-widest border-r border-white/20">GRAND TOTAL:</td>
                                    <td className="px-4 py-3 text-center font-950 text-[20pt] leading-none">₹{(summary.grandTotal || 0).toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="text-[8pt] text-right mt-3 font-bold uppercase italic text-gray-400">
                            Rupees {summary.grandTotalInWords || 'Zero'} Only
                        </div>
                    </div>
                )}
            </div>

            {!summary.hideSummaryUI && (
                <div className="text-[8pt] text-right mt-3 font-bold uppercase italic text-blue-900/40">
                    Rupees {summary.grandTotalInWords || 'Zero'} Only
                </div>
            )}


            {/* Bottom Section: Terms & Signatures */}
            <div className="mt-8 grid grid-cols-2 gap-10 border-t-2 border-black pt-4">
                <div className="text-[7.5pt] text-gray-600 font-bold leading-relaxed">
                    <div className="font-950 underline text-black uppercase mb-1">Standard Terms & Conditions:</div>
                    {terms || (
                        <>
                            1. Goods once sold will not be taken back.<br />
                            2. 18% interest p.a. will be charged for delayed payments.<br />
                            3. Subject to local jurisdiction.
                        </>
                    )}
                </div>
                <div className="text-center flex flex-col items-center justify-end">
                    <div className="text-[10pt] font-950 uppercase italic mb-12">Authorized Signature for {storeName}</div>
                    <div className="w-48 border-t border-black"></div>
                </div>
            </div>

            {note && (
                <div className="mt-4 text-[7pt] text-center italic opacity-30 tracking-[0.5em] uppercase font-black">
                    {note}
                </div>
            )}
        </div>
    );
};

export default InvoiceFooter;
