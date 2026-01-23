import React from 'react';
import { AuthProvider } from './AuthContext';
import { CustomerProvider } from './CustomerContext';
import { ProductProvider } from './ProductContext';
import { BillProvider } from './BillContext';
import { SettingsProvider } from './SettingsContext';

/**
 * AppProviders component composes all domain-specific context providers
 * Follows the Composition pattern and Single Responsibility Principle
 * Each provider manages its own domain without coupling to others
 */
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <CustomerProvider>
          <ProductProvider>
            <BillProvider>
              {children}
            </BillProvider>
          </ProductProvider>
        </CustomerProvider>
      </SettingsProvider>
    </AuthProvider>
  );
};

// Re-export all context hooks for convenience
export { useAuth } from './AuthContext';
export { useCustomerContext } from './CustomerContext';
export { useProductContext } from './ProductContext';
export { useBillContext } from './BillContext';
export { useSettingsContext } from './SettingsContext';

export default AppProviders;