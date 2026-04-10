
export type BillStatus = 'Draft' | 'Pending' | 'Paid' | 'Overdue' | 'Cancelled' | 'DRAFT' | 'PENDING' | 'PENDING_APPROVAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface BillItem {
    id?: string;
    productId?: string;
    serviceId?: string;
    isService?: boolean;
    productName: string;
    quantity: number;
    price: number;
    total: number;
    taxRate?: number; // Per-product tax rate (%) captured at bill creation time
    sku?: string;
    category?: string;
    batchNumber?: string;
    expiryDate?: string;
    customFields?: Record<string, any> | null;
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
    paymentMode?: string | null;

    // Payment & Credits
    paymentStatus?: 'PAID' | 'PARTIAL' | 'PENDING';
    paidAmount?: number;
    dueAmount?: number;

    dueDate: string; // Required to fix new Date(dueDate) errors
    createdAt: string; // Required
    updatedAt: string; // Required
    templateId?: string | null; // Selected invoice template for this bill
    activeTemplateId?: string | null; // Global preference for fallback
    defaultBillSize?: string | null; // Selected paper size override

    supplier?: {
        id: string;
        name: string;
        phone?: string | null;
        email?: string | null;
        address?: string | null;
    } | null;

    user?: {
        companyName?: string | null;
        email: string;
        phone?: string | null;
        logoUrl?: string | null;
        logoPosition?: string | null;
        address?: string | null;
        city?: string | null;
        state?: string | null;
        pincode?: string | null;
        gstNumber?: string | null;
        panNumber?: string | null;
        bankName?: string | null;
        accountNumber?: string | null;
        ifscCode?: string | null;
        branchName?: string | null;
        upiId?: string | null;
    } | null;

    customer?: {
        id: string;
        name: string;
        phone?: string | null;
        email?: string | null;
        address?: string | null;
        gstNumber?: string | null;
    } | null;
}
