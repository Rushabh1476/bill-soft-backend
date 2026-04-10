import React from 'react';
import './InvoiceTemplates.css';
import ThermalFooter from './core/ThermalFooter';

/**
 * FastRetail.jsx - Architect Grocery professional standard
 * Optimized for Retail POS.
 */
const FastRetail = ({ saleData }) => {
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
                <h1 className="shop-name">{storeName || 'ARCHITECT GROCERY'}</h1>
                <p className="text-[10pt] opacity-80">{storeAddress || 'Main Street, Retail Park\nNew York, NY 10005'}</p>
                <div className="receipt-separator"></div>
                
                <div className="flex justify-between text-[9pt]">
                    <span>Invoice #:</span>
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
                            {item.customFields?.brand && (
                                <span className="text-[8pt] opacity-50 ml-2">[{item.customFields.brand}]</span>
                            )}
                        </span>
                        <span className="item-price-qty">{item.qty} x ₹{item.rate.toFixed(2)}</span>
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
                <div className="total-row opacity-70 italic">
                    <span>Tax Amount</span>
                    <span>₹{summary.taxTotal?.toFixed(2)}</span>
                </div>
                {summary.discountTotal > 0 && (
                    <div className="total-row text-green-700 italic">
                        <span>Savings</span>
                        <span>-₹{summary.discountTotal?.toFixed(2)}</span>
                    </div>
                )}
                <div className="total-row grand-total">
                    <span className="font-bold">TOTAL PAYABLE</span>
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

export default FastRetail;

