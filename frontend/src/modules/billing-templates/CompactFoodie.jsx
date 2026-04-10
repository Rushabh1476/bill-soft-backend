import React from 'react';

const CompactFoodInvoice = ({ size = '58mm' }) => {
    // Dimension logic for all sizes
    const layouts = {
        '58mm': { width: '58mm', fontSize: '10px', padding: '2mm' },
        '80mm': { width: '80mm', fontSize: '12px', padding: '4mm' },
        'A4': { width: '210mm', height: '297mm', fontSize: '14px', padding: '10mm' },
        'A5': { width: '148mm', height: '210mm', fontSize: '13px', padding: '8mm' },
        '1/6': { width: '105mm', height: '148mm', fontSize: '12px', padding: '5mm' },
        '1/7': { width: '80mm', height: '120mm', fontSize: '11px', padding: '4mm' },
        '1/8': { width: '74mm', height: '105mm', fontSize: '10px', padding: '3mm' },
    };

    const config = layouts[size] || layouts['A4'];

    const items = [
        { name: 'Paneer Butter Masala', qty: 1, price: 250 },
        { name: 'Butter Naan', qty: 3, price: 40 },
        { name: 'Dal Tadka (Half)', qty: 1, price: 120 },
        { name: 'Cold Drink 500ml', qty: 2, price: 45 },
    ];

    const subTotal = items.reduce((acc, item) => acc + item.qty * item.price, 0);

    return (
        <div style={{
            width: config.width,
            minHeight: config.height || 'auto',
            padding: config.padding,
            fontSize: config.fontSize,
            fontFamily: 'monospace',
            backgroundColor: '#fff',
            color: '#000',
            margin: 'auto',
            border: '1px solid #eee'
        }} className="invoice-container">

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                <h2 style={{ margin: 0, fontSize: '1.4em', textTransform: 'uppercase' }}>Compact Food</h2>
                <p style={{ margin: 0 }}>Express Kitchen & Takeaway</p>
                <p style={{ margin: 0 }}>GSTIN: 27BKZPM1234F1Z1</p>
            </div>

            <div style={{ borderBottom: '1px dashed #000', margin: '5px 0' }}></div>

            {/* Bill Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Bill: #CF-982</span>
                <span>{new Date().toLocaleDateString()}</span>
            </div>

            {/* Table Header */}
            <div style={{ display: 'flex', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
                <span style={{ flex: 2 }}>Item</span>
                <span style={{ flex: 0.5, textAlign: 'center' }}>Qty</span>
                <span style={{ flex: 1, textAlign: 'right' }}>Total</span>
            </div>

            {/* Items Loop */}
            {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', marginTop: '3px' }}>
                    <span style={{ flex: 2 }}>{item.name}</span>
                    <span style={{ flex: 0.5, textAlign: 'center' }}>{item.qty}</span>
                    <span style={{ flex: 1, textAlign: 'right' }}>{(item.qty * item.price).toFixed(2)}</span>
                </div>
            ))}

            <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>

            {/* Calculation */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sub Total:</span>
                <span>{subTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GST (5%):</span>
                <span>{(subTotal * 0.05).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2em', marginTop: '4px' }}>
                <span>GRAND TOTAL:</span>
                <span>₹{(subTotal * 1.05).toFixed(2)}</span>
            </div>

            <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>

            {/* Footer */}
            <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0 }}>Thank You! Visit Again</p>
                <p style={{ margin: '2px 0', fontSize: '0.8em' }}>Size: {size}</p>
                <div style={{ marginTop: '5px', display: 'flex', justifyContent: 'center' }}>
                    {/* Simple Box to simulate QR */}
                    <div style={{ width: '40px', height: '40px', border: '1px solid #000', fontSize: '8px', padding: '2px' }}>QR CODE</div>
                </div>
            </div>

            {/* Print Specific CSS */}
            <style>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-container, .invoice-container * { visibility: visible; }
          .invoice-container { position: absolute; left: 0; top: 0; border: none !important; }
          @page { 
            size: ${size === '58mm' ? '58mm auto' : size === '80mm' ? '80mm auto' : size}; 
            margin: 0; 
          }
        }
      `}</style>
        </div>
    );
};

export default CompactFoodInvoice;