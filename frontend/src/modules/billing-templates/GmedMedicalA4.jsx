import React from 'react';
import './InvoiceTemplates.css';
import UPIQRCode from './core/UPIQRCode';

const GmedMedicalA4 = ({ saleData, activeColumns }) => {
    const {
        summary, items, storeName, storeAddress, storeGSTIN,
        billNo, billDate, customerName, customerPhone, customerAddress,
        customerGSTIN, paymentMode, bankName, accountNumber, ifscCode, upiId
    } = saleData;

    // Dynamic Columns Logic
    const defaultCols = ['S.No', 'Item Name', 'HSN', 'Batch', 'Exp', 'Qty', 'Unit', 'Rate', 'Tax', 'Amount'];
    const cols = activeColumns || defaultCols;

    const getColLabel = (col) => {
        switch (col) {
            case 'S.No': return 'SR.';
            case 'Item Name': return 'ITEMS / DESCRIPTION';
            case 'Tax': return 'GST%';
            default: return col;
        }
    };

    const getColClass = (col) => {
        switch (col) {
            case 'S.No': return 'col-sn text-center';
            case 'Item Name': return 'col-item-name text-left flex-1';
            case 'Qty': return 'col-qty text-center';
            case 'Rate': return 'col-rate text-right';
            case 'Amount': return 'col-amount text-right';
            case 'Tax': return 'col-tax text-center';
            case 'Batch': return 'col-batch text-center';
            case 'Exp': return 'col-exp text-center';
            case 'Unit': return 'col-unit text-center';
            case 'HSN': return 'col-hsn text-center';
            default: return '';
        }
    };

    const showQR = paymentMode === 'UPI' || paymentMode === 'QR';

    const getPaymentLabel = (mode) => {
        if (!mode) return 'CASH';
        if (mode === 'Credit') return 'Credit (Udhaar)';
        return mode;
    };

    return (
        <div className="invoice-container a4-standard-layout gmed-theme bg-white no-round border-all m-0 p-0 shadow-none">
            {/* Main Header */}
            <div className="tax-header">TAX INVOICE</div>

            {/* Business Header Block */}
            <div className="flex border-b">
                <div className="w-1/2 border-r p-2 leading-none">
                    <h1 className="company-name">{storeName || 'GMED ENTERPRISES'}</h1>
                    <p className="text-[8pt] font-bold mb-1 leading-tight">{storeAddress || 'SHOP NO-4, GR FLR, P.NO-6, SR.NO-42/1/4, PUNE-411048'}</p>
                    <p className="bold text-[8pt]">DL No: PUN-ZONE-2/6/MD-42/009 | GSTIN: {storeGSTIN}</p>
                    <p className="bold text-[8pt]">Mfg Reg No: MH/PUN/8892 | State: MAHARASHTRA (27)</p>
                </div>
                <div className="w-1/2 p-2 bg-gray-50/30">
                    <div className="grid grid-cols-2 gap-y-1.5 text-[9pt] align-baseline">
                        <span className="bold uppercase">Invoice No:</span>
                        <span className="bold text-[11pt] text-blue-800">{billNo}</span>
                        <span className="bold uppercase">Date:</span>
                        <span className="bold">{billDate}</span>
                        <span className="bold uppercase">Payment Mode:</span>
                        <span className="bold uppercase text-red-600 underline font-black">{getPaymentLabel(paymentMode)}</span>
                        <span className="bold uppercase">Due Date:</span>
                        <span className="bold">{billDate}</span>
                    </div>
                </div>
            </div>

            {/* Billing Details Block */}
            <div className="flex border-b">
                <div className="w-1/2 border-r p-2 leading-tight">
                    <p className="bold text-[7pt] uppercase underline mb-1 italic text-gray-500">Bill To (Customer Details)</p>
                    <p className="text-[12pt] bold font-black text-gray-900 border-b border-gray-100 mb-1">{customerName}</p>
                    <p className="text-[8.5pt] font-medium mb-1">{customerAddress || 'Local Area, City'}</p>
                    <p className="bold text-[8.5pt]">GSTIN: {customerGSTIN || 'URD'}</p>
                    <p className="bold text-[8.5pt]">Mob: {customerPhone}</p>
                </div>
                <div className="w-1/2 p-2 leading-tight bg-gray-50/10">
                    <p className="bold text-[7pt] uppercase underline mb-1 italic text-gray-500">Shipping / Consignee Details</p>
                    <div className="grid grid-cols-1 text-[8pt] gap-1">
                        <div className="font-bold uppercase text-gray-800">{customerName}</div>
                        <div className="italic text-gray-600">{customerAddress || 'Same as Billing'}</div>
                        <div className="flex gap-4 mt-2">
                            <span>DL NO: <b className="text-gray-900">PUN-2-24455</b></span>
                            <span>PLACE: <b className="text-gray-900">MAHARASHTRA</b></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transportation strip */}
            <div className="transport-block flex justify-between px-4 py-1.5 border-b bg-gray-50/50">
                <span>L.R. NO: <b className="text-gray-900">N/A</b></span>
                <span>VEHICLE: <b className="text-gray-900">SELF DELIVERY</b></span>
                <span>EXPIRY CHECKED: <b className="text-gray-900">YES</b></span>
                <span>TRANSPORT: <b className="text-gray-900">LOCAL DELIVERY</b></span>
            </div>

            {/* Professional Table Grid: Standardized */}
            <div className="main-table-container min-h-[450px]">
                <table className="a4-grid-table w-full table-fixed">
                    <thead>
                        <tr className="uppercase tracking-wider text-[8pt] font-black border-y-2 border-black">
                            {cols.map((col, idx) => (
                                <th key={idx} className={getColClass(col)}>
                                    {getColLabel(col)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-[8.5pt]">
                        {items.map((item, idx) => (
                            <tr key={idx} style={{ height: '30px' }} className="border-b border-gray-100">
                                {cols.map((col, cIdx) => {
                                    const baseClass = `${getColClass(col)} py-1 px-1 align-middle`;
                                    switch (col) {
                                        case 'S.No': return <td key={cIdx} className={`${baseClass} font-bold text-gray-500`}>{idx + 1}</td>;
                                        case 'Item Name': return <td key={cIdx} className={`${baseClass} bold uppercase truncate px-2`}>{item.name}</td>;
                                        case 'HSN': return <td key={cIdx} className={`${baseClass} font-mono opacity-50`}>{item.hsn || item.customFields?.hsn || '-'}</td>;
                                        case 'Batch': return <td key={cIdx} className={`${baseClass} font-black text-blue-900`}>{item.batch || item.customFields?.batchNo || 'BT-44'}</td>;
                                        case 'Exp': return <td key={cIdx} className={`${baseClass} bold text-red-600`}>{item.exp || item.customFields?.expDate || '12/26'}</td>;
                                        case 'Qty': return <td key={cIdx} className={`${baseClass} bold`}>{item.qty}</td>;
                                        case 'Unit': return <td key={cIdx} className={`${baseClass} uppercase italic`}>{item.unit || item.customFields?.unit || 'NOS'}</td>;
                                        case 'Rate': return <td key={cIdx} className={`${baseClass} text-right font-bold`}>₹{(item.rate || 0).toFixed(0)}</td>;
                                        case 'Tax': return <td key={cIdx} className={`${baseClass} text-center`}>{item.taxRate || 0}%</td>;
                                        case 'Amount': return <td key={cIdx} className={`${baseClass} text-right font-black`}>₹{(item.total || 0).toFixed(0)}</td>;
                                        default: return <td key={cIdx} className={baseClass}>{item[col] || item[col.toLowerCase()] || '-'}</td>;
                                    }
                                })}
                            </tr>
                        ))}
                        {/* Filler Rows */}
                        {Array(Math.max(0, 12 - items.length)).fill(0).map((_, i) => (
                            <tr key={`filler-${i}`} style={{ height: '28px' }}>
                                <td className="border-r border-gray-100"></td>
                                <td className="border-r border-gray-100"></td>
                                <td className="border-r border-gray-100"></td>
                                <td className="border-r border-gray-100"></td>
                                <td className="border-r border-gray-100"></td>
                                <td className="border-r border-gray-100"></td>
                                <td className="border-r border-gray-100"></td>
                                <td className="border-r border-gray-100"></td>
                                <td className="border-r border-gray-100"></td>
                                <td></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Calculations & GST Breakup */}
            <div className="flex border-all border-t-2 summary-box bg-white">
                <div className="w-1/2 border-r p-4">
                    <p className="bold text-[8.5pt] underline uppercase italic mb-3 text-blue-900">Tax Breakup Details</p>
                    <table className="text-[7.5pt] border-none">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-1 text-center">HSN</th>
                                <th className="p-1 text-right">VALUE</th>
                                <th className="p-1 text-center">CGST%</th>
                                <th className="p-1 text-right">AMT</th>
                                <th className="p-1 text-center">SGST%</th>
                                <th className="p-1 text-right">AMT</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-1 text-center font-600">3004</td>
                                <td className="p-1 text-right">₹{summary.basicTotal.toFixed(0)}</td>
                                <td className="p-1 text-center">6%</td>
                                <td className="p-1 text-right">₹{(summary.taxTotal / 2).toFixed(2)}</td>
                                <td className="p-1 text-center">6%</td>
                                <td className="p-1 text-right">₹{(summary.taxTotal / 2).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="w-1/2 p-4">
                    <div className="flex justify-between border-b pb-2 mb-2 text-[9pt]">
                        <span className="font-bold text-gray-500">Sub Total:</span>
                        <span className="bold font-black">₹{summary.basicTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 mb-2 text-[9pt]">
                        <span className="font-bold text-gray-500">GST Amt:</span>
                        <span className="bold font-black">₹{summary.taxTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-blue-900 text-white p-3 rounded shadow-md mt-4">
                        <span className="bold text-[10pt] uppercase tracking-wider">Net Amount:</span>
                        <span className="text-[18pt] font-black">₹{summary.grandTotal.toFixed(0)}/-</span>
                    </div>
                    <p className="text-[7pt] italic mt-2 text-right opacity-40">ROUND OFF: ₹{summary.roundOff}</p>
                </div>
            </div>

            {/* Words Amount Row */}
            <div className="border-x border-b p-3 text-[9pt] italic font-black bg-gray-50 uppercase text-blue-900">
                Amount in Words: {summary.grandTotalInWords} ONLY
            </div>

            {/* Secondary Footer Matrix */}
            <div className="flex border-x border-b bg-white">
                <div className="w-1/3 border-r p-4">
                    <p className="bold text-[8.5pt] underline italic mb-4 uppercase text-blue-800">Bank Details</p>
                    <div className="font-mono text-[8pt] leading-loose">
                        <p>Bank: <b>{bankName || 'HDFC BANK LTD'}</b></p>
                        <p>A/c Name: <b className="uppercase">{storeName || 'GMED ENTERPRISES'}</b></p>
                        <p>A/c No: <b>{accountNumber || '50200067744321'}</b></p>
                        <p>IFSC Code: <b>{ifscCode || 'HDFC0000001'}</b></p>
                    </div>
                </div>
                <div className="w-1/3 border-r p-4 text-[7.5pt] italic text-gray-600 bg-gray-50/30">
                    <p className="bold underline uppercase mb-2 text-gray-800">Terms & Conditions</p>
                    <ul className="list-decimal pl-4 gap-1 flex flex-col">
                        <li>Goods once sold will not be taken back.</li>
                        <li>Interest @ 18% p.a. will be charged for delayed payment.</li>
                        <li>Subject to PUNE Jurisdiction.</li>
                    </ul>
                    {showQR && (
                        <div className="mt-4 flex justify-center border-t pt-4">
                            <UPIQRCode upiId={upiId} amount={summary.grandTotal} name={storeName} size={90} />
                        </div>
                    )}
                </div>
                <div className="w-1/3 p-4 text-right flex flex-col justify-between min-h-[140px]">
                    <p className="bold text-[9pt] uppercase underline font-black text-blue-900">FOR {storeName || 'GMED ENTERPRISES'}:</p>
                    <div className="signature-space h-20 flex items-center justify-center">
                        <div className="border border-dashed border-gray-300 w-32 h-16 flex items-center justify-center text-[7pt] text-gray-300 uppercase italic opacity-30">Place Stamp Here</div>
                    </div>
                    <p className="bold italic text-[10pt] font-black uppercase underline decoration-double">Authorized Signatory</p>
                </div>
            </div>

            <div className="text-center p-3 opacity-30 italic text-[7pt] font-bold uppercase tracking-[0.4em]">
                Thanks for your kind patronage! Visit us again at our outlet.
            </div>
        </div>
    );
};

export default GmedMedicalA4;
