import React, { createContext, useContext, useState } from 'react';

interface AppContextType {
  customerDetails: any;
  setCustomerDetails: React.Dispatch<React.SetStateAction<any>>;
  billHistory: any[];
  setBillHistory: React.Dispatch<React.SetStateAction<any[]>>;
  logo: string | null;
  setLogo: React.Dispatch<React.SetStateAction<string | null>>;
  taxSettings: any;
  setTaxSettings: React.Dispatch<React.SetStateAction<any>>;
  columnSettings: any;
  setColumnSettings: React.Dispatch<React.SetStateAction<any>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [billHistory, setBillHistory] = useState<any[]>([]);
  const [logo, setLogo] = useState<string | null>(null);
  const [taxSettings, setTaxSettings] = useState<any>(null);
  const [columnSettings, setColumnSettings] = useState<any>(null);

  return (
    <AppContext.Provider
      value={{
        customerDetails,
        setCustomerDetails,
        billHistory,
        setBillHistory,
        logo,
        setLogo,
        taxSettings,
        setTaxSettings,
        columnSettings,
        setColumnSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
