/* eslint-disable */
import { useEffect, useState, useCallback } from 'react';
import { Bill } from '../types/bill';
import { useBillContext } from '../contexts/BillContext';
import { IBillService } from '../services/billService';
import { getBillService } from '../services/DIContainer';

interface UseBillsReturn {
    bills: Bill[];
    loading: boolean;
    error: string | null;
    createBill: (billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Bill>;
    updateBill: (updatedBill: Bill) => Promise<Bill>;
    deleteBill: (id: string, quiet?: boolean) => Promise<void>;
    deleteBills: (ids: string[], quiet?: boolean) => Promise<void>;
    getAllBillIds: (filters?: any) => Promise<string[]>;
    searchBills: (query: string) => Promise<Bill[]>;
    exportBills: (format: 'csv' | 'json') => Promise<Blob>;
    isSubmitting: boolean;
    refetch: () => Promise<void>;
    loadBillsPaginated: (params: { page: number; limit: number; search?: string; status?: string; customerId?: string; dateFilter?: string }) => Promise<void>;
    currentBill: Bill | null;
    setCurrentBill: (bill: Bill | null | ((prev: Bill | null) => Bill | null)) => void;
    selectedBills: Bill[];
    setSelectedBills: (bills: Bill[] | ((prev: Bill[]) => Bill[])) => void;
    billPreviewMode: boolean;
    setBillPreviewMode: (mode: boolean | ((prev: boolean) => boolean)) => void;
    pagination: { total: number; page: number; limit: number; totalPages: number } | null;
    setPagination: (pagination: { total: number; page: number; limit: number; totalPages: number } | null | ((prev: any) => any)) => void;
}

/**
 * useBills hook integrates dependency injection with React context
 * Follows SOLID principles by using injected services and focused context
 */
const useBills = (): UseBillsReturn => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false); // Added for submission state
    const {
        billHistory,
        setBillHistory,
        currentBill,
        setCurrentBill,
        selectedBills,
        setSelectedBills,
        billPreviewMode,
        setBillPreviewMode,
        pagination,
        setPagination
    } = useBillContext();

    // Get the bill service through dependency injection
    const billService: IBillService = getBillService();

    const loadBills = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await billService.getBills();
            if (Array.isArray(result)) {
                setBillHistory(result);
            } else {
                setBillHistory(result.bills);
                setPagination(result.pagination);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load bills');
        } finally {
            setLoading(false);
        }
    }, [billService, setBillHistory, setPagination]);

    const loadBillsPaginated = useCallback(async (params: { page: number; limit: number; search?: string; status?: string; customerId?: string; dateFilter?: string }) => {
        try {
            setLoading(true);
            setError(null);
            const response = await billService.getBills(params);
            
            if (!Array.isArray(response)) {
                setBillHistory(response.bills);
                setPagination(response.pagination);
            } else {
                setBillHistory(response);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load bills');
        } finally {
            setLoading(false);
        }
    }, [billService, setBillHistory, setPagination]);

    /* 
    useEffect(() => {
        loadBills();
    }, [loadBills]);
    */

    // Data fetching responsibility is moved to components to avoid redundant global sync storms


    const createBill = useCallback(async (billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            setError(null);
            setIsSubmitting(true);
            const newBill = await billService.createBill(billData);
            
            // Add NEW BILL to the TOP of the history immediately (Order: DESC)
            setBillHistory(prev => {
                // Prevent duplicate addition if refresh event fires simultaneously
                if (prev.some(b => b.id === newBill.id)) return prev;
                return [newBill, ...prev];
            });

            // Update pagination total if applicable
            if (pagination) {
                setPagination({
                    ...pagination,
                    total: pagination.total + 1
                });
            }

            // Notify other components immediately
            window.dispatchEvent(new Event('inventory-updated'));
            window.dispatchEvent(new Event('bills-updated'));
            window.dispatchEvent(new Event('bill-created'));

            return newBill;
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.data?.error || err.message || 'Failed to create bill';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }, [billService, setBillHistory, pagination, setPagination]);

    const updateBill = useCallback(async (updatedBill: Bill) => {
        try {
            setError(null);
            setIsSubmitting(true);
            const result = await billService.updateBill(updatedBill);
            setBillHistory((prev: Bill[]) => prev.map(b => b.id === updatedBill.id ? result : b));

            if (currentBill?.id === updatedBill.id) {
                setCurrentBill(result);
            }

            // Notify Dashboard and inventory to re-sync (stock adjusted server-side)
            window.dispatchEvent(new Event('bills-updated'));
            window.dispatchEvent(new Event('inventory-updated'));

            return result;
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.data?.error || err.message || 'Failed to update bill';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }, [billService, setBillHistory, currentBill, setCurrentBill]);
    const deleteBill = useCallback(async (id: string, quiet = false) => {
        const previousBills = [...billHistory];
        try {
            setError(null);
            // Functional update for bills history
            setBillHistory((prev: Bill[]) => prev.filter(b => b.id !== id));
            if (currentBill?.id === id) {
                setCurrentBill((_prev: Bill | null) => null);
            }
            setSelectedBills((prev: Bill[]) => prev.filter(b => b.id !== id));

            await billService.deleteBill(id);

            if (!quiet) {
                window.dispatchEvent(new Event('bills-updated'));
                window.dispatchEvent(new Event('inventory-updated'));
            }
        } catch (err: any) {
            setBillHistory(previousBills);
            const errorMessage = err.response?.data?.error || err.data?.error || err.message || 'Failed to delete bill';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [billService, setCurrentBill, setSelectedBills]);

    const deleteBills = useCallback(async (ids: string[], quiet = false) => {
        const previousBills = [...billHistory];
        try {
            setError(null);
            // Optimistic UI updates using functional pattern
            setBillHistory((prev: Bill[]) => prev.filter(b => !ids.includes(b.id)));
            setSelectedBills((prev: Bill[]) => prev.filter(b => !ids.includes(b.id)));

            await billService.deleteBills(ids);

            if (!quiet) {
                window.dispatchEvent(new Event('bills-updated'));
                window.dispatchEvent(new Event('inventory-updated'));
            }
        } catch (err: any) {
            setBillHistory(previousBills);
            const errorMessage = err.response?.data?.error || err.data?.error || err.message || 'Failed to delete bills';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [billService, setSelectedBills]);

    const getAllBillIds = useCallback(async (filters?: any) => {
        try {
            return await billService.getAllBillIds(filters);
        } catch (err) {
            console.error(err);
            return [];
        }
    }, [billService]);

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
        deleteBills,
        getAllBillIds,
        searchBills,
        exportBills,
        isSubmitting, // Exposed
        refetch: loadBills,
        loadBillsPaginated,
        // Context state and setters
        currentBill,
        setCurrentBill,
        selectedBills,
        setSelectedBills,
        billPreviewMode,
        setBillPreviewMode,
        pagination,
        setPagination,
    };
};

export { useBills };
export default useBills;
