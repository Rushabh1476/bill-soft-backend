import { StorageProvider, StorageConfig, StorageResult } from '../../interfaces/storage';

/**
 * LocalStorage implementation of StorageProvider
 * Provides browser localStorage functionality with error handling and type safety
 */
export class LocalStorageProvider implements StorageProvider {
  private config: StorageConfig;

  constructor(config: StorageConfig = {}) {
    this.config = {
      prefix: 'billing-app-',
      encryption: false,
      compression: false,
      ...config
    };
  }

  private getKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  private handleError<T>(operation: string, error: any): StorageResult<T> {
    console.error(`LocalStorage ${operation} error:`, error);
    return {
      success: false,
      error: error.message || `Failed to ${operation}`
    };
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.getKey(key);
      const item = localStorage.getItem(fullKey);
      
      if (!item) {
        return null;
      }

      const parsedItem = JSON.parse(item);
      
      // Check expiration if configured
      if (this.config.expirationTime && parsedItem.timestamp) {
        const now = Date.now();
        const itemAge = now - parsedItem.timestamp;
        
        if (itemAge > this.config.expirationTime) {
          await this.remove(key);
          return null;
        }
        
        return parsedItem.data;
      }

      return parsedItem;
    } catch (error) {
      console.error(`Error getting item with key "${key}":`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const fullKey = this.getKey(key);
      
      let dataToStore: any = value;
      
      // Add timestamp for expiration checking
      if (this.config.expirationTime) {
        dataToStore = {
          data: value,
          timestamp: Date.now()
        };
      }

      localStorage.setItem(fullKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.error(`Error setting item with key "${key}":`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to store item: ${errorMessage}`);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const fullKey = this.getKey(key);
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.error(`Error removing item with key "${key}":`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to remove item: ${errorMessage}`);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      for (const key of keys) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to clear storage: ${errorMessage}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.getKey(key);
      return localStorage.getItem(fullKey) !== null;
    } catch (error) {
      console.error(`Error checking existence of key "${key}":`, error);
      return false;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys: string[] = [];
      const prefix = this.config.prefix || '';
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      
      return keys;
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Get storage usage information
   */
  async getStorageInfo(): Promise<{ used: number; available: number; total: number }> {
    try {
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          used += (key.length + (value?.length || 0)) * 2; // Approximate bytes
        }
      }

      // Rough estimate - browsers typically allow 5-10MB for localStorage
      const total = 5 * 1024 * 1024; // 5MB
      const available = total - used;

      return { used, available, total };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { used: 0, available: 0, total: 0 };
    }
  }

  /**
   * Backup all data to a JSON object
   */
  async backup(): Promise<Record<string, any>> {
    try {
      const backup: Record<string, any> = {};
      const keys = await this.getAllKeys();
      
      for (const fullKey of keys) {
        const value = localStorage.getItem(fullKey);
        if (value) {
          // Remove prefix for cleaner backup
          const cleanKey = fullKey.replace(this.config.prefix || '', '');
          backup[cleanKey] = JSON.parse(value);
        }
      }
      
      return backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create backup: ${errorMessage}`);
    }
  }

  /**
   * Restore data from a backup object
   */
  async restore(backup: Record<string, any>): Promise<void> {
    try {
      for (const [key, value] of Object.entries(backup)) {
        await this.set(key, value);
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to restore backup: ${errorMessage}`);
    }
  }
}
