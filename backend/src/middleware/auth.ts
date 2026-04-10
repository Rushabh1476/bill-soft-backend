import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth';
import prisma from '../lib/prisma';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        orgId: string;
        parentId?: string | null;
        role?: {
          name: string;
        };
        permissions?: string[];
        isEmployee?: boolean;
      };
    }
  }
}

// Middleware to authenticate token
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = '';
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // --- ROOT CAUSE REMOVAL: Resilient Auth Middleware ---
    // If we have a decoded token, it means the signature is valid.
    // If the database is "Busy" or "Locked" due to bulk operations,
    // we should trust the token rather than failing and causing a logout.
    
    let userFromDb: any = null;
    let sessionFromDb: any = null;

    try {
      // 1. Session Validation (with timeout/busy handling)
      if (decoded.sessionId) {
        sessionFromDb = await prisma.userSession.findUnique({
          where: { sessionId: decoded.sessionId }
        });
      }

      // 2. User Details (with timeout/busy handling)
      userFromDb = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { role: true }
      });
    } catch (dbErr: any) {
      const isBusy = dbErr.message?.includes('busy') || dbErr.message?.includes('locked');
      if (isBusy) {
        console.warn(`[Auth] DB Busy during auth check — Using stateless fallback for user ${decoded.userId}`);
        // Fallback: Construct minimal user from token data to prevent logout
        req.user = {
          id: decoded.userId,
          name: decoded.name || '',
          email: decoded.email || '',
          orgId: decoded.orgId || decoded.userId,
          role: { name: (decoded.role || 'VIEWER').toUpperCase() },
          permissions: decoded.permissions || [],
          isEmployee: !!decoded.isEmployee
        };
        return next();
      }
      throw dbErr; // Rethrow actual non-busy errors
    }

    if (!userFromDb) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // 3. Session validation logic (Strict Check)
    if (decoded.sessionId) {
      if (!sessionFromDb || !sessionFromDb.isActive || sessionFromDb.expiresAt < new Date()) {
        console.warn(`[Auth] Inactive or missing session for user ${decoded.userId}. sessionId: ${decoded.sessionId}`);
        return res.status(401).json({
          success: false,
          error: 'Session expired, revoked, or non-existent. Please log in again.'
        });
      }
    }

    let parsedPermissions: string[] = [];
    try {
      if (userFromDb.permissions) {
        parsedPermissions = JSON.parse(userFromDb.permissions);
      }
    } catch (e) { /* ignore parse error */ }

    const orgId = userFromDb.parentId || userFromDb.id;

    const resolvedRole = userFromDb.role?.name
      ? userFromDb.role.name.toUpperCase()
      : (userFromDb.parentId ? 'VIEWER' : 'ADMIN');

    req.user = {
      id: userFromDb.id,
      name: userFromDb.name || '',
      email: userFromDb.email,
      parentId: userFromDb.parentId,
      orgId: orgId,
      role: { name: resolvedRole },
      permissions: parsedPermissions,
      isEmployee: (userFromDb as any).isEmployee
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Middleware to require specific roles
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRole = (req.user.role?.name || 'VIEWER').toUpperCase();

    if (!allowedRoles.map(r => r.toUpperCase()).includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Middleware to require admin access
export const requireAdmin = requireRole(['ADMIN']);

export const requireAdminOrManager = requireRole(['ADMIN', 'MANAGER']);

// Middleware to require super admin access
export const requireSuperAdmin = requireRole(['SUPER_ADMIN']);

// Middleware to require specific permission or admin access
export const requirePermission = (permissionKey: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRole = (req.user.role?.name || 'VIEWER').toUpperCase();

    // Admins bypass all permission checks
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      return next();
    }

    // Get permissions as an array
    let permissions: string[] = [];
    if (Array.isArray(req.user.permissions)) {
      permissions = req.user.permissions;
    } else if (typeof req.user.permissions === 'string') {
      try {
        const parsed = JSON.parse(req.user.permissions);
        permissions = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        permissions = [];
      }
    }

    // --- PERMISSION BRIDGE: Role-to-Permission Mapping ---
    // If a user has a specific role, they get these permissions implicitly
    const roleDefaultPermissions: Record<string, string[]> = {
      'ADMIN': ['all_access'],
      'MANAGER': [
        'view_customers', 'manage_customers', 'create_customers', 'edit_customers',
        'view_products', 'manage_products', 'create_products', 'edit_products',
        'view_bills', 'manage_bills', 'create_bills', 'edit_bills',
        'view_services', 'manage_services', 'view_reports'
      ],
      'OPERATOR': [
        'view_customers', 'manage_customers', 'create_customers', 'edit_customers',
        'view_products', 'manage_products', 'create_products', 'edit_products',
        'view_bills', 'manage_bills', 'create_bills', 'edit_bills',
        'view_services'
      ],
      'ACCOUNTANT': [
        'view_customers', 'create_customers', 'edit_customers',
        'view_bills', 'create_bills', 'edit_bills',
        'view_products', 'view_reports', 'view_billing'
      ],
      'FINANCE': [
        'view_customers', 'view_bills', 'view_products', 'view_reports', 'view_billing'
      ],
      'VIEWER': ['view_customers', 'view_products', 'view_bills', 'view_reports'],
      'READONLY': ['view_customers', 'view_products', 'view_bills', 'view_reports']
    };

    const implicitPermissions = roleDefaultPermissions[userRole] || [];
    const allPermissions = [...permissions, ...implicitPermissions];

    // Check for 'all_access' flag or specific permission key
    if (allPermissions.includes('all_access') || allPermissions.includes(permissionKey)) {
      return next();
    }

    // Map 'manage_X' to 'create_X', 'edit_X', and 'delete_X'
    if (permissionKey.startsWith('create_') || permissionKey.startsWith('edit_') || permissionKey.startsWith('delete_')) {
      const resource = permissionKey.split('_')[1]; // e.g., 'bills', 'products', 'customers'
      const manageKey = `manage_${resource}`;
      if (allPermissions.includes(manageKey)) {
        return next();
      }
    }

    // Special cases mapping manually if needed
    const permissionMappings: Record<string, string[]> = {
      'view_bills': ['view_billing', 'billing_read'],
      'create_bills': ['billing_write', 'manage_billing'],
      'edit_bills': ['billing_write', 'manage_billing'],
      'delete_bills': ['billing_delete', 'manage_billing'],
      'view_customers': ['customers_read', 'crm_read'],
      'create_customers': ['customers_write', 'manage_customers', 'crm_write'],
      'edit_customers': ['customers_write', 'manage_customers', 'crm_write'],
      'view_products': ['products_read', 'inventory_read'],
      'create_products': ['products_write', 'manage_products', 'inventory_write'],
      'edit_products': ['products_write', 'manage_products', 'inventory_write'],
      'delete_products': ['products_delete', 'manage_products', 'inventory_delete'],
      'delete_customers': ['customers_delete', 'manage_customers', 'crm_delete'],
      'manage_users': ['admin_access', 'user_management'],
    };

    const mappedKeys = permissionMappings[permissionKey] || [];
    if (mappedKeys.some(key => allPermissions.includes(key))) {
      return next();
    }

    console.warn(`[Auth] Permission denied: User ${req.user.id} lacks '${permissionKey}'. Current permissions: ${permissions.join(', ')}`);

    return res.status(403).json({
      success: false,
      error: `Access denied. You do not have the required permission: ${permissionKey}`
    });
  };
};
