export interface Customer {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    state?: string | null;
    city?: string | null;
    pincode?: string | null;
    gstNumber?: string | null;

    // Missing fields restored
    company?: string | null;
    totalPurchases?: number;

    // CRM
    dob?: string | null;
    anniversaryDate?: string | null;
    loyaltyPoints?: number;
    isActive?: boolean;
    isMarkedRed?: boolean;
    userId?: string;
    createdAt: string;
    updatedAt: string;
}
