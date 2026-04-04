import React from 'react';
import { Bill } from '../../types/bill';

interface BillPreviewProps {
  bill: Bill;
}

const BillPreview: React.FC<BillPreviewProps> = ({ bill }) => {
  return (
    <div className="bill-preview">
      <h2>Bill Preview</h2>
      <div>
        <h3>Customer Details</h3>
        <p>Name: {bill.customerName}</p>
        <p>Email: {bill.customerEmail}</p>
      </div>
      <div>
        <h3>Items</h3>
        <ul>
          {bill.items && bill.items.length > 0 ? (
            bill.items.map((item, index) => (
              <li key={index}>
                {item.productName} - {item.quantity} x ₹{item.price} = ₹{item.total}
              </li>
            ))
          ) : (
            <li>No items found</li>
          )}
        </ul>
      </div>
      <div>
        <h3>Total Amount</h3>
        <p>₹{bill.totalAmount}</p>
      </div>
      <div>
        <h3>Tax</h3>
        <p>₹{bill.taxAmount}</p>
      </div>
    </div>
  );
};

export default BillPreview;
