import React from 'react';
import './InvoiceTemplates.css';
import ThermalFooter from './core/ThermalFooter';

/**
 * FoodDineIn.jsx - Architect Restaurant professional standard
 * Optimized for Restaurant POS.
 */
const FoodDineIn = ({ saleData }) => {
    if (!saleData) return null;

    const {
        storeName,
        storeAddress,
        billNo,
        billDate,
        items = [],
        summary = {},
        paymentMode,
        upiId,
        transactionId,
        customFields = {}
    } = saleData;

    return (
        <div className="invoice-container architect-thermal-theme shadow-none border-0 overflow-visible">
            {/* Header: Identity & Hospitality Details */}
            <div className="header-info">
                <h1 className="shop-name">{storeName || 'ARCHITECT RESTAURANT'}</h1>
                <p className="text-[10pt] opacity-80">{storeAddress || 'Gourmet Square, Suite 101\nNew York, NY 10012'}</p>
                <div className="receipt-separator"></div>
                
                <div className="flex justify-between font-bold text-[11pt] uppercase tracking-widest my-2">
                    <span>Table: {customFields.tableNo || 'N/A'}</span>
                    <span>Order: {customFields.orderType || 'DINE-IN'}</span>
                </div>

                <div className="flex justify-between text-[9pt]">
                    <span>Receipt:</span>
                    <span>#{billNo}</span>
                </div>
                <div className="flex justify-between text-[9pt]">
                    <span>Date:</span>
                    <span>{billDate}</span>
                </div>
            </div>

            <div className="receipt-separator"></div>

            {/* Food Items List */}
            <div className="items-section overflow-visible">
                {items.map((item, idx) => (
                    <div key={idx} className="item-row">
                        <div className="item-name">
                            {item.name}
                            {item.customFields?.notes && (
                                <p className="text-[8pt] italic opacity-50 ml-2 mt-1">
                                    - {item.customFields.notes}
                                </p>
                            )}
                        </div>
                        <span className="item-price-qty">{item.qty} x ₹{item.rate.toFixed(1)}</span>
                    </div>
                ))}
            </div>

            <div className="receipt-separator"></div>

            {/* Totals Section */}
            <div className="total-section overflow-visible">
                <div className="total-row">
                    <span>Total Taxable Value</span>
                    <span>₹{summary.basicTotal?.toFixed(2)}</span>
                </div>
                <div className="total-row opacity-70 italic">
                    <span>VAT / GST (5%)</span>
                    <span>₹{summary.taxTotal?.toFixed(2)}</span>
                </div>
                {customFields.serviceCharge && (
                    <div className="total-row opacity-70 italic">
                        <span>Service Charge (2%)</span>
                        <span>₹{(summary.basicTotal * 0.02).toFixed(2)}</span>
                    </div>
                )}
                <div className="total-row grand-total">
                    <span className="font-bold">PAYABLE AMOUNT</span>
                    <span>₹{(summary.grandTotal + (customFields.serviceCharge ? (summary.basicTotal * 0.02) : 0)).toFixed(2)}</span>
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

export default FoodDineIn;

