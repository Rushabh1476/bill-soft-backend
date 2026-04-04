import { Customer } from '../types/customer';

/**
 * Interface for basic CRUD operations on customers
 * Follows Interface Segregation Principle - only essential CRUD operations
 */
export interface ICustomerCrudOperations {
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | null>;
  createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer>;
  updateCustomer(customer: Customer): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
}

/**
 * Interface for customer search operations
 * Separated from CRUD to allow different implementations
 */
export interface ICustomerSearchOperations {
  searchCustomers(query: string): Promise<Customer[]>;
  searchByEmail(email: string): Promise<Customer | null>;
  searchByPhone(phone: string): Promise<Customer[]>;
  getActiveCustomers(): Promise<Customer[]>;
  getInactiveCustomers(): Promise<Customer[]>;
}

/**
 * Interface for customer export operations
 * Separated to allow different export implementations
 */
export interface ICustomerExportOperations {
  exportCustomers(format: 'json' | 'csv' | 'excel'): Promise<Blob>;
  exportFilteredCustomers(customers: Customer[], format: 'json' | 'csv' | 'excel'): Promise<Blob>;
  generateCustomerReport(customerId: string): Promise<Blob>;
}

/**
 * Interface for customer validation operations
 * Separated to allow different validation strategies
 */
export interface ICustomerValidationOperations {
  validateCustomerData(customer: Partial<Customer>): Promise<string[]>;
  validateEmail(email: string): boolean;
  validatePhone(phone: string): boolean;
  checkDuplicateEmail(email: string, excludeId?: string): Promise<boolean>;
}

/**
 * Interface for bulk operations on customers
 * Separated for clients that need bulk processing
 */
export interface ICustomerBulkOperations {
  bulkCreateCustomers(customers: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Customer[]>;
  bulkUpdateCustomers(customers: Customer[]): Promise<Customer[]>;
  bulkDeleteCustomers(ids: string[]): Promise<void>;
  importCustomersFromFile(file: File): Promise<Customer[]>;
}

/**
 * Combined interface for full customer service functionality
 * Clients can depend on only the interfaces they need
 */
export interface ICustomerService extends 
  ICustomerCrudOperations,
  ICustomerSearchOperations,
  ICustomerExportOperations {
  // Full service interface - most components will use this
  // But specific components can depend on just the segregated interfaces
}
