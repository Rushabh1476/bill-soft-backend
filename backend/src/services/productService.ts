import { Product } from '../types/product';
import { StorageProvider } from '../interfaces/storage';
import { HttpClient } from '../interfaces/http';

/**
 * Product service interface defining the contract for product operations
 * Follows Interface Segregation Principle
 */
export interface IProductService {
  getProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  updateProduct(product: Product): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  searchProducts(query: string): Promise<Product[]>;
  exportProducts(format: 'json' | 'csv'): Promise<Blob>;
  bulkCreateProducts(products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Product[]>;
  bulkUpdateProducts(products: Product[]): Promise<Product[]>;
  getLowStockProducts(threshold?: number): Promise<Product[]>;
}

/**
 * Service configuration options
 */
export interface ProductServiceConfig {
  enableOfflineMode?: boolean;
  apiEndpoint?: string;
  cacheTimeout?: number;
  lowStockThreshold?: number;
}

/**
 * Product service implementation with dependency injection
 * Implements Dependency Inversion Principle by depending on abstractions
 */
export class ProductService implements IProductService {
  private readonly STORAGE_KEY = 'products';
  private readonly API_ENDPOINT = 'products';
  private config: ProductServiceConfig;

  constructor(
    private storage: StorageProvider,
    private httpClient: HttpClient,
    config: ProductServiceConfig = {}
  ) {
    this.config = {
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      enableOfflineMode: true,
      apiEndpoint: 'products',
      lowStockThreshold: 10,
      ...config
    };
  }

  async getProducts(): Promise<Product[]> {
    try {
      // Fetch from API first with cache-busting timestamp
      const baseEndpoint = (this.config.apiEndpoint || this.API_ENDPOINT).replace(/^\/+/, '');
      const url = `${baseEndpoint}${baseEndpoint.includes('?') ? '&' : '?'}t=${Date.now()}`;

      console.log(`ProductService: Fetching products from ${url}`);
      const response = await this.httpClient.get<any>(url);
      const products = response.data.products || response.data;

      // Update cache
      await this.storage.set(this.STORAGE_KEY, products);

      return products;
    } catch (error: any) {
      console.error('Error fetching products:', error);

      // Fallback to cache if offline mode is enabled
      if (this.config.enableOfflineMode) {
        const cachedProducts = await this.storage.get<Product[]>(this.STORAGE_KEY);
        if (cachedProducts) {
          console.warn('Using cached products due to network error');
          return cachedProducts;
        }
      }

      throw new Error('Failed to fetch products');
    }
  }


  async getProductById(id: string): Promise<Product | null> {
    try {
      // First check local cache
      const products = await this.getProducts();
      const product = products.find(p => p.id === id);

      if (product) {
        return product;
      }

      // If not in cache, try API
      const response = await this.httpClient.get<Product>(`${this.config.apiEndpoint || this.API_ENDPOINT}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching product ${id}:`, error);
      return null;
    }
  }

  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const newProduct: Product = {
      id: this.generateId(),
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Try to create via API first
      const response = await this.httpClient.post<any>(
        this.config.apiEndpoint || this.API_ENDPOINT,
        newProduct
      );
      const createdProduct = response.data.product || response.data;

      // Update local cache
      await this.addToCache(createdProduct);

      return createdProduct;
    } catch (error: any) {
      console.error('Error creating product:', error);

      // Only fallback to local storage on network errors (no response)
      const isNetworkError = !error.status && !error.response;
      if (this.config.enableOfflineMode && isNetworkError) {
        console.warn('Creating product locally due to network error');
        await this.addToCache(newProduct);
        return newProduct;
      }

      throw error;
    }
  }

  async updateProduct(product: Product): Promise<Product> {
    const updatedProduct: Product = {
      ...product,
      updatedAt: new Date().toISOString()
    };

    try {
      // Try to update via API first
      const response = await this.httpClient.put<any>(
        `${this.config.apiEndpoint || this.API_ENDPOINT}/${product.id}`,
        updatedProduct
      );
      const apiProduct = response.data.product || response.data;

      // Update local cache
      await this.updateInCache(apiProduct);

      return apiProduct;
    } catch (error: any) {
      console.error('Error updating product:', error);

      // Handle 404 - Product not found on server
      if (error.response?.status === 404 || error.status === 404) {
        console.warn('Product not found on server (404) during update, removing from local cache');
        await this.removeFromCache(product.id);
        throw new Error('Product no longer exists on the server');
      }

      const isNetworkError = !error.status && !error.response;
      if (this.config.enableOfflineMode && isNetworkError) {
        console.warn('Updating product locally due to network error');
        await this.updateInCache(updatedProduct);
        return updatedProduct;
      }

      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      // Try to delete via API first
      await this.httpClient.delete(`${this.config.apiEndpoint || this.API_ENDPOINT}/${id}`);

      // Remove from local cache
      await this.removeFromCache(id);
    } catch (error: any) {
      console.error('Error deleting product:', error);

      // Handle 404 - Product already deleted or doesn't exist on server
      // We throw the error so the UI knows something is wrong (e.g. ID mismatch) instead of silently removing it.
      // The user can refresh to see the true state.
      /* 
      if (error.response?.status === 404 || error.status === 404) {
        console.warn('Product not found on server (404), removing from local cache');
        await this.removeFromCache(id);
        return;
      }
      */

      const isNetworkError = !error.status && !error.response;
      if (this.config.enableOfflineMode && isNetworkError) {
        console.warn('Deleting product locally due to network error');
        await this.removeFromCache(id);
        return;
      }

      throw error;
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      // Try API search first
      const response = await this.httpClient.get<Product[]>(
        `${this.config.apiEndpoint || this.API_ENDPOINT}/search?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error searching products via API:', error);

      // Fallback to local search
      const products = await this.getProducts();
      const lowercaseQuery = query.toLowerCase();

      return products.filter(product =>
        product.name.toLowerCase().includes(lowercaseQuery) ||
        (product.description && product.description.toLowerCase().includes(lowercaseQuery)) ||
        product.id.includes(query)
      );
    }
  }

  async exportProducts(format: 'json' | 'csv'): Promise<Blob> {
    const products = await this.getProducts();

    if (format === 'json') {
      const json = JSON.stringify(products, null, 2);
      return new Blob([json], { type: 'application/json' });
    } else {
      const csv = this.convertToCSV(products);
      return new Blob([csv], { type: 'text/csv' });
    }
  }

  async bulkCreateProducts(productsData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Product[]> {
    const newProducts: Product[] = productsData.map(data => ({
      id: this.generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    try {
      // Try to create via API first
      const response = await this.httpClient.post<Product[]>(
        `${this.config.apiEndpoint || this.API_ENDPOINT}/bulk`,
        newProducts
      );
      const createdProducts = response.data;

      // Update local cache
      await this.bulkAddToCache(createdProducts);

      return createdProducts;
    } catch (error: any) {
      console.error('Error bulk creating products via API:', error);

      // Fallback to local storage if offline mode is enabled
      if (this.config.enableOfflineMode) {
        console.warn('Bulk creating products locally due to network error');
        await this.bulkAddToCache(newProducts);
        return newProducts;
      }

      throw new Error('Failed to bulk create products');
    }
  }

  async bulkUpdateProducts(products: Product[]): Promise<Product[]> {
    const updatedProducts: Product[] = products.map(product => ({
      ...product,
      updatedAt: new Date().toISOString()
    }));

    try {
      // Try to update via API first
      const response = await this.httpClient.put<Product[]>(
        `${this.config.apiEndpoint || this.API_ENDPOINT}/bulk`,
        updatedProducts
      );
      const apiProducts = response.data;

      // Update local cache
      await this.bulkUpdateInCache(apiProducts);

      return apiProducts;
    } catch (error: any) {
      console.error('Error bulk updating products via API:', error);

      // Fallback to local storage if offline mode is enabled
      if (this.config.enableOfflineMode) {
        console.warn('Bulk updating products locally due to network error');
        await this.bulkUpdateInCache(updatedProducts);
        return updatedProducts;
      }

      throw new Error('Failed to bulk update products');
    }
  }

  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    const products = await this.getProducts();
    const stockThreshold = threshold || this.config.lowStockThreshold || 10;

    return products.filter(product =>
      product.stock !== undefined && product.stock <= stockThreshold
    );
  }

  // Private helper methods

  private generateId(): string {
    return `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isCacheValid(cachedData: any): boolean {
    if (!this.config.cacheTimeout) return true;

    // Simple cache validation - in production, you'd want more sophisticated logic
    const cacheTimestamp = cachedData._timestamp;
    if (!cacheTimestamp) return false;

    return Date.now() - cacheTimestamp < this.config.cacheTimeout;
  }

  private async addToCache(product: Product): Promise<void> {
    let products = await this.storage.get<Product[]>(this.STORAGE_KEY);
    if (!Array.isArray(products)) {
      products = [];
    }
    const updatedProducts = [...products, product];
    await this.storage.set(this.STORAGE_KEY, updatedProducts);
  }

  private async updateInCache(product: Product): Promise<void> {
    let products = await this.storage.get<Product[]>(this.STORAGE_KEY);
    if (!Array.isArray(products)) {
      products = [];
    }
    const updatedProducts = products.map(p => p.id === product.id ? product : p);
    await this.storage.set(this.STORAGE_KEY, updatedProducts);
  }

  private async removeFromCache(id: string): Promise<void> {
    let products = await this.storage.get<Product[]>(this.STORAGE_KEY);
    if (!Array.isArray(products)) {
      products = [];
    }
    const updatedProducts = products.filter(p => p.id !== id);
    await this.storage.set(this.STORAGE_KEY, updatedProducts);
  }

  private async bulkAddToCache(products: Product[]): Promise<void> {
    let existingProducts = await this.storage.get<Product[]>(this.STORAGE_KEY);
    if (!Array.isArray(existingProducts)) {
      existingProducts = [];
    }
    const updatedProducts = [...existingProducts, ...products];
    await this.storage.set(this.STORAGE_KEY, updatedProducts);
  }

  private async bulkUpdateInCache(products: Product[]): Promise<void> {
    let existingProducts = await this.storage.get<Product[]>(this.STORAGE_KEY);
    if (!Array.isArray(existingProducts)) {
      existingProducts = [];
    }
    const productMap = new Map(products.map(p => [p.id, p]));

    const updatedProducts = existingProducts.map(p =>
      productMap.has(p.id) ? productMap.get(p.id)! : p
    );

    await this.storage.set(this.STORAGE_KEY, updatedProducts);
  }

  private convertToCSV(products: Product[]): string {
    const headers = ['ID', 'Name', 'Description', 'Price', 'Stock', 'Tax Rate', 'Created At', 'Updated At'];
    const rows = products.map(product => [
      product.id,
      product.name,
      product.description,
      product.price.toString(),
      product.stock?.toString() || '',
      product.taxRate?.toString() || '',
      product.createdAt,
      product.updatedAt
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

// Legacy exports for backward compatibility
export const getProducts = async (): Promise<Product[]> => {
  console.warn('Deprecated: Use ProductService.getProducts instead');
  throw new Error('Use ProductService with dependency injection instead');
};

export const createProduct = async (product: Product): Promise<Product> => {
  console.warn('Deprecated: Use ProductService.createProduct instead');
  throw new Error('Use ProductService with dependency injection instead');
};

export const updateProduct = async (productId: string, product: Product): Promise<Product> => {
  console.warn('Deprecated: Use ProductService.updateProduct instead');
  throw new Error('Use ProductService with dependency injection instead');
};

export const deleteProduct = async (productId: string): Promise<void> => {
  console.warn('Deprecated: Use ProductService.deleteProduct instead');
  throw new Error('Use ProductService with dependency injection instead');
};
