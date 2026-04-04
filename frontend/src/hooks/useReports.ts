import { useState, useCallback } from 'react';
import { getReportService } from '../services/DIContainer';

export const useReports = () => {
  const [inactiveCustomers, setInactiveCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportService = getReportService();

  const loadInactiveCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getInactiveCustomers();
      setInactiveCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inactive customers');
    } finally {
      setLoading(false);
    }
  }, [reportService]);

  const exportGSTReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getGSTReport();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export GST report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [reportService]);

  return {
    inactiveCustomers,
    loading,
    error,
    loadInactiveCustomers,
    exportGSTReport
  };
};
