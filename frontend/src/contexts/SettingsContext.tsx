import React, { createContext, useContext, useState, Dispatch, SetStateAction } from 'react';

export interface TaxSettings {
  enableTax: boolean;
  taxType: 'percentage' | 'fixed';
  taxRate: number;
  taxName: string;
  includeTaxInTotal: boolean;
}

export interface ColumnSettings {
  visibleColumns: string[];
  columnOrder: string[];
  columnWidths: { [key: string]: number };
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  invoiceTemplate: 'modern' | 'classic' | 'minimal';
  defaultBillSize: string;
  activeTemplateId: string;
}

export interface BusinessProfile {
  companyName: string;
  companyAddress: string;
  phone: string;
  email: string;
  gstNumber: string;
  panNumber: string;
  logo: string | null;
}

export interface SettingsContextType {
  taxSettings: TaxSettings;
  setTaxSettings: Dispatch<SetStateAction<TaxSettings>>;
  columnSettings: ColumnSettings;
  setColumnSettings: Dispatch<SetStateAction<ColumnSettings>>;
  appearanceSettings: AppearanceSettings;
  setAppearanceSettings: Dispatch<SetStateAction<AppearanceSettings>>;
  businessProfile: BusinessProfile;
  setBusinessProfile: Dispatch<SetStateAction<BusinessProfile>>;
  logo: string | null;
  setLogo: Dispatch<SetStateAction<string | null>>;
  refreshSettings: () => Promise<void>;
  isLoadingSettings: boolean;
  templateOverrides: Record<string, any>;
  setTemplateOverrides: Dispatch<SetStateAction<Record<string, any>>>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * SettingsContext manages all application settings and configuration
 * Follows Single Responsibility Principle by handling only settings-related state
 */
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    enableTax: true,
    taxType: 'percentage',
    taxRate: 18,
    taxName: 'GST',
    includeTaxInTotal: true
  });

  const [columnSettings, setColumnSettings] = useState<ColumnSettings>({
    visibleColumns: ['name', 'email', 'phone', 'totalBills'],
    columnOrder: ['name', 'email', 'phone', 'totalBills'],
    columnWidths: { name: 200, email: 250, phone: 150, totalBills: 120 }
  });

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: 'system',
    primaryColor: '#3B82F6',
    invoiceTemplate: 'modern',
    defaultBillSize: 'A4',
    activeTemplateId: 'default'
  });

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    companyName: 'Your Company Name',
    companyAddress: '123 Business Street, City, State, PIN',
    phone: '+91 9876543210',
    email: 'contact@company.com',
    gstNumber: '29ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F',
    logo: null
  });

  const [logo, setLogo] = useState<string | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // 🛠️ SINGLE SOURCE OF TRUTH (ISSUE 1): Global Template Overrides
  const [templateOverrides, setTemplateOverrides] = useState<Record<string, any>>(() => {
    try {
      return JSON.parse(localStorage.getItem('billsoft_template_overrides') || '{}');
    } catch (e) { return {}; }
  });

  // Sync to localStorage whenever overrides change
  React.useEffect(() => {
    localStorage.setItem('billsoft_template_overrides', JSON.stringify(templateOverrides));
  }, [templateOverrides]);

  const refreshSettings = async () => {
    try {
      const { authAPI } = await import('../services/api');
      const res = await authAPI.getProfile();
      if (res.user) {
        const size = res.user.defaultBillSize || 'A4';
        const template = res.user.activeTemplateId || 'default';
        
        console.log(`[SettingsContext] Hydrating Template Settings: [${size}] [${template}] ✅`);

        setAppearanceSettings(prev => ({
          ...prev,
          defaultBillSize: size,
          activeTemplateId: template
        }));
        
        // Sync local storage for speed on next boot, but DB is truth
        localStorage.setItem('billsoft_default_bill_size', size);
        localStorage.setItem('billsoft_default_template_id', template);
      }
    } catch (err) {
      console.error('[SettingsContext] Failed to refresh settings:', err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  React.useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        taxSettings,
        setTaxSettings,
        columnSettings,
        setColumnSettings,
        appearanceSettings,
        setAppearanceSettings,
        businessProfile,
        setBusinessProfile,
        logo,
        setLogo,
        refreshSettings,
        isLoadingSettings,
        templateOverrides,
        setTemplateOverrides
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
