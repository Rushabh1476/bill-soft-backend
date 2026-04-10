/* eslint-disable */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Customer } from '../types/customer';
import { 
  OptimizedCustomerService, 
  CustomerQueryOptions, 
  PaginatedCustomers, 
  CustomerStats,
  SearchOptions
} from '../services/optimizedCustomerService';

/**
 * Optimized React hook for customer management with advanced caching and performance features
 */
export interface UseOptimizedCustomersOptions extends CustomerQueryOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enablePrefetching?: boolean;
  preloadRelated?: boolean;
}

export interface UseOptimizedCustomersReturn {
  // Data
  customers: Customer[];
  total: number;
  stats: CustomerStats | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isSearching: boolean;
  isLoadingMore: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  search: (query: string, options?: SearchOptions) => Promise<void>;
  clearSearch: () => void;
  prefetchPage: (page: number) => Promise<void>;
  
  // CRUD operations
  createCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer>;
  updateCustomer: (customer: Customer) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  
  // Utility
  invalidateCache: () => void;
  exportCustomers: (format: 'json' | 'csv') => Promise<void>;
  
  // Selection management
  selectedCustomers: string[];
  selectCustomer: (id: string) => void;
  deselectCustomer: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

export function useOptimizedCustomers(
  customerService: OptimizedCustomerService,
  options: UseOptimizedCustomersOptions = {}
): UseOptimizedCustomersReturn {
  const {
    page = 1,
    limit = 25,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    filters = {},
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    enablePrefetching = true,
    preloadRelated = false,
  } = options;

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  
  // Selection state
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  // Computed values
  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);
  const hasNext = useMemo(() => currentPage < totalPages, [currentPage, totalPages]);
  const hasPrev = useMemo(() => currentPage > 1, [currentPage]);

  // Load customers with optimized query
  const loadCustomers = useCallback(async (
    queryOptions: CustomerQueryOptions = {},
    resetData = true
  ): Promise<void> => {
    try {
      if (resetData) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      setError(null);

      const options: CustomerQueryOptions = {
        page: currentPage,
        limit,
        sortBy,
        sortOrder,
        filters,
        includeStats: true,
        ...queryOptions,
      };

      const result: PaginatedCustomers = await customerService.getCustomers(options);
      
      if (resetData) {
        setCustomers(result.data);
      } else {
        // Append for load more
        setCustomers(prev => [...prev, ...result.data]);
      }
      
      setTotal(result.total);
      setCurrentPage(result.page);
      
      // Load stats if on first page
      if (result.page === 1) {
        try {
          const customerStats = await customerService.getCustomerStats();
          setStats(customerStats);
        } catch (statsError) {
          console.warn('Failed to load customer stats:', statsError);
        }
      }
      
      // Prefetch next page if enabled
      if (enablePrefetching && result.hasNext) {
        customerService.getCustomers({
          ...options,
          page: result.page + 1,
        }).catch(() => {}); // Silent prefetch
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load customers';
      setError(errorMessage);
      console.error('Error loading customers:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [customerService, currentPage, limit, sortBy, sortOrder, filters, enablePrefetching]);

  // Search functionality
  const search = useCallback(async (query: string, searchOptions: SearchOptions = {}): Promise<void> => {
    setIsSearching(true);
    setError(null);
    
    try {
      if (!query.trim()) {
        setIsSearchMode(false);
        setSearchQuery('');
        await loadCustomers({ page: 1 });
        return;
      }
      
      setSearchQuery(query);
      setIsSearchMode(true);
      
      const result = await customerService.searchCustomers(query, {
        page: 1,
        limit,
        ...searchOptions,
      });
      
      setCustomers(result.data);
      setTotal(result.total);
      setCurrentPage(1);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
    } finally {
      setIsSearching(false);
    }
  }, [customerService, limit, loadCustomers]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearchMode(false);
    setCurrentPage(1);
    loadCustomers({ page: 1 });
  }, [loadCustomers]);

  // Refresh data
  const refresh = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    
    if (isSearchMode && searchQuery) {
      await search(searchQuery);
    } else {
      await loadCustomers({ page: currentPage });
    }
  }, [isSearchMode, searchQuery, search, loadCustomers, currentPage]);

  // Load more (pagination)
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasNext || isLoadingMore) return;
    
    const nextPage = currentPage + 1;
    
    if (isSearchMode && searchQuery) {
      setIsLoadingMore(true);
      try {
        const result = await customerService.searchCustomers(searchQuery, {
          page: nextPage,
          limit,
        });
        
        setCustomers(prev => [...prev, ...result.data]);
        setCurrentPage(nextPage);
      } catch (err) {
        setError('Failed to load more results');
      } finally {
        setIsLoadingMore(false);
      }
    } else {
      await loadCustomers({ page: nextPage }, false);
    }
  }, [hasNext, isLoadingMore, currentPage, isSearchMode, searchQuery, customerService, limit, loadCustomers]);

  // Prefetch specific page
  const prefetchPage = useCallback(async (page: number): Promise<void> => {
    if (!enablePrefetching) return;
    
    try {
      await customerService.getCustomers({
        page,
        limit,
        sortBy,
        sortOrder,
        filters,
      });
    } catch (error) {
      // Silent prefetch failure
      console.warn(`Prefetch failed for page ${page}:`, error);
    }
  }, [enablePrefetching, customerService, limit, sortBy, sortOrder, filters]);

  // CRUD operations
  const createCustomer = useCallback(async (
    customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Customer> => {
    try {
      const newCustomer = await customerService.createCustomer(customerData);
      
      // Refresh current view
      await refresh();
      
      return newCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create customer';
      setError(errorMessage);
      throw err;
    }
  }, [customerService, refresh]);

  const updateCustomer = useCallback(async (customer: Customer): Promise<Customer> => {
    try {
      const updatedCustomer = await customerService.updateCustomer(customer);
      
      // Update local state
      setCustomers(prev => 
        prev.map(c => c.id === customer.id ? updatedCustomer : c)
      );
      
      return updatedCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update customer';
      setError(errorMessage);
      throw err;
    }
  }, [customerService]);

  const deleteCustomer = useCallback(async (id: string): Promise<void> => {
    try {
      await customerService.deleteCustomer(id);
      
      // Remove from local state
      setCustomers(prev => prev.filter(c => c.id !== id));
      setSelectedCustomers(prev => prev.filter(cId => cId !== id));
      setTotal(prev => prev - 1);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete customer';
      setError(errorMessage);
      throw err;
    }
  }, [customerService]);

  // Selection management
  const selectCustomer = useCallback((id: string) => {
    setSelectedCustomers(prev => 
      prev.includes(id) ? prev : [...prev, id]
    );
  }, []);

  const deselectCustomer = useCallback((id: string) => {
    setSelectedCustomers(prev => prev.filter(cId => cId !== id));
  }, []);

  const selectAll = useCallback(() => {
    setSelectedCustomers(customers.map(c => c.id));
  }, [customers]);

  const clearSelection = useCallback(() => {
    setSelectedCustomers([]);
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedCustomers.includes(id);
  }, [selectedCustomers]);

  // Utility functions
  const invalidateCache = useCallback(() => {
    customerService.invalidateCache();
    refresh();
  }, [customerService, refresh]);

  const exportCustomers = useCallback(async (format: 'json' | 'csv'): Promise<void> => {
    try {
      const blob = await customerService.exportCustomers(format, { filters });
      
      // Download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      setError(errorMessage);
    }
  }, [customerService, filters]);

  // Initial load
  useEffect(() => {
    loadCustomers();
  }, [page, limit, sortBy, sortOrder]); // Don't include loadCustomers in deps to avoid infinite loop

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;
    
    const interval = setInterval(() => {
      if (!isLoading && !isRefreshing && !isSearching) {
        refresh();
      }
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isLoading, isRefreshing, isSearching]); // Don't include refresh

  // Prefetch related data
  useEffect(() => {
    if (!preloadRelated || !customers.length) return;
    
    // Extract related IDs for prefetching (e.g., recent customers, frequently accessed)
    const recentIds = customers.slice(0, 10).map(c => c.id);
    customerService.prefetchCustomers(recentIds);
  }, [customers, preloadRelated, customerService]);

  return {
    // Data
    customers,
    total,
    stats,
    
    // Pagination
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    
    // Loading states
    isLoading,
    isRefreshing,
    isSearching,
    isLoadingMore,
    
    // Error state
    error,
    
    // Actions
    refresh,
    loadMore,
    search,
    clearSearch,
    prefetchPage,
    
    // CRUD operations
    createCustomer,
    updateCustomer,
    deleteCustomer,
    
    // Utility
    invalidateCache,
    exportCustomers,
    
    // Selection management
    selectedCustomers,
    selectCustomer,
    deselectCustomer,
    selectAll,
    clearSelection,
    isSelected,
  };
}
