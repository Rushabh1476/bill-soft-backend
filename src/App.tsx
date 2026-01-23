import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { modernTheme } from './theme/theme';
import { AppProviders } from './contexts/AppProviders';
import { useAuth } from './contexts/AuthContext'; 
import Layout from './components/common/Layout';
import TestDataManager from './components/common/TestDataManager';
import Dashboard from './pages/Dashboard';
import Bills from './pages/Bills';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Settings from './pages/Settings';
import UserSettings from './pages/UserSettings';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PrivacySettings from './pages/PrivacySettings';
import ChangePassword from './pages/ChangePassword';

/**
 * Protected Route Component to prevent unauthorized access
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={modernTheme}>
      <CssBaseline />
      <AppProviders>
        <Router>
          <Routes>
            {/* Public Routes - No Layout applied directly */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes - Wrapped in ProtectedRoute and Layout */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
            <Route path="/bills/new" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/customers/new" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/products/new" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/user-settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
            <Route path="/profile/*" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route path="/profile/privacy" element={<ProtectedRoute><PrivacySettings /></ProtectedRoute>} />
            
            {/* Redirect any unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <TestDataManager />
        </Router>
      </AppProviders>
    </ThemeProvider>
  );
};

export default App;