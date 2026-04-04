// Unified Bill Template System with Industry Column Suggestions

export interface IndustryCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  suggestedColumns: IndustryColumnSuggestion[];
}

export interface IndustryColumnSuggestion {
  id: string;
  name: string;
  displayName: string;
  type: FieldType;
  description: string;
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  category: 'customer' | 'item' | 'billing' | 'payment' | 'custom';
}

export interface UnifiedTemplate {
  id: string;
  name: string;
  displayName: string;
  complexity: TemplateComplexity;
  description: string;
  fieldCount: number;
  features: string[];
  baseFields: BillTemplateField[];
  layout: TemplateLayout;
  calculations: CalculationRule[];
  pricing: 'free' | 'premium';
}

export enum TemplateComplexity {
  EASY = 'easy',
  BETTER = 'better', 
  COMPLEX = 'complex',
  DETAILED = 'detailed'
}

export interface BillTemplateField {
  id: string;
  name: string;
  displayName: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  validation?: FieldValidation;
  visibility?: FieldVisibility;
  section?: string;
  order: number;
  dependsOn?: string[];
  calculation?: FieldCalculation;
}

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage',
  DATE = 'date',
  DROPDOWN = 'dropdown',
  CHECKBOX = 'checkbox',
  TEXTAREA = 'textarea',
  PHONE = 'phone',
  EMAIL = 'email',
  ADDRESS = 'address',
  CALCULATED = 'calculated'
}

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  errorMessage?: string;
  customValidator?: string;
}

export interface FieldVisibility {
  condition?: string;
  dependentFields?: string[];
  showWhen?: 'always' | 'conditional' | 'admin_only';
}

export interface FieldCalculation {
  formula: string;
  dependencies: string[];
  format?: 'currency' | 'percentage' | 'number';
  roundTo?: number;
}

export interface CalculationRule {
  id: string;
  name: string;
  type: 'tax' | 'discount' | 'fee' | 'subtotal' | 'total';
  formula: string;
  conditions?: string[];
  order: number;
  appliesTo: string[];
}

export interface BillTemplate {
  id: string;
  name: string;
  displayName: string;
  industryId: string;
  complexity: TemplateComplexity;
  description: string;
  fields: BillTemplateField[];
  calculations: CalculationRule[];
  layout: TemplateLayout;
  customizations: TemplateCustomization;
  metadata: TemplateMetadata;
}

export interface TemplateLayout {
  sections: LayoutSection[];
  header: HeaderConfig;
  footer: FooterConfig;
  styling: LayoutStyling;
}

export interface LayoutSection {
  id: string;
  name: string;
  title: string;
  order: number;
  columns: number;
  fields: string[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface HeaderConfig {
  showLogo: boolean;
  showCompanyInfo: boolean;
  showInvoiceNumber: boolean;
  showDate: boolean;
  customFields: string[];
}

export interface FooterConfig {
  showTerms: boolean;
  showSignature: boolean;
  showTotals: boolean;
  customText?: string;
  customFields: string[];
}

export interface LayoutStyling {
  colorScheme: 'blue' | 'green' | 'gray' | 'red' | 'purple';
  fontFamily: 'inter' | 'roboto' | 'open-sans' | 'lato';
  fontSize: 'small' | 'medium' | 'large';
  spacing: 'compact' | 'normal' | 'spacious';
}

export interface TemplateCustomization {
  allowFieldModification: boolean;
  allowLayoutChange: boolean;
  allowCalculationEdit: boolean;
  restrictedFields: string[];
  mandatoryFields: string[];
}

export interface TemplateMetadata {
  createdAt: Date;
  updatedAt: Date;
  version: string;
  createdBy: string;
  tags: string[];
  isActive: boolean;
  usageCount: number;
  rating?: number;
  reviews?: TemplateReview[];
}

export interface TemplateReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface BillPreview {
  templateId: string;
  companyInfo: CompanyInfo;
  customerInfo: CustomerInfo;
  invoiceDetails: InvoiceDetails;
  items: InvoiceItem[];
  calculations: InvoiceCalculations;
  additionalInfo: AdditionalInfo;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  taxId?: string;
}

export interface CustomerInfo {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  taxId?: string;
}

export interface InvoiceDetails {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  poNumber?: string;
  currency: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate?: number;
  discount?: number;
  unit?: string;
  category?: string;
}

export interface InvoiceCalculations {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  paidAmount?: number;
  balanceAmount?: number;
}

export interface AdditionalInfo {
  notes?: string;
  terms?: string;
  paymentMethods?: string[];
  bankDetails?: string;
  signature?: string;
}

// Industry-specific column suggestions
export const INDUSTRY_CATEGORIES: IndustryCategory[] = [
  {
    id: 'retail',
    name: 'retail',
    displayName: 'Retail & E-commerce',
    description: 'Perfect for retail stores, online shops, and e-commerce businesses',
    icon: 'StorefrontIcon',
    suggestedColumns: [
      {
        id: 'sku',
        name: 'sku',
        displayName: 'SKU/Product Code',
        type: FieldType.TEXT,
        description: 'Stock Keeping Unit for inventory tracking',
        required: false,
        placeholder: 'PROD-001',
        category: 'item'
      },
      {
        id: 'barcode',
        name: 'barcode',
        displayName: 'Barcode',
        type: FieldType.TEXT,
        description: 'Product barcode for scanning',
        required: false,
        category: 'item'
      },
      {
        id: 'warranty',
        name: 'warranty',
        displayName: 'Warranty Period',
        type: FieldType.TEXT,
        description: 'Product warranty information',
        required: false,
        placeholder: '1 Year',
        category: 'item'
      },
      {
        id: 'brand',
        name: 'brand',
        displayName: 'Brand',
        type: FieldType.TEXT,
        description: 'Product brand name',
        required: false,
        category: 'item'
      },
      {
        id: 'returnPolicy',
        name: 'returnPolicy',
        displayName: 'Return Policy',
        type: FieldType.TEXT,
        description: 'Return policy details',
        required: false,
        placeholder: '30 days return',
        category: 'custom'
      }
    ]
  },
  {
    id: 'it_services',
    name: 'it_services',
    displayName: 'IT Services & Software',
    description: 'Ideal for software companies, IT consultancies, and tech services',
    icon: 'ComputerDesktopIcon',
    suggestedColumns: [
      {
        id: 'hoursWorked',
        name: 'hoursWorked',
        displayName: 'Hours Worked',
        type: FieldType.NUMBER,
        description: 'Number of hours worked on the project',
        required: false,
        placeholder: '40',
        category: 'item'
      },
      {
        id: 'hourlyRate',
        name: 'hourlyRate',
        displayName: 'Hourly Rate',
        type: FieldType.CURRENCY,
        description: 'Rate per hour',
        required: false,
        placeholder: '50.00',
        category: 'item'
      },
      {
        id: 'projectPhase',
        name: 'projectPhase',
        displayName: 'Project Phase',
        type: FieldType.TEXT,
        description: 'Current project phase or milestone',
        required: false,
        placeholder: 'Development Phase 1',
        category: 'item'
      },
      {
        id: 'technologyStack',
        name: 'technologyStack',
        displayName: 'Technology Stack',
        type: FieldType.TEXT,
        description: 'Technologies used in the project',
        required: false,
        placeholder: 'React, Node.js',
        category: 'item'
      },
      {
        id: 'licenseType',
        name: 'licenseType',
        displayName: 'License Type',
        type: FieldType.TEXT,
        description: 'Software license type',
        required: false,
        placeholder: 'Annual License',
        category: 'custom'
      }
    ]
  },
  {
    id: 'healthcare',
    name: 'healthcare',
    displayName: 'Healthcare & Medical',
    description: 'Designed for hospitals, clinics, and medical practitioners',
    icon: 'HeartIcon',
    suggestedColumns: [
      {
        id: 'patientId',
        name: 'patientId',
        displayName: 'Patient ID',
        type: FieldType.TEXT,
        description: 'Unique patient identifier',
        required: false,
        placeholder: 'PAT-12345',
        category: 'customer'
      },
      {
        id: 'treatmentDate',
        name: 'treatmentDate',
        displayName: 'Treatment Date',
        type: FieldType.DATE,
        description: 'Date of treatment or service',
        required: false,
        category: 'item'
      },
      {
        id: 'diagnosis',
        name: 'diagnosis',
        displayName: 'Diagnosis Code',
        type: FieldType.TEXT,
        description: 'Medical diagnosis or procedure code',
        required: false,
        placeholder: 'ICD-10: Z00.00',
        category: 'item'
      },
      {
        id: 'physician',
        name: 'physician',
        displayName: 'Attending Physician',
        type: FieldType.TEXT,
        description: 'Name of the attending physician',
        required: false,
        placeholder: 'Dr. Smith',
        category: 'custom'
      },
      {
        id: 'insuranceProvider',
        name: 'insuranceProvider',
        displayName: 'Insurance Provider',
        type: FieldType.TEXT,
        description: 'Patient insurance company',
        required: false,
        category: 'customer'
      }
    ]
  },
  {
    id: 'consulting',
    name: 'consulting',
    displayName: 'Consulting & Professional Services',
    description: 'Perfect for consultants, lawyers, and professional services',
    icon: 'BriefcaseIcon',
    suggestedColumns: [
      {
        id: 'consultationDate',
        name: 'consultationDate',
        displayName: 'Consultation Date',
        type: FieldType.DATE,
        description: 'Date of consultation or service',
        required: false,
        category: 'item'
      },
      {
        id: 'caseNumber',
        name: 'caseNumber',
        displayName: 'Case/Matter Number',
        type: FieldType.TEXT,
        description: 'Legal case or matter reference',
        required: false,
        placeholder: 'CASE-2024-001',
        category: 'custom'
      },
      {
        id: 'practiceArea',
        name: 'practiceArea',
        displayName: 'Practice Area',
        type: FieldType.TEXT,
        description: 'Area of legal or consulting practice',
        required: false,
        placeholder: 'Corporate Law',
        category: 'item'
      },
      {
        id: 'retainerAmount',
        name: 'retainerAmount',
        displayName: 'Retainer Amount',
        type: FieldType.CURRENCY,
        description: 'Retainer fee amount',
        required: false,
        category: 'payment'
      }
    ]
  },
  {
    id: 'general',
    name: 'general',
    displayName: 'General Business',
    description: 'Universal template suitable for any business type',
    icon: 'BuildingOffice2Icon',
    suggestedColumns: [
      {
        id: 'department',
        name: 'department',
        displayName: 'Department',
        type: FieldType.TEXT,
        description: 'Business department or division',
        required: false,
        category: 'custom'
      },
      {
        id: 'reference',
        name: 'reference',
        displayName: 'Reference Number',
        type: FieldType.TEXT,
        description: 'Internal reference number',
        required: false,
        category: 'custom'
      },
      {
        id: 'location',
        name: 'location',
        displayName: 'Service Location',
        type: FieldType.TEXT,
        description: 'Location where service was provided',
        required: false,
        category: 'item'
      }
    ]
  }
];

// Unified Template Definitions
export const UNIFIED_TEMPLATES: Record<TemplateComplexity, UnifiedTemplate> = {
  [TemplateComplexity.EASY]: {
    id: 'easy-template',
    name: 'Easy Invoice',
    displayName: 'Easy Invoice Template',
    complexity: TemplateComplexity.EASY,
    description: 'Simple invoice with essential fields only',
    fieldCount: 8,
    features: ['Basic customer info', 'Simple item list', 'Basic totals', 'Invoice number & date'],
    baseFields: [],
    layout: {} as TemplateLayout,
    calculations: [],
    pricing: 'free'
  },
  [TemplateComplexity.BETTER]: {
    id: 'better-template',
    name: 'Better Invoice',
    displayName: 'Better Invoice Template',
    complexity: TemplateComplexity.BETTER,
    description: 'Enhanced invoice with additional business details',
    fieldCount: 15,
    features: ['Enhanced customer details', 'Item descriptions', 'Tax calculations', 'Payment terms', 'Due dates'],
    baseFields: [],
    layout: {} as TemplateLayout,
    calculations: [],
    pricing: 'free'
  },
  [TemplateComplexity.COMPLEX]: {
    id: 'complex-template',
    name: 'Complex Invoice',
    displayName: 'Complex Invoice Template',
    complexity: TemplateComplexity.COMPLEX,
    description: 'Advanced invoice with comprehensive business features',
    fieldCount: 25,
    features: ['Multiple tax rates', 'Discounts', 'Shipping details', 'Custom fields', 'Advanced calculations', 'Project tracking'],
    baseFields: [],
    layout: {} as TemplateLayout,
    calculations: [],
    pricing: 'premium'
  },
  [TemplateComplexity.DETAILED]: {
    id: 'detailed-template',
    name: 'Detailed Invoice',
    displayName: 'Detailed Professional Invoice',
    complexity: TemplateComplexity.DETAILED,
    description: 'Professional invoice with all advanced features',
    fieldCount: 35,
    features: ['Multi-currency', 'Multiple addresses', 'Project tracking', 'Time tracking', 'Advanced reporting', 'Custom branding', 'Digital signatures'],
    baseFields: [],
    layout: {} as TemplateLayout,
    calculations: [],
    pricing: 'premium'
  }
};

// Unified Template Selection Interface
export interface UnifiedTemplateSelection {
  templateComplexity: TemplateComplexity;
  selectedIndustry?: string;
  customFields?: string[];
  selectedColumns?: string[];
  timestamp: string;
}
