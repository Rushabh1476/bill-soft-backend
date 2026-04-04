import { Bill } from '../types/bill';
import { StorageProvider } from '../interfaces/storage';
import { HttpClient } from '../interfaces/http';

/**
 * Bill service interface defining the contract for bill operations
 * Follows Interface Segregation Principle
 */
export interface IBillService {
  getBills(): Promise<Bill[]>;
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
      defaultTaxRate: 0, // Tax is now per-product, not a global flat rate
      ...config
    };
  }

  async getBills(): Promise<Bill[]> {
    try {
      // Try to get from cache first
      const cachedBills = await this.storage.get<Bill[]>(this.STORAGE_KEY);

      if (cachedBills && this.isCacheValid(cachedBills)) {
        return cachedBills;
      }

      // Fetch from API
      const response = await this.httpClient.get<any>(this.config.apiEndpoint || this.API_ENDPOINT);
      const bills = response.data.bills || response.data;

      // Update cache
      if (Array.isArray(bills)) {
        await this.storage.set(this.STORAGE_KEY, bills);
        return bills;
      }
      return [];
    } catch (error) {
      console.error('Error fetching bills:', error);

      // Fallback to cache if offline mode is enabled
      if (this.config.enableOfflineMode) {
        const cachedBills = await this.storage.get<Bill[]>(this.STORAGE_KEY);
        if (cachedBills) {
          console.warn('Using cached bills due to network error');
          return cachedBills;
        }
      }

      throw new Error('Failed to fetch bills');
    }
  }

  async getBillById(id: string): Promise<Bill | null> {
    try {
      // First check local cache
      const bills = await this.getBills();
      const bill = bills.find(b => b.id === id);

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
    } catch (error) {
      console.error('Error creating bill via API:', error);

      // Fallback to local storage if offline mode is enabled
      // BUT only if it's not a 4xx error (client error/validation error)
      const isClientError = (error as any).status >= 400 && (error as any).status < 500;

      if (this.config.enableOfflineMode && !isClientError) {
        console.warn('Creating bill locally due to network error');
        await this.addToCache(newBill);
        return newBill;
      }

      throw new Error('Failed to create bill');
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

      // Update local cache
      await this.updateInCache(apiBill);

      return apiBill;
    } catch (error) {
      console.error('Error updating bill via API:', error);

      // Fallback to local storage if offline mode is enabled
      if (this.config.enableOfflineMode) {
        console.warn('Updating bill locally due to network error');
        await this.updateInCache(updatedBill);
        return updatedBill;
      }

      throw new Error('Failed to update bill');
    }
  }

  async deleteBill(id: string): Promise<void> {
    try {
      // Try to delete via API first
      await this.httpClient.delete(`${this.config.apiEndpoint || this.API_ENDPOINT}/${id}`);

      // Remove from local cache
      await this.removeFromCache(id);
    } catch (error) {
      console.error('Error deleting bill via API:', error);

      // Fallback to local storage if offline mode is enabled
      if (this.config.enableOfflineMode) {
        console.warn('Deleting bill locally due to network error');
        await this.removeFromCache(id);
        return;
      }

      throw new Error('Failed to delete bill');
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
      const bills = await this.getBills();
      const lowercaseQuery = query.toLowerCase();

      return bills.filter(bill =>
        bill.billNumber?.toLowerCase().includes(lowercaseQuery) ||
        bill.customerName.toLowerCase().includes(lowercaseQuery) ||
        bill.customerEmail?.toLowerCase().includes(lowercaseQuery) ||
        bill.id.includes(query)
      );
    }
  }

  async exportBills(format: 'json' | 'csv' | 'pdf'): Promise<Blob> {
    const bills = await this.getBills();

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
    const bills = await this.getBills();
    return bills.filter(bill => bill.status === status);
  }

  async getBillsByCustomer(customerId: string): Promise<Bill[]> {
    const bills = await this.getBills();
    return bills.filter(bill => bill.customerId === customerId);
  }

  async getOverdueBills(): Promise<Bill[]> {
    const bills = await this.getBills();
    const now = new Date();

    return bills.filter(bill =>
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

    // Subtotal is the sum of all item totals (price × qty)
    const subtotal = bill.items.reduce((sum, item) => sum + item.total, 0);

    // Tax is NOT applied here: it is computed server-side per product using
    // each product's taxRate stored in the database. If taxAmount is already
    // present on the bill object (returned by the API), use that.
    const taxAmount = (bill as any).taxAmount ?? 0;
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
    const updatedBills = [...bills, bill];
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
