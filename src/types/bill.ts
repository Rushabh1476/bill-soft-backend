export interface BillItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
}

export interface Bill {
    id: string;
    billNumber?: string;
    customerId: string;
    customerName: string;
    customerEmail?: string;
    items: BillItem[];
    subtotal: number;
    totalAmount: number;
    taxAmount: number;
    status: 'Draft' | 'Pending' | 'Paid' | 'Overdue';
    dueDate: string;
    createdAt: string;
    updatedAt: string;
    logoUrl?: string;
    customColumns?: Record<string, any>;
}