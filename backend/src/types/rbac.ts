/**
 * RBAC (Role-Based Access Control) type definitions for the backend service layer
 */

export type UserRoleType = 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'VIEWER';

export interface Permission {
    id: string;
    name: string;
    resource: string;
    action: string;
}

export interface UISettings {
    navigation: {
        dashboard: boolean;
        customers: boolean;
        bills: boolean;
        products: boolean;
        settings: boolean;
        adminPanel: boolean;
        [key: string]: boolean;
    };
    features: {
        bulkOperations: boolean;
        dataExport: boolean;
        advancedFilters: boolean;
        reporting: boolean;
        [key: string]: boolean;
    };
    fieldAccess: Record<string, Record<string, { visible: boolean; editable: boolean }>>;
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
