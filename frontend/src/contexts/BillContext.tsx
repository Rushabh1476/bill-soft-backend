import React, { createContext, useContext, useState } from 'react';
import { Bill } from '../types/bill';

interface BillContextType {
  billHistory: Bill[];
  setBillHistory: React.Dispatch<React.SetStateAction<Bill[]>>;
  currentBill: Bill | null;
  setCurrentBill: React.Dispatch<React.SetStateAction<Bill | null>>;
  selectedBills: Bill[];
  setSelectedBills: React.Dispatch<React.SetStateAction<Bill[]>>;
  billFilters: {
    search: string;
    status: 'all' | 'paid' | 'pending' | 'overdue';
    dateRange: { start: Date | null; end: Date | null };
  };
  setBillFilters: React.Dispatch<React.SetStateAction<{
    search: string;
    status: 'all' | 'paid' | 'pending' | 'overdue';
    dateRange: { start: Date | null; end: Date | null };
  }>>;
  billPreviewMode: boolean;
  setBillPreviewMode: React.Dispatch<React.SetStateAction<boolean>>;
  pagination: { total: number; page: number; limit: number; totalPages: number } | null;
  setPagination: React.Dispatch<React.SetStateAction<{ total: number; page: number; limit: number; totalPages: number } | null>>;
}

const BillContext = createContext<BillContextType | undefined>(undefined);

/**
 * BillContext manages all bill-related state and operations
 * Follows Single Responsibility Principle by handling only billing data
 */
export const BillProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [billHistory, setBillHistory] = useState<Bill[]>([]);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [selectedBills, setSelectedBills] = useState<Bill[]>([]);
  const [billFilters, setBillFilters] = useState<BillContextType['billFilters']>({
    search: '',
    status: 'all',
    dateRange: { start: null, end: null }
  });
  const [billPreviewMode, setBillPreviewMode] = useState(false);
  const [pagination, setPagination] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null);

  return (
    <BillContext.Provider
      value={{
        billHistory,
        setBillHistory,
        currentBill,
        setCurrentBill,
        selectedBills,
        setSelectedBills,
        billFilters,
        setBillFilters,
        billPreviewMode,
        setBillPreviewMode,
        pagination,
        setPagination,
      }}
    >
      {children}
    </BillContext.Provider>
  );
};

export const useBillContext = () => {
  const context = useContext(BillContext);
  if (!context) {
    throw new Error('useBillContext must be used within a BillProvider');
  }
  return context;
};

export default BillContext;
