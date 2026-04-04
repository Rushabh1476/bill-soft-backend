export interface Permission {
  id: string;
  name: string;
  resource: string; // 'customers', 'bills', 'products', 'settings', 'admin'
  action: string; // 'create', 'read', 'update', 'delete', 'export', 'access'
  conditions?: Record<string, any>; // Additional conditions
}

export interface UISettings {
  navigation: {
    dashboard: boolean;
    customers: boolean;
    bills: boolean;
    products: boolean;
    settings: boolean;
    adminPanel: boolean;
  };
  features: {
    bulkOperations: boolean;
    dataExport: boolean;
    advancedFilters: boolean;
    reporting: boolean;
  };
  fieldAccess: {
    [module: string]: {
      [field: string]: {
        visible: boolean;
        editable: boolean;
        required?: boolean;
      };
    };
  };
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
  uiSettings: UISettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
  isActive: boolean;
}

export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  baseRole: Role;
  customizations: Partial<UISettings>;
}

export type UserRoleType = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'VIEWER' | 'FINANCE' | 'OPERATOR' | 'STAFF';
