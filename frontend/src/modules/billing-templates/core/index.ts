export type BillSize = '80mm' | '58mm' | '1/4 Size' | '1/5 Size' | '1/6 Size' | '1/7 Size' | '1/8 Size' | 'A4' | 'A5';

export interface TemplateField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'currency';
    required: boolean;
    visible: boolean;
    position: number;
    label?: string;
}

export interface CustomColumn {
    id: string;
    label: string;
    type: 'integer' | 'date' | 'text';
    required: boolean;
    capitalize?: boolean;
}

export interface TemplateSettings {
    logoPosition: 'top-left' | 'top-center' | 'top-right';
    colorScheme: string;
    fontFamily: string;
    fontSize: number;
    titleFontSize?: number;
    showBorder: boolean;
    billSize: BillSize;
    headerHeight: number;
    footerHeight: number;
    logoUrl?: string;
    activeColumns: string[];
    requiredColumns?: string[];
    customColumns?: CustomColumn[];
    columnLabels?: Record<string, string>;
    columnDataTypes?: Record<string, 'TEXT' | 'INTEGER' | 'DATE'>;
    columnCapitalized?: Record<string, boolean>;
    margins: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
}

export interface InvoiceTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    complexity: 'basic' | 'standard' | 'advanced';
    preview?: string;
    isDefault?: boolean;
    isFavorite?: boolean;
    tags: string[];
    fields: TemplateField[];
    settings: TemplateSettings;
    createdAt: string;
    updatedAt: string;
}

// --- STRICT SIZE CONFIG (ISSUE 2) ---
export const SIZE_CONFIG: Record<BillSize, { 
    maxCols: number; 
    fontSize: string; 
    titleSize: string;
    widths: Record<string, string>;
    commonUses: string;
    recommendedTypes: string[];
}> = {
    '80mm': { 
        maxCols: 4, 
        fontSize: '9px', titleSize: '12px',
        commonUses: 'POS receipts, kiosk printing, quick transactions',
        recommendedTypes: ['Sales Receipt', 'Restaurant Order Receipt', 'Delivery Receipt', 'Parking Receipt', 'Queue Ticket', 'Refund Voucher', 'Cash Slip', 'Utility Mini-Receipt'],
        widths: { 
            'Item Name': '40%', 'Qty': '15%', 'Rate': '20%', 'Amount': '25%', 
            'Tax': '15%', 'HSN': '15%', 'Batch': '20%', 'Exp': '15%', 'Mfg': '15%', 
            'Unit': '12%', 'Discount': '15%', 'Size': '15%' 
        }
    },
    '58mm': { 
        maxCols: 3, 
        fontSize: '8px', titleSize: '10px',
        commonUses: 'Small handheld POS, portable printers',
        recommendedTypes: ['Mini Sales Receipt', 'Mobile Delivery Receipt', 'Courier Slip', 'Taxi Fare Receipt', 'Service Receipt', 'ATM Mini Slip', 'Payment Slip'],
        widths: { 
            'Item Name': '50%', 'Qty': '20%', 'Amount': '30%', 'Rate': '20%', 
            'HSN': '15%', 'Tax': '15%', 'S.No': '10%', 'Discount': '15%' 
        }
    },
    '1/4 Size': { 
        maxCols: 6, 
        fontSize: '10px', titleSize: '14px',
        commonUses: 'Medium-sized invoices, statements',
        recommendedTypes: ['Standard Invoice (Medium)', 'Service Invoice', 'Medical Billing Statement', 'Tuition Fee Statement', 'Purchase Order', 'Hotel Guest Statement', 'Donation Receipt', 'Work Order'],
        widths: { 
            'S.No': '8%', 'Item Name': '40%', 'Qty': '12%', 'Rate': '18%', 'Amount': '22%', 
            'HSN': '10%', 'Tax': '10%', 'Batch': '15%', 'Exp': '12%', 'Discount': '10%' 
        }
    },
    '1/5 Size': { 
        maxCols: 6, 
        fontSize: '10px', titleSize: '13px',
        commonUses: 'Administrative forms, business invoices',
        recommendedTypes: ['Official Business Invoice', 'Billing Statement', 'Delivery Note', 'Subscription Billing', 'Government Fee Invoice', 'Membership Form', 'Contract Billing'],
        widths: { 'S.No': '8%', 'Item Name': '40%', 'Qty': '12%', 'Rate': '18%', 'Amount': '22%', 'HSN': '12%', 'Tax': '12%' }
    },
    '1/6 Size': { 
        maxCols: 5, 
        fontSize: '9px', titleSize: '12px',
        commonUses: 'Compact invoices, vouchers',
        recommendedTypes: ['Compact Invoice', 'Credit/Debit Memo', 'Supplier Billing Sheet', 'Booking Invoice', 'Event Ticket Invoice', 'Internal Billing Slip', 'Warranty Form'],
        widths: { 'S.No': '10%', 'Item Name': '40%', 'Qty': '15%', 'Rate': '15%', 'Amount': '20%', 'HSN': '15%' }
    },
    '1/8 Size': { 
        maxCols: 4, 
        fontSize: '8.5px', titleSize: '11px',
        commonUses: 'Vouchers, stubs, tickets',
        recommendedTypes: ['Payment Voucher', 'Cash Voucher', 'Delivery Stub', 'Gate Pass Ticket', 'Raffle Ticket', 'Meal Coupon', 'Parking Ticket', 'Mini Utility Bill'],
        widths: { 'Item Name': '45%', 'Qty': '15%', 'Rate': '20%', 'Amount': '20%' }
    },
    'A4': { 
        maxCols: 9, 
        fontSize: '11px', titleSize: '24px',
        commonUses: 'Full legal/official documents',
        recommendedTypes: ['Full-Format Invoice', 'Utility Bills', 'Tax Invoice', 'Payroll Slip', 'Insurance Statement', 'Government Forms', 'Medical Detailed Invoice', 'Multi-Item PO'],
        widths: { 
            'S.No': '6%', 'Item Name': '30%', 'HSN': '8%', 'Qty': '8%', 'Rate': '12%', 
            'Tax': '8%', 'Amount': '12%', 'Batch': '12%', 'Exp': '12%', 'Mfg': '10%', 
            'Unit': '8%', 'Discount': '10%', 'Size': '12%' 
        }
    },
    'A5': { 
        maxCols: 7, 
        fontSize: '10px', titleSize: '18px',
        commonUses: 'Business forms, compact invoices, statements',
        recommendedTypes: ['Half-Page Invoice', 'Service & Repair Receipt', 'Clinic Receipt', 'Rental Billing', 'Delivery Receipt', 'Work Order Form', 'Official Receipt'],
        widths: { 
            'S.No': '8%', 'Item Name': '40%', 'Qty': '12%', 'Rate': '18%', 'Amount': '22%', 
            'Tax': '10%', 'HSN': '12%', 'Batch': '15%', 'Exp': '12%', 'Discount': '10%' 
        }
    },
    '1/7 Size': { 
        maxCols: 4, 
        fontSize: '8.5px', titleSize: '11px',
        commonUses: 'Mini Stub (Internal)',
        recommendedTypes: ['Stub'],
        widths: { 'Item Name': '45%', 'Qty': '15%', 'Rate': '20%', 'Amount': '20%' }
    }
};

export const BILL_SIZE_DIMENSIONS: Record<BillSize, { width: string; height: string }> = {
    '80mm': { width: '80mm', height: 'auto' },
    '58mm': { width: '58mm', height: 'auto' },
    '1/4 Size': { width: '105mm', height: '148mm' },
    '1/5 Size': { width: '105mm', height: '118mm' },
    '1/6 Size': { width: '105mm', height: '99mm' },
    '1/7 Size': { width: '80mm', height: '110mm' },
    '1/8 Size': { width: '74mm', height: '105mm' },
    'A4': { width: '210mm', height: '297mm' },
    'A5': { width: '148mm', height: '210mm' }
};

// Legacy support - map to SIZE_CONFIG
export const BILL_SIZE_COLUMN_LIMITS: Record<BillSize, { default: number; max: number }> = Object.keys(SIZE_CONFIG).reduce((acc, key) => {
    acc[key as BillSize] = { default: SIZE_CONFIG[key as BillSize].maxCols - 1, max: SIZE_CONFIG[key as BillSize].maxCols };
    return acc;
}, {} as any);

export const BILL_SIZE_FONT_SIZES: Record<BillSize, { base: string; title: string }> = Object.keys(SIZE_CONFIG).reduce((acc, key) => {
    acc[key as BillSize] = { base: SIZE_CONFIG[key as BillSize].fontSize, title: SIZE_CONFIG[key as BillSize].titleSize };
    return acc;
}, {} as any);

export * from './mockData';
