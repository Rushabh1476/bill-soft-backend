/* eslint-disable */
import { Product } from '../types/product';
import { StorageProvider } from '../interfaces/storage';
import { HttpClient } from '../interfaces/http';

export interface ProductResponse {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Product service interface defining the contract for product operations
 * Follows Interface Segregation Principle
 */
export interface IProductService {
  getProducts(params?: { search?: string, category?: string, status?: string, limit?: number }): Promise<Product[]>;
  getProductsPaginated(params: { page: number, limit: number, search?: string, category?: string, status?: string }): Promise<ProductResponse>;
  getProductById(id: string): Promise<Product | null>;
  createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  updateProduct(product: Product): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  deleteProducts(ids: string[]): Promise<void>;
  searchProducts(query: string): Promise<Product[]>;
  exportProducts(format: 'json' | 'csv'): Promise<Blob>;
  bulkCreateProducts(productsData: any): Promise<any>;
  bulkUpdateProducts(products: Product[]): Promise<Product[]>;
  getLowStockProducts(threshold?: number): Promise<Product[]>;
  getAllProductIds(params?: { search?: string, category?: string, status?: string }): Promise<string[]>;
  uploadBulk(file: File, signal?: AbortSignal): Promise<{ jobId: string }>;
  getImportStatus(jobId: string): Promise<any>;
  cancelImport(jobId: string): Promise<void>;
  startChunkedImport(totalProducts: number): Promise<{ jobId: string }>;
  sendImportChunk(jobId: string, products: any[]): Promise<void>;
  finishImportJob(jobId: string, status?: string): Promise<void>;
  getProductStats(): Promise<{ totalCount: number, totalValue: number }>;
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

  async getProducts(params?: { search?: string, category?: string, status?: string, limit?: number }): Promise<Product[]> {
    try {
      const baseEndpoint = (this.config.apiEndpoint || this.API_ENDPOINT).replace(/^\/+/, '');
      const limit = params?.limit || 100;
      let url = `${baseEndpoint}?limit=${limit}&t=${Date.now()}`; 
      
      if (params) {
        if (params.search) url += `&search=${encodeURIComponent(params.search)}`;
        if (params.category) url += `&category=${encodeURIComponent(params.category)}`;
        if (params.status) url += `&status=${encodeURIComponent(params.status)}`;
      }

      console.log(`ProductService: Fetching products from ${url}`);
      const response = await this.httpClient.get<any>(url);
      const products = response.data.products || response.data;

      return products;
    } catch (error: any) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  async getProductsPaginated(params: { page: number, limit: number, search?: string, category?: string, status?: string }): Promise<ProductResponse> {
    const baseEndpoint = (this.config.apiEndpoint || this.API_ENDPOINT).replace(/^\/+/, '');
    const url = `${baseEndpoint}?page=${params.page}&limit=${params.limit}` +
      (params.search ? `&search=${encodeURIComponent(params.search)}` : '') +
      (params.category ? `&category=${encodeURIComponent(params.category)}` : '') +
      (params.status ? `&status=${encodeURIComponent(params.status)}` : '') +
      `&_t=${Date.now()}`; // Add cache buster to prevent stale reverts

    try {
      const response = await this.httpClient.get<ProductResponse>(url);
      return response.data;
    } catch (error: any) {
      console.error(`[ProductService] Error fetching paginated products from ${url}:`, {
        message: error.message,
        status: error.status,
        data: error.data,
        isAxiosError: !!error.isAxiosError,
        wasCancelled: !!error.wasCancelled,
        code: error.code
      });
      const errorMessage = error.data?.error || error.response?.data?.error || error.message || 'Failed to fetch paginated products';
      throw new Error(errorMessage);
    }
  }

  async getAllProductIds(params?: { search?: string, category?: string, status?: string }): Promise<string[]> {
    try {
      const baseEndpoint = (this.config.apiEndpoint || this.API_ENDPOINT).replace(/^\/+/, '');
      let url = `${baseEndpoint}/all-ids?limit=10000`;
      
      if (params) {
        if (params.search) url += `&search=${encodeURIComponent(params.search)}`;
        if (params.category) url += `&category=${encodeURIComponent(params.category)}`;
        if (params.status) url += `&status=${encodeURIComponent(params.status)}`;
      }

      const response = await this.httpClient.get<any>(url);
      return response.data.ids || [];
    } catch (error: any) {
      console.error('Error fetching all product IDs:', error);
      throw new Error('Failed to fetch product IDs');
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
      const response = await this.httpClient.get<any>(`${this.config.apiEndpoint || this.API_ENDPOINT}/${id}`);
      return response.data.product || response.data;
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
      // Delete from API — this is the source of truth
      await this.httpClient.delete(`${this.config.apiEndpoint || this.API_ENDPOINT}/${id}`);

      // Invalidate the entire local cache so the next getProducts() hits the API fresh.
      await this.storage.remove(this.STORAGE_KEY);

    } catch (error: any) {
      console.error('Error deleting product:', error);

      // 404: Product already gone — clear cache and treat as success
      if (error.status === 404 || error.response?.status === 404) {
        console.warn('Product not found on server (404) — removing from local cache anyway');
        await this.storage.remove(this.STORAGE_KEY);
        return;
      }

      // 409: FK constraint — product referenced in bills. Surface the backend message.
      if (error.status === 409 || error.response?.status === 409) {
        const msg = error.data?.error || error.response?.data?.error || 'Cannot delete: product is used in existing bills';
        throw Object.assign(new Error(msg), { status: 409 });
      }

      // Genuine network errors in offline mode — remove from cache only
      const isNetworkError = !error.status && !error.response;
      if (this.config.enableOfflineMode && isNetworkError) {
        console.warn('Deleting product locally due to network error');
        await this.removeFromCache(id);
        return;
      }

      throw error;
    }
  }

  async deleteProducts(ids: string[]): Promise<void> {
    try {
      // Delete from API
      await this.httpClient.post(`${this.config.apiEndpoint || this.API_ENDPOINT}/delete`, { ids }, { timeout: 60000 });

      // Invalidate the entire local cache
      await this.storage.remove(this.STORAGE_KEY);

    } catch (error: any) {
      console.error('Error bulk deleting products:', error);

      if (error.status === 409 || error.response?.status === 409) {
        const msg = error.data?.error || error.response?.data?.error || 'One or more products are referenced in existing bills';
        throw Object.assign(new Error(msg), { status: 409 });
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

  async bulkCreateProducts(productsData: any): Promise<any> {
    const newProducts: Product[] = productsData.map((data: any) => ({
      id: this.generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    try {
      // Try to create via API first
      const response = await this.httpClient.post<any>(
        `${this.config.apiEndpoint || this.API_ENDPOINT}/bulk`,
        newProducts,
        { timeout: 60000 } // High timeout for large bulk payloads
      );
      const data = response.data;

      // If it's a background job (BullMQ), it returns a jobId
      if (data && data.jobId) {
        return data; // Return jobId to frontend for tracking
      }

      // Legacy fallback: if it returns an array of products directly
      if (Array.isArray(data)) {
        await this.bulkAddToCache(data);
        return data;
      }

      return data;
    } catch (error: any) {
      console.error('Error bulk creating products via API:', error);
      // Removed offline fallback for bulk import as it requires a server-side jobId to track progress.
      throw error;
    }
  }

  async uploadBulk(file: File, signal?: AbortSignal): Promise<{ jobId: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await this.httpClient.post<any>(
        `${this.config.apiEndpoint || this.API_ENDPOINT}/bulk-upload`,
        formData,
        { 
          timeout: 0, // No timeout for large file uploads
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          signal
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error uploading bulk file:', error);
      throw error;
    }
  }

  async getImportStatus(jobId: string): Promise<any> {
    try {
      const response = await this.httpClient.get<any>(
        `${this.config.apiEndpoint || this.API_ENDPOINT}/bulk-import/status/${jobId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting import status:', error);
      throw error;
    }
  }

  async startChunkedImport(totalProducts: number): Promise<{ jobId: string }> {
    const response = await this.httpClient.post<{ success: boolean, jobId: string }>(
      `${this.config.apiEndpoint || this.API_ENDPOINT}/import/start`,
      { totalProducts }
    );
    return response.data;
  }

  async sendImportChunk(jobId: string, products: any[]): Promise<void> {
    await this.httpClient.post(
      `${this.config.apiEndpoint || this.API_ENDPOINT}/import/chunk`,
      { jobId, products }
    );
  }

  async finishImportJob(jobId: string, status: string = 'completed'): Promise<void> {
    await this.httpClient.post(
      `${this.config.apiEndpoint || this.API_ENDPOINT}/import/finish`,
      { jobId, status }
    );
  }

  async cancelImport(jobId: string): Promise<void> {
    try {
      await this.httpClient.post(
        `${this.config.apiEndpoint || this.API_ENDPOINT}/bulk-import/cancel/${jobId}`,
        {}
      );
    } catch (error: any) {
      console.error('Error cancelling import:', error);
      throw error;
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

  async getProductStats(): Promise<{ totalCount: number, totalValue: number }> {
    try {
      const response = await this.httpClient.get<{ totalCount: number, totalValue: number }>(`${this.API_ENDPOINT}/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to get product stats:', error);
      return { totalCount: 0, totalValue: 0 };
    }
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
