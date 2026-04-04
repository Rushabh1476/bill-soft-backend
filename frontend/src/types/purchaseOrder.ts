export interface PurchaseOrder {
  id: string;
  userId: string;
  poNumber: string;
  supplierId: string;
  orderDate: string;
  status: 'DRAFT' | 'ORDERED' | 'RECEIVED';
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  supplier: {
    name: string;
  };
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId?: string;
  itemName: string;
  quantity: number;
  price: number;
  total: number;
  createdAt: string;
  product?: {
    name: string;
    sku?: string;
  }
}
