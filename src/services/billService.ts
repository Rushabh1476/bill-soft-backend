import { Bill } from '../types/bill';
import { StorageProvider } from '../interfaces/storage';
import { HttpClient } from '../interfaces/http';

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

export interface BillServiceConfig {
  enableOfflineMode?: boolean;
  apiEndpoint?: string;
  cacheTimeout?: number;
  billNumberPrefix?: string;
  defaultTaxRate?: number;
}

export class BillService implements IBillService {
  private readonly STORAGE_KEY = 'bills';
  private readonly API_ENDPOINT = '/api/bills';
  private config: BillServiceConfig;

  constructor(
    private storage: StorageProvider,
    private httpClient: HttpClient,
    config: BillServiceConfig = {}
  ) {
    this.config = {
      enableOfflineMode: true,
      apiEndpoint: '/api/bills',
      billNumberPrefix: 'INV',
      defaultTaxRate: 0.18,
      ...config,
    };
  }

  async getBills(): Promise<Bill[]> {
    try {
      const response = await this.httpClient.get<any>(this.config.apiEndpoint || this.API_ENDPOINT);
      // 🔥 Safety Check: Ensure we always have an array
      const bills = Array.isArray(response.data) ? response.data : (response.data?.bills || []);
      
      await this.storage.set(this.STORAGE_KEY, bills);
      return bills;
    } catch (error) {
      const cached = await this.storage.get<any>(this.STORAGE_KEY);
      return Array.isArray(cached) ? cached : [];
    }
  }

  async getBillById(id: string): Promise<Bill | null> {
    const bills = await this.getBills();
    return bills.find(b => b.id === id) || null;
  }

  async createBill(billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bill> {
    const totals = this.calculateBillTotals(billData);
    const newBill: Bill = {
      ...billData,
      id: this.generateId(),
      billNumber: billData.billNumber || this.generateBillNumber(),
      customerName: billData.customerName || 'Unknown',
      status: billData.status || 'Pending',
      ...totals,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // ✅ Database API Call
      const response = await this.httpClient.post<Bill>(this.config.apiEndpoint || this.API_ENDPOINT, newBill);
      const createdBill = response.data || newBill;

      // Update Local Cache
      const bills = await this.getBills();
      await this.storage.set(this.STORAGE_KEY, [...bills, createdBill]);
      
      return createdBill;
    } catch (error) {
      const bills = await this.getBills();
      await this.storage.set(this.STORAGE_KEY, [...bills, newBill]);
      return newBill;
    }
  }

  async updateBill(bill: Bill): Promise<Bill> {
    const totals = this.calculateBillTotals(bill);
    const updated = { ...bill, ...totals, updatedAt: new Date().toISOString() };

    try {
      await this.httpClient.put(`${this.config.apiEndpoint || this.API_ENDPOINT}/${bill.id}`, updated);
    } catch (e) { console.error('Update failed'); }

    const bills = await this.getBills();
    await this.storage.set(this.STORAGE_KEY, bills.map(b => (b.id === updated.id ? updated : b)));
    return updated;
  }

  async deleteBill(id: string): Promise<void> {
    try {
      await this.httpClient.delete(`${this.config.apiEndpoint || this.API_ENDPOINT}/${id}`);
    } catch (e) { console.error('Delete failed'); }

    const bills = await this.getBills();
    await this.storage.set(this.STORAGE_KEY, bills.filter(b => b.id !== id));
  }

  /* ===========================
     🔥 FIXED: toLowerCase SAFE SEARCH
     =========================== */
  async searchBills(query: string): Promise<Bill[]> {
    const bills = await this.getBills();
    const q = (query || '').toLowerCase();

    return bills.filter(b => {
      // ✅ Use || '' to prevent toLowerCase() on undefined properties
      const customerName = (b.customerName || '').toLowerCase();
      const billNumber = (b.billNumber || '').toLowerCase();
      const billId = (b.id || '').toLowerCase();
      
      return customerName.includes(q) || billNumber.includes(q) || billId.includes(q);
    });
  }

  async exportBills(format: 'json' | 'csv' | 'pdf'): Promise<Blob> {
    const bills = await this.getBills();
    return new Blob([JSON.stringify(bills, null, 2)], { type: 'application/json' });
  }

  async getBillsByStatus(status: Bill['status']): Promise<Bill[]> {
    const bills = await this.getBills();
    return bills.filter(b => b.status === status);
  }

  async getBillsByCustomer(customerId: string): Promise<Bill[]> {
    const bills = await this.getBills();
    return bills.filter(b => b.customerId === customerId);
  }

  async getOverdueBills(): Promise<Bill[]> {
    const bills = await this.getBills();
    const now = new Date();
    return bills.filter(b => b.status !== 'Paid' && new Date(b.dueDate) < now);
  }

  async markBillAsPaid(id: string): Promise<Bill> {
    const bill = await this.getBillById(id);
    if (!bill) throw new Error('Bill not found');
    return this.updateBill({ ...bill, status: 'Paid' });
  }

  generateBillNumber(): string {
    return `${this.config.billNumberPrefix || 'INV'}-${Date.now()}`;
  }

  calculateBillTotals(bill: Partial<Bill>) {
    const subtotal = bill.items?.reduce((s, i) => s + i.total, 0) || 0;
    const tax = subtotal * (this.config.defaultTaxRate || 0.18);
    return {
      subtotal,
      taxAmount: tax,
      totalAmount: subtotal + tax,
    };
  }

  private generateId(): string {
    return `bill-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}