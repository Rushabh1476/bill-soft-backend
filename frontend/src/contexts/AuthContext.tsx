/* eslint-disable */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { rbacService } from '../services/rbacService';
import { Role, UISettings, UserRoleType } from '../types/rbac';
import { API_URL } from '../config/api';
import { authAPI } from '../services/api';
import { LoadingScreen } from '../components/common/LoadingScreen';

export interface User {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  phone?: string;
  avatar?: string;
  plan: string;
  role: string | UserRoleType;
  realRole?: string | UserRoleType;
  permissions: any;
  uiSettings?: UISettings;
  parentId?: string;
  logoUrl?: string | null;
  logoPosition?: string;
  logoWidth?: number;
  logoOffsetX?: number;
  logoOffsetY?: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  createdAt?: string;
  lastLoginAt?: string;
}


interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  signupRequest: (email: string) => Promise<{ message: string; previewUrl?: string }>;
  completeSignup: (data: { token: string; password: string; companyName: string; name?: string }) => Promise<User | null>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  switchRole: (role: UserRoleType) => void;
  availableRoles: Role[];
  currentRoleSettings: UISettings | null;
  updateRoleSettings: (settings: Partial<UISettings>) => void;
  hasPermission: (resource: string, action: string) => boolean;
  canAccessNavigation: (nav: keyof UISettings['navigation']) => boolean;
  canUseFeature: (feature: keyof UISettings['features']) => boolean;
  getFieldAccess: (module: string, field: string) => { visible: boolean; editable: boolean };
  refreshUser: () => Promise<void>;
  updateUserLocal: (user: User | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds


export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); // First declaration, keep this one
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);

  // Get available roles from RBAC service
  const availableRoles = rbacService.getRoles();

  const normalizePermissions = () => ({
    array: ['all'],
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
  });

  // Initialize auth state
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data.user) {
            const backendUser = response.data.user;
            const realRole = (backendUser.role || 'VIEWER').toUpperCase() as UserRoleType;
            const simulatedRole = localStorage.getItem('simulatedRole') as UserRoleType;
            const activeRole = simulatedRole || realRole;

            const profile: User = {
              id: backendUser.id,
              name: backendUser.name || backendUser.email.split('@')[0],
              email: backendUser.email,
              companyName: backendUser.companyName,
              phone: backendUser.phone,
              plan: backendUser.planType || 'Basic',
              role: activeRole,
              realRole: realRole,
              permissions: backendUser.permissions || [],
              uiSettings: rbacService.getRole(activeRole)?.uiSettings,
              parentId: backendUser.parentId,
              avatar: backendUser.avatarUrl,
              logoUrl: backendUser.logoUrl,
              logoPosition: backendUser.logoPosition,
              logoWidth: backendUser.logoWidth,
              logoOffsetX: backendUser.logoOffsetX,
              logoOffsetY: backendUser.logoOffsetY,
              address: backendUser.address,
              city: backendUser.city,
              state: backendUser.state,
              pincode: backendUser.pincode,
              gstNumber: backendUser.gstNumber,
              panNumber: backendUser.panNumber,
              createdAt: backendUser.createdAt,
              lastLoginAt: backendUser.lastLoginAt,
            };
            setUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));
          }
        } catch (err: any) {
          // --- FALLBACK: Use cached user if API fails on refresh ---
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            console.warn('[AuthContext] Profile fetch failed, using cached user:', err.message);
            try {
              setUser(JSON.parse(cachedUser));
            } catch (e) {
              console.error('[AuthContext] Cache parse error:', e);
            }
          }
        }
      }
      setIsLoading(false);
    };

    fetchProfile();

    // Polling sync: every 8 seconds for immediate reflection as requested
    const syncInterval = setInterval(async () => {
      const token = localStorage.getItem('authToken');
      if (token && !isLoading) {
        try {
          const response = await axios.get(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data.user) {
            const backendUser = response.data.user;
            // Priority resolved role logic:
            // 1. Explicit role name from DB relation
            // 2. Top-level users (no parentId) always fall back to 'ADMIN'
            // 3. Invited sub-users (have parentId) default to 'VIEWER'
            const resolvedDbRole = backendUser.role
              ? backendUser.role.toUpperCase()
              : (backendUser.parentId ? 'VIEWER' : 'ADMIN');

            const simulatedRole = localStorage.getItem('simulatedRole') as UserRoleType;
            const activeRole = simulatedRole || (resolvedDbRole as UserRoleType);

            setUser(prev => {
              if (!prev) return null;
              const updatedProfile = {
                ...prev,
                companyName: backendUser.companyName,
                phone: backendUser.phone,
                role: activeRole,
                realRole: resolvedDbRole as UserRoleType,
                permissions: backendUser.permissions || [],
                uiSettings: rbacService.getRole(activeRole)?.uiSettings,
                parentId: backendUser.parentId,
                avatar: backendUser.avatarUrl,
                logoUrl: backendUser.logoUrl,
                logoPosition: backendUser.logoPosition,
                logoWidth: backendUser.logoWidth,
                logoOffsetX: backendUser.logoOffsetX,
                logoOffsetY: backendUser.logoOffsetY,
                address: backendUser.address,
                city: backendUser.city,
                state: backendUser.state,
                pincode: backendUser.pincode,
                gstNumber: backendUser.gstNumber,
                panNumber: backendUser.panNumber,
                createdAt: backendUser.createdAt,
                lastLoginAt: backendUser.lastLoginAt,
              };
              localStorage.setItem('user', JSON.stringify(updatedProfile));
              return updatedProfile;
            });
          }
        } catch (e) { }
      }
    }, 8000);

    return () => clearInterval(syncInterval);
  }, []);

  // Use axios interceptor for automatic refresh on navigation/request
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => {
        // Update activity on successful request
        setLastActivity(Date.now());
        return response;
      },
      (error) => {
        // Global 401 Interceptor: If any API call returns 401, 
        // it means the session has been invalidated globally (e.g., logout from another device).
        if (error.response?.status === 401) {
          console.warn('[AUTH] Session invalidated by server (401). Clearing local state...');
          
          // Clear everything locally
          localStorage.removeItem('authToken');
          localStorage.removeItem('simulatedRole');
          localStorage.removeItem('user');
          
          // Force page refresh to login if we aren't already there
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login?expired=true';
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // ... (keep activity tracking)

  const login = async (email: string, password: string): Promise<User | null> => {
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });

      const { token, user: backendUser } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.removeItem('simulatedRole');

      const userRole = (backendUser.role || 'VIEWER').toUpperCase() as UserRoleType;
      const newUser = {
        id: backendUser.id,
        name: backendUser.name || backendUser.email.split('@')[0],
        email: backendUser.email,
        plan: backendUser.planType || 'Basic',
        role: userRole,
        realRole: userRole,
        permissions: backendUser.permissions || [],
        uiSettings: rbacService.getRole(userRole)?.uiSettings,
        parentId: backendUser.parentId,
        avatar: backendUser.avatarUrl,
        logoUrl: backendUser.logoUrl,
        logoPosition: backendUser.logoPosition,
        logoWidth: backendUser.logoWidth,
        logoOffsetX: backendUser.logoOffsetX,
        logoOffsetY: backendUser.logoOffsetY,
        address: backendUser.address,
        city: backendUser.city,
        state: backendUser.state,
        pincode: backendUser.pincode,
        gstNumber: backendUser.gstNumber,
        panNumber: backendUser.panNumber,
        createdAt: backendUser.createdAt,
        lastLoginAt: backendUser.lastLoginAt,
      };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;

    } catch (error: any) {
      const resp = error.response?.data;
      let message = 'An unexpected error occurred';
      if (resp?.error || resp?.detail || resp?.message) {
        message = resp.detail || resp.error || resp.message;
        if (resp.error && resp.detail && resp.error !== resp.detail) {
          message = `${resp.error}: ${resp.detail}`;
        }
      } else if (error.message) {
        message = error.message;
      }
      
      setError(message);
      throw new Error(message);
    }
  };

  const signupRequest = async (email: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/signup-request`, { email });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Signup request failed';
      throw new Error(message);
    }
  };

  const completeSignup = async (data: { token: string; password: string; companyName: string; name?: string }): Promise<User | null> => {
    try {
      const response = await axios.post(`${API_URL}/auth/complete-signup`, data);
      const { token, user: backendUser } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.removeItem('simulatedRole');

      const userRole = (backendUser.role || 'ADMIN').toUpperCase() as UserRoleType;
      const newUser: User = {
        id: backendUser.id,
        name: backendUser.name || backendUser.email.split('@')[0],
        email: backendUser.email,
        companyName: backendUser.companyName,
        phone: backendUser.phone,
        plan: backendUser.planType || 'Basic',
        role: userRole,
        realRole: userRole,
        permissions: backendUser.permissions || [],
        uiSettings: rbacService.getRole(userRole)?.uiSettings,
        parentId: backendUser.parentId,
        avatar: backendUser.avatarUrl,
        logoUrl: backendUser.logoUrl,
        logoPosition: backendUser.logoPosition,
        logoWidth: backendUser.logoWidth,
        logoOffsetX: backendUser.logoOffsetX,
        logoOffsetY: backendUser.logoOffsetY,
        address: backendUser.address,
        city: backendUser.city,
        state: backendUser.state,
        pincode: backendUser.pincode,
        gstNumber: backendUser.gstNumber,
        panNumber: backendUser.panNumber,
        createdAt: backendUser.createdAt,
        lastLoginAt: backendUser.lastLoginAt,
      };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Signup completion failed';
      throw new Error(message);
    }
  };
  const logout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Notify backend to invalidate all sessions globally
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('[LOGOUT] Backend invalidation failed:', err);
    } finally {
      // Always clear local state regardless of API success
      localStorage.removeItem('authToken');
      localStorage.removeItem('simulatedRole');
      localStorage.removeItem('user');
      setUser(null);
      setLastActivity(Date.now());
      // Redirect to login page
      window.location.href = '/login';
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const response = await authAPI.updateProfile(updates);
      if (response.user) {
        // Normalize role if it's an object from Prisma
        const backendUser = response.user;
        const resolvedRole = backendUser.role?.name
          ? backendUser.role.name.toUpperCase()
          : (typeof backendUser.role === 'string' ? backendUser.role : (backendUser.parentId ? 'VIEWER' : 'ADMIN'));

        const fullUser = {
          ...user,
          ...backendUser,
          avatar: backendUser.avatarUrl !== undefined ? backendUser.avatarUrl : user?.avatar,
          role: resolvedRole
        } as User;

        setUser(fullUser);
        localStorage.setItem('user', JSON.stringify(fullUser));
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };
  // Switch between different roles for testing different user perspectives
  const switchRole = (newRole: UserRoleType) => {
    if (!user) return;

    // Persist for testing views
    localStorage.setItem('simulatedRole', newRole);
    const roleObj = rbacService.getRole(newRole);
    const roleSettings = roleObj?.uiSettings;
    const rolePerms = roleObj?.permissions.map(p => p.name) || [];

    setUser({
      ...user,
      role: newRole,
      uiSettings: roleSettings,
      permissions: newRole === 'ADMIN' ? ['all'] : rolePerms
    });
  };

  // Refresh User Data — fetches latest profile from API and updates the user state.
  // Called after permission changes, password resets, etc.
  const refreshUser = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.user) {
        const backendUser = response.data.user;
        const resolvedDbRole = backendUser.role
          ? backendUser.role.toUpperCase()
          : (backendUser.parentId ? 'VIEWER' : 'ADMIN');
        const simulatedRole = localStorage.getItem('simulatedRole') as UserRoleType;
        const activeRole = simulatedRole || (resolvedDbRole as UserRoleType);
        const roleObj = rbacService.getRole(activeRole);

        setUser(prev => {
          if (!prev) return null;
          const updated = {
            ...prev,
            companyName: backendUser.companyName,
            phone: backendUser.phone,
            role: activeRole,
            realRole: resolvedDbRole as UserRoleType,
            permissions: activeRole === (resolvedDbRole as UserRoleType)
              ? (backendUser.permissions || [])
              : (roleObj?.permissions.map(p => p.name) || []),
            uiSettings: roleObj?.uiSettings,
            parentId: backendUser.parentId,
            avatar: backendUser.avatarUrl,
            logoUrl: backendUser.logoUrl,
            logoPosition: backendUser.logoPosition,
            logoWidth: backendUser.logoWidth,
            logoOffsetX: backendUser.logoOffsetX,
            logoOffsetY: backendUser.logoOffsetY,
            address: backendUser.address,
            city: backendUser.city,
            state: backendUser.state,
            pincode: backendUser.pincode,
            gstNumber: backendUser.gstNumber,
            panNumber: backendUser.panNumber,
            createdAt: backendUser.createdAt,
            lastLoginAt: backendUser.lastLoginAt,
          };
          localStorage.setItem('user', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      console.error('[AuthContext] refreshUser failed:', e);
    }
  };

  // Update role settings
  const updateRoleSettings = (settings: Partial<UISettings>) => {
    if (!user) return;

    rbacService.updateRoleSettings(user.role, settings);
    const updatedSettings = rbacService.getRole(user.role)?.uiSettings;

    setUser({
      ...user,
      uiSettings: updatedSettings
    });
  };

  // Permission checking methods
  const hasPermission = (resource: string, action: string): boolean => {
    return true;
  };

  const canAccessNavigation = (nav: keyof UISettings['navigation']): boolean => {
    return true;
  };

  const canUseFeature = (feature: keyof UISettings['features']): boolean => {
    return true;
  };

  const getFieldAccess = (module: string, field: string) => {
    if (!user) return { visible: false, editable: false };
    return rbacService.getFieldAccess(user.role, module, field);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    signupRequest,
    completeSignup,
    logout,
    updateProfile,
    switchRole,
    availableRoles,
    currentRoleSettings: user?.uiSettings || null,
    updateRoleSettings,
    hasPermission,
    canAccessNavigation,
    canUseFeature,
    getFieldAccess,
    refreshUser,
    updateUserLocal: setUser,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
