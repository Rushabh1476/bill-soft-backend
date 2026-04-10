// Local type definitions for RBAC system
export enum UserRole {
  ADMIN = 'ADMIN',
  FINANCE = 'FINANCE',
  OPERATOR = 'OPERATOR',
  READONLY = 'READONLY'
}

export enum Permission {
  BILLING_READ = 'BILLING_READ',
  BILLING_WRITE = 'BILLING_WRITE',
  BILLING_DELETE = 'BILLING_DELETE',
  CUSTOMERS_READ = 'CUSTOMERS_READ',
  CUSTOMERS_WRITE = 'CUSTOMERS_WRITE',
  CUSTOMERS_DELETE = 'CUSTOMERS_DELETE',
  PRODUCTS_READ = 'PRODUCTS_READ',
  PRODUCTS_WRITE = 'PRODUCTS_WRITE',
  PRODUCTS_DELETE = 'PRODUCTS_DELETE',
  REPORTS_READ = 'REPORTS_READ',
  REPORTS_EXPORT = 'REPORTS_EXPORT',
  API_READ = 'API_READ',
  API_WRITE = 'API_WRITE',
  ADMIN_SETTINGS = 'ADMIN_SETTINGS',
  USER_MANAGEMENT = 'USER_MANAGEMENT'
}

export interface RolePermissionConfig {
  role: UserRole;
  permissions: {
    permission: Permission;
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  }[];
}

// In-memory storage for demo purposes
const ROLE_PERMISSIONS: { [key in UserRole]: Permission[] } = {
  [UserRole.ADMIN]: [
    Permission.BILLING_READ, Permission.BILLING_WRITE, Permission.BILLING_DELETE,
    Permission.CUSTOMERS_READ, Permission.CUSTOMERS_WRITE, Permission.CUSTOMERS_DELETE,
    Permission.PRODUCTS_READ, Permission.PRODUCTS_WRITE, Permission.PRODUCTS_DELETE,
    Permission.REPORTS_READ, Permission.REPORTS_EXPORT,
    Permission.API_READ, Permission.API_WRITE,
    Permission.ADMIN_SETTINGS, Permission.USER_MANAGEMENT
  ],
  [UserRole.FINANCE]: [
    Permission.BILLING_READ, Permission.BILLING_WRITE,
    Permission.CUSTOMERS_READ, Permission.CUSTOMERS_WRITE,
    Permission.PRODUCTS_READ,
    Permission.REPORTS_READ, Permission.REPORTS_EXPORT
  ],
  [UserRole.OPERATOR]: [
    Permission.BILLING_READ, Permission.BILLING_WRITE,
    Permission.CUSTOMERS_READ, Permission.CUSTOMERS_WRITE,
    Permission.PRODUCTS_READ, Permission.PRODUCTS_WRITE
  ],
  [UserRole.READONLY]: [
    Permission.BILLING_READ,
    Permission.CUSTOMERS_READ,
    Permission.PRODUCTS_READ,
    Permission.REPORTS_READ
  ]
};

// Demo user-role mapping
const USER_ROLES: { [userId: string]: UserRole } = {
  'demo-admin': UserRole.ADMIN,
  'demo-finance': UserRole.FINANCE,
  'demo-operator': UserRole.OPERATOR,
  'demo-readonly': UserRole.READONLY
};

export class SimplifiedRBACService {
  private static instance: SimplifiedRBACService;

  public static getInstance(): SimplifiedRBACService {
    if (!SimplifiedRBACService.instance) {
      SimplifiedRBACService.instance = new SimplifiedRBACService();
    }
    return SimplifiedRBACService.instance;
  }

  /**
   * Check if user has permission
   */
  public async hasPermission(
    userId: string, 
    permission: Permission, 
    action: 'read' | 'write' | 'delete' = 'read'
  ): Promise<boolean> {
    const userRole = USER_ROLES[userId] || UserRole.READONLY;
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    
    if (!rolePermissions.includes(permission)) {
      return false;
    }

    // For demo purposes, assume all permissions allow read/write based on permission type
    switch (action) {
      case 'read':
        return true; // If permission exists, read is allowed
      case 'write':
        return !permission.includes('READ'); // Write allowed if not read-only permission
      case 'delete':
        return permission.includes('DELETE') || userRole === UserRole.ADMIN;
      default:
        return false;
    }
  }

  /**
   * Get user's role and permissions
   */
  public async getUserPermissions(userId: string): Promise<{
    role: UserRole | null;
    permissions: {
      permission: Permission;
      canRead: boolean;
      canWrite: boolean;
      canDelete: boolean;
    }[];
  }> {
    const userRole = USER_ROLES[userId];
    
    if (!userRole) {
      return { role: null, permissions: [] };
    }

    const rolePermissions = ROLE_PERMISSIONS[userRole];
    
    const permissions = rolePermissions.map(permission => ({
      permission,
      canRead: true,
      canWrite: !permission.includes('READ'),
      canDelete: permission.includes('DELETE') || userRole === UserRole.ADMIN
    }));

    return {
      role: userRole,
      permissions
    };
  }

  /**
   * Get all roles with their permissions
   */
  public async getAllRoles(): Promise<{
    id: string;
    name: UserRole;
    displayName: string;
    description: string;
    permissions: {
      permission: Permission;
      canRead: boolean;
      canWrite: boolean;
      canDelete: boolean;
    }[];
  }[]> {
    return Object.entries(ROLE_PERMISSIONS).map(([roleName, permissions]) => {
      const role = roleName as UserRole;
      return {
        id: role,
        name: role,
        displayName: this.getRoleDisplayName(role),
        description: this.getRoleDescription(role),
        permissions: permissions.map(permission => ({
          permission,
          canRead: true,
          canWrite: !permission.includes('READ'),
          canDelete: permission.includes('DELETE') || role === UserRole.ADMIN
        }))
      };
    });
  }

  /**
   * Assign role to user (demo version)
   */
  public async assignRole(userId: string, roleName: UserRole): Promise<void> {
    USER_ROLES[userId] = roleName;
    console.log(`Role ${roleName} assigned to user ${userId}`);
  }

  /**
   * Remove role from user (demo version)
   */
  public async removeRole(userId: string): Promise<void> {
    delete USER_ROLES[userId];
    console.log(`Role removed from user ${userId}`);
  }

  /**
   * Check if RBAC is enabled (demo version)
   */
  public async isRBACEnabled(): Promise<boolean> {
    return true; // Always enabled in demo
  }

  /**
   * Middleware to check permission
   */
  public checkPermission(permission: Permission, action: 'read' | 'write' | 'delete' = 'read') {
    return async (req: any, res: any, next: any) => {
      try {
        const userId = req.user?.id || 'demo-readonly'; // Default to readonly for demo
        
        const hasPermission = await this.hasPermission(userId, permission, action);
        
        if (!hasPermission) {
          return res.status(403).json({ 
            error: 'Permission denied',
            permission,
            action 
          });
        }

        next();
      } catch (error) {
        console.error('Permission check error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    };
  }

  /**
   * Get role display names
   */
  private getRoleDisplayName(role: UserRole): string {
    const displayNames = {
      [UserRole.ADMIN]: 'Administrator',
      [UserRole.FINANCE]: 'Finance Manager',
      [UserRole.OPERATOR]: 'Operator',
      [UserRole.READONLY]: 'Read Only'
    };
    return displayNames[role];
  }

  /**
   * Get role descriptions
   */
  private getRoleDescription(role: UserRole): string {
    const descriptions = {
      [UserRole.ADMIN]: 'Full system access with all permissions',
      [UserRole.FINANCE]: 'Access to billing, customers and financial reports',
      [UserRole.OPERATOR]: 'Day-to-day operations including billing and customer management',
      [UserRole.READONLY]: 'View-only access to data and reports'
    };
    return descriptions[role];
  }

  /**
   * Get users by role (demo version)
   */
  public async getUsersByRole(roleName: UserRole): Promise<{
    id: string;
    email: string;
    companyName: string | null;
    isActive: boolean;
  }[]> {
    // Return demo users for the specified role
    const demoUsers = Object.entries(USER_ROLES)
      .filter(([_, role]) => role === roleName)
      .map(([userId, _]) => ({
        id: userId,
        email: `${userId}@example.com`,
        companyName: 'Demo Company',
        isActive: true
      }));

    return demoUsers;
  }
}

export const simplifiedRbacService = SimplifiedRBACService.getInstance();
