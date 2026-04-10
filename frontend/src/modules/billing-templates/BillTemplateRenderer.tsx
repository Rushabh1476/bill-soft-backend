import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Bill } from '../../types/bill';
import { 
    InvoiceTemplate, 
    BillSize, 
    BILL_SIZE_FONT_SIZES, 
    BILL_SIZE_COLUMN_LIMITS, 
    BILL_SIZE_DIMENSIONS,
    SIZE_CONFIG 
} from './core';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { modernTheme } from '../../theme/theme';
import A4InvoicePreview from './previews/A4InvoicePreview';
import ClassicProfessionalPreview from './previews/ClassicProfessionalPreview';
import SimpleBasicPreview from './previews/SimpleBasicPreview';
import CorporateStandardPreview from './previews/CorporateStandardPreview';
import CreativeModernPreview from './previews/CreativeModernPreview';
import MinimalCleanPreview from './previews/MinimalCleanPreview';
import { API_URL } from '../../config/api';

// New Billing Module Components
import { getBillingTemplate, SUPPORTED_BILLING_FORMATS } from './index';
import { processSaleData } from '../../utils/billingUtils';

interface BillTemplateRendererProps {
    template?: InvoiceTemplate;
    bill?: Bill;
    saleData?: any;
    preferences?: any;
    size?: string;
    activeColumns?: string[];
}

const BillTemplateRenderer: React.FC<BillTemplateRendererProps> = ({ template, bill, saleData, preferences: initialPreferences, size: sizeOverride, activeColumns: propColumns }) => {
    const { templateOverrides } = useSettingsContext();
    const [preferences, setPreferences] = useState<any>(initialPreferences || null);

    useEffect(() => {
        if (initialPreferences) {
            setPreferences(initialPreferences);
            return;
        }

        const loadPreferences = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${API_URL}/admin/settings/invoice-preferences`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const res = await response.json();
                if (res.success && res.data) {
                    setPreferences(res.data);
                }
            } catch (err) {
                console.error('Error loading preferences in renderer:', err);
            }
        };
        loadPreferences();
    }, [initialPreferences]);

    // We force a light theme for the invoice preview area because 
    // invoices are documents meant for print/viewing on a white background.
    const renderContent = () => {
        // 🚀 CASE 1: Direct SaleData (Used by BillForm for instant preview)
        if (saleData) {
            const activeTemplateId = saleData.templateId || 'default';
            const CustomTemplate = getBillingTemplate(activeTemplateId) as any;
            
            const templateMeta = SUPPORTED_BILLING_FORMATS.find(f => f.id === activeTemplateId);
            const templateSize = (sizeOverride || templateMeta?.size || 'A4') as BillSize;

            // 🛠️ SINGLE SOURCE OF TRUTH (ISSUE 1): Using Global Overrides for WYSIWYG
            let activeColumns = propColumns || saleData?.activeColumns;
            let settingsOverride = {};

            const sizeKey = `${activeTemplateId}:${templateSize}`;
            const o = templateOverrides[sizeKey] || templateOverrides[activeTemplateId];
            
            if (!activeColumns && o) {
                activeColumns = o.settings?.activeColumns;
            }
            if (o) settingsOverride = o.settings || {};

            // 🛠️ ABSOLUTE SIZE CONTROL (ISSUE 2): SIZE_CONFIG driven layout
            const strictConfig = SIZE_CONFIG[templateSize] || SIZE_CONFIG['A4'];
            
            const finalSaleData = {
                ...saleData,
                settings: {
                    ...saleData.settings,
                    ...settingsOverride,
                    fontSize: strictConfig.fontSize,
                    titleFontSize: strictConfig.titleSize
                }
            };

            return (
                <div 
                  className="preview-absolute-context"
                  style={{ 
                    fontSize: strictConfig.fontSize,
                    width: '100%',
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                  } as any}
                >
                    <CustomTemplate 
                        saleData={finalSaleData} 
                        size={templateSize} 
                        activeColumns={activeColumns} 
                        sizeConfig={strictConfig}
                    />
                </div>
            );
        }

        // 🚀 CASE 2: Legacy Bill/Template mapping (Used by Library and ViewBill)
        if (!bill || !template) return <div>Loading Preview...</div>;

        const activeTemplateId = bill.templateId || template.id;
        const CustomTemplate = getBillingTemplate(activeTemplateId) as any;
        
        const isNewModuleTemplate = true; // All templates follow the NEW standard now

        if (isNewModuleTemplate) {
            const processed = processSaleData({
                items: bill.items.map((item: any) => ({
                    name: item.productName,
                    qty: Number(item.quantity || item.qty),
                    rate: Number(item.price || item.rate),
                    taxRate: Number(item.taxRate || 0),
                    discount: Number(item.discount || item.customFields?.discount || 0),
                    hsn: item.hsn || item.customFields?.hsn || '',
                    batch: item.batch || item.customFields?.batch || '',
                    exp: item.exp || item.customFields?.exp || '',
                    mfg: item.mfg || item.customFields?.mfg || '',
                    unit: item.unit || item.customFields?.unit || 'PCS',
                    size: item.size || item.customFields?.size || '',
                    customFields: item.customFields || {} 
                })),
                isInterState: false, 
                tcsRate: 0,
                tcsMode: 'TOTAL',
                storeName: bill.user?.companyName || 'Store',
                storeAddress: bill.user?.address || '',
                storeGSTIN: bill.user?.gstNumber || '',
                billNo: bill.billNumber || 'AUTO',
                billDate: bill.createdAt,
                customerName: bill.customerName,
                customerPhone: bill.customer?.phone || '',
                customerAddress: bill.customer?.address || '',
                customerGSTIN: bill.customer?.gstNumber || '',
                paymentMode: bill.paymentMode || 'Cash',
                bankName: bill.user?.bankName || preferences?.bankName || 'HDFC BANK',
                accountNumber: bill.user?.accountNumber || preferences?.accountNumber || '50200012345678',
                ifscCode: bill.user?.ifscCode || preferences?.ifscCode || 'HDFC0001234',
                branchName: bill.user?.branchName || preferences?.branchName || 'PUNE',
                upiId: bill.user?.upiId || preferences?.upiId || 'shop@upi',
                customFields: { ...bill } 
            });

            const templateMeta = SUPPORTED_BILLING_FORMATS.find(f => f.id === activeTemplateId);
            const templateSize = (sizeOverride || templateMeta?.size || 'A4') as BillSize;
            const strictConfig = SIZE_CONFIG[templateSize] || SIZE_CONFIG['A4'];

            // SYNC overrides (Priority: Props -> Context Override -> Template Metadata)
            let activeColumns = propColumns || template?.settings?.activeColumns;
            const sizeKey = `${activeTemplateId}:${templateSize}`;
            const o = templateOverrides[sizeKey] || templateOverrides[activeTemplateId];
            
            if (o?.settings?.activeColumns) {
                activeColumns = o.settings.activeColumns;
            }

            return (
                <div style={{ fontSize: strictConfig.fontSize, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                    <CustomTemplate 
                        saleData={processed} 
                        size={templateSize} 
                        activeColumns={activeColumns} 
                        sizeConfig={strictConfig} 
                    />
                </div>
            );
          }

        const commonProps = { template, bill, preferences };
        switch (activeTemplateId) {
            case '1':
            case 'default':
                return <A4InvoicePreview {...commonProps as any} />;
            case '2':
                return <CorporateStandardPreview {...commonProps as any} />;
            case '3':
                return <SimpleBasicPreview {...commonProps as any} />;
            case '4':
                return <ClassicProfessionalPreview {...commonProps as any} />;
            case '5':
                return <CreativeModernPreview {...commonProps as any} />;
            case '6':
                return <MinimalCleanPreview {...commonProps as any} />;
            default:
                return <CustomTemplate saleData={{ ...bill }} size={bill.defaultBillSize || 'A4'} />;
        }
    };

    return (
        <ThemeProvider theme={modernTheme} key={`renderer-${saleData?.templateId || bill?.templateId || 'default'}`}>
            {renderContent()}
        </ThemeProvider>
    );
};

export default BillTemplateRenderer;
