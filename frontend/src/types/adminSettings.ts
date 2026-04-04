/**
 * Admin Settings Interfaces
 * Defines types for admin control functionality
 */

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  editable: boolean;
  required: boolean;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'email' | 'phone';
  validationRules?: {
    min?: number;
    max?: number;
    pattern?: string;
    required?: boolean;
  };
}

export interface ModuleConfig {
  moduleName: 'products' | 'customers' | 'bills';
  displayName: string;
  columns: ColumnConfig[];
  permissions: {
    view: string[];
    edit: string[];
    delete: string[];
    create: string[];
  };
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  modules: {
    [key: string]: {
      access: 'full' | 'read' | 'write' | 'none';
      restrictedFields?: string[];
    };
  };
}

export interface InvoiceNumberConfig {
  pattern: string;
  prefix: string;
  suffix: string;
  length: number;
  includeDate: boolean;
  dateFormat?: string;
  counter: number;
  examples: string[];
}

export interface AdminSettings {
  modules: ModuleConfig[];
  userRoles: UserRole[];
  invoiceNumberConfig: InvoiceNumberConfig;
  generalSettings: {
    companyName: string;
    defaultCurrency: string;
    defaultTaxRate: number;
    businessLogo?: string;
  };
}

export interface FieldAccessRule {
  fieldId: string;
  moduleName: string;
  roles: {
    [roleId: string]: {
      visible: boolean;
      editable: boolean;
    };
  };
}
