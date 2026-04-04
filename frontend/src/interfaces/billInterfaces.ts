import { Bill } from '../types/bill';

/**
 * Interface for basic CRUD operations on bills
 * Follows Interface Segregation Principle - only essential CRUD operations
 */
export interface IBillCrudOperations {
  getBills(): Promise<Bill[]>;
  getBillById(id: string): Promise<Bill | null>;
  createBill(bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bill>;
  updateBill(bill: Bill): Promise<Bill>;
  deleteBill(id: string): Promise<void>;
}

/**
 * Interface for bill search and filtering operations
 * Separated from CRUD to allow different search implementations
 */
export interface IBillSearchOperations {
  searchBills(query: string): Promise<Bill[]>;
  searchByCustomer(customerId: string): Promise<Bill[]>;
  searchByDateRange(startDate: Date, endDate: Date): Promise<Bill[]>;
  searchByStatus(status: 'paid' | 'pending' | 'overdue'): Promise<Bill[]>;
  searchByAmountRange(minAmount: number, maxAmount: number): Promise<Bill[]>;
}

/**
 * Interface for bill export and reporting operations
 * Separated to allow different export implementations
 */
export interface IBillExportOperations {
  exportBills(format: 'json' | 'csv' | 'excel'): Promise<Blob>;
  exportFilteredBills(bills: Bill[], format: 'json' | 'csv' | 'excel'): Promise<Blob>;
  generateSalesReport(startDate: Date, endDate: Date): Promise<Blob>;
  generateCustomerStatement(customerId: string): Promise<Blob>;
  generateTaxReport(year: number): Promise<Blob>;
}

/**
 * Interface for bill PDF generation operations
 * Separated for components that only need PDF functionality
 */
export interface IBillPDFOperations {
  generateBillPDF(billId: string): Promise<Blob>;
  generateBillPreview(billId: string): Promise<string>; // HTML preview
  customizePDFTemplate(template: string): Promise<void>;
  getBillPDFUrl(billId: string): Promise<string>;
}

/**
 * Interface for bill payment operations
 * Separated for payment-specific functionality
 */
export interface IBillPaymentOperations {
  markAsPaid(billId: string, paymentDate: Date, paymentMethod?: string): Promise<Bill>;
  markAsPending(billId: string): Promise<Bill>;
  markAsOverdue(billId: string): Promise<Bill>;
  addPayment(billId: string, amount: number, paymentDate: Date): Promise<Bill>;
  getPaymentHistory(billId: string): Promise<any[]>;
}

/**
 * Interface for bill calculation operations
 * Separated for components that only need calculations
 */
export interface IBillCalculationOperations {
  calculateSubtotal(billId: string): Promise<number>;
  calculateTax(billId: string): Promise<number>;
  calculateTotal(billId: string): Promise<number>;
  calculateDiscount(billId: string): Promise<number>;
  applyDiscount(billId: string, discountPercentage: number): Promise<Bill>;
  recalculateBill(billId: string): Promise<Bill>;
}

/**
 * Interface for bill validation operations
 * Separated to allow different validation strategies
 */
export interface IBillValidationOperations {
  validateBillData(bill: Partial<Bill>): Promise<string[]>;
  validateBillItems(items: any[]): Promise<string[]>;
  validateCustomerExists(customerId: string): Promise<boolean>;
  validateProductsExist(productIds: string[]): Promise<boolean>;
}

/**
 * Combined interface for full bill service functionality
 * Clients can depend on only the interfaces they need
 */
export interface IBillService extends 
  IBillCrudOperations,
  IBillSearchOperations,
  IBillExportOperations {
  // Full service interface - most components will use this
  // But specific components can depend on just the segregated interfaces
}
