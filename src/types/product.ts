export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock?: number;
    taxRate?: number;
    tax?: number;
    quantity?: number;
    createdAt: string;
    updatedAt: string;
    customFields?: Record<string, any>;
}