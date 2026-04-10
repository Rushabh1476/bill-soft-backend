import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface JWTPayload {
  userId: string
  email: string
  name?: string
  isEmployee?: boolean
  sessionId?: string
  orgId?: string
  role?: string
  permissions?: string[]
}

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export const extractUserFromRequest = (authHeader: string | undefined): JWTPayload | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  return verifyToken(token)
}

export const createAuthResponse = (user: {
  id: string;
  email: string;
  name?: string | null;
  isEmployee?: boolean | null;
  companyName?: string | null;
  permissions?: string | null;
  role?: { name?: string } | null;
  roleId?: string | null;
  parentId?: string | null;
  logoUrl?: string | null;
  logoPosition?: string | null;
  logoWidth?: number | null;
  logoOffsetX?: number | null;
  logoOffsetY?: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  createdAt?: Date | null;
  lastLoginAt?: Date | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}, sessionId?: string) => {
  const token = generateToken({ 
    userId: user.id, 
    email: user.email, 
    name: user.name || '', 
    isEmployee: !!user.isEmployee, 
    sessionId 
  })

  let parsedPermissions = [];
  if (user.permissions) {
    try {
      parsedPermissions = JSON.parse(user.permissions);
    } catch (e) {
      console.error('Failed to parse user permissions', e);
    }
  }

  // Priority resolved role logic:
  // 1. Explicit role name from DB relation
  // 2. Top-level users (no parentId) always fall back to 'ADMIN'
  // 3. Invited sub-users (have parentId) default to 'VIEWER' if role is truly missing
  const resolvedRole = user.role?.name
    ? user.role.name.toUpperCase()
    : (user.parentId ? 'VIEWER' : 'ADMIN');

  console.log(`[createAuthResponse] userId=${user.id} parentId=${user.parentId ?? 'null'} role=${user.role?.name ?? 'NULL'} → resolved=${resolvedRole}`);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      companyName: user.companyName,
      role: resolvedRole,
      permissions: parsedPermissions,
      parentId: user.parentId,
      logoUrl: user.logoUrl,
      logoPosition: user.logoPosition,
      logoWidth: user.logoWidth,
      logoOffsetX: user.logoOffsetX,
      logoOffsetY: user.logoOffsetY,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      gstNumber: user.gstNumber,
      panNumber: user.panNumber,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      city: user.city,
      state: user.state,
      pincode: user.pincode
    },
    token
  }
}

export const validatePasswordStrength = async (password: string, prisma: any): Promise<{ isValid: boolean; error?: string }> => {
  try {
    const strengthSetting = await prisma.settings.findFirst({
      where: { key: 'password_strength', category: 'security' }
    });
    const strength = strengthSetting ? JSON.parse(strengthSetting.value) : 'strong';

    if (strength === 'strong') {
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!strongPasswordRegex.test(password)) {
        return { 
          isValid: false, 
          error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character' 
        };
      }
    } else {
      if (password.length < 3) {
        return { isValid: false, error: 'Password must be at least 3 characters' };
      }
    }
    return { isValid: true };
  } catch (err) {
    return { isValid: true }; // Fallback to allow progress if settings table is inaccessible
  }
}
