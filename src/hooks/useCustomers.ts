import { useEffect, useState, useCallback } from 'react';
import { Customer } from '../types/customer';
import { useCustomerContext } from '../contexts/CustomerContext';
import { ICustomerService } from '../services/customerService';
import { getCustomerService } from '../services/DIContainer';

const useCustomers = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { customerDetails, setCustomerDetails, selectedCustomers, setSelectedCustomers } = useCustomerContext();
    
    const customerService: ICustomerService = getCustomerService();
    const [customers, setCustomers] = useState<Customer[]>([]);

    const loadCustomers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const customerList = await customerService.getCustomers();
            // Yahan humne cleanList hata diya taaki email data rahe
            setCustomers(customerList); 
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load customers');
        } finally {
            setLoading(false);
        }
    }, [customerService]);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    const createCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            setError(null);
            const newCustomer = await customerService.createCustomer(customerData);
            setCustomers(prev => [...prev, newCustomer]);
            return newCustomer;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create customer';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [customerService]);

    const updateCustomer = useCallback(async (updatedCustomer: Customer) => {
        try {
            setError(null);
            const result = await customerService.updateCustomer(updatedCustomer);
            setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? result : c));
            if (customerDetails?.id === updatedCustomer.id) {
                setCustomerDetails(result);
            }
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update customer';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [customerService, customerDetails, setCustomerDetails]);

    const deleteCustomer = useCallback(async (id: string) => {
        try {
            setError(null);
            await customerService.deleteCustomer(id);
            setCustomers(prev => prev.filter(c => c.id !== id));
            if (customerDetails?.id === id) {
                setCustomerDetails(null);
            }
            setSelectedCustomers(selectedCustomers.filter(c => c.id !== id));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete customer';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [customerService, customerDetails, setCustomerDetails, selectedCustomers, setSelectedCustomers]);

    const searchCustomers = useCallback(async (query: string) => {
        try {
            setError(null);
            const results = await customerService.searchCustomers(query);
            return results;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to search customers';
            setError(errorMessage);
            return [];
        }
    }, [customerService]);

    const exportCustomers = useCallback(async (format: 'csv' | 'json') => {
        try {
            setError(null);
            const blob = await customerService.exportCustomers(format);
            return blob;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to export customers';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [customerService]);

    return {
        customers,
        loading,
        error,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        searchCustomers,
        exportCustomers,
        refetch: loadCustomers,
        customerDetails,
        setCustomerDetails,
        selectedCustomers,
        setSelectedCustomers,
    };
};

export { useCustomers };
export default useCustomers;