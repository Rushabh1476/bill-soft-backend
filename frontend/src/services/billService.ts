/* eslint-disable */
import { Bill } from '../types/bill';
import { StorageProvider } from '../interfaces/storage';
import { HttpClient } from '../interfaces/http';

/**
 * Bill service interface defining the contract for bill operations
 * Follows Interface Segregation Principle
 */
export interface IBillService {
  getBills(params?: { page?: number; limit?: number; search?: string; status?: string; customerId?: string }): Promise<Bill[] | { bills: Bill[], pagination: any }>;
  getBillById(id: string): Promise<Bill | null>;
  createBill(bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bill>;
  updateBill(bill: Bill): Promise<Bill>;
  deleteBill(id: string): Promise<void>;
  searchBills(query: string): Promise<Bill[]>;
  exportBills(format: 'json' | 'csv' | 'pdf'): Promise<Blob>;
  getBillsByStatus(status: Bill['status']): Promise<Bill[]>;
  getBillsByCustomer(customerId: string): Promise<Bill[]>;
  getOverdueBills(): Promise<Bill[]>;
  markBillAsPaid(id: string): Promise<Bill>;
  generateBillNumber(): string;
  calculateBillTotals(bill: Partial<Bill>): { subtotal: number; taxAmount: number; totalAmount: number };
  getAllBillIds(filters?: { search?: string; status?: string; customerId?: string; dateFilter?: string }): Promise<string[]>;
  deleteBills(ids: string[]): Promise<void>;
  getBillStats(): Promise<{ totalCount: number, totalRevenue: number }>;
}

/**
 * Service configuration options
 */
export interface BillServiceConfig {
  enableOfflineMode?: boolean;
  apiEndpoint?: string;
  cacheTimeout?: number;
  billNumberPrefix?: string;
  defaultTaxRate?: number;
}

/**
 * Bill service implementation with dependency injection
 * Implements Dependency Inversion Principle by depending on abstractions
 */
export class BillService implements IBillService {
  private readonly STORAGE_KEY = 'bills';
  private readonly API_ENDPOINT = 'bills';
  private config: BillServiceConfig;

  constructor(
    private storage: StorageProvider,
    private httpClient: HttpClient,
    config: BillServiceConfig = {}
  ) {
    this.config = {
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      enableOfflineMode: true,
      apiEndpoint: 'bills',
      billNumberPrefix: 'INV',
      defaultTaxRate: 0, // Tax is per-product — no global flat rate
      ...config
    };
  }

  async getBills(params?: { page?: number; limit?: number; search?: string; status?: string; customerId?: string }): Promise<Bill[] | { bills: Bill[], pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.search) queryParams.append('search', params.search);
        if (params.status) queryParams.append('status', params.status);
        if (params.customerId) queryParams.append('customerId', params.customerId);
      }
      queryParams.append('t', Date.now().toString());

      const url = `${this.config.apiEndpoint || this.API_ENDPOINT}?${queryParams.toString()}`;
      const response = await this.httpClient.get<any>(url);
      
      // If paginated response from server
      if (response.data && response.data.pagination) {
        return {
          bills: response.data.bills || [],
          pagination: response.data.pagination
        };
      }

      const bills = response.data.bills || response.data;

      // Update cache only for non-filtered, full list requests
      if (!params || (!params.search && !params.status && !params.customerId)) {
        if (Array.isArray(bills)) {
          await this.storage.set(this.STORAGE_KEY, bills);
        }
      }
      return Array.isArray(bills) ? bills : [];
    } catch (error) {
      console.error('Error fetching bills:', error);

      // Fallback to cache if offline mode is enabled and no specific filters
      if (this.config.enableOfflineMode && (!params || !params.search)) {
        const cachedBills = await this.storage.get<Bill[]>(this.STORAGE_KEY);
        if (cachedBills) {
          console.warn('Using cached bills due to network error');
          return cachedBills;
        }
      }

      throw new Error('Failed to fetch bills');
    }
  }
  private async getBillArray(): Promise<Bill[]> {
    const result = await this.getBills();
    if (Array.isArray(result)) return result;
    return result.bills;
  }

  async getBillById(id: string): Promise<Bill | null> {
    try {
      // First check local cache
      const bills = await this.getBillArray();
      const bill = bills.find((b: Bill) => b.id === id);

      if (bill) {
        return bill;
      }

      // If not in cache, try API
      const response = await this.httpClient.get<any>(`${this.config.apiEndpoint || this.API_ENDPOINT}/${id}`);
      return response.data.bill || response.data;
    } catch (error) {
      console.error(`Error fetching bill ${id}:`, error);
      return null;
    }
  }

  async createBill(billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bill> {
    const totals = this.calculateBillTotals(billData);
    const newBill: Bill = {
      id: this.generateId(),
      billNumber: billData.billNumber || this.generateBillNumber(),
      ...billData,
      ...totals,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Try to create via API first
      const response = await this.httpClient.post<any>(
        this.config.apiEndpoint || this.API_ENDPOINT,
        newBill
      );
      const createdBill = response.data.bill || response.data;

      // Update local cache
      await this.addToCache(createdBill);

      return createdBill;
    } catch (error: any) {
      console.error('Error creating bill via API:', error);

      // Fallback to local storage if offline mode is enabled
      // BUT only if it is a true network error (no response from server).
      // A 5xx error means the server was reached but failed (e.g. DB constraint).
      const isNetworkError = !error.response && !error.status;

      if (this.config.enableOfflineMode && isNetworkError) {
        console.warn('Creating bill locally due to network error');
        await this.addToCache(newBill);
        return newBill;
      }

      // If it's a server/client error, we throw it up strictly!
      throw error;
    }
  }

  async updateBill(bill: Bill): Promise<Bill> {
    const totals = this.calculateBillTotals(bill);
    const updatedBill: Bill = {
      ...bill,
      ...totals,
      updatedAt: new Date().toISOString()
    };

    try {
      // Try to update via API first
      const response = await this.httpClient.put<any>(
        `${this.config.apiEndpoint || this.API_ENDPOINT}/${bill.id}`,
        updatedBill
      );
      const apiBill = response.data.bill || response.data;

      // Invalidate the cache completely so the next fetch gets a fresh list
      await this.storage.remove(this.STORAGE_KEY);

      return apiBill;
    } catch (error: any) {
      console.error('Error updating bill via API:', error);

      // Only fall back to local cache on genuine network/offline errors (not 4xx/5xx backend errors)
      const isNetworkError = !error.status && !error.response;
      if (this.config.enableOfflineMode && isNetworkError) {
        console.warn('Updating bill locally due to network error');
        await this.updateInCache(updatedBill);
        return updatedBill;
      }

      throw error; // Re-throw the real backend error so the UI can display it
    }
  }

  async deleteBill(id: string): Promise<void> {
    try {
      // Delete via API first
      await this.httpClient.delete(`${this.config.apiEndpoint || this.API_ENDPOINT}/${id}`);

      // Invalidate the ENTIRE local cache to ensure the next fetch is totally fresh
      await this.storage.remove(this.STORAGE_KEY);

    } catch (error: any) {
      console.error('Error deleting bill via API:', error);

      const isNetworkError = !error.status && !error.response;
      if (this.config.enableOfflineMode && isNetworkError) {
        console.warn('Deleting bill locally due to network error');
        await this.removeFromCache(id);
        return;
      }

      throw error; // Propagate real backend errors
    }
  }

  async getAllBillIds(filters: { search?: string; status?: string; customerId?: string; dateFilter?: string } = {}): Promise<string[]> {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.customerId) params.append('customerId', filters.customerId);
      if (filters.dateFilter) params.append('dateFilter', filters.dateFilter);

      const response = await this.httpClient.get<{ ids: string[] }>(`${this.config.apiEndpoint || this.API_ENDPOINT}/all-ids?${params.toString()}`);
      return response.data.ids || [];
    } catch (error) {
      console.error('Error fetching all bill IDs:', error);
      throw new Error('Failed to fetch bill IDs');
    }
  }

  async deleteBills(ids: string[]): Promise<void> {
    try {
      await this.httpClient.post(`${this.config.apiEndpoint || this.API_ENDPOINT}/delete`, { ids });
      await this.storage.remove(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error deleting multiple bills:', error);
      throw error;
    }
  }

  async searchBills(query: string): Promise<Bill[]> {
    try {
      // Try API search first
      const response = await this.httpClient.get<Bill[]>(
        `${this.config.apiEndpoint || this.API_ENDPOINT}/search?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error) {
      console.error('Error searching bills via API:', error);

      // Fallback to local search
      const bills = await this.getBillArray();
      const lowercaseQuery = query.toLowerCase();

      return bills.filter((bill: Bill) =>
        bill.billNumber?.toLowerCase().includes(lowercaseQuery) ||
        bill.customerName.toLowerCase().includes(lowercaseQuery) ||
        bill.customerEmail?.toLowerCase().includes(lowercaseQuery) ||
        bill.id.includes(query)
      );
    }
  }

  async exportBills(format: 'json' | 'csv' | 'pdf'): Promise<Blob> {
    const bills = await this.getBillArray();

    if (format === 'json') {
      const json = JSON.stringify(bills, null, 2);
      return new Blob([json], { type: 'application/json' });
    } else if (format === 'csv') {
      const csv = this.convertToCSV(bills);
      return new Blob([csv], { type: 'text/csv' });
    } else {
      // PDF export would require a PDF library like jsPDF
      const json = JSON.stringify(bills, null, 2);
      return new Blob([json], { type: 'application/json' });
    }
  }

  async getBillsByStatus(status: Bill['status']): Promise<Bill[]> {
    const bills = await this.getBillArray();
    return bills.filter((bill: Bill) => bill.status === status);
  }

  async getBillsByCustomer(customerId: string): Promise<Bill[]> {
    const bills = await this.getBillArray();
    return bills.filter((bill: Bill) => bill.customerId === customerId);
  }

  async getOverdueBills(): Promise<Bill[]> {
    const bills = await this.getBillArray();
    const now = new Date();

    return bills.filter((bill: Bill) =>
      bill.status !== 'Paid' &&
      new Date(bill.dueDate) < now
    );
  }

  async markBillAsPaid(id: string): Promise<Bill> {
    const bill = await this.getBillById(id);
    if (!bill) {
      throw new Error('Bill not found');
    }

    return this.updateBill({
      ...bill,
      status: 'Paid'
    });
  }

  generateBillNumber(): string {
    const prefix = this.config.billNumberPrefix || 'INV';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  calculateBillTotals(bill: Partial<Bill>): { subtotal: number; taxAmount: number; totalAmount: number } {
    if (!bill.items || bill.items.length === 0) {
      return { subtotal: 0, taxAmount: 0, totalAmount: 0 };
    }

    // Subtotal: sum of all line-item totals (price × qty)
    const subtotal = bill.items.reduce((sum, item) => sum + item.total, 0);

    // Tax: sum per product using its individual taxRate (%).
    // taxRate is captured from the product at the time the item is added.
    // If taxAmount is already present on the bill (e.g. returned from API), use that.
    const taxAmount = (bill as any).taxAmount !== undefined
      ? Number((bill as any).taxAmount)
      : bill.items.reduce((sum, item) => {
        const rate = (item as any).taxRate ?? 0;
        return sum + (item.total * rate) / 100;
      }, 0);

    const totalAmount = subtotal + taxAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  }

  // Private helper methods

  private generateId(): string {
    return `bill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isCacheValid(cachedData: any): boolean {
    if (!this.config.cacheTimeout) return true;

    // Simple cache validation - in production, you'd want more sophisticated logic
    const cacheTimestamp = cachedData._timestamp;
    if (!cacheTimestamp) return false;

    return Date.now() - cacheTimestamp < this.config.cacheTimeout;
  }

  private async addToCache(bill: Bill): Promise<void> {
    const bills = await this.storage.get<Bill[]>(this.STORAGE_KEY) || [];
    const updatedBills = [bill, ...bills];
    await this.storage.set(this.STORAGE_KEY, updatedBills);
  }

  private async updateInCache(bill: Bill): Promise<void> {
    const bills = await this.storage.get<Bill[]>(this.STORAGE_KEY) || [];
    const updatedBills = bills.map(b => b.id === bill.id ? bill : b);
    await this.storage.set(this.STORAGE_KEY, updatedBills);
  }

  private async removeFromCache(id: string): Promise<void> {
    const bills = await this.storage.get<Bill[]>(this.STORAGE_KEY) || [];
    const updatedBills = bills.filter(b => b.id !== id);
    await this.storage.set(this.STORAGE_KEY, updatedBills);
  }

  private convertToCSV(bills: Bill[]): string {
    const headers = ['ID', 'Bill Number', 'Customer Name', 'Customer Email', 'Status', 'Subtotal', 'Tax Amount', 'Total Amount', 'Due Date', 'Created At'];
    const rows = bills.map(bill => [
      bill.id,
      bill.billNumber || '',
      bill.customerName,
      bill.customerEmail || '',
      bill.status,
      bill.subtotal.toString(),
      bill.taxAmount.toString(),
      bill.totalAmount.toString(),
      bill.dueDate,
      bill.createdAt
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  async getBillStats(): Promise<{ totalCount: number, totalRevenue: number }> {
    try {
      const response = await this.httpClient.get<{ totalCount: number, totalRevenue: number }>(`${this.API_ENDPOINT}/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to get bill stats:', error);
      return { totalCount: 0, totalRevenue: 0 };
    }
  }
}

// Legacy exports for backward compatibility
export const createBill = async (bill: Bill): Promise<Bill> => {
  console.warn('Deprecated: Use BillService.createBill instead');
  throw new Error('Use BillService with dependency injection instead');
};

export const fetchBills = async (): Promise<Bill[]> => {
  console.warn('Deprecated: Use BillService.getBills instead');
  throw new Error('Use BillService with dependency injection instead');
};

export const deleteBill = async (billId: string): Promise<void> => {
  console.warn('Deprecated: Use BillService.deleteBill instead');
  throw new Error('Use BillService with dependency injection instead');
};

export const fetchBillById = async (billId: string): Promise<Bill> => {
  console.warn('Deprecated: Use BillService.getBillById instead');
  throw new Error('Use BillService with dependency injection instead');
};
