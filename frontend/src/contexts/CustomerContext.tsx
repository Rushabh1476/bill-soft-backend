import React, { createContext, useContext, useState } from 'react';
import { Customer } from '../types/customer';

interface CustomerContextType {
  // Shared customer list - loaded once, shared everywhere
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  customersLoaded: boolean;
  setCustomersLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  // Single customer detail
  customerDetails: Customer | null;
  setCustomerDetails: React.Dispatch<React.SetStateAction<Customer | null>>;
  selectedCustomers: Customer[];
  setSelectedCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  customerFilters: {
    search: string;
    status: 'all' | 'active' | 'inactive';
  };
  setCustomerFilters: React.Dispatch<React.SetStateAction<{
    search: string;
    status: 'all' | 'active' | 'inactive';
  }>>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoaded, setCustomersLoaded] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [customerFilters, setCustomerFilters] = useState<CustomerContextType['customerFilters']>({
    search: '',
    status: 'all'
  });

  return (
    <CustomerContext.Provider
      value={{
        customers,
        setCustomers,
        customersLoaded,
        setCustomersLoaded,
        customerDetails,
        setCustomerDetails,
        selectedCustomers,
        setSelectedCustomers,
        customerFilters,
        setCustomerFilters,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomerContext = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomerContext must be used within a CustomerProvider');
  }
  return context;
};

export default CustomerContext;
