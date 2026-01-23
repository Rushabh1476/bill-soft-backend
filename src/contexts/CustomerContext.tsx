import React, { createContext, useContext, useState } from 'react';
import { Customer } from '../types/customer';

interface CustomerContextType {
  customers: Customer[]; // 🔥 Added to store the list
  setCustomers: (customers: Customer[]) => void; // 🔥 Added setter function
  customerDetails: Customer | null;
  setCustomerDetails: (details: Customer | null) => void;
  selectedCustomers: Customer[];
  setSelectedCustomers: (customers: Customer[]) => void;
  customerFilters: {
    search: string;
    status: 'all' | 'active' | 'inactive';
  };
  setCustomerFilters: (filters: any) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

/**
 * CustomerContext manages all customer-related state
 * Follows Single Responsibility Principle by handling only customer data and operations
 */
export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]); // 🔥 Added state
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [customerFilters, setCustomerFilters] = useState({
    search: '',
    status: 'all' as const
  });

  return (
    <CustomerContext.Provider
      value={{
        customers, // 🔥 Provided value
        setCustomers, // 🔥 Provided setter
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