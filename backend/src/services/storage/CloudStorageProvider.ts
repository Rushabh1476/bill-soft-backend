import { StorageProvider, StorageConfig } from '../../interfaces/storage';

/**
 * Cloud Storage implementation of StorageProvider
 * Can be configured to work with various cloud storage services
 * (AWS S3, Google Cloud Storage, Azure Blob Storage, etc.)
 */
export class CloudStorageProvider implements StorageProvider {
  private config: StorageConfig & {
    apiEndpoint: string;
    apiKey: string;
    bucket?: string;
  };

  constructor(config: StorageConfig & { apiEndpoint: string; apiKey: string; bucket?: string }) {
    this.config = {
      prefix: 'billing-app-',
      encryption: true,
      compression: true,
      ...config
    };
  }

  private getKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  private async makeRequest(method: string, key: string, data?: any): Promise<any> {
    const url = `${this.config.apiEndpoint}/${this.config.bucket || 'default'}/${key}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (method === 'DELETE') {
        return true;
      }

      return await response.json();
    } catch (error) {
      console.error(`Cloud storage ${method} error:`, error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.getKey(key);
      const result = await this.makeRequest('GET', fullKey);
      
      if (!result || !result.data) {
        return null;
      }

      // Check expiration if configured
      if (this.config.expirationTime && result.timestamp) {
        const now = Date.now();
        const itemAge = now - result.timestamp;
        
        if (itemAge > this.config.expirationTime) {
          await this.remove(key);
          return null;
        }
        
        return result.data;
      }

      return result.data || result;
    } catch (error) {
      console.error(`Error getting item with key "${key}":`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const fullKey = this.getKey(key);
      
      let dataToStore: any = { data: value };
      
      // Add timestamp for expiration checking
      if (this.config.expirationTime) {
        dataToStore.timestamp = Date.now();
      }

      await this.makeRequest('PUT', fullKey, dataToStore);
    } catch (error) {
      console.error(`Error setting item with key "${key}":`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to store item: ${errorMessage}`);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const fullKey = this.getKey(key);
      await this.makeRequest('DELETE', fullKey);
    } catch (error) {
      console.error(`Error removing item with key "${key}":`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to remove item: ${errorMessage}`);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      const deletePromises = keys.map(key => this.makeRequest('DELETE', key));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing storage:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to clear storage: ${errorMessage}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.getKey(key);
      await this.makeRequest('HEAD', fullKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const listUrl = `${this.config.apiEndpoint}/${this.config.bucket || 'default'}`;
      const options: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      };

      const response = await fetch(listUrl, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const prefix = this.config.prefix || '';
      
      return (result.keys || []).filter((key: string) => key.startsWith(prefix));
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Get cloud storage usage information
   */
  async getStorageInfo(): Promise<{ used: number; available: number; total: number }> {
    try {
      const infoUrl = `${this.config.apiEndpoint}/${this.config.bucket || 'default'}/info`;
      const options: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      };

      const response = await fetch(infoUrl, options);
      
      if (!response.ok) {
        return { used: 0, available: 0, total: 0 };
      }

      const result = await response.json();
      return {
        used: result.used || 0,
        available: result.available || 0,
        total: result.total || 0
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { used: 0, available: 0, total: 0 };
    }
  }

  /**
   * Sync with local cache for offline support
   */
  async syncWithLocal(localProvider: StorageProvider): Promise<void> {
    try {
      // Get all cloud keys
      const cloudKeys = await this.getAllKeys();
      
      // Sync each item
      for (const key of cloudKeys) {
        const cloudData = await this.get(key);
        if (cloudData) {
          const cleanKey = key.replace(this.config.prefix || '', '');
          await localProvider.set(cleanKey, cloudData);
        }
      }
    } catch (error) {
      console.error('Error syncing with local storage:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to sync with local storage: ${errorMessage}`);
    }
  }
}
