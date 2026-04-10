export interface Service {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    taxRate?: number;
    category?: string | null;
    duration?: string | null;
    isActive: boolean;
    userId?: string;
    createdAt: string;
    updatedAt: string;
}
