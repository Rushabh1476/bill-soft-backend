/**
 * Bill type definitions for the backend service layer
 */

export type BillStatus = 'Draft' | 'Pending' | 'Paid' | 'Overdue' | 'Cancelled';

export interface BillItem {
    id?: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
    taxRate?: number; // per-product tax rate (%)
}

export interface Bill {
    id: string;
    billNumber?: string;
    customerId: string;
    customerName: string;
    customerEmail?: string | null;
    items: BillItem[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    status: BillStatus;
    supplierId?: string | null;

    // Payment & Credits
    paymentStatus?: 'PAID' | 'PARTIAL' | 'PENDING';
    paidAmount?: number;
    dueAmount?: number;

    dueDate: string;
    createdAt: string;
    updatedAt: string;

    supplier?: {
        id: string;
        name: string;
        phone?: string | null;
        email?: string | null;
        address?: string | null;
    } | null;
}
