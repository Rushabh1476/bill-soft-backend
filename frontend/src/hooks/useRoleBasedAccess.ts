import { usePermissions } from '../contexts/PermissionsContext';

export interface RolePermissions {
  canViewDashboard: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canViewBills: boolean;
  canCreateBills: boolean;
  canEditBills: boolean;
  canDeleteBills: boolean;
  canViewReports: boolean;
  canViewCustomers: boolean;
  canManageCustomers: boolean;
  canViewProducts: boolean;
  canManageProducts: boolean;
  canManageServices: boolean;
  canManageExpenses: boolean;
  canViewAuditLogs: boolean;
  canAccessTaxReports: boolean;
  canViewSubscription: boolean;
  canViewAdminPanel: boolean;
  canAccessBulkOperations: boolean;
  canViewSuppliers: boolean;
  canViewTemplates: boolean;
  canViewSuperAdmin: boolean;
  canManageServiceTickets: boolean;
  canManagePurchaseOrders: boolean;
}

export const useRoleBasedAccess = (): RolePermissions => {
  const { permissions, isAdmin, isSuperAdmin, role } = usePermissions();

  // Super Admin gets ONLY the Control Panel
  if (isSuperAdmin || role === 'SUPER_ADMIN') {
    return {
      canViewDashboard: false,
      canManageUsers: false,
      canManageSettings: true,
      canViewBills: false,
      canCreateBills: false,
      canEditBills: false,
      canDeleteBills: false,
      canViewReports: false,
      canViewCustomers: false,
      canManageCustomers: false,
      canViewProducts: false,
      canManageProducts: false,
      canManageServices: false,
      canManageExpenses: false,
      canViewAuditLogs: true,
      canAccessTaxReports: false,
      canViewSubscription: false,
      canViewAdminPanel: false,
      canAccessBulkOperations: false,
      canViewSuppliers: false,
      canViewTemplates: false,
      canViewSuperAdmin: true,
      canManageServiceTickets: false,
      canManagePurchaseOrders: false,
    };
  }

  // Regular Admin gets everything for their company
  if (isAdmin || role === 'ADMIN') {
    return {
      canViewDashboard: true,
      canManageUsers: true,
      canManageSettings: true,
      canViewBills: true,
      canCreateBills: true,
      canEditBills: true,
      canDeleteBills: true,
      canViewReports: true,
      canViewCustomers: true,
      canManageCustomers: true,
      canViewProducts: true,
      canManageProducts: true,
      canManageServices: true,
      canManageExpenses: true,
      canViewAuditLogs: true,
      canAccessTaxReports: true,
      canViewSubscription: true,
      canViewAdminPanel: true,
      canAccessBulkOperations: true,
      canViewSuppliers: true,
      canViewTemplates: true,
      canViewSuperAdmin: false,
      canManageServiceTickets: true,
      canManagePurchaseOrders: true,
    };
  }

  // Staff/User permissions check
  const hasPerm = (key: string) => {
    return permissions.includes(key) || permissions.includes('all_access') || permissions.includes('all');
  };

  return {
    canViewDashboard: true, // Basic access
    canManageUsers: hasPerm('manage_users') || hasPerm('staff_management'),
    canManageSettings: hasPerm('manage_settings') || hasPerm('business_settings'),
    canViewBills: hasPerm('view_bills') || hasPerm('create_bills'),
    canCreateBills: hasPerm('create_bills'),
    canEditBills: hasPerm('edit_bills'),
    canDeleteBills: hasPerm('delete_bills'),
    canViewReports: hasPerm('view_reports') || hasPerm('basic_reports'),
    canViewCustomers: hasPerm('view_customers') || hasPerm('manage_customers'),
    canManageCustomers: hasPerm('manage_customers') || hasPerm('edit_customers'),
    canViewProducts: hasPerm('view_products') || hasPerm('manage_products'),
    canManageProducts: hasPerm('manage_products') || hasPerm('create_products'),
    canManageServices: hasPerm('manage_services') || hasPerm('create_services'),
    canManageExpenses: hasPerm('manage_expenses'),
    canViewAuditLogs: hasPerm('view_audit_logs'),
    canAccessTaxReports: hasPerm('tax_gst_reports'),
    canViewSubscription: hasPerm('subscription_view'),
    canViewAdminPanel: hasPerm('admin_access'),
    canAccessBulkOperations: hasPerm('export_reports') || hasPerm('bulk_operations'),
    canViewSuppliers: hasPerm('view_suppliers') || hasPerm('view_customers'),
    canViewTemplates: true, // Made accessible to everyone for Bill Size feature
    canViewSuperAdmin: false, // Only Super Admin role gets this
    canManageServiceTickets: hasPerm('manage_services') || hasPerm('view_bills'),
    canManagePurchaseOrders: hasPerm('manage_products') || hasPerm('view_products'),
  };
};

export default useRoleBasedAccess;
