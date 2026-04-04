import React, { createContext, useContext, useState } from 'react';

interface TaxSettings {
  enableTax: boolean;
  taxType: 'percentage' | 'fixed';
  taxRate: number;
  taxName: string;
  includeTaxInTotal: boolean;
}

interface ColumnSettings {
  visibleColumns: string[];
  columnOrder: string[];
  columnWidths: { [key: string]: number };
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  invoiceTemplate: 'modern' | 'classic' | 'minimal';
}

interface BusinessProfile {
  companyName: string;
  companyAddress: string;
  phone: string;
  email: string;
  gstNumber: string;
  panNumber: string;
  logo: string | null;
}

interface SettingsContextType {
  taxSettings: TaxSettings;
  setTaxSettings: (settings: TaxSettings) => void;
  columnSettings: ColumnSettings;
  setColumnSettings: (settings: ColumnSettings) => void;
  appearanceSettings: AppearanceSettings;
  setAppearanceSettings: (settings: AppearanceSettings) => void;
  businessProfile: BusinessProfile;
  setBusinessProfile: (profile: BusinessProfile) => void;
  logo: string | null;
  setLogo: (logo: string | null) => void;
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
    invoiceTemplate: 'modern'
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
