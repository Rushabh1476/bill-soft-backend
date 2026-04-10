import React from 'react';
import './InvoiceTemplates.css';
import ThermalFooter from './core/ThermalFooter';

/**
 * KiranaThermal.jsx - Architect Grocery/Kirana professional standard
 * Optimized for Thermal POS.
 */
const KiranaThermal = ({ saleData }) => {
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

    return (
        <div className="invoice-container architect-thermal-theme shadow-none border-0 overflow-visible">
            {/* Header: Grocery Identity */}
            <div className="header-info">
                <h1 className="shop-name">{storeName || 'KIRANA STORE'}</h1>
                <p className="text-[10pt] opacity-80">{storeAddress || 'Local Market, Area 5\nNew Delhi, India'}</p>
                <div className="receipt-separator"></div>
                
                <div className="flex justify-between text-[9pt]">
                    <span>Receipt #:</span>
                    <span>{billNo}</span>
                </div>
                <div className="flex justify-between text-[9pt]">
                    <span>Date:</span>
                    <span>{billDate}</span>
                </div>
                {customerName && (
                    <div className="flex justify-between text-[9pt] font-bold mt-1">
                        <span>Customer:</span>
                        <span>{customerName}</span>
                    </div>
                )}
            </div>

            <div className="receipt-separator"></div>

            {/* Grocery Items List */}
            <div className="items-section overflow-visible">
                {items.map((item, idx) => (
                    <div key={idx} className="item-row">
                        <span className="item-name">
                            {item.name}
                            {item.qty > 1 && <span className="text-[8pt] opacity-50 ml-2">({item.qty} x ₹{item.rate.toFixed(0)})</span>}
                        </span>
                        <span className="item-price-qty">₹{(item.qty * item.rate).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            <div className="receipt-separator"></div>

            {/* Totals Section */}
            <div className="total-section overflow-visible">
                <div className="total-row">
                    <span>Subtotal</span>
                    <span>₹{summary.basicTotal?.toFixed(2)}</span>
                </div>
                <div className="total-row opacity-70 italic text-[9pt]">
                    <span>Tax Include</span>
                    <span>₹{summary.taxTotal?.toFixed(2)}</span>
                </div>
                {summary.discountTotal > 0 && (
                    <div className="total-row text-green-700 italic">
                        <span>Savings</span>
                        <span>-₹{summary.discountTotal?.toFixed(2)}</span>
                    </div>
                )}
                <div className="total-row grand-total">
                    <span className="font-bold">TOTAL AMOUNT</span>
                    <span>₹{summary.grandTotal?.toFixed(2)}</span>
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

export default KiranaThermal;

