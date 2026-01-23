import { useEffect, useState, useCallback } from 'react';
import { Bill } from '../types/bill';
import { useBillContext } from '../contexts/BillContext';
import { IBillService } from '../services/billService';
import { getBillService } from '../services/DIContainer';

/**
 * useBills hook integrates dependency injection with React context
 * Follows SOLID principles by using injected services and focused context
 */
const useBills = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { 
        billHistory, 
        setBillHistory,
        currentBill, 
        setCurrentBill, 
        selectedBills, 
        setSelectedBills,
        billPreviewMode,
        setBillPreviewMode
    } = useBillContext();
    
    // Get the bill service through dependency injection
    const billService: IBillService = getBillService();

    const loadBills = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const billList = await billService.getBills();
            setBillHistory(billList);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load bills');
        } finally {
            setLoading(false);
        }
    }, [billService, setBillHistory]);

    useEffect(() => {
        loadBills();
    }, [loadBills]);

    const createBill = useCallback(async (billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            setError(null);
            const responseBill = await billService.createBill(billData);
            
            // 1. Safety check: ensure responseBill has all required fields for UI
            const safeBill = {
                ...responseBill,
                customerName: responseBill.customerName || billData.customerName || 'Unknown',
                billNumber: responseBill.billNumber || (billData as any).billNumber || 'PENDING'
            };

            // 2. Not iterable fix + UI Crash fix
            const currentHistory = Array.isArray(billHistory) ? billHistory : [];
            
            // 3. Update state with safe data
            setBillHistory([...currentHistory, safeBill]);
            
            return safeBill;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create bill';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [billService, setBillHistory, billHistory]);

    const updateBill = useCallback(async (updatedBill: Bill) => {
        try {
            setError(null);
            const result = await billService.updateBill(updatedBill);
            setBillHistory(billHistory.map(b => b.id === updatedBill.id ? result : b));
            
            // Update context if this is the currently selected bill
            if (currentBill?.id === updatedBill.id) {
                setCurrentBill(result);
            }
            
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update bill';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [billService, setBillHistory, billHistory, currentBill, setCurrentBill]);

    const deleteBill = useCallback(async (id: string) => {
        try {
            setError(null);
            await billService.deleteBill(id);
            setBillHistory(billHistory.filter(b => b.id !== id));
            
            // Clear context if this bill was selected
            if (currentBill?.id === id) {
                setCurrentBill(null);
            }
            
            // Remove from selected bills
            setSelectedBills(selectedBills.filter(b => b.id !== id));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete bill';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [billService, setBillHistory, billHistory, currentBill, setCurrentBill, selectedBills, setSelectedBills]);

    const searchBills = useCallback(async (query: string) => {
        try {
            setError(null);
            const results = await billService.searchBills(query);
            return results;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to search bills';
            setError(errorMessage);
            return [];
        }
    }, [billService]);

    const exportBills = useCallback(async (format: 'csv' | 'json') => {
        try {
            setError(null);
            const blob = await billService.exportBills(format);
            return blob;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to export bills';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [billService]);

    return {
        bills: billHistory,
        loading,
        error,
        createBill,
        updateBill,
        deleteBill,
        searchBills,
        exportBills,
        refetch: loadBills,
        // Context state and setters
        currentBill,
        setCurrentBill,
        selectedBills,
        setSelectedBills,
        billPreviewMode,
        setBillPreviewMode,
    };
};

export { useBills };
export default useBills;