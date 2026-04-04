import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { Service } from '../types/service';

export const useServices = () => {
    const { user } = useAuth();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const fetchServices = useCallback(async (searchQuery = '') => {
        setLoading(true);
        setError(null);
        try {
            const timestamp = new Date().getTime();
            const queryParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
            const endpoint = `${API_URL}/services?t=${timestamp}${queryParam}`;
            
            console.log(`[useServices] Fetching from: ${endpoint}`);
            if (user) console.log(`[useServices] Current user org context: ${user.parentId || user.id}`);
            const response = await axios.get(endpoint, {
                headers: getAuthHeaders()
            });
            console.log(`[useServices] Received ${response.data.services.length} services`);
            setServices(response.data.services);
        } catch (err: any) {
            console.error('Error fetching services:', err);
            setError(err.response?.data?.error || err.message || 'Failed to fetch services');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchServices();
        }
    }, [user, fetchServices]);

    useEffect(() => {
        const handleRefresh = () => fetchServices();
        window.addEventListener('app-data-refresh', handleRefresh);
        window.addEventListener('services-updated', handleRefresh);
        return () => {
            window.removeEventListener('app-data-refresh', handleRefresh);
            window.removeEventListener('services-updated', handleRefresh);
        };
    }, [fetchServices]);

    const addService = async (serviceData: Partial<Service>) => {
        try {
            const response = await axios.post(`${API_URL}/services`, serviceData, {
                headers: getAuthHeaders()
            });
            await fetchServices();
            return { success: true, service: response.data.service };
        } catch (err: any) {
            console.error('Error creating service:', err);
            return { success: false, error: err.response?.data?.error || 'Failed to create service' };
        }
    };

    const updateService = async (id: string, serviceData: Partial<Service>) => {
        try {
            const response = await axios.put(`${API_URL}/services/${id}`, serviceData, {
                headers: getAuthHeaders()
            });
            await fetchServices();
            return { success: true, service: response.data.service };
        } catch (err: any) {
            console.error('Error updating service:', err);
            return { success: false, error: err.response?.data?.error || 'Failed to update service' };
        }
    };

    const deleteService = async (id: string) => {
        try {
            await axios.delete(`${API_URL}/services/${id}`, {
                headers: getAuthHeaders()
            });
            await fetchServices();
            return { success: true };
        } catch (err: any) {
            console.error('Error deleting service:', err);
            return { success: false, error: err.response?.data?.error || 'Failed to delete service' };
        }
    };

    return { services, loading, error, fetchServices, addService, updateService, deleteService };
};
