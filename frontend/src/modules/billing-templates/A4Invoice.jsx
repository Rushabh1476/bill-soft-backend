import React from 'react';
import './InvoiceTemplates.css';
import UPIQRCode from './core/UPIQRCode';

/**
 * A4Invoice.jsx
 * Professional business layout with columns for HSN, Discount, and Tax.
 * Optimized for Standard A4 Printers.
 */
const A4Invoice = ({ saleData, activeColumns }) => {
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
        upiId,
        businessLogo // URL or base64 string
    } = saleData;

    const isInterState = saleData.isInterState || false;
    const showQR = paymentMode === 'UPI' || paymentMode === 'QR';

    const getPaymentLabel = (mode) => {
        if (!mode) return 'CASH';
        if (mode === 'Credit') return 'Credit (Udhaar)';
        return mode;
    };

    // Dynamic Columns Logic
    const defaultCols = ['Item Name', 'HSN', 'Qty', 'Rate', 'Discount', 'Tax', 'Amount'];
    const cols = activeColumns || defaultCols;

    const getColLabel = (col) => {
        // 1. Check custom labels from settings
        const customLabel = saleData.settings?.columnLabels?.[col] || (saleData.settings?.customColumns?.find(c => c.id === col)?.label);
        if (customLabel) return customLabel;

        switch(col) {
            case 'S.No': return 'Sr No';
            case 'Item Name': return 'Description of Goods';
            case 'HSN': return 'HSN/SAC';
            case 'Unit': return 'Unit';
            case 'Qty': return 'Qty';
            case 'Batch': return 'Batch';
            case 'Exp': return 'Exp';
            case 'Rate': return 'Rate';
            case 'Tax': return 'GST%';
            case 'Discount': return 'Disc%';
            case 'Amount': return 'Amount';
            default: return col;
        }
    };

    const getColClass = (col) => {
        switch(col) {
            case 'S.No': return 'col-sn text-center';
            case 'Item Name': return 'col-item-name text-left';
            case 'HSN': return 'col-hsn text-center';
            case 'Unit': return 'col-unit text-center';
            case 'Qty': return 'col-qty text-center';
            case 'Batch': return 'col-batch text-center';
            case 'Exp': return 'col-exp text-center';
            case 'Rate': return 'col-rate text-center';
            case 'Tax': return 'col-tax text-center';
            case 'Discount': return 'col-discount text-center';
            case 'Amount': return 'col-amount text-right';
            default: return '';
        }
    };

    return (
        <div className="invoice-container a4-standard-layout p-12 bg-white text-gray-800 shadow-xl">
            <div className="header-grid flex justify-between items-start mb-10 border-b pb-8 border-gray-100">
                <div className="brand flex items-center">
                    {businessLogo ? (
                        <img src={businessLogo} alt="Logo" className="logo-img w-20 h-20 object-contain mr-6" />
                    ) : (
                        <div className="logo-placeholder w-16 h-16 bg-blue-600 flex items-center justify-center rounded text-white font-black text-2xl mr-6">B</div>
                    )}
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-black m-0">{storeName || 'RETAIL SOLUTIONS'}</h1>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">GSTIN: {storeGSTIN || '12ABCDE1234F1Z1'}</p>
                        <p className="text-[10px] text-gray-400 max-w-sm mt-1">{storeAddress || 'Address not configured in settings.'}</p>
                    </div>
                </div>
                <div className="invoice-meta text-right">
                    <h2 className="text-4xl text-blue-600 font-extrabold m-0 uppercase tracking-widest text-shadow-sm">TAX INVOICE</h2>
                    <div className="mt-4">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-0">INVOICE NUMBER</p>
                        <p className="text-xl font-bold text-gray-900 border-b-2 border-blue-100 inline-block">{billNo || ' INV-0001'}</p>
                    </div>
                    <div className="mt-2">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-0">DATE</p>
                        <p className="text-sm font-semibold">{billDate}</p>
                    </div>
                </div>
            </div>

            <div className="addresses-grid grid grid-cols-2 gap-10 mb-10 px-4">
                <div className="bill-to p-4 border rounded-xl bg-gray-50 border-gray-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-4 border-b border-blue-100 pb-2">BILL TO:</h3>
                    <div className="space-y-1">
                        <p className="font-bold text-gray-900 text-lg">{customerName || 'Walk-in Customer'}</p>
                        <p className="text-xs text-gray-600">{customerAddress || 'Address not provided.'}</p>
                        <p className="text-xs text-gray-600 font-medium">Phone: {customerPhone || 'N/A'}</p>
                        <p className="text-sm font-bold text-blue-900 mt-2">GSTIN: {customerGSTIN || 'Unregistered Consumer'}</p>
                    </div>
                </div>
                <div className="compliance-slots p-4 border rounded-xl bg-gray-50 border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">E-INVOICE / COMPLIANCE:</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">IRN NUMBER</p>
                                <p className="text-[9px] font-mono text-gray-600 break-all leading-relaxed">{irn || 'Not Required'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">E-WAY BILL</p>
                                <p className="text-[10px] font-bold text-gray-700">{ewayBill || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    {showQR && (
                        <div className="payment-bar flex justify-between items-end mt-4 pt-4 border-t border-gray-100">
                            <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">PAYMENT MODE</p>
                                <p className="text-sm font-bold text-gray-700">Mode: {getPaymentLabel(paymentMode)}</p>
                            </div>
                            <div className="qrcode-container">
                                <UPIQRCode upiId={upiId} amount={summary.grandTotal} name={storeName} size={40} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="table-container rounded-xl overflow-hidden border border-gray-100 shadow-sm mb-10">
                <table className="items-table w-full border-separate border-spacing-0 border-2 border-black">
                    <thead className="bg-gray-100 text-black font-black text-[10px] uppercase tracking-widest border-b-2 border-black">
                        <tr>
                            {cols.map((col, idx) => {
                                const isCap = saleData.settings?.columnCapitalized?.[col] || (saleData.settings?.customColumns?.find(c => c.id === col)?.capitalize);
                                return (
                                    <th key={col} className={`${getColClass(col)} p-4 py-5 border-x border-black tracking-widest`} style={{ textTransform: isCap ? 'uppercase' : 'capitalize' }}>
                                        {getColLabel(col)}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx} className="border-b border-black">
                                {cols.map((col, cIdx) => {
                                    const baseClass = `${getColClass(col)} p-4 text-sm border-x border-black`;
                                    
                                    switch(col) {
                                        case 'S.No': return <td key={col} className={baseClass + " text-center"}>{idx + 1}</td>;
                                        case 'Item Name': return (
                                            <td key={col} className={baseClass}>
                                                <p className="font-bold text-gray-900">{item.name}</p>
                                                {item.description && <p className="text-[10px] text-gray-400 italic">{item.description}</p>}
                                            </td>
                                        );
                                        case 'HSN': return <td key={col} className={baseClass + " text-center"}>{item.hsn || '-'}</td>;
                                        case 'Unit': return <td key={col} className={baseClass + " text-center"}>{item.unit || 'Nos'}</td>;
                                        case 'Qty': return <td key={col} className={baseClass + " text-center font-bold"}>{item.qty} {item.unit || 'PCS'}</td>;
                                        case 'Batch': return <td key={col} className={baseClass + " text-center"}>{item.batch || '-'}</td>;
                                        case 'Exp': return <td key={col} className={baseClass + " text-center"}>{item.exp || '-'}</td>;
                                        case 'Rate': return <td key={col} className={baseClass + " text-center"}>₹{item.rate?.toFixed(2)}</td>;
                                        case 'Tax': return <td key={col} className={baseClass + " text-center"}>{item.taxRate}%</td>;
                                        case 'Discount': return <td key={col} className={baseClass + " text-center"}>{(item.discount || 0)}%</td>;
                                        case 'Amount': return <td key={col} className={baseClass + " text-center font-black"}>₹{(item.qty * item.rate).toFixed(2)}</td>;
                                        default: return <td key={col} className={baseClass + " text-center"}>{item[col] || item[col.toLowerCase()] || '-'}</td>;
                                    }
                                })}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="border-t-2 border-black">
                        <tr>
                            <td colSpan={cols.length - 1} className="p-2 text-right font-bold text-[10pt] border-x border-black">Taxable Value:</td>
                            <td className="p-2 text-center font-black text-[12pt] border-x border-black">₹{summary.basicTotal?.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colSpan={cols.length - 1} className="p-2 text-right font-bold text-[10pt] border-x border-black">GST Amount:</td>
                            <td className="p-2 text-center font-black text-[12pt] border-x border-black">₹{summary.taxTotal?.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colSpan={cols.length - 1} className="p-2 text-right font-bold text-[10pt] border-x border-black text-gray-400 italic">Round Off:</td>
                            <td className="p-2 text-center font-bold text-[10pt] border-x border-black text-gray-400 italic">₹{summary.roundOff}</td>
                        </tr>
                        <tr className="bg-black text-white">
                            <td colSpan={cols.length - 1} className="p-4 text-right font-950 text-[14pt] border-x border-black uppercase tracking-widest">Grand Total:</td>
                            <td className="p-4 text-center font-950 text-[20pt] border-x border-black">₹{summary.grandTotal}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="summary-grid flex justify-between items-start gap-20 p-4">
                <div className="notes flex-1 text-[10px] text-gray-400 italic bg-gray-50 p-6 rounded-lg border-l-4 border-black">
                    <h4 className="font-black text-gray-800 uppercase mb-2 not-italic underline">DECLARATION & TERMS:</h4>
                    <p>1. Goods once sold will not be taken back or exchanged.</p>
                    <p>2. Interest @18% p.a. will be charged if payment is delayed beyond 15 days.</p>
                    <p>3. Our responsibility ceases as soon as goods leave our premises.</p>
                    <p>4. All disputes subject to local jurisdiction.</p>
                    <div className="mt-10 pt-10 border-t border-gray-100 flex justify-between">
                        <div>
                             <p className="font-bold text-gray-500 uppercase">Receiver's Signature</p>
                        </div>
                        <div className="text-right">
                             <p className="font-bold text-gray-900 uppercase italic">For {storeName}</p>
                             <div className="h-12"></div>
                             <p className="font-bold text-gray-500 border-t border-black pt-1">Authorized Signatory</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default A4Invoice;
