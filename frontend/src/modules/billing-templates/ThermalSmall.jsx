import React from 'react';
import './InvoiceTemplates.css';
import ThermalFooter from './core/ThermalFooter';

/**
 * ThermalSmall.jsx - Architect Retail professional standard
 * Optimized for Thermal 80mm/58mm printers.
 */
const ThermalSmall = ({ saleData, activeColumns }) => {
    if (!saleData) return null;

    const {
        storeName,
        storeAddress,
        storeGSTIN,
        billNo,
        billDate,
        customerName,
        customerPhone,
        items = [],
        summary = {},
        paymentMode,
        upiId,
        transactionId
    } = saleData;

    // Dynamic Columns Logic
    const defaultCols = ['Item Name', 'Qty', 'Amount'];
    const cols = activeColumns || defaultCols;

    const getColLabel = (col) => {
        switch(col) {
            case 'S.No': return '#';
            case 'Item Name': return 'Item';
            case 'HSN': return 'HSN';
            case 'Qty': return 'Qty';
            case 'Rate': return 'Rate';
            case 'Amount': return 'Total';
            default: return col;
        }
    };

    return (
        <div className="invoice-container architect-thermal-theme shadow-none border-0 p-2">
            {/* Header: Center-aligned */}
            <div className="header-info text-center">
                <h1 className="shop-name text-lg font-bold uppercase">{storeName || 'ARCHITECT RETAIL'}</h1>
                <p className="text-[8pt] opacity-80 whitespace-pre-line lowercase">{storeAddress}</p>
                <p className="text-[8pt] font-mono mt-1">GSTIN: {storeGSTIN || 'URD'}</p>
                <div className="receipt-separator border-b border-dashed border-black my-2"></div>
                <div className="flex justify-between font-bold text-[8pt] uppercase">
                    <span>Receipt #:</span>
                    <span>{billNo}</span>
                </div>
                <div className="flex justify-between font-bold text-[8pt] uppercase">
                    <span>Date:</span>
                    <span>{billDate}</span>
                </div>
            </div>

            <div className="receipt-separator border-b border-dashed border-black my-2"></div>

            {/* Dynamic Items Table */}
            <table className={`w-full font-mono border-collapse ${cols.length > 3 ? 'text-[7pt]' : 'text-[8pt]'}`}>
                <thead>
                    <tr className="border-b border-black text-left uppercase">
                        {cols.map(c => (
                            <th key={c} className="pb-1" style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                {getColLabel(c)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100 last:border-0">
                            {cols.map(c => {
                                const sChild = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
                                switch(c) {
                                    case 'S.No': return <td key={c} className="py-1" style={sChild}>{idx + 1}</td>;
                                    case 'Item Name': return <td key={c} className="py-1 font-bold" style={sChild}>{item.name?.substring(0, cols.length > 4 ? 12 : 20)}</td>;
                                    case 'HSN': return <td key={c} className="py-1" style={sChild}>{item.hsn || '-'}</td>;
                                    case 'Qty': return <td key={c} className="py-1" style={sChild}>{item.qty} {item.unit || ''}</td>;
                                    case 'Rate': return <td key={c} className="py-1" style={sChild}>₹{(item.rate || 0).toFixed(0)}</td>;
                                    case 'Amount': return <td key={c} className="py-1 text-right" style={sChild}>₹{(item.total || 0).toFixed(0)}</td>;
                                    case 'Batch': return <td key={c} className="py-1" style={sChild}>{item.batch || item.batchNo || '-'}</td>;
                                    case 'Exp': return <td key={c} className="py-1" style={sChild}>{item.exp || item.expDate || '-'}</td>;
                                    case 'Unit': return <td key={c} className="py-1" style={sChild}>{item.unit || '-'}</td>;
                                    case 'Tax': return <td key={c} className="py-1" style={sChild}>{item.taxRate || 0}%</td>;
                                    case 'Discount': return <td key={c} className="py-1" style={sChild}>₹{(item.discount || 0).toFixed(0)}</td>;
                                    default: return <td key={c} className="py-1" style={sChild}>-</td>;
                                }
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="receipt-separator border-b border-dashed border-black my-2"></div>

            {/* Totals Section */}
            <div className="total-section space-y-1">
                <div className="flex justify-between text-[8pt]">
                    <span>Subtotal</span>
                    <span>₹{(summary.basicTotal || 0).toFixed(2)}</span>
                </div>
                {(summary.taxTotal || 0) > 0 && (
                    <div className="flex justify-between text-[8pt] italic opacity-70">
                        <span>Tax (GST)</span>
                        <span>₹{(summary.taxTotal || 0).toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-[10pt] pt-1 border-t border-black uppercase">
                    <span>TOTAL</span>
                    <span>₹{(summary.grandTotal || 0).toFixed(2)}</span>
                </div>
            </div>

            {/* Universal Thermal Footer with QR Code */}
            <ThermalFooter 
                paymentMode={paymentMode}
                upiId={upiId}
                amount={summary.grandTotal}
                storeName={storeName}
                transactionId={transactionId}
            />
        </div>
    );
};

export default ThermalSmall;

