import React, { createContext, useContext, useState } from 'react';
import { Bill } from '../types/bill';

interface BillContextType {
  billHistory: Bill[];
  setBillHistory: (history: Bill[]) => void;
  currentBill: Bill | null;
  setCurrentBill: (bill: Bill | null) => void;
  selectedBills: Bill[];
  setSelectedBills: (bills: Bill[]) => void;
  billFilters: {
    search: string;
    status: 'all' | 'paid' | 'pending' | 'overdue';
    dateRange: { start: Date | null; end: Date | null };
  };
  setBillFilters: (filters: any) => void;
  billPreviewMode: boolean;
  setBillPreviewMode: (mode: boolean) => void;
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
  const [billFilters, setBillFilters] = useState({
    search: '',
    status: 'all' as const,
    dateRange: { start: null, end: null }
  });
  const [billPreviewMode, setBillPreviewMode] = useState(false);

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