import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { AppThemeProvider } from './contexts/ThemeContext';
import { AppProviders } from './contexts/AppProviders';
import Layout from './components/common/Layout';
import { PermissionGuard } from './contexts/PermissionsContext';
import { SectionLoader } from './components/common/LoadingScreen';
import GlobalRefreshTrigger from './components/common/GlobalRefreshTrigger';

import LandingPage from './pages/LandingPage';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import SetupPassword from './pages/SetupPassword';
import PublicInvoice from './pages/PublicInvoice';
import SetPassword from './pages/SetPassword';
import VerifyEmail from './pages/VerifyEmail';
import SupportPage from './pages/Support';
import PaymentPage from './pages/Payment';


import { lazyWithRetry } from './utils/lazyRetry';

// ── Lazily loaded (code-split — only downloaded when user navigates there) ─
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const Bills = lazyWithRetry(() => import('./pages/Bills'));
const ViewBill = lazyWithRetry(() => import('./pages/ViewBill'));
const Customers = lazyWithRetry(() => import('./pages/Customers'));
const Products = lazyWithRetry(() => import('./pages/Products'));
const Reports = lazyWithRetry(() => import('./pages/Reports'));
const Suppliers = lazyWithRetry(() => import('./pages/Suppliers'));
const Services = lazyWithRetry(() => import('./pages/Services'));
const ServiceTickets = lazyWithRetry(() => import('./pages/ServiceTickets'));
const PurchaseOrders = lazyWithRetry(() => import('./pages/PurchaseOrders'));
const ExpenseManager = lazyWithRetry(() => import('./pages/ExpenseManager'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));
const AdminPanel = lazyWithRetry(() => import('./pages/AdminPanel'));
const SubscriptionManagement = lazyWithRetry(() => import('./pages/SubscriptionManagement'));
const InvoiceTemplateLibrary = lazyWithRetry(() => import('./pages/InvoiceTemplateLibrary'));
const SuperAdminDashboard = lazyWithRetry(() => import('./pages/SuperAdminDashboard'));
const UserManagement = lazyWithRetry(() => import('./components/admin/UserManagement'));
const EmployeeManagement = lazyWithRetry(() => import('./components/admin/EmployeeManagement'));
const AuditLogs = lazyWithRetry(() => import('./pages/AuditLogs'));

const PageLoader = () => <SectionLoader />;

const App: React.FC = () => {
  // Task 2: Persistent Theme Persistence from Backend + Fallback
  useEffect(() => {
    // 1. Instant load from LocalStorage to prevent flicker
    const currentStoredColor = localStorage.getItem('brandColor') || '#305CDE';
    document.documentElement.style.setProperty('--primary-color', currentStoredColor);

    // 3. Real-time sync handled by ThemeContext.tsx (Single Source of Truth)
  }, []);

  return (
    <AppThemeProvider>
      <CssBaseline />
      <GlobalStyles styles={{
        /* Remove all focus/touch borders from Recharts charts */
        '.recharts-wrapper': { outline: 'none !important', border: 'none !important' },
        '.recharts-wrapper *': { outline: 'none !important' },
        '.recharts-wrapper svg': { outline: 'none !important', border: 'none !important' },
        '.recharts-wrapper svg:focus': { outline: 'none !important' },
        '.recharts-surface': { outline: 'none !important', border: 'none !important' },
        '.recharts-surface:focus': { outline: 'none !important' },
        '.recharts-wrapper rect:focus': { outline: 'none !important' },
        'svg.recharts-surface': { outline: 'none !important' },
        '.recharts-wrapper, .recharts-wrapper *': {
          WebkitTapHighlightColor: 'transparent !important',
        },
      }} />
      <AppProviders>
        <Router>
          <GlobalRefreshTrigger />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/set-password" element={<SetPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/setup-password" element={<SetupPassword />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/share/invoice/:id" element={<PublicInvoice />} />
              <Route path="/payment" element={<PaymentPage />} />


              <Route path="/*" element={
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/dashboard" element={<PermissionGuard require="view_dashboard"><Dashboard /></PermissionGuard>} />
                      <Route path="/" element={<PermissionGuard require="view_dashboard"><Dashboard /></PermissionGuard>} />
                      <Route path="/super-admin" element={<PermissionGuard require="super_admin_access"><SuperAdminDashboard /></PermissionGuard>} />
                      <Route path="/bills" element={<PermissionGuard require="view_bills"><Bills /></PermissionGuard>} />
                      <Route path="/bills/new" element={<PermissionGuard require="create_bills"><Bills /></PermissionGuard>} />
                      <Route path="/bills/view/:id" element={<ViewBill />} />
                      <Route path="/customers" element={<PermissionGuard require="view_customers"><Customers /></PermissionGuard>} />
                      <Route path="/customers/new" element={<PermissionGuard require="manage_customers"><Customers /></PermissionGuard>} />
                      <Route path="/products" element={<PermissionGuard require="view_products"><Products /></PermissionGuard>} />
                      <Route path="/products/new" element={<PermissionGuard require="manage_products"><Products /></PermissionGuard>} />
                      <Route path="/reports" element={<PermissionGuard require="view_reports"><Reports /></PermissionGuard>} />
                      <Route path="/admin" element={<PermissionGuard require="admin_access"><AdminPanel /></PermissionGuard>}>
                        <Route path="subscription" element={<SubscriptionManagement />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="employees" element={<EmployeeManagement />} />
                        <Route path="audit-logs" element={<AuditLogs />} />
                      </Route>
                      <Route path="/suppliers" element={<PermissionGuard require="view_customers"><Suppliers /></PermissionGuard>} />
                      <Route path="/services" element={<PermissionGuard require="manage_services"><Services /></PermissionGuard>} />
                      <Route path="/service-tickets" element={<PermissionGuard require="manage_services"><ServiceTickets /></PermissionGuard>} />
                      <Route path="/purchase-orders" element={<PermissionGuard require="view_products"><PurchaseOrders /></PermissionGuard>} />
                      <Route path="/expenses" element={<PermissionGuard require="manage_expenses"><ExpenseManager /></PermissionGuard>} />
                      <Route path="/templates" element={<InvoiceTemplateLibrary />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/settings/:tab" element={<Settings />} />
                    </Routes>
                  </Suspense>
                </Layout>
              } />
            </Routes>
          </Suspense>
        </Router>
      </AppProviders>
    </AppThemeProvider>
  );
};

export default App;
