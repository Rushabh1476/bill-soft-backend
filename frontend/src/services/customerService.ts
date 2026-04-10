/* eslint-disable */
import { Customer } from '../types/customer';
import * as XLSX from 'xlsx';
import { StorageProvider } from '../interfaces/storage';
import { HttpClient } from '../interfaces/http';

/**
 * Customer service interface defining the contract for customer operations
 * Follows Interface Segregation Principle
 */
export interface ICustomerService {
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | null>;
  createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer>;
  updateCustomer(customer: Customer): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  searchCustomers(query: string): Promise<Customer[]>;
  exportCustomers(format: 'json' | 'csv' | 'excel'): Promise<Blob>;
}

/**
 * Service configuration options
 */
export interface CustomerServiceConfig {
  enableOfflineMode?: boolean;
  apiEndpoint?: string;
  cacheTimeout?: number;
}

/**
 * Customer service implementation with dependency injection
 * Implements Dependency Inversion Principle by depending on abstractions
 */
export class CustomerService implements ICustomerService {
  private readonly STORAGE_KEY = 'customers';
  private readonly API_ENDPOINT = 'customers';
  private config: CustomerServiceConfig;

  constructor(
    private storage: StorageProvider,
    private httpClient: HttpClient,
    config: CustomerServiceConfig = {}
  ) {
    this.config = {
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      enableOfflineMode: true,
      apiEndpoint: 'customers',
      ...config
    };
  }

  async getCustomers(): Promise<Customer[]> {
    try {
      // Fetch from API first to ensure data consistency
      const response = await this.httpClient.get<any>(this.config.apiEndpoint || this.API_ENDPOINT);
      const customers = response.data.customers || response.data;

      // Update cache
      await this.storage.set(this.STORAGE_KEY, customers);

      return customers;
    } catch (error: any) {
      console.error('Error fetching customers:', error);

      // Fallback to cache if offline mode is enabled or API fails
      if (this.config.enableOfflineMode) {
        const cachedCustomers = await this.storage.get<Customer[]>(this.STORAGE_KEY);
        if (cachedCustomers) {
          console.warn('Using cached customers due to network error');
          return cachedCustomers;
        }
      }

      throw new Error('Failed to fetch customers');
    }
  }


  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      // Go directly to API - includes bill history from server
      const response = await this.httpClient.get<any>(`${this.config.apiEndpoint || this.API_ENDPOINT}/${id}`);
      return response.data.customer || response.data;
    } catch (error: any) {
      console.error(`Error fetching customer ${id}:`, error);
      // Fallback to cached list
      const cachedCustomers = await this.storage.get<Customer[]>(this.STORAGE_KEY);
      if (cachedCustomers) {
        return cachedCustomers.find(c => c.id === id) || null;
      }
      return null;
    }
  }

  async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const newCustomer: Customer = {
      id: this.generateId(),
      ...customerData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Try to create via API first
      const response = await this.httpClient.post<any>(
        this.config.apiEndpoint || this.API_ENDPOINT,
        newCustomer
      );

      // Handle backend response format { message: string, customer: Customer }
      const createdCustomer = response.data.customer || response.data;

      // Update local cache
      await this.addToCache(createdCustomer);

      return createdCustomer;
    } catch (error: any) {
      console.error('Error creating customer:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Fallback to local storage if offline mode is enabled
      // Only fallback if it's a network error or explicitly enabled, 
      // NOT if it's a 4xx error from the server (e.g. valid duplicate email)
      const isNetworkError = !error.response;

      if (this.config.enableOfflineMode && isNetworkError) {
        console.warn('Creating customer locally due to network error');
        await this.addToCache(newCustomer);
        return newCustomer;
      }

      throw error; // Re-throw to be handled by the form
    }
  }

  async updateCustomer(customer: Customer): Promise<Customer> {
    const updatedCustomer: Customer = {
      ...customer,
      updatedAt: new Date().toISOString()
    };

    try {
      // Try to update via API first
      const response = await this.httpClient.put<any>(
        `${this.config.apiEndpoint || this.API_ENDPOINT}/${customer.id}`,
        updatedCustomer
      );

      const apiCustomer = response.data.customer || response.data;

      // Update local cache
      await this.updateInCache(apiCustomer);

      return apiCustomer;
    } catch (error: any) {
      console.error('Error updating customer via API:', error);

      // Fallback to local storage if offline mode is enabled
      if (this.config.enableOfflineMode) {
        console.warn('Updating customer locally due to network error');
        await this.updateInCache(updatedCustomer);
        return updatedCustomer;
      }

      throw new Error('Failed to update customer');
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      // Try to delete via API first
      await this.httpClient.delete(`${this.config.apiEndpoint || this.API_ENDPOINT}/${id}`);

      // Remove from local cache
      await this.removeFromCache(id);
    } catch (error: any) {
      console.error('Error deleting customer via API:', error);

      // Extract error message from response if available
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete customer';

      // Fallback to local storage if offline mode is enabled (only for network errors)
      const isNetworkError = !error.response;
      if (this.config.enableOfflineMode && isNetworkError) {
        console.warn('Deleting customer locally due to network error');
        await this.removeFromCache(id);
        return;
      }

      throw new Error(errorMessage);
    }
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      // Try API search first
      const response = await this.httpClient.get<Customer[]>(
        `${this.config.apiEndpoint || this.API_ENDPOINT}/search?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error searching customers via API:', error);

      // Fallback to local search
      const customers = await this.getCustomers();
      const lowercaseQuery = query.toLowerCase();

      return customers.filter(customer =>
        (customer.name && customer.name.toLowerCase().includes(lowercaseQuery)) ||
        (customer.email && customer.email.toLowerCase().includes(lowercaseQuery)) ||
        (customer.phone && customer.phone.includes(query))
      );
    }
  }

  async exportCustomers(format: 'json' | 'csv'): Promise<Blob> {
    const customers = await this.getCustomers();

    if (format === 'json') {
      const json = JSON.stringify(customers, null, 2);
      return new Blob([json], { type: 'application/json' });
    } else if (format === 'csv') {
      const csv = this.convertToCSV(customers);
      return new Blob([csv], { type: 'text/csv' });
    } else {
      return this.exportToExcel(customers);
    }
  }

  private async exportToExcel(customers: Customer[]): Promise<Blob> {
    const data = customers.map(customer => ({
      'ID': customer.id,
      'Name': customer.name,
      'Email': customer.email || '',
      'Phone': customer.phone || '',
      'Address': customer.address || '',
      'State': (customer as any).state || '',
      'City': (customer as any).city || '',
      'Pincode': (customer as any).pincode || '',
      'Created At': customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '',
      'Updated At': customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString() : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    
    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // Private helper methods

  private generateId(): string {
    return `cust-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isCacheValid(cachedData: any): boolean {
    if (!this.config.cacheTimeout) return true;

    // Simple cache validation - in production, you'd want more sophisticated logic
    const cacheTimestamp = cachedData._timestamp;
    if (!cacheTimestamp) return false;

    return Date.now() - cacheTimestamp < this.config.cacheTimeout;
  }

  private async addToCache(customer: Customer): Promise<void> {
    let customers = await this.storage.get<Customer[]>(this.STORAGE_KEY);
    if (!Array.isArray(customers)) {
      customers = [];
    }
    const updatedCustomers = [...customers, customer];
    await this.storage.set(this.STORAGE_KEY, updatedCustomers);
  }

  private async updateInCache(customer: Customer): Promise<void> {
    let customers = await this.storage.get<Customer[]>(this.STORAGE_KEY);
    if (!Array.isArray(customers)) {
      customers = [];
    }
    const updatedCustomers = customers.map(c => c.id === customer.id ? customer : c);
    await this.storage.set(this.STORAGE_KEY, updatedCustomers);
  }

  private async removeFromCache(id: string): Promise<void> {
    let customers = await this.storage.get<Customer[]>(this.STORAGE_KEY);
    if (!Array.isArray(customers)) {
      customers = [];
    }
    const updatedCustomers = customers.filter(c => c.id !== id);
    await this.storage.set(this.STORAGE_KEY, updatedCustomers);
  }

  private convertToCSV(customers: Customer[]): string {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'Created At', 'Updated At'];
    const rows = customers.map(customer => [
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      customer.address,
      customer.createdAt,
      customer.updatedAt
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

// Legacy exports for backward compatibility
export const createCustomer = async (customer: Customer): Promise<Customer> => {
  console.warn('Deprecated: Use CustomerService.createCustomer instead');
  // Would need to create service instance - this is temporary
  throw new Error('Use CustomerService with dependency injection instead');
};

export const fetchCustomers = async (): Promise<Customer[]> => {
  console.warn('Deprecated: Use CustomerService.getCustomers instead');
  throw new Error('Use CustomerService with dependency injection instead');
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  console.warn('Deprecated: Use CustomerService.deleteCustomer instead');
  throw new Error('Use CustomerService with dependency injection instead');
};
