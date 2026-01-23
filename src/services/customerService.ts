import { Customer } from '../types/customer';
import { StorageProvider } from '../interfaces/storage';
import { HttpClient } from '../interfaces/http';

export interface ICustomerService {
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | null>;
  createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer>;
  updateCustomer(customer: Customer): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  searchCustomers(query: string): Promise<Customer[]>;
  exportCustomers(format: 'json' | 'csv'): Promise<Blob>;
}

export interface CustomerServiceConfig {
  enableOfflineMode?: boolean;
  apiEndpoint?: string;
  cacheTimeout?: number;
}

export class CustomerService implements ICustomerService {
  private readonly STORAGE_KEY = 'customers';
  private readonly DEFAULT_API_ENDPOINT = 'http://localhost:5000/api/customers'; 
  private config: CustomerServiceConfig;
  
  constructor(
    private storage: StorageProvider,
    private httpClient: HttpClient,
    config: CustomerServiceConfig = {}
  ) {
    this.config = {
      cacheTimeout: 5 * 60 * 1000, 
      enableOfflineMode: true,
      apiEndpoint: config.apiEndpoint || this.DEFAULT_API_ENDPOINT,
      ...config
    };
  }

  private async getLocalData(): Promise<Customer[]> {
    const cached = await this.storage.get<{data: Customer[], timestamp: number}>(this.STORAGE_KEY);
    return cached?.data || [];
  }

  async getCustomers(): Promise<Customer[]> {
    try {
      const response = await this.httpClient.get<any>(this.config.apiEndpoint!);
      let customers: Customer[] = [];
      if (response && response.data) {
        customers = Array.isArray(response.data) ? response.data : (response.data.customers || []);
      } else if (Array.isArray(response)) {
        customers = response;
      }
      await this.storage.set(this.STORAGE_KEY, { data: customers, timestamp: Date.now() });
      return customers;
    } catch (error) {
      console.error('Fetch failed, loading from local storage');
      return this.getLocalData();
    }
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    const customers = await this.getCustomers();
    return customers.find(c => c.id === id) || null;
  }

  async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const newCustomer: Customer = {
      id: this.generateId(),
      ...customerData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    try {
      const response = await this.httpClient.post<Customer>(this.config.apiEndpoint!, newCustomer);
      const saved = (response.data && Object.keys(response.data).length > 0) ? (response.data as Customer) : newCustomer;
      await this.addToCache(saved);
      return saved;
    } catch (error) {
      await this.addToCache(newCustomer);
      return newCustomer; 
    }
  }

  async updateCustomer(customer: Customer): Promise<Customer> {
    const updated: Customer = { ...customer, updatedAt: new Date().toISOString() };
    try {
      const response = await this.httpClient.put<Customer>(`${this.config.apiEndpoint}/${customer.id}`, updated);
      const saved = (response.data && Object.keys(response.data).length > 0) ? (response.data as Customer) : updated;
      await this.updateInCache(saved);
      return saved;
    } catch (error) {
      await this.updateInCache(updated);
      return updated;
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      await this.httpClient.delete(`${this.config.apiEndpoint}/${id}`);
    } catch (error) {
      console.error('Delete failed on server');
    } finally {
      await this.removeFromCache(id);
    }
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const customers = await this.getCustomers();
    const q = query.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q));
  }

  async exportCustomers(format: 'json' | 'csv'): Promise<Blob> {
    const customers = await this.getCustomers();
    const content = format === 'json' ? JSON.stringify(customers) : this.convertToCSV(customers);
    return new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
  }

  private generateId(): string {
    return `cust-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  private async addToCache(customer: Customer): Promise<void> {
    const list = await this.getLocalData();
    await this.storage.set(this.STORAGE_KEY, { data: [...list, customer], timestamp: Date.now() });
  }

  private async updateInCache(customer: Customer): Promise<void> {
    const list = await this.getLocalData();
    const updated = list.map(c => c.id === customer.id ? customer : c);
    await this.storage.set(this.STORAGE_KEY, { data: updated, timestamp: Date.now() });
  }

  private async removeFromCache(id: string): Promise<void> {
    const list = await this.getLocalData();
    const filtered = list.filter(c => c.id !== id);
    await this.storage.set(this.STORAGE_KEY, { data: filtered, timestamp: Date.now() });
  }

  private convertToCSV(customers: Customer[]): string {
    const headers = 'ID,Name,Email,Phone,Address\n';
    const rows = customers.map(c => `${c.id},${c.name},${c.email},${c.phone},${c.address}`).join('\n');
    return headers + rows;
  }
}

export const createCustomerLocal = async (data: any) => { return {} as Customer; };
export const fetchCustomersLocal = async () => { return [] as Customer[]; };
export const deleteCustomerLocal = async (id: string) => { return; };