/**
 * Storage Provider Interface - Implements Dependency Inversion Principle
 * Abstracts storage operations to allow switching between localStorage, sessionStorage, 
 * cloud storage, etc. without changing business logic
 */

export interface StorageProvider {
  /**
   * Retrieve an item from storage
   * @param key - The storage key
   * @returns Promise resolving to the stored value or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Store an item in storage
   * @param key - The storage key
   * @param value - The value to store
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Remove an item from storage
   * @param key - The storage key
   */
  remove(key: string): Promise<void>;

  /**
   * Clear all items from storage
   */
  clear(): Promise<void>;

  /**
   * Check if a key exists in storage
   * @param key - The storage key
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get all keys from storage
   */
  getAllKeys(): Promise<string[]>;
}

/**
 * Storage operation result with error handling
 */
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Storage configuration options
 */
export interface StorageConfig {
  prefix?: string;
  encryption?: boolean;
  compression?: boolean;
  expirationTime?: number; // in milliseconds
}
