import React from 'react';
import UPIQRCode from './UPIQRCode';

const ThermalFooter = ({ paymentMode, upiId, amount, storeName, transactionId }) => {
    const showQR = paymentMode === 'UPI' || paymentMode === 'QR';

    const getPaymentLabel = (mode) => {
        if (!mode) return 'Cash';
        if (mode === 'Credit') return 'Credit (Udhaar)';
        return mode;
    };

    return (
        <div className="thermal-footer flex flex-col items-center mt-4">
            <div className="receipt-separator border-b border-dashed border-black w-full mb-4"></div>
            
            {showQR && (
                <div className="w-full flex justify-between items-center mb-4 px-2">
                    <span className="text-[9pt] font-black uppercase">Mode: {getPaymentLabel(paymentMode)}</span>
                    <span className="text-[7pt] opacity-50 uppercase tracking-tighter">Auth: Verified</span>
                </div>
            )}

            <p className="text-sm font-bold uppercase mb-4 tracking-widest text-center">Thank you for your purchase!</p>

            {showQR && (
                <div className="flex flex-col items-center mb-4">
                    <div className="qr-container bg-white p-2 border border-black mb-2">
                        <UPIQRCode 
                            upiId={upiId} 
                            amount={amount} 
                            name={storeName} 
                            size={120} 
                        />
                    </div>
                    {transactionId && (
                        <p className="text-[8pt] font-mono uppercase tracking-tighter opacity-70">
                            TXN: {transactionId}
                        </p>
                    )}
                </div>
            )}
            
            <div className="receipt-separator border-b border-dashed border-black w-full my-2"></div>
            <p className="text-[7pt] font-mono uppercase tracking-[0.4em] opacity-40 text-center">
                Architect Retail POS
            </p>
        </div>
    );
};

export default ThermalFooter;
