import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { initializeTestData, clearTestData, hasTestData } from '../../data/testData';

const TestDataManager: React.FC = () => {
  const [dataExists, setDataExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setDataExists(hasTestData());
  }, []);

  const handleInitializeData = async () => {
    setLoading(true);
    try {
      initializeTestData();
      setDataExists(true);
      setMessage('Test data initialized successfully!');
      setTimeout(() => setMessage(''), 3000);
      // Refresh the page to reload data
      window.location.reload();
    } catch (error) {
      setMessage('Failed to initialize test data');
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    setLoading(true);
    try {
      clearTestData();
      setDataExists(false);
      setMessage('Test data cleared successfully!');
      setTimeout(() => setMessage(''), 3000);
      // Refresh the page to reload data
      window.location.reload();
    } catch (error) {
      setMessage('Failed to clear test data');
    } finally {
      setLoading(false);
    }
  };

  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    return (
      <Box sx={{ 
        position: 'fixed', 
        bottom: 16, 
        left: 16, 
        zIndex: 1000,
        backgroundColor: 'background.paper',
        p: 2,
        borderRadius: 2,
        boxShadow: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          Development Mode
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {loading ? (
            <CircularProgress size={20} />
          ) : (
            <>
              {!dataExists ? (
                <Button 
                  size="small" 
                  variant="contained" 
                  onClick={handleInitializeData}
                >
                  Load Test Data
                </Button>
              ) : (
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={handleClearData}
                  color="error"
                >
                  Clear Data
                </Button>
              )}
            </>
          )}
        </Box>
        {message && (
          <Alert severity="success" sx={{ mt: 1, py: 0 }}>
            {message}
          </Alert>
        )}
      </Box>
    );
  }

  return null;
};

export default TestDataManager;
