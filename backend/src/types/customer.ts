/**
 * Customer type definitions for the backend service layer
 */

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    state?: string;
    city?: string;
    pincode?: string;
    company?: string;
    loyaltyPoints?: number;
    totalPurchases?: number;
    userId?: string;
    createdAt: string;
    updatedAt: string;
}
