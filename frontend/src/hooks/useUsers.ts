import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    isEmployee: boolean;
}

export const useUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await axios.get(`${API_URL}/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const employees = users.filter(u => u.isEmployee);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const handleRefresh = () => fetchUsers();
        window.addEventListener('app-data-refresh', handleRefresh);
        window.addEventListener('users-updated', handleRefresh);
        return () => {
            window.removeEventListener('app-data-refresh', handleRefresh);
            window.removeEventListener('users-updated', handleRefresh);
        };
    }, []);

    return { users, employees, loading, error, refreshUsers: fetchUsers };
};
