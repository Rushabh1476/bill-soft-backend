import { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

export interface Supplier {
    id: string;
    name: string;
    contact?: string;
    email?: string;
    phone?: string;
    address?: string;
    state?: string;
    city?: string;
    pincode?: string;
    gstNumber?: string;
    balance: number;
    isMarkedRed?: boolean;
    products?: any[];
    _count?: {
        products: number;
    };
    createdAt: string;
}

export const useSuppliers = () => {
    const { user } = useAuth();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const fetchSuppliers = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/suppliers`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            // Check if response is HTML (login page or 404)
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.indexOf('text/html') !== -1) {
                throw new Error('Server returned HTML instead of JSON. Check API URL.');
            }

            const data = await response.json();
            if (response.ok) {
                setSuppliers(data.suppliers || []);
            } else {
                setError(data.error);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addSupplier = async (supplierData: Partial<Supplier>) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/suppliers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(supplierData)
            });

            if (response.ok) {
                fetchSuppliers(); // Refresh list
                return { success: true };
            }
            const data = await response.json().catch(() => ({ error: 'Unknown error' }));
            return { success: false, error: data.error || 'Failed to add' };
        } catch (err) {
            return { success: false, error: 'Network error' };
        }
    };

    const updateSupplier = async (id: string, supplierData: Partial<Supplier>) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/suppliers/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(supplierData)
            });

            if (response.ok) {
                fetchSuppliers();
                return { success: true };
            }
            const data = await response.json().catch(() => ({ error: 'Unknown error' }));
            return { success: false, error: data.error || 'Failed to update' };
        } catch (err) {
            return { success: false, error: 'Network error' };
        }
    };

    const deleteSupplier = async (id: string) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/suppliers/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                fetchSuppliers();
                return { success: true };
            }
            const data = await response.json().catch(() => ({ error: 'Unknown error' }));
            return { success: false, error: data.error || 'Failed to delete' };
        } catch (err) {
            return { success: false, error: 'Network error' };
        }
    };

    useEffect(() => {
        if (user) fetchSuppliers();
    }, [user]);

    useEffect(() => {
        const handleRefresh = () => fetchSuppliers();
        window.addEventListener('app-data-refresh', handleRefresh);
        window.addEventListener('suppliers-updated', handleRefresh);
        return () => {
            window.removeEventListener('app-data-refresh', handleRefresh);
            window.removeEventListener('suppliers-updated', handleRefresh);
        };
    }, [user]);

    const exportSuppliers = async () => {
        try {
            if (suppliers.length === 0) return null;

            const headers = ['Company Name', 'Contact Person', 'Email', 'Phone', 'GST Number', 'Balance', 'Created At'];
            const rows = suppliers.map(s => [
                s.name,
                s.contact || '',
                s.email || '',
                s.phone || '',
                s.gstNumber || '',
                s.balance,
                new Date(s.createdAt).toLocaleDateString()
            ]);

            const csvContent = [headers, ...rows]
                .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
                .join('\n');

            return new Blob([csvContent], { type: 'text/csv' });
        } catch (err) {
            console.error('Export error:', err);
            return null;
        }
    };

    return { suppliers, loading, error, addSupplier, updateSupplier, deleteSupplier, fetchSuppliers, exportSuppliers };
};
