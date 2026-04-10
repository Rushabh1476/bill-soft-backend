import React from 'react';
import './InvoiceTemplates.css';
import ThermalFooter from './core/ThermalFooter';

/**
 * RealRestaurantThermal.jsx - Architect Restaurant professional standard
 * Optimized for Restaurant POS.
 */
const RealRestaurantThermal = ({ saleData, size = '80mm' }) => {
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

    const isSmall = size === '58mm';

    return (
        <div className={`invoice-container architect-thermal-theme ${isSmall ? 'small-format' : ''} shadow-none border-0 overflow-visible`}>
            {/* Header: Identity & Hospitality Details */}
            <div className={`header-info ${isSmall ? 'scale-90 origin-top' : ''}`}>
                <h1 className="shop-name">{storeName || 'ARCHITECT RESTAURANT'}</h1>
                <p className="text-[10pt] opacity-80">{storeAddress}</p>
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
            <div className={`items-section overflow-visible ${isSmall ? 'scale-95 origin-top' : ''}`}>
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
            <div className={`total-section overflow-visible ${isSmall ? 'scale-95 origin-top' : ''}`}>
                <div className="total-row">
                    <span>Subtotal</span>
                    <span>₹{summary.basicTotal?.toFixed(2)}</span>
                </div>
                {summary.taxTotal > 0 && (
                    <div className="total-row opacity-70 italic text-[9pt]">
                        <span>VAT / GST (5.00%)</span>
                        <span>₹{summary.taxTotal?.toFixed(2)}</span>
                    </div>
                )}
                <div className="total-row grand-total text-[14pt]">
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

export default RealRestaurantThermal;

