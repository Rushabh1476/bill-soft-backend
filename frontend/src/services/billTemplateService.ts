/* eslint-disable */
import {
  IndustryCategory,
  TemplateComplexity,
  UnifiedTemplate,
  BillTemplateField,
  FieldType,
  UnifiedTemplateSelection,
  BillPreview,
  INDUSTRY_CATEGORIES
} from '../types/billTemplate';

class BillTemplateService {
  private industries: IndustryCategory[] = [];
  private templates: UnifiedTemplate[] = [];
  private userSelections: Map<string, UnifiedTemplateSelection> = new Map();

  constructor() {
    this.initializeTemplates();
    this.initializeIndustries();
  }

  // Get available template complexities
  getTemplateComplexities(): TemplateComplexity[] {
    return Object.values(TemplateComplexity);
  }

  // Get template by complexity
  getTemplateByComplexity(complexity: TemplateComplexity): UnifiedTemplate | undefined {
    return this.templates.find(template => template.complexity === complexity);
  }

  // Get all available templates
  getAllTemplates(): UnifiedTemplate[] {
    return this.templates;
  }

  // Get industry suggestions
  getIndustryById(industryId: string): IndustryCategory | undefined {
    return this.industries.find(industry => industry.id === industryId);
  }

  getAllIndustries(): IndustryCategory[] {
    return this.industries;
  }

  // Template selection management
  saveTemplateSelection(userId: string, selection: UnifiedTemplateSelection): void {
    this.userSelections.set(userId, selection);
  }

  getTemplateSelection(userId: string): UnifiedTemplateSelection | undefined {
    return this.userSelections.get(userId);
  }

  // Generate bill preview
  generateBillPreview(
    selection: UnifiedTemplateSelection,
    billData?: Partial<BillPreview>
  ): BillPreview {
    const template = this.getTemplateByComplexity(selection.templateComplexity);
    
    // Create a sample bill preview
    return {
      templateId: template?.id || 'default',
      companyInfo: billData?.companyInfo || {
        name: 'Your Company Name',
        address: 'Company Address',
        phone: '+1 234 567 8900',
        email: 'contact@company.com',
        website: 'www.company.com',
        taxId: 'TAX123456'
      },
      customerInfo: billData?.customerInfo || {
        name: 'Customer Name',
        address: 'Customer Address',
        phone: '+1 234 567 8901',
        email: 'customer@email.com',
        taxId: 'CUSTOMER_TAX'
      },
      invoiceDetails: billData?.invoiceDetails || {
        invoiceNumber: 'INV-001',
        invoiceDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        poNumber: 'PO-001',
        currency: 'USD'
      },
      items: billData?.items || [
        {
          description: 'Sample Item',
          quantity: 1,
          rate: 100,
          amount: 100,
          taxRate: 10,
          unit: 'piece',
          category: 'product'
        }
      ],
      calculations: billData?.calculations || {
        subtotal: 100,
        taxAmount: 10,
        discountAmount: 0,
        shippingAmount: 0,
        totalAmount: 110,
        paidAmount: 0,
        balanceAmount: 110
      },
      additionalInfo: billData?.additionalInfo || {
        notes: 'Thank you for your business!',
        terms: 'Payment due within 30 days.',
        paymentMethods: ['Bank Transfer', 'Credit Card'],
        bankDetails: 'Bank details here',
        signature: 'Authorized Signature'
      }
    };
  }

  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'easy-template',
        name: 'easy',
        displayName: 'Easy Template',
        complexity: TemplateComplexity.EASY,
        description: 'Simple template with basic fields',
        fieldCount: 8,
        features: ['Basic Info', 'Simple Layout', 'Essential Fields'],
        baseFields: this.getBaseFieldsForComplexity(TemplateComplexity.EASY),
        layout: {
          sections: [
            { id: 'main', name: 'main', title: 'Main', order: 1, columns: 1, fields: [] }
          ],
          header: { 
            showLogo: true, 
            showDate: true, 
            showInvoiceNumber: true, 
            showCompanyInfo: true, 
            customFields: [] 
          },
          footer: { 
            showTerms: true, 
            showSignature: true, 
            showTotals: true, 
            customFields: [] 
          },
          styling: { 
            colorScheme: 'gray', 
            fontFamily: 'inter', 
            fontSize: 'medium', 
            spacing: 'normal'
          }
        },
        calculations: [],
        pricing: 'free'
      },
      {
        id: 'better-template',
        name: 'better',
        displayName: 'Better Template',
        complexity: TemplateComplexity.BETTER,
        description: 'Enhanced template with more features',
        fieldCount: 12,
        features: ['Enhanced Layout', 'Tax Calculations', 'Customer Details'],
        baseFields: this.getBaseFieldsForComplexity(TemplateComplexity.BETTER),
        layout: {
          sections: [
            { id: 'main', name: 'main', title: 'Main', order: 1, columns: 2, fields: [] }
          ],
          header: { 
            showLogo: true, 
            showDate: true, 
            showInvoiceNumber: true, 
            showCompanyInfo: true, 
            customFields: [] 
          },
          footer: { 
            showTerms: true, 
            showSignature: true, 
            showTotals: true, 
            customFields: [] 
          },
          styling: { 
            colorScheme: 'blue', 
            fontFamily: 'roboto', 
            fontSize: 'medium', 
            spacing: 'normal'
          }
        },
        calculations: [],
        pricing: 'free'
      },
      {
        id: 'complex-template',
        name: 'complex',
        displayName: 'Complex Template',
        complexity: TemplateComplexity.COMPLEX,
        description: 'Advanced template with comprehensive features',
        fieldCount: 18,
        features: ['Advanced Layout', 'Multiple Tax Rates', 'Discounts', 'Shipping'],
        baseFields: this.getBaseFieldsForComplexity(TemplateComplexity.COMPLEX),
        layout: {
          sections: [
            { id: 'main', name: 'main', title: 'Main', order: 1, columns: 2, fields: [] }
          ],
          header: { 
            showLogo: true, 
            showDate: true, 
            showInvoiceNumber: true, 
            showCompanyInfo: true, 
            customFields: [] 
          },
          footer: { 
            showTerms: true, 
            showSignature: true, 
            showTotals: true, 
            customFields: [] 
          },
          styling: { 
            colorScheme: 'blue', 
            fontFamily: 'roboto', 
            fontSize: 'large', 
            spacing: 'spacious'
          }
        },
        calculations: [],
        pricing: 'premium'
      },
      {
        id: 'detailed-template',
        name: 'detailed',
        displayName: 'Detailed Template',
        complexity: TemplateComplexity.DETAILED,
        description: 'Most comprehensive template with all features',
        fieldCount: 25,
        features: ['Professional Layout', 'Multi-Currency', 'Advanced Calculations', 'Custom Fields'],
        baseFields: this.getBaseFieldsForComplexity(TemplateComplexity.DETAILED),
        layout: {
          sections: [
            { id: 'main', name: 'main', title: 'Main', order: 1, columns: 3, fields: [] }
          ],
          header: { 
            showLogo: true, 
            showDate: true, 
            showInvoiceNumber: true, 
            showCompanyInfo: true, 
            customFields: ['Custom Header'] 
          },
          footer: { 
            showTerms: true, 
            showSignature: true, 
            showTotals: true, 
            customFields: ['Custom Footer'],
            customText: 'Professional Invoice - Thank you for your business'
          },
          styling: { 
            colorScheme: 'purple', 
            fontFamily: 'lato', 
            fontSize: 'large', 
            spacing: 'spacious'
          }
        },
        calculations: [],
        pricing: 'premium'
      }
    ];
  }

  private getBaseFieldsForComplexity(complexity: TemplateComplexity): BillTemplateField[] {
    // Return simplified base fields for each complexity level
    const baseFields: BillTemplateField[] = [
      {
        id: 'company_name',
        name: 'companyName',
        displayName: 'Company Name',
        type: FieldType.TEXT,
        required: true,
        section: 'company',
        order: 1
      },
      {
        id: 'customer_name',
        name: 'customerName',
        displayName: 'Customer Name',
        type: FieldType.TEXT,
        required: true,
        section: 'customer',
        order: 2
      }
    ];

    return baseFields;
  }

  private initializeIndustries(): void {
    this.industries = INDUSTRY_CATEGORIES;
  }
}

export default new BillTemplateService();
