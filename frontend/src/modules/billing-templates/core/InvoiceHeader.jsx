import React from 'react';

const InvoiceHeader = ({ storeName, storeAddress, storeGSTIN, billNo, billDate, customerName, customerPhone, customerAddress, customerGSTIN, title = 'TAX INVOICE', extraHeaderInfo }) => {
    return (
        <div className="flex flex-col border border-black min-h-[140px] mb-4">
            {/* Main Header Strip */}
            <div className="flex border-b border-black">
                {/* Left: Store Details */}
                <div className="w-1/2 p-4 border-r border-black bg-gray-50/20">
                    <div className="text-3xl font-950 uppercase mb-2 text-gray-900 leading-none tracking-tighter">{storeName || 'YOUR BUSINESS NAME'}</div>
                    <div className="text-[9pt] font-bold text-gray-700 leading-tight mb-3">
                        {storeAddress || 'Company Address Line 1, City, State, Pincode'}
                    </div>
                    <div className="grid grid-cols-2 text-[8pt] font-bold gap-y-1.5 uppercase tracking-tighter col-gap-4">
                        <span className="text-gray-400">GSTIN:</span>
                        <span className="text-gray-900 font-950">{storeGSTIN || 'URD'}</span>
                        {extraHeaderInfo}
                    </div>
                </div>

                {/* Right: Invoice Metadata */}
                <div className="w-1/2 flex flex-col bg-white">
                    <div className="text-center font-950 text-2xl py-4 border-b border-black bg-gray-100 uppercase tracking-widest italic">{title}</div>
                    <div className="flex flex-grow items-stretch">
                        <div className="w-1/2 p-3 border-r border-black flex flex-col gap-2">
                             <div className="text-[7pt] text-gray-400 font-black uppercase tracking-widest">Invoice Details</div>
                             <div className="text-[10pt] font-950 text-blue-900 leading-none">#{billNo}</div>
                             <div className="text-[9pt] font-bold leading-none">{billDate}</div>
                        </div>
                        <div className="w-1/2 p-3 flex flex-col gap-2 bg-gray-50/30">
                             <div className="text-[7pt] text-gray-400 font-black uppercase tracking-widest">Terms</div>
                             <div className="text-[10pt] font-950 text-red-600 underline uppercase italic">IMMEDIATE</div>
                             <div className="text-[8pt] font-bold text-gray-500 italic">Net Cash</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Buyer Details Row */}
            <div className="w-full p-4 bg-white min-h-[90px]">
                <div className="italic text-[7.5pt] text-gray-700 font-black mb-1 uppercase tracking-[0.2em] underline decoration-gray-200">Customer (Bill to):</div>
                <div className="flex justify-between items-start">
                    <div className="w-2/3">
                        <div className="text-2xl font-950 uppercase text-gray-900 mb-1 leading-none">{customerName || 'Walk-in Customer'}</div>
                        <div className="text-[9pt] text-gray-600 font-bold uppercase italic leading-tight">{customerAddress || 'Local Address Details'}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[9.5pt] font-950 text-gray-800">GSTIN: {customerGSTIN || 'URD'}</div>
                        <div className="text-[9.5pt] font-950 text-gray-800">Mob: {customerPhone || 'N/A'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceHeader;
