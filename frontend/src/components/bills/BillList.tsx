import React from 'react';
import { useBills } from '../../hooks/useBills';

const BillList: React.FC = () => {
    const { bills, deleteBill } = useBills();

    const handleDelete = (id: string) => {
        deleteBill(id);
    };

    return (
        <div>
            <h2>Billing History</h2>
            <table>
                <thead>
                    <tr>
                        <th>Bill ID</th>
                        <th>Customer Name</th>
                        <th>Date</th>
                        <th>Total Amount</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {bills.map(bill => (
                        <tr key={bill.id}>
                            <td>{bill.id}</td>
                            <td>{bill.customerName}</td>
                            <td>{new Date(bill.createdAt).toLocaleDateString()}</td>
                            <td>{bill.totalAmount.toFixed(2)}</td>
                            <td>
                                <button onClick={() => handleDelete(bill.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default BillList;
