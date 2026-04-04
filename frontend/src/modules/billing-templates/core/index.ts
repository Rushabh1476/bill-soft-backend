export type BillSize = 'A4' | 'A5' | 'SMALL_BOOK' | 'POCKET';

export interface TemplateField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'currency';
    required: boolean;
    visible: boolean;
    position: number;
    label?: string;
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

export const BILL_SIZE_DIMENSIONS: Record<BillSize, { width: string; height: string }> = {
    'A4': { width: '210mm', height: '297mm' },
    'A5': { width: '140mm', height: '220mm' },
    'SMALL_BOOK': { width: '110mm', height: '190mm' },
    'POCKET': { width: '5.2in', height: '4.2in' }
};

export * from './mockData';
