/* eslint-disable */
import { Role, Permission, UISettings } from '../types/rbac';

class RBACService {
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string, string[]> = new Map();
  private roleSettings: Map<string, UISettings> = new Map();

  constructor() {
    this.initializeDefaultRoles();
  }

  private initializeDefaultRoles() {
    // Administrator Role
    const adminRole: Role = {
      id: 'ADMIN',
      name: 'ADMIN',
      displayName: 'Administrator',
      description: 'Full system access with all permissions',
      permissions: this.getPermissionsFor('ADMIN'),
      uiSettings: {
        navigation: {
          dashboard: true,
          customers: true,
          bills: true,
          products: true,
          settings: true,
          adminPanel: true,
        },
        features: {
          bulkOperations: true,
          dataExport: true,
          advancedFilters: true,
          reporting: true,
        },
        fieldAccess: {
          customers: {
            name: { visible: true, editable: true },
            email: { visible: true, editable: true },
            phone: { visible: true, editable: true },
            company: { visible: true, editable: true },
            address: { visible: true, editable: true },
            totalPurchases: { visible: true, editable: true },
          },
          bills: {
            invoiceNumber: { visible: true, editable: true },
            amount: { visible: true, editable: true },
            discount: { visible: true, editable: true },
            tax: { visible: true, editable: true },
            status: { visible: true, editable: true },
          },
          products: {
            name: { visible: true, editable: true },
            price: { visible: true, editable: true },
            category: { visible: true, editable: true },
            stock: { visible: true, editable: true },
          },
        },
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Manager Role
    const managerRole: Role = {
      id: 'MANAGER',
      name: 'MANAGER',
      displayName: 'Manager',
      description: 'Management access with most permissions',
      permissions: this.getPermissionsFor('MANAGER'),
      uiSettings: {
        navigation: {
          dashboard: true,
          customers: true,
          bills: true,
          products: true,
          settings: true,
          adminPanel: false,
        },
        features: {
          bulkOperations: true,
          dataExport: true,
          advancedFilters: true,
          reporting: true,
        },
        fieldAccess: {
          customers: {
            name: { visible: true, editable: true },
            email: { visible: true, editable: true },
            phone: { visible: true, editable: true },
            company: { visible: true, editable: false },
            address: { visible: true, editable: true },
            totalPurchases: { visible: false, editable: false },
          },
          bills: {
            invoiceNumber: { visible: true, editable: false },
            amount: { visible: true, editable: true },
            discount: { visible: true, editable: true },
            tax: { visible: true, editable: false },
            status: { visible: true, editable: true },
          },
          products: {
            name: { visible: true, editable: true },
            price: { visible: true, editable: true },
            category: { visible: true, editable: true },
            stock: { visible: true, editable: true },
          },
        },
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Accountant Role - Focus: Money and Tax, NO Product Management
    const accountantRole: Role = {
      id: 'ACCOUNTANT',
      name: 'ACCOUNTANT',
      displayName: 'Accountant',
      description: 'Billing, Expenses and Tax access',
      permissions: this.getPermissionsFor('ACCOUNTANT'),
      uiSettings: {
        navigation: {
          dashboard: true,
          customers: true,
          bills: true,
          products: false,
          settings: false,
          adminPanel: false,
        },
        features: {
          bulkOperations: false,
          dataExport: true,
          advancedFilters: true,
          reporting: true,
        },
        fieldAccess: {
          customers: {
            name: { visible: true, editable: false },
            email: { visible: true, editable: false },
            phone: { visible: true, editable: false },
            company: { visible: true, editable: false },
            address: { visible: true, editable: false },
            totalPurchases: { visible: true, editable: false },
          },
          bills: {
            invoiceNumber: { visible: true, editable: false },
            amount: { visible: true, editable: false },
            discount: { visible: true, editable: true },
            tax: { visible: true, editable: false },
            status: { visible: true, editable: true },
          },
          products: {
            name: { visible: true, editable: false },
            price: { visible: true, editable: false },
            category: { visible: true, editable: false },
            stock: { visible: true, editable: false },
          },
        },
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Viewer Role
    const viewerRole: Role = {
      id: 'VIEWER',
      name: 'VIEWER',
      displayName: 'Viewer',
      description: 'Read-only access',
      permissions: this.getPermissionsFor('VIEWER'),
      uiSettings: {
        navigation: {
          dashboard: true,
          customers: false,
          bills: true,
          products: true,
          settings: false,
          adminPanel: false,
        },
        features: {
          bulkOperations: false,
          dataExport: false,
          advancedFilters: false,
          reporting: false,
        },
        fieldAccess: {
          customers: {
            name: { visible: true, editable: false },
            email: { visible: true, editable: false },
            phone: { visible: true, editable: false },
            company: { visible: true, editable: false },
            address: { visible: true, editable: false },
            totalPurchases: { visible: false, editable: false },
          },
          bills: {
            invoiceNumber: { visible: true, editable: false },
            amount: { visible: false, editable: false },
            discount: { visible: false, editable: false },
            tax: { visible: false, editable: false },
            status: { visible: true, editable: false },
          },
          products: {
            name: { visible: true, editable: false },
            price: { visible: false, editable: false },
            category: { visible: true, editable: false },
            stock: { visible: false, editable: false },
          },
        },
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Finance Role - Focus: Reports and Audit
    const financeRole: Role = {
      id: 'FINANCE',
      name: 'FINANCE',
      displayName: 'Finance',
      description: 'Audit and Reporting access',
      permissions: this.getPermissionsFor('FINANCE'),
      uiSettings: {
        navigation: {
          dashboard: true,
          customers: true,
          bills: true,
          products: false,
          settings: false,
          adminPanel: false,
        },
        features: {
          bulkOperations: false,
          dataExport: true,
          advancedFilters: true,
          reporting: true,
        },
        fieldAccess: {
          customers: {
            name: { visible: true, editable: false },
            email: { visible: true, editable: false },
            phone: { visible: true, editable: false },
            company: { visible: true, editable: false },
            address: { visible: true, editable: false },
            totalPurchases: { visible: true, editable: false },
          },
          bills: {
            invoiceNumber: { visible: true, editable: false },
            amount: { visible: true, editable: false },
            status: { visible: true, editable: false },
          },
          products: {
            name: { visible: true, editable: false },
            price: { visible: true, editable: false },
          },
        },
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Operator Role - Focus: Daily Operations
    const operatorRole: Role = {
      id: 'OPERATOR',
      name: 'OPERATOR',
      displayName: 'Operator',
      description: 'Inventory and Billing tasks',
      permissions: this.getPermissionsFor('OPERATOR'),
      uiSettings: {
        navigation: {
          dashboard: true,
          customers: false,
          bills: true,
          products: true,
          settings: false,
          adminPanel: false,
        },
        features: {
          bulkOperations: false,
          dataExport: false,
          advancedFilters: true,
          reporting: false,
        },
        fieldAccess: {
          customers: {
            name: { visible: true, editable: false },
          },
          bills: {
            invoiceNumber: { visible: true, editable: false },
            amount: { visible: true, editable: true },
            status: { visible: true, editable: true },
          },
          products: {
            name: { visible: true, editable: true },
            stock: { visible: true, editable: true },
          },
        },
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Read-Only Role
    const readOnlyRole: Role = {
      id: 'READONLY',
      name: 'READONLY',
      displayName: 'Read Only',
      description: 'View only access',
      permissions: this.getPermissionsFor('READONLY'),
      uiSettings: {
        navigation: {
          dashboard: true,
          customers: true,
          bills: true,
          products: true,
          settings: false,
          adminPanel: false,
        },
        features: {
          bulkOperations: false,
          dataExport: false,
          advancedFilters: true,
          reporting: true,
        },
        fieldAccess: {
          customers: {
            name: { visible: true, editable: false },
            email: { visible: true, editable: false },
          },
          bills: {
            invoiceNumber: { visible: true, editable: false },
            amount: { visible: true, editable: false },
          },
          products: {
            name: { visible: true, editable: false },
            price: { visible: true, editable: false },
          },
        },
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.roles.set('ADMIN', adminRole);
    this.roles.set('MANAGER', managerRole);
    this.roles.set('ACCOUNTANT', accountantRole);
    this.roles.set('FINANCE', financeRole);
    this.roles.set('OPERATOR', operatorRole);
    this.roles.set('READONLY', readOnlyRole);
    this.roles.set('VIEWER', viewerRole);
  }

  private getPermissionsFor(role: string): Permission[] {
    const roleDefaults: Record<string, string[]> = {
      ADMIN: ['all_access'],
      MANAGER: [
        'view_bills', 'create_bills', 'edit_bills', 'delete_bills', 'bills:export',
        'view_products', 'manage_products', 'manage_services',
        'view_customers', 'manage_customers', 'view_reports', 'manage_expenses'
      ],
      ACCOUNTANT: [
        'view_bills', 'create_bills', 'view_reports', 'tax_gst_reports', 'manage_expenses', 'view_customers'
      ],
      FINANCE: [
        'view_bills', 'view_reports', 'tax_gst_reports', 'view_audit_logs', 'view_customers'
      ],
      OPERATOR: [
        'view_products', 'manage_products', 'view_bills', 'create_bills'
      ],
      READONLY: ['view_bills', 'view_products', 'view_customers', 'view_reports'],
      VIEWER: ['view_bills', 'view_products']
    };

    const keys = roleDefaults[role] || roleDefaults.VIEWER;
    return keys.map((key, index) => {
      let resource = 'unknown';
      let action = 'unknown';

      if (key === 'all_access') {
        resource = 'all';
        action = 'all';
      } else if (key.includes(':')) {
        // e.g., 'bills:export'
        [resource, action] = key.split(':');
      } else if (key.includes('_')) {
        // e.g., 'view_bills', 'manage_products'
        const parts = key.split('_');
        action = parts[0];
        resource = parts.slice(1).join('_'); // In case resource itself has underscores
      } else {
        // Fallback for single-word permissions if any
        resource = key;
        action = 'view'; // Default action
      }

      return {
        id: `p-${role}-${index}`,
        name: key, // This is what the UI (hasPerm) expects
        resource: resource,
        action: action
      };
    });
  }

  // Public methods
  getRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }

  updateRoleSettings(roleId: string, settings: Partial<UISettings>): void {
    const role = this.roles.get(roleId);
    if (role) {
      role.uiSettings = this.mergeSettings(role.uiSettings, settings);
      role.updatedAt = new Date();
      this.roles.set(roleId, role);

      // Also update the local settings cache
      this.roleSettings.set(roleId, role.uiSettings);
    }
  }

  private mergeSettings(current: UISettings, updates: Partial<UISettings>): UISettings {
    return {
      navigation: { ...current.navigation, ...updates.navigation },
      features: { ...current.features, ...updates.features },
      fieldAccess: this.mergeFieldAccess(current.fieldAccess, updates.fieldAccess),
    };
  }

  private mergeFieldAccess(
    current: UISettings['fieldAccess'],
    updates?: UISettings['fieldAccess']
  ): UISettings['fieldAccess'] {
    if (!updates) return current;

    const merged = { ...current };
    Object.keys(updates).forEach(module => {
      if (updates[module]) {
        merged[module] = { ...current[module], ...updates[module] };
      }
    });
    return merged;
  }

  hasPermission(roleId: string, resource: string, action: string): boolean {
    const role = this.roles.get(roleId);
    if (!role) return false;

    // Check for 'all_access' first
    if (role.permissions.some(p => p.name === 'all_access')) {
      return true;
    }

    return role.permissions.some(p =>
      p.resource === resource && p.action === action
    );
  }

  canAccessNavigation(roleId: string, nav: keyof UISettings['navigation']): boolean {
    const role = this.roles.get(roleId);
    return role?.uiSettings.navigation[nav] || false;
  }

  canUseFeature(roleId: string, feature: keyof UISettings['features']): boolean {
    const role = this.roles.get(roleId);
    return role?.uiSettings.features[feature] || false;
  }

  getFieldAccess(roleId: string, module: string, field: string) {
    const role = this.roles.get(roleId);
    return role?.uiSettings.fieldAccess[module]?.[field] || { visible: false, editable: false };
  }

  // Advanced permission checking
  canPerformAction(roleId: string, resource: string, action: string, context?: any): boolean {
    if (!this.hasPermission(roleId, resource, action)) {
      return false;
    }

    // Add contextual permission checks here
    // For example, users might only be able to edit their own records
    return true;
  }

  // Bulk permission checking
  getPermissionMatrix(roleId: string): Record<string, Record<string, boolean>> {
    const role = this.roles.get(roleId);
    if (!role) return {};

    const matrix: Record<string, Record<string, boolean>> = {};
    role.permissions.forEach(permission => {
      if (!matrix[permission.resource]) {
        matrix[permission.resource] = {};
      }
      matrix[permission.resource][permission.action] = true;
    });

    return matrix;
  }
}

export const rbacService = new RBACService();
