import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const UPIQRCode = ({ upiId, amount, name, size = 80 }) => {
    if (!upiId) return null;
    
    // Standard UPI Payment URI format: upi://pay?pa=address@upi&pn=PayeeName&am=Amount&cu=INR
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name || 'Business')}&am=${amount}&cu=INR`;
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <QRCodeSVG 
                value={upiLink} 
                size={size} 
                level="M"
                includeMargin={false}
            />
            <span style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>Scan to Pay with UPI</span>
        </div>
    );
};

export default UPIQRCode;
