import { Customer } from '../types/customer';
import { StorageProvider } from '../interfaces/storage';
import { HttpClient } from '../interfaces/http';
import { LRUCache } from 'lru-cache';

/**
 * Enhanced Customer service with performance optimizations
 * Implements advanced caching, pagination, and query optimization
 */
export interface IOptimizedCustomerService {
  getCustomers(options?: CustomerQueryOptions): Promise<PaginatedCustomers>;
  getCustomerById(id: string): Promise<Customer | null>;
  createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer>;
  updateCustomer(customer: Customer): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  searchCustomers(query: string, options?: SearchOptions): Promise<PaginatedCustomers>;
  exportCustomers(format: 'json' | 'csv', options?: ExportOptions): Promise<Blob>;
  prefetchCustomers(ids: string[]): Promise<void>;
  invalidateCache(id?: string): void;
  getCustomerStats(): Promise<CustomerStats>;
}

export interface CustomerQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: keyof Customer;
  sortOrder?: 'asc' | 'desc';
  filters?: Partial<Customer>;
  includeStats?: boolean;
}

export interface SearchOptions extends CustomerQueryOptions {
  searchFields?: (keyof Customer)[];
  fuzzySearch?: boolean;
}

export interface ExportOptions {
  filters?: Partial<Customer>;
  fields?: (keyof Customer)[];
  includeHeaders?: boolean;
}

export interface PaginatedCustomers {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomersThisMonth: number;
  topCustomersByPurchases: Customer[];
  averagePurchaseAmount: number;
  customerGrowthRate: number;
}

/**
 * Optimized Customer service with advanced performance features
 */
export class OptimizedCustomerService implements IOptimizedCustomerService {
  private readonly STORAGE_KEY = 'customers';
  private readonly CACHE_KEY_PREFIX = 'customer_';
  private readonly STATS_CACHE_KEY = 'customer_stats';
  private readonly API_ENDPOINT = '/customers';
  
  // In-memory LRU cache for frequently accessed customers
  private memoryCache: LRUCache<string, Customer>;
  private statsCache: LRUCache<string, CustomerStats>;
  private searchCache: LRUCache<string, PaginatedCustomers>;
  
  // Background refresh timer
  private refreshTimer?: NodeJS.Timeout;
  
  constructor(
    private storage: StorageProvider,
    private httpClient: HttpClient,
    private config: OptimizedCustomerServiceConfig = {}
  ) {
    this.config = {
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      memoryCacheSize: 500, // Keep 500 customers in memory
      enableBackgroundRefresh: true,
      refreshInterval: 10 * 60 * 1000, // 10 minutes
      defaultPageSize: 25,
      maxPageSize: 100,
      enableCompression: true,
      enablePrefetching: true,
      ...config
    };
    
    // Initialize LRU caches
    this.memoryCache = new LRUCache<string, Customer>({
      max: this.config.memoryCacheSize!,
      ttl: this.config.cacheTimeout,
    });
    
    this.statsCache = new LRUCache<string, CustomerStats>({
      max: 10,
      ttl: 15 * 60 * 1000, // 15 minutes for stats
    });
    
    this.searchCache = new LRUCache<string, PaginatedCustomers>({
      max: 50,
      ttl: 2 * 60 * 1000, // 2 minutes for search results
    });
    
    // Start background refresh if enabled
    if (this.config.enableBackgroundRefresh) {
      this.startBackgroundRefresh();
    }
  }

  async getCustomers(options: CustomerQueryOptions = {}): Promise<PaginatedCustomers> {
    const {
      page = 1,
      limit = this.config.defaultPageSize!,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {},
      includeStats = false,
    } = options;
    
    // Create cache key for this query
    const cacheKey = this.createCacheKey('query', { page, limit, sortBy, sortOrder, filters });
    
    // Check search cache first
    const cached = this.searchCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: Math.min(limit, this.config.maxPageSize!).toString(),
        sortBy: sortBy.toString(),
        sortOrder,
        ...this.flattenFilters(filters),
      });
      
      if (includeStats) {
        params.append('includeStats', 'true');
      }
      
      // Fetch from API with optimized query
      const response = await this.httpClient.get<PaginatedCustomers>(
        `${this.API_ENDPOINT}?${params.toString()}`
      );
      
      const result = response.data;
      
      // Cache individual customers in memory
      result.data.forEach(customer => {
        this.memoryCache.set(customer.id, customer);
      });
      
      // Cache the paginated result
      this.searchCache.set(cacheKey, result);
      
      // Update local storage with latest data (debounced)
      this.debouncedStorageUpdate(result.data);
      
      return result;
    } catch (error) {
      console.error('Error fetching customers:', error);
      
      // Fallback to cached data
      return this.getFallbackCustomers(options);
    }
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    // Check memory cache first (fastest)
    const memCached = this.memoryCache.get(id);
    if (memCached) {
      return memCached;
    }
    
    try {
      // Check if customer is in recent batch
      const recentCustomers = await this.storage.get<Customer[]>(this.STORAGE_KEY);
      if (recentCustomers) {
        const found = recentCustomers.find(c => c.id === id);
        if (found) {
          this.memoryCache.set(id, found);
          return found;
        }
      }
      
      // Fetch from API
      const response = await this.httpClient.get<Customer>(`${this.API_ENDPOINT}/${id}`);
      const customer = response.data;
      
      // Update caches
      this.memoryCache.set(id, customer);
      
      return customer;
    } catch (error) {
      console.error(`Error fetching customer ${id}:`, error);
      return null;
    }
  }

  async searchCustomers(query: string, options: SearchOptions = {}): Promise<PaginatedCustomers> {
    const {
      searchFields = ['name', 'email', 'company'],
      fuzzySearch = true,
      ...queryOptions
    } = options;
    
    const cacheKey = this.createCacheKey('search', { query, searchFields, fuzzySearch, ...queryOptions });
    
    // Check search cache
    const cached = this.searchCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const params = new URLSearchParams({
        q: query,
        fields: searchFields.join(','),
        fuzzy: fuzzySearch.toString(),
        ...this.buildQueryParams(queryOptions),
      });
      
      const response = await this.httpClient.get<PaginatedCustomers>(
        `${this.API_ENDPOINT}/search?${params.toString()}`
      );
      
      const result = response.data;
      
      // Cache results
      this.searchCache.set(cacheKey, result);
      
      // Update memory cache with found customers
      result.data.forEach(customer => {
        this.memoryCache.set(customer.id, customer);
      });
      
      return result;
    } catch (error) {
      console.error('Error searching customers:', error);
      
      // Fallback to local search
      return this.performLocalSearch(query, options);
    }
  }

  async prefetchCustomers(ids: string[]): Promise<void> {
    if (!this.config.enablePrefetching) return;
    
    // Filter out already cached customers
    const uncachedIds = ids.filter(id => !this.memoryCache.has(id));
    
    if (uncachedIds.length === 0) return;
    
    try {
      // Batch fetch uncached customers
      const params = new URLSearchParams({
        ids: uncachedIds.join(','),
      });
      
      const response = await this.httpClient.get<Customer[]>(
        `${this.API_ENDPOINT}/batch?${params.toString()}`
      );
      
      // Cache the prefetched customers
      response.data.forEach(customer => {
        this.memoryCache.set(customer.id, customer);
      });
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  }

  async getCustomerStats(): Promise<CustomerStats> {
    const cached = this.statsCache.get(this.STATS_CACHE_KEY);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await this.httpClient.get<CustomerStats>(`${this.API_ENDPOINT}/stats`);
      const stats = response.data;
      
      this.statsCache.set(this.STATS_CACHE_KEY, stats);
      
      return stats;
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      
      // Fallback to basic stats calculation
      return this.calculateBasicStats();
    }
  }

  invalidateCache(id?: string): void {
    if (id) {
      this.memoryCache.delete(id);
      // Also clear related search results
      this.searchCache.clear();
    } else {
      this.memoryCache.clear();
      this.searchCache.clear();
      this.statsCache.clear();
    }
  }

  // Implementation details...
  private createCacheKey(type: string, params: any): string {
    return `${type}_${JSON.stringify(params)}`;
  }

  private flattenFilters(filters: Partial<Customer>): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        result[`filter_${key}`] = value.toString();
      }
    }
    
    return result;
  }

  private buildQueryParams(options: CustomerQueryOptions): Record<string, string> {
    const { page = 1, limit = this.config.defaultPageSize!, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    return {
      page: page.toString(),
      limit: Math.min(limit, this.config.maxPageSize!).toString(),
      sortBy: sortBy.toString(),
      sortOrder,
    };
  }

  private async getFallbackCustomers(options: CustomerQueryOptions): Promise<PaginatedCustomers> {
    const cached = await this.storage.get<Customer[]>(this.STORAGE_KEY) || [];
    
    // Apply filters and pagination locally
    let filtered = cached;
    
    if (options.filters) {
      filtered = this.applyFilters(cached, options.filters);
    }
    
    // Sort
    if (options.sortBy) {
      filtered = this.sortCustomers(filtered, options.sortBy, options.sortOrder || 'desc');
    }
    
    // Paginate
    const page = options.page || 1;
    const limit = options.limit || this.config.defaultPageSize!;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      data: filtered.slice(start, end),
      total: filtered.length,
      page,
      limit,
      hasNext: end < filtered.length,
      hasPrev: page > 1,
    };
  }

  private async performLocalSearch(query: string, options: SearchOptions): Promise<PaginatedCustomers> {
    const cached = await this.storage.get<Customer[]>(this.STORAGE_KEY) || [];
    const searchFields = options.searchFields || ['name', 'email', 'company'];
    
    const filtered = cached.filter(customer => {
      return searchFields.some(field => {
        const value = customer[field as keyof Customer];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query.toLowerCase());
        }
        return false;
      });
    });
    
    return this.paginateResults(filtered, options);
  }

  private paginateResults(data: Customer[], options: CustomerQueryOptions): PaginatedCustomers {
    const page = options.page || 1;
    const limit = options.limit || this.config.defaultPageSize!;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      data: data.slice(start, end),
      total: data.length,
      page,
      limit,
      hasNext: end < data.length,
      hasPrev: page > 1,
    };
  }

  private applyFilters(customers: Customer[], filters: Partial<Customer>): Customer[] {
    return customers.filter(customer => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null) return true;
        return customer[key as keyof Customer] === value;
      });
    });
  }

  private sortCustomers(customers: Customer[], sortBy: keyof Customer, sortOrder: 'asc' | 'desc'): Customer[] {
    return [...customers].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortOrder === 'asc' ? -1 : 1;
      if (bVal == null) return sortOrder === 'asc' ? 1 : -1;
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private async calculateBasicStats(): Promise<CustomerStats> {
    const customers = await this.storage.get<Customer[]>(this.STORAGE_KEY) || [];
    
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const newCustomersThisMonth = customers.filter(c => 
      new Date(c.createdAt) >= firstOfMonth
    );
    
    return {
      totalCustomers: customers.length,
      newCustomersThisMonth: newCustomersThisMonth.length,
      topCustomersByPurchases: customers.slice(0, 5), // Simplified
      averagePurchaseAmount: 0, // Would need purchase data
      customerGrowthRate: 0, // Would need historical data
    };
  }

  private debouncedStorageUpdate = this.debounce(async (customers: Customer[]) => {
    await this.storage.set(this.STORAGE_KEY, customers);
  }, 1000);

  private debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
  }

  private startBackgroundRefresh(): void {
    this.refreshTimer = setInterval(async () => {
      try {
        // Refresh the first page to get latest data
        await this.getCustomers({ page: 1, limit: this.config.defaultPageSize! });
      } catch (error) {
        console.warn('Background refresh failed:', error);
      }
    }, this.config.refreshInterval);
  }

  dispose(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.memoryCache.clear();
    this.searchCache.clear();
    this.statsCache.clear();
  }

  // Implement remaining interface methods...
  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    try {
      const response = await this.httpClient.post<Customer>(this.API_ENDPOINT, customer);
      const newCustomer = response.data;
      
      // Update caches
      this.memoryCache.set(newCustomer.id, newCustomer);
      this.invalidateCache(); // Clear search caches
      
      return newCustomer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  async updateCustomer(customer: Customer): Promise<Customer> {
    try {
      const response = await this.httpClient.put<Customer>(`${this.API_ENDPOINT}/${customer.id}`, customer);
      const updatedCustomer = response.data;
      
      // Update caches
      this.memoryCache.set(updatedCustomer.id, updatedCustomer);
      this.invalidateCache(); // Clear search caches
      
      return updatedCustomer;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw new Error('Failed to update customer');
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      await this.httpClient.delete(`${this.API_ENDPOINT}/${id}`);
      
      // Remove from caches
      this.memoryCache.delete(id);
      this.invalidateCache(); // Clear search caches
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw new Error('Failed to delete customer');
    }
  }

  async exportCustomers(format: 'json' | 'csv', options: ExportOptions = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams({
        format,
        ...this.flattenFilters(options.filters || {}),
      });
      
      if (options.fields) {
        params.append('fields', options.fields.join(','));
      }
      
      if (options.includeHeaders !== undefined) {
        params.append('includeHeaders', options.includeHeaders.toString());
      }
      
      // For blob responses, we'll handle this differently
      const response = await this.httpClient.get(`${this.API_ENDPOINT}/export?${params.toString()}`);
      
      // Convert response to blob
      let content: string;
      if (format === 'json') {
        content = JSON.stringify(response.data, null, 2);
      } else {
        // For CSV, assume the response is already formatted
        content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      }
      
      return new Blob([content], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
    } catch (error) {
      console.error('Error exporting customers:', error);
      throw new Error('Failed to export customers');
    }
  }
}

interface OptimizedCustomerServiceConfig {
  cacheTimeout?: number;
  memoryCacheSize?: number;
  enableBackgroundRefresh?: boolean;
  refreshInterval?: number;
  defaultPageSize?: number;
  maxPageSize?: number;
  enableCompression?: boolean;
  enablePrefetching?: boolean;
}
