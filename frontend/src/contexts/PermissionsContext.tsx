/* eslint-disable */
/**
 * PermissionsContext
 *
 * Provides real-time permission synchronization for invited sub-users.
 * - On mount, loads current user's permissions from the API
 * - Polls every 10 seconds so that if an admin changes permissions,
 *   the sub-user's UI (sidebar, routes) updates without a page refresh
 * - Exposes a `PermissionGuard` component for route/feature gating
 */
import React, {
    createContext, useContext, useState,
    useEffect, useRef, useCallback, ReactNode
} from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { rbacService } from '../services/rbacService';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PermissionsContextType {
    permissions: string[];
    role: string;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    hasPermission: (key: string) => boolean;
    refreshPermissions: () => Promise<void>;
    lastSynced: Date | null;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

const POLL_INTERVAL_MS = 5_000; // 5 seconds

/** Safely extract the role string whether role is a plain string or { name: string } */
const getRoleString = (role: any): string => {
    if (!role) return 'VIEWER';
    if (typeof role === 'string') return role.toUpperCase();
    if (typeof role === 'object' && role.name) return String(role.name).toUpperCase();
    return 'VIEWER';
};

// ─── Provider ──────────────────────────────────────────────────────────────────

export const PermissionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [permissions, setPermissions] = useState<string[]>([]);
    const [role, setRole] = useState<string>('VIEWER');
    const [lastSynced, setLastSynced] = useState<Date | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // isAdmin is intentionally dual-sourced:
    // 1. `user.realRole` from AuthContext — set at login from createAuthResponse (DB-backed)
    // 2. `role` polled from /admin/invite/permissions — real-time but may lag on DB seeding gaps
    // Either source saying 'admin' is sufficient; we never accidentally demote an admin.
    // isAdmin check for UI gating
    const isAdmin =
        getRoleString(user?.role) === 'ADMIN' ||
        role === 'ADMIN' ||
        getRoleString(user?.role) === 'SUPER_ADMIN' ||
        role === 'SUPER_ADMIN';

    const isSuperAdmin =
        getRoleString(user?.role) === 'SUPER_ADMIN' ||
        role === 'SUPER_ADMIN';

    const fetchPermissions = useCallback(async () => {
        if (!isAuthenticated || !user) return;

        // Check for simulated role (Simulation Shortcut)
        const simulatedRole = localStorage.getItem('simulatedRole');
        if (simulatedRole) {
            const simulatedRoleData = rbacService.getRole(simulatedRole.toUpperCase());
            if (simulatedRoleData) {
                const simulatedPerms = simulatedRoleData.permissions.map((p: any) => p.name);
                const activeRole = simulatedRole.toUpperCase();

                setRole(activeRole);
                setPermissions(activeRole === 'ADMIN' ? ['all'] : simulatedPerms);
                setLastSynced(new Date());
                return;
            }
        }

        try {
            // Using the centralized 'api' client ensures correct pathing and automatic Authorization header
            const res = await api.get(`/admin/invite/permissions/${user.id}`);
            const data = res.data;

            // Admin/SuperAdmin shortcut: skip if already admin
            const fetchedRole = (data.role || 'VIEWER').toUpperCase();
            if (fetchedRole === 'ADMIN' || getRoleString(user.role) === 'ADMIN' ||
                fetchedRole === 'SUPER_ADMIN' || getRoleString(user.role) === 'SUPER_ADMIN') {
                setRole(fetchedRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN');
                setPermissions(['all']);
                setLastSynced(new Date());
                return;
            }

            // Compare to avoid unnecessary re-renders
            const incoming = (data.permissions || []).sort().join(',');
            const current = [...permissions].sort().join(',');
            if (incoming !== current || fetchedRole !== role) {
                setPermissions(data.permissions || []);
                setRole(fetchedRole);
            }
            setLastSynced(new Date());
        } catch (_) {
            // Silent fail — keep stale permissions rather than crashing
        }
    }, [isAuthenticated, user?.id, user?.role]);

    // Initial fetch + start polling
    useEffect(() => {
        if (!isAuthenticated) {
            setPermissions([]);
            setRole('VIEWER');
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        fetchPermissions();

        intervalRef.current = setInterval(fetchPermissions, POLL_INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isAuthenticated, user?.id]);

    const hasPermission = useCallback((key: string): boolean => {
        if (isAdmin) return true;
        if (permissions.includes('all') || permissions.includes('all_access')) return true;
        return permissions.includes(key);
    }, [permissions, isAdmin]);

    const refreshPermissions = useCallback(() => fetchPermissions(), [fetchPermissions]);

    return (
        <PermissionsContext.Provider value={{ permissions, role, isAdmin, isSuperAdmin, hasPermission, refreshPermissions, lastSynced }}>
            {children}
        </PermissionsContext.Provider>
    );
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

export const usePermissions = (): PermissionsContextType => {
    const ctx = useContext(PermissionsContext);
    if (!ctx) throw new Error('usePermissions must be used within PermissionsProvider');
    return ctx;
};

// ─── PermissionGuard ──────────────────────────────────────────────────────────
// Wraps a route or UI element. Shows fallback if user lacks permission.

interface PermissionGuardProps {
    require: string | string[];
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    require,
    fallback = null,
    children,
}) => {
    const { hasPermission, isAdmin } = usePermissions();

    if (isAdmin) return <>{children}</>;

    const keys = Array.isArray(require) ? require : [require];
    const allowed = keys.some(k => hasPermission(k));

    return allowed ? <>{children}</> : <>{fallback}</>;
};

export default PermissionsContext;
