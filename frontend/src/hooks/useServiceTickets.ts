import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { ServiceTicket } from '../types/serviceTicket';

export const useServiceTickets = () => {
    const [tickets, setTickets] = useState<ServiceTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTickets = useCallback(async (filters = {}) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${API_URL}/service-tickets`, {
                headers: { Authorization: `Bearer ${token}` },
                params: filters
            });
            setTickets(response.data.tickets);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch tickets');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    useEffect(() => {
        const handleRefresh = () => fetchTickets();
        window.addEventListener('app-data-refresh', handleRefresh);
        window.addEventListener('service-tickets-updated', handleRefresh);
        return () => {
            window.removeEventListener('app-data-refresh', handleRefresh);
            window.removeEventListener('service-tickets-updated', handleRefresh);
        };
    }, [fetchTickets]);

    const createTicket = async (ticketData: any) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(`${API_URL}/service-tickets`, ticketData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTickets(prev => [response.data.ticket, ...prev]);
            return response.data.ticket;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || 'Failed to create ticket');
        }
    };

    const updateTicketStatus = async (id: string, status: string) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.patch(`${API_URL}/service-tickets/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTickets(prev => prev.map(t => t.id === id ? response.data.ticket : t));
            return response.data.ticket;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || 'Failed to update ticket status');
        }
    };

    const exportTickets = useCallback(async () => {
        try {
            if (tickets.length === 0) return null;
            
            const headers = ['Ticket Number', 'Customer', 'Device Info', 'Priority', 'Status', 'Technician', 'Created Date'];
            const rows = tickets.map(t => [
                t.ticketNumber,
                t.customer.name,
                t.deviceInfo || '',
                t.priority,
                t.status,
                t.assignedTechnician || '',
                new Date(t.createdAt).toLocaleDateString()
            ]);

            const csvContent = [headers, ...rows]
                .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
                .join('\n');

            return new Blob([csvContent], { type: 'text/csv' });
        } catch (err) {
            console.error('Export error:', err);
            return null;
        }
    }, [tickets]);

    const deleteTicket = async (id: string) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(`${API_URL}/service-tickets/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTickets(prev => prev.filter(t => t.id !== id));
            return true;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || 'Failed to delete ticket');
        }
    };

    return { tickets, loading, error, fetchTickets, createTicket, updateTicketStatus, deleteTicket, exportTickets };
};
