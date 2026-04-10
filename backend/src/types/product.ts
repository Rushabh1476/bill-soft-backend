/**
 * Product type definitions for the backend service layer
 */

export interface Product {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    taxRate?: number;
    stock?: number;
    quantity?: number;
    category?: string | null;
    sku?: string | null;
    customFields?: Record<string, any> | null;
    minStockLevel?: number;
    expiryDate?: string | null;
    batchNumber?: string | null;
    supplierId?: string | null;
    userId?: string;
    createdAt: string;
    updatedAt: string;
}
