import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { Customer } from '../../types/customer';
import { ICustomerCrudOperations } from '../../interfaces/customerInterfaces';
import { getCustomerService } from '../../services/DIContainer';

/**
 * CustomerSearch component demonstrates Interface Segregation Principle
 * Only depends on ICustomerCrudOperations for basic search functionality
 * This makes it more focused and easier to test/maintain
 */
interface CustomerSearchProps {
  onCustomerSelect: (customer: Customer) => void;
  searchService?: ICustomerCrudOperations; // Allows injection for testing
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({
  onCustomerSelect,
  searchService
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use injected service or get default - follows Dependency Inversion
  const service = searchService || getCustomerService();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all customers and filter locally for this example
      const allCustomers = await service.getCustomers();
      const filtered = allCustomers.filter(customer =>
        (customer.name && customer.name.toLowerCase().includes(query.toLowerCase())) ||
        (customer.email && customer.email.toLowerCase().includes(query.toLowerCase())) ||
        (customer.phone && customer.phone.includes(query))
      );
      setResults(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [query, service]);

  const loadAllCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const customers = await service.getCustomers();
      setResults(customers);
      setQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [service]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Customer Search
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          label="Search customers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading}
        >
          Search
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={loadAllCustomers}
          disabled={loading}
        >
          Load All Customers
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <List>
        {results.map((customer) => (
          <ListItem
            key={customer.id}
            onClick={() => onCustomerSelect(customer)}
            sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
          >
            <ListItemText
              primary={customer.name}
              secondary={`${customer.email} • ${customer.phone}`}
            />
          </ListItem>
        ))}
      </List>

      {!loading && results.length === 0 && query && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
          No customers found matching "{query}"
        </Typography>
      )}
    </Box>
  );
};

export default CustomerSearch;
