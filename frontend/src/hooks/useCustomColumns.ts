import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

export interface CustomColumn {
  id: string;
  name: string;
  label: string;
  type: string;
  entity?: string;
  required?: boolean;
}

const DEFAULT_COLUMNS = ['Product Name', 'Quantity', 'Price', 'Total'];

export const useCustomColumns = (entity?: string) => {
  const [columns, setColumns] = useState<CustomColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchColumns = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const res = await axios.get(`${API_URL}/custom-columns`, {
        params: { entity },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const cols = res.data.columns || [];
      setColumns(cols);
      setError(null);
    } catch (err: any) {
      console.error('[useCustomColumns] Fetch failed:', err);
      setError(err.response?.data?.error || 'Failed to fetch columns');
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    fetchColumns();

    // Listen for global updates to keep multiple hook instances in sync
    const handleGlobalUpdate = () => {
      // console.log('[useCustomColumns] Global update detected, refreshing...');
      fetchColumns();
    };
    window.addEventListener('custom-columns-updated' as any, handleGlobalUpdate);
    return () => window.removeEventListener('custom-columns-updated' as any, handleGlobalUpdate);
  }, [fetchColumns]);

  const addColumn = async (data: Partial<CustomColumn>) => {
    try {
      if (!data.label) throw new Error('Column label required');
      const token = localStorage.getItem('authToken');
      
      const payload = {
        name: data.name || data.label.toLowerCase().trim().replace(/\s+/g, '_'),
        label: data.label.trim(),
        type: data.type || 'text',
        entity: data.entity || entity,
        required: !!data.required
      };

      const res = await axios.post(`${API_URL}/custom-columns`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Dispatch global event so other instances refresh
      window.dispatchEvent(new CustomEvent('custom-columns-updated', { detail: { entity } }));
      
      return res.data.column;
    } catch (err: any) {
      console.error('[useCustomColumns] Add failed:', err);
      throw new Error(err.response?.data?.error || 'Failed to create column');
    }
  };

  const removeColumn = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_URL}/custom-columns/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Dispatch global event so other instances refresh
      window.dispatchEvent(new CustomEvent('custom-columns-updated', { detail: { entity } }));
    } catch (err: any) {
      console.error('[useCustomColumns] Remove failed:', err);
      throw new Error(err.response?.data?.error || 'Failed to delete column');
    }
  };

  return {
    columns,
    loading,
    error,
    refreshColumns: fetchColumns,
    addColumn,
    removeColumn
  };
};
