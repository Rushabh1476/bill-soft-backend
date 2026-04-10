
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';

export interface Expense {
    id: string;
    title: string;
    category: string;
    amount: number;
    gstAmount?: number;
    date: string;
    description?: string;
    branchId?: string | null;
}

export const useExpenses = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categoryBreakdown, setCategoryBreakdown] = useState<any>({});
    const [loading, setLoading] = useState(true);

    const fetchExpenses = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/expenses?t=${Date.now()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error("Received non-JSON response from server. Check console for details.");
            }

            const data = await response.json();
            if (response.ok) {
                setExpenses(data.expenses || []);
                setCategoryBreakdown(data.categoryBreakdown || {});
            } else {
                console.error('Fetch expenses failed:', data.error);
            }
        } catch (error) {
            console.error('Fetch expenses error:', error);
        } finally {
            setLoading(false);
        }
    };

    const addExpense = async (expenseData: any) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(expenseData)
            });

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error("Server returned an error (not JSON). Check server logs.");
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save expense');
            }

            await fetchExpenses();
        } catch (error) {
            console.error('Add expense error:', error);
            alert(error instanceof Error ? error.message : 'Failed to record expense');
            throw error; // Re-throw to let the UI know it failed
        }
    };

    useEffect(() => {
        if (user) fetchExpenses();
    }, [user]);

    useEffect(() => {
        const handleRefresh = () => fetchExpenses();
        window.addEventListener('app-data-refresh', handleRefresh);
        window.addEventListener('expenses-updated', handleRefresh);
        return () => {
            window.removeEventListener('app-data-refresh', handleRefresh);
            window.removeEventListener('expenses-updated', handleRefresh);
        };
    }, [user]);

    return { expenses, categoryBreakdown, loading, addExpense };
};
