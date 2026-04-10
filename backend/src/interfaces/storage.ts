/**
 * Storage interface definitions
 * Defines the contract for all storage providers in the application
 */

export interface StorageConfig {
    prefix?: string;
    encryption?: boolean;
    compression?: boolean;
    expirationTime?: number; // in milliseconds
    apiEndpoint?: string;
    apiKey?: string;
    bucket?: string;
}

export interface StorageResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Core storage provider interface
 * All storage implementations must implement this interface
 */
export interface StorageProvider {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
    exists(key: string): Promise<boolean>;
    getAllKeys(): Promise<string[]>;
}
