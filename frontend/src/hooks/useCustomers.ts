/* eslint-disable */
import { useEffect, useState, useCallback } from 'react';
import { Customer } from '../types/customer';
import { useCustomerContext } from '../contexts/CustomerContext';
import { ICustomerService } from '../services/customerService';
import { getCustomerService } from '../services/DIContainer';

const useCustomers = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const {
        customers,
        setCustomers,
        customersLoaded,
        setCustomersLoaded,
        customerDetails,
        setCustomerDetails,
        selectedCustomers,
        setSelectedCustomers
    } = useCustomerContext();

    const customerService: ICustomerService = getCustomerService();

    const loadCustomers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const customerList = await customerService.getCustomers();
            setCustomers(Array.isArray(customerList) ? customerList : []);
            setCustomersLoaded(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load customers');
        } finally {
            setLoading(false);
        }
    }, [customerService]);

    // Only fetch once when app starts - if already loaded, skip
    useEffect(() => {
        if (!customersLoaded) {
            loadCustomers();
        }
    }, [customersLoaded]);

    useEffect(() => {
        const handleRefresh = () => {
            loadCustomers();
        };
        window.addEventListener('inventory-updated', handleRefresh);
        window.addEventListener('bill-created', handleRefresh);
        return () => {
            window.removeEventListener('inventory-updated', handleRefresh);
            window.removeEventListener('bill-created', handleRefresh);
        };
    }, []);

    const createCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            setError(null);
            const newCustomer = await customerService.createCustomer(customerData);
            setCustomers([...customers, newCustomer]);
            return newCustomer;
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to create customer';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [customerService, customers]);

    const updateCustomer = useCallback(async (updatedCustomer: Customer) => {
        try {
            setError(null);
            const result = await customerService.updateCustomer(updatedCustomer);
            setCustomers(customers.map(c => c.id === updatedCustomer.id ? result : c));
            if (customerDetails?.id === updatedCustomer.id) {
                setCustomerDetails(result);
            }
            return result;
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to update customer';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [customerService, customers, customerDetails, setCustomerDetails]);

    const deleteCustomer = useCallback(async (id: string) => {
        try {
            setError(null);
            await customerService.deleteCustomer(id);
            setCustomers(customers.filter(c => c.id !== id));
            if (customerDetails?.id === id) {
                setCustomerDetails(null);
            }
            setSelectedCustomers(selectedCustomers.filter(c => c.id !== id));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete customer';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [customerService, customers, customerDetails, setCustomerDetails, selectedCustomers, setSelectedCustomers]);

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

    const exportCustomers = useCallback(async (format: 'csv' | 'json' | 'excel') => {
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
