import { Role, Permission, UISettings, UserRoleType } from '../types/rbac';

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
      permissions: this.getAllPermissions(),
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
      permissions: this.getManagerPermissions(),
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
            totalPurchases: { visible: true, editable: false },
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

    // Accountant Role
    const accountantRole: Role = {
      id: 'ACCOUNTANT',
      name: 'ACCOUNTANT',
      displayName: 'Accountant',
      description: 'Billing and invoice access',
      permissions: this.getAccountantPermissions(),
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
          reporting: false,
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
            amount: { visible: true, editable: false },
            discount: { visible: true, editable: true },
            tax: { visible: false, editable: false },
            status: { visible: true, editable: true },
          },
          products: {
            name: { visible: true, editable: true },
            price: { visible: false, editable: false },
            category: { visible: true, editable: false },
            stock: { visible: true, editable: true },
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
      permissions: this.getViewerPermissions(),
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

    this.roles.set('ADMIN', adminRole);
    this.roles.set('MANAGER', managerRole);
    this.roles.set('ACCOUNTANT', accountantRole);
    this.roles.set('VIEWER', viewerRole);
  }

  private getAllPermissions(): Permission[] {
    return [
      { id: '1', name: 'customers:create', resource: 'customers', action: 'create' },
      { id: '2', name: 'customers:read', resource: 'customers', action: 'read' },
      { id: '3', name: 'customers:update', resource: 'customers', action: 'update' },
      { id: '4', name: 'customers:delete', resource: 'customers', action: 'delete' },
      { id: '5', name: 'customers:export', resource: 'customers', action: 'export' },
      { id: '6', name: 'bills:create', resource: 'bills', action: 'create' },
      { id: '7', name: 'bills:read', resource: 'bills', action: 'read' },
      { id: '8', name: 'bills:update', resource: 'bills', action: 'update' },
      { id: '9', name: 'bills:delete', resource: 'bills', action: 'delete' },
      { id: '10', name: 'bills:export', resource: 'bills', action: 'export' },
      { id: '11', name: 'products:create', resource: 'products', action: 'create' },
      { id: '12', name: 'products:read', resource: 'products', action: 'read' },
      { id: '13', name: 'products:update', resource: 'products', action: 'update' },
      { id: '14', name: 'products:delete', resource: 'products', action: 'delete' },
      { id: '15', name: 'products:export', resource: 'products', action: 'export' },
      { id: '16', name: 'settings:read', resource: 'settings', action: 'read' },
      { id: '17', name: 'settings:update', resource: 'settings', action: 'update' },
      { id: '18', name: 'admin:access', resource: 'admin', action: 'access' },
      { id: '19', name: 'reports:read', resource: 'reports', action: 'read' },
      { id: '20', name: 'reports:export', resource: 'reports', action: 'export' },
    ];
  }

  private getManagerPermissions(): Permission[] {
    return this.getAllPermissions().filter(p => p.resource !== 'admin');
  }

  private getAccountantPermissions(): Permission[] {
    return this.getAllPermissions().filter(p =>
      !['admin', 'settings'].includes(p.resource) &&
      !['delete', 'export'].includes(p.action)
    );
  }

  private getViewerPermissions(): Permission[] {
    return this.getAllPermissions().filter(p => p.action === 'read');
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
