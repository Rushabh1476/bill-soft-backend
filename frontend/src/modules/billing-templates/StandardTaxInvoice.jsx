import React from 'react';
import './InvoiceTemplates.css';
import InvoiceHeader from './core/InvoiceHeader';
import InvoiceFooter from './core/InvoiceFooter';

const StandardTaxInvoice = ({ saleData, activeColumns }) => {
    const { 
        summary, items, storeName, storeAddress, storeGSTIN, 
        billNo, billDate, customerName, customerPhone, customerAddress, 
        customerGSTIN, paymentMode, upiId, bankName, accountNumber, ifscCode, branchName
    } = saleData;

    // Default columns if none provided
    const cols = activeColumns || ['S.No', 'Item Name', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];

    const getColLabel = (col) => {
        // 1. Check custom labels from settings
        const customLabel = saleData.settings?.columnLabels?.[col] || (saleData.settings?.customColumns?.find(c => c.id === col)?.label);
        if (customLabel) return customLabel;

        switch(col) {
            case 'S.No': return 'S.No';
            case 'Item Name': return 'Description of Goods';
            case 'HSN': return 'HSN/SAC';
            case 'Unit': return 'Unit';
            case 'Qty': return 'Quantity';
            case 'Rate': return 'Rate';
            case 'Tax': return 'GST%';
            case 'Discount': return 'Disc%';
            case 'Amount': return 'Amount';
            default: return col;
        }
    };

    const getColClass = (col) => {
        switch(col) {
            case 'S.No': return 'w-[40px] text-center';
            case 'Item Name': return 'auto text-left px-2';
            case 'HSN': return 'w-[70px] text-center';
            case 'Unit': return 'w-[50px] text-center';
            case 'Qty': return 'w-[70px] text-right';
            case 'Rate': return 'w-[80px] text-right';
            case 'Tax': return 'w-[60px] text-center';
            case 'Exp': return 'w-[80px] text-center';
            case 'Batch': return 'w-[80px] text-center';
            case 'Discount': return 'w-[60px] text-center';
            case 'Amount': return 'w-[100px] text-right';
            default: return 'w-[80px] text-center';
        }
    };

    return (
        <div className="invoice-container tally-theme a4-standard-layout shadow-none p-4 bg-white border-0">
            {/* Tally Strict Grid Header */}
            <div className="border border-black">
                <div className="text-center font-bold text-sm py-1 border-b border-black uppercase tracking-widest">TAX INVOICE</div>
                
                <div className="flex border-b border-black">
                    <div className="w-1/2 border-r border-black p-2">
                        <div className="font-bold text-md leading-tight">{storeName || 'YOUR COMPANY NAME'}</div>
                        <div className="text-[8pt] leading-tight mt-1 opacity-80">
                            {storeAddress || 'Company Address details not configured.'}
                        </div>
                        <div className="mt-2 font-bold text-[9pt]">GSTIN/UIN: {storeGSTIN || 'URD'}</div>
                        <div className="text-[8pt] italic">State Name: MAHARASHTRA, Code: 27</div>
                    </div>
                    <div className="w-1/2 p-0">
                        <table className="w-full h-full border-none text-[8pt] table-fixed">
                            <tbody>
                                <tr className="border-b border-black">
                                    <td className="p-1 border-r border-black font-bold w-1/2">Invoice No: {billNo}</td>
                                    <td className="p-1 font-bold w-1/2">Dated: {billDate}</td>
                                </tr>
                                <tr className="border-b border-black h-8 text-[7pt] opacity-60">
                                    <td className="p-1 border-r border-black">Delivery Note</td>
                                    <td className="p-1">Mode/Terms of Payment</td>
                                </tr>
                                <tr className="border-b border-black">
                                    <td className="p-1 border-r border-black font-bold h-8 uppercase">{paymentMode || 'Cash'}</td>
                                    <td className="p-1 font-bold italic">Immediate Settlement</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex border-b border-black">
                    <div className="w-1/2 border-r border-black p-2">
                        <div className="text-[7pt] italic mb-1 uppercase opacity-60">Buyer (Bill to)</div>
                        <div className="font-bold text-sm uppercase">{customerName || 'Walk-in Customer'}</div>
                        <div className="text-[8pt] leading-tight mt-1">{customerAddress || 'Local Address Details'}</div>
                        <div className="mt-2 font-bold text-[8pt]">GSTIN/UIN: {customerGSTIN || 'Unregistered'}</div>
                    </div>
                    <div className="w-1/2 p-2 bg-gray-50/5">
                         <div className="text-[7pt] italic mb-1 uppercase opacity-60">Consignee (Ship to)</div>
                         <div className="text-[8pt] italic opacity-40">Same as Buyer</div>
                    </div>
                </div>

                {/* Dynamic Column Table */}
                <table className="w-full border-collapse border-none table-fixed">
                    <thead className="bg-gray-50 text-[8pt] font-bold">
                        <tr>
                            {cols.map((col, idx) => {
                                const isCap = saleData.settings?.columnCapitalized?.[col] || (saleData.settings?.customColumns?.find(c => c.id === col)?.capitalize);
                                return (
                                    <th key={col} style={{ width: getColClass(col).split(' ')[0].replace('w-[','').replace(']',''), textTransform: isCap ? 'uppercase' : 'capitalize' }} className={`${getColClass(col)} border-b border-black ${idx > 0 ? 'border-l' : ''} py-1 px-1 truncate`}>
                                        {getColLabel(col)}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="text-[8pt]">
                        {items.map((item, idx) => (
                            <tr key={idx} className="border-b border-black last:border-b-0 h-10">
                                {cols.map((col, cIdx) => {
                                    const borderClass = cIdx > 0 ? 'border-l border-black' : '';
                                    const style = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
                                    const baseClass = `${getColClass(col)} ${borderClass} py-1 align-top`;
                                    
                                    switch(col) {
                                        case 'S.No': return <td key={col} className={baseClass}>{idx + 1}</td>;
                                        case 'Item Name': return (
                                            <td key={col} className={`${baseClass} px-1`} style={{ width: 'auto' }}>
                                                <div className="font-bold uppercase truncate" style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.name}</div>
                                            </td>
                                        );
                                        case 'HSN': return <td key={col} style={style} className={baseClass}>{item.hsn || '-'}</td>;
                                        case 'Unit': return <td key={col} style={style} className={baseClass}>{item.unit || 'Nos'}</td>;
                                        case 'Qty': return <td key={col} style={style} className={baseClass}>{item.qty}</td>;
                                        case 'Rate': return <td key={col} style={style} className={baseClass}>{(item.rate || 0).toFixed(2)}</td>;
                                        case 'Tax': return <td key={col} style={style} className={baseClass}>{item.taxRate || 0}%</td>;
                                        case 'Batch': return <td key={col} style={style} className={baseClass}>{item.batch || '-'}</td>;
                                        case 'Exp': return <td key={col} style={style} className={baseClass}>{item.exp || '-'}</td>;
                                        case 'Discount': return <td key={col} style={style} className={baseClass}>{item.discount || 0}%</td>;
                                        case 'Amount': return <td key={col} style={style} className={baseClass}>₹{(item.total || 0).toFixed(2)}</td>;
                                        default: return <td key={col} style={style} className={baseClass}>{item[col.toLowerCase()] || '-'}</td>;
                                    }
                                })}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="border-t border-black font-bold text-[8pt] bg-gray-50/10 h-8">
                        <tr>
                            {cols.map((col, cIdx) => {
                                const borderClass = cIdx > 0 ? 'border-l border-black' : '';
                                if (col === 'Item Name') {
                                    return <td key={col} className={`${getColClass(col)} ${borderClass} text-right p-1 uppercase`}>Total</td>;
                                }
                                if (col === 'Qty') {
                                    return <td key={col} className={`${getColClass(col)} ${borderClass} p-1 text-right`}>{items.reduce((sum, i) => sum + i.qty, 0)}</td>;
                                }
                                if (col === 'Amount') {
                                    return <td key={col} className={`${getColClass(col)} ${borderClass} p-1 text-right text-[9pt]`}>₹{(summary.grandTotal || 0).toFixed(2)}</td>;
                                }
                                return <td key={col} className={`${getColClass(col)} ${borderClass}`}></td>;
                            })}
                        </tr>
                    </tfoot>
                </table>

                {/* Total in Words */}
                <div className="border-t border-black p-2 text-[8pt] italic">
                    Amount Chargeable (in words): <span className="font-bold uppercase tracking-tight">Indian Rupees {summary.grandTotalInWords}</span>
                </div>

                {/* Tally Bank/Signature Block */}
                <div className="flex border-t border-black min-h-[120px]">
                    <div className="w-1/2 border-r border-black p-2 text-[7.5pt]">
                        <div className="font-bold underline mb-1">Company's Bank Details</div>
                        <div>Bank Name: <span className="font-bold">{bankName || 'HDFC BANK'}</span></div>
                        <div>A/c No.: <span className="font-bold">{accountNumber || '50200012345678'}</span></div>
                        <div>Branch & IFSC Code: <span className="font-bold">{branchName || 'PUNE'} & {ifscCode || 'HDFC0001234'}</span></div>
                        
                        <div className="mt-2 font-bold underline uppercase">Terms & Conditions</div>
                        <div className="italic">1. Goods once sold will not be taken back.</div>
                        <div className="italic">2. Our responsibility ceases as soon as goods leave our premises.</div>
                    </div>
                    
                    <div className="w-1/2 flex flex-col justify-between">
                        <div className="p-1 px-4 text-right italic text-[7pt] opacity-30">
                            Receiver's Signature
                        </div>
                        <div className="p-2 border-t border-black text-center bg-gray-50/20">
                            <div className="font-bold text-[8pt] mb-8">for {storeName || 'YOUR COMPANY NAME'}</div>
                            <div className="font-bold underline uppercase text-[8pt]">Authorized Signatory</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shared Footer Logic for QR/Payment Persistence */}
            <div className="mt-4 border-t-2 border-dashed border-gray-100 pt-4">
                <InvoiceFooter 
                    summary={summary}
                    paymentMode={paymentMode}
                    upiId={upiId}
                    storeName={storeName}
                />
            </div>

            <div className="text-center text-[7pt] mt-1 italic text-gray-300 uppercase tracking-widest">This is a Computer Generated Invoice • Tally Compatible Layout</div>
        </div>
    );
};

export default StandardTaxInvoice;
