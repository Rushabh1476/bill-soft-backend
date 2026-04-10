import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * GlobalRefreshTrigger
 * Dispatches sync events every 30 seconds to keep the app data fresh.
 * Listened to by various hooks (useProducts, useBills, useCustomers, etc.)
 */
const GlobalRefreshTrigger: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const triggerRefresh = () => {
      // console.log('[GlobalRefresh] Triggering 30s auto-update');
      
      // Dispatch specific events that hooks are already listening to
      window.dispatchEvent(new Event('inventory-updated'));
      window.dispatchEvent(new Event('bills-updated'));
      window.dispatchEvent(new Event('bill-created')); // Some hooks listen to this for customers/bills
      
      // New general event for hooks we'll update now
      window.dispatchEvent(new Event('app-data-refresh'));
    };

    // Initial delay to not interfere with mount loads
    const interval = setInterval(triggerRefresh, 30000);

    return () => clearInterval(interval);
  }, []);

  // Also trigger refresh on navigation to ensure fresh data when switching pages
  useEffect(() => {
    window.dispatchEvent(new Event('app-data-refresh'));
    window.dispatchEvent(new Event('inventory-updated'));
    window.dispatchEvent(new Event('bills-updated'));
  }, [location.pathname]);

  return null; // This component doesn't render anything
};

export default GlobalRefreshTrigger;
