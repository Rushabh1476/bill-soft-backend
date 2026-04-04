import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { PurchaseOrder } from '../types/purchaseOrder';

export const usePurchaseOrders = () => {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = useCallback(async (filters = {}) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${API_URL}/purchase-orders`, {
                headers: { Authorization: `Bearer ${token}` },
                params: filters
            });
            setOrders(response.data.orders);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch purchase orders');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        const handleRefresh = () => fetchOrders();
        window.addEventListener('app-data-refresh', handleRefresh);
        window.addEventListener('purchase-orders-updated', handleRefresh);
        return () => {
            window.removeEventListener('app-data-refresh', handleRefresh);
            window.removeEventListener('purchase-orders-updated', handleRefresh);
        };
    }, [fetchOrders]);

    const createOrder = async (orderData: any) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(`${API_URL}/purchase-orders`, orderData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(prev => [response.data.order, ...prev]);
            return response.data.order;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || 'Failed to create purchase order');
        }
    };

    const updateOrderStatus = async (id: string, status: string) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.patch(`${API_URL}/purchase-orders/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(prev => prev.map(o => o.id === id ? response.data.order : o));
            return response.data.order;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || 'Failed to update order status');
        }
    };

    const deleteOrder = async (id: string) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(`${API_URL}/purchase-orders/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(prev => prev.filter(o => o.id !== id));
        } catch (err: any) {
            throw new Error(err.response?.data?.error || 'Failed to delete purchase order');
        }
    };

    return { orders, loading, error, fetchOrders, createOrder, updateOrderStatus, deleteOrder };
};
