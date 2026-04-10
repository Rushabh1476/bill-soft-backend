import { Product } from '../types/product';

/**
 * Interface for basic CRUD operations on products
 * Follows Interface Segregation Principle - only essential CRUD operations
 */
export interface IProductCrudOperations {
  getProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  updateProduct(product: Product): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
}

/**
 * Interface for product search and filtering operations
 * Separated from CRUD to allow different search implementations
 */
export interface IProductSearchOperations {
  searchProducts(query: string): Promise<Product[]>;
  searchByCategory(category: string): Promise<Product[]>;
  searchByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]>;
  getInStockProducts(): Promise<Product[]>;
  getOutOfStockProducts(): Promise<Product[]>;
  getLowStockProducts(threshold: number): Promise<Product[]>;
}

/**
 * Interface for product export operations
 * Separated to allow different export implementations
 */
export interface IProductExportOperations {
  exportProducts(format: 'json' | 'csv' | 'excel'): Promise<Blob>;
  exportFilteredProducts(products: Product[], format: 'json' | 'csv' | 'excel'): Promise<Blob>;
  generateProductCatalog(): Promise<Blob>;
  generateInventoryReport(): Promise<Blob>;
}

/**
 * Interface for product inventory operations
 * Separated for components that only need inventory management
 */
export interface IProductInventoryOperations {
  updateStock(productId: string, quantity: number): Promise<Product>;
  adjustStock(productId: string, adjustment: number): Promise<Product>;
  checkStock(productId: string): Promise<number>;
  getStockAlerts(): Promise<Product[]>;
  reserveStock(productId: string, quantity: number): Promise<boolean>;
  releaseStock(productId: string, quantity: number): Promise<boolean>;
}

/**
 * Interface for product validation operations
 * Separated to allow different validation strategies
 */
export interface IProductValidationOperations {
  validateProductData(product: Partial<Product>): Promise<string[]>;
  validateSKU(sku: string): boolean;
  validatePrice(price: number): boolean;
  checkDuplicateSKU(sku: string, excludeId?: string): Promise<boolean>;
}

/**
 * Interface for bulk operations on products
 * Separated for clients that need bulk processing
 */
export interface IProductBulkOperations {
  bulkCreateProducts(products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Product[]>;
  bulkUpdateProducts(products: Product[]): Promise<Product[]>;
  bulkDeleteProducts(ids: string[]): Promise<void>;
  bulkUpdatePrices(updates: { id: string; price: number }[]): Promise<Product[]>;
  importProductsFromFile(file: File): Promise<Product[]>;
}

/**
 * Combined interface for full product service functionality
 * Clients can depend on only the interfaces they need
 */
export interface IProductService extends 
  IProductCrudOperations,
  IProductSearchOperations,
  IProductExportOperations {
  // Full service interface - most components will use this
  // But specific components can depend on just the segregated interfaces
}
