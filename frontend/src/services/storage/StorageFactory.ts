import { StorageProvider, StorageConfig } from '../../interfaces/storage';
import { LocalStorageProvider } from './LocalStorageProvider';
import { CloudStorageProvider } from './CloudStorageProvider';

/**
 * Storage provider types
 */
export type StorageType = 'localStorage' | 'sessionStorage' | 'cloudStorage' | 'hybrid';

/**
 * Configuration for different storage types
 */
export interface StorageFactoryConfig extends StorageConfig {
  type: StorageType;
  cloudConfig?: {
    apiEndpoint: string;
    apiKey: string;
    bucket?: string;
  };
  fallbackToLocal?: boolean;
}

/**
 * Hybrid storage provider that combines local and cloud storage
 * Implements resilient storage with automatic fallback
 */
class HybridStorageProvider implements StorageProvider {
  private primaryProvider: StorageProvider;
  private fallbackProvider: StorageProvider;

  constructor(primary: StorageProvider, fallback: StorageProvider) {
    this.primaryProvider = primary;
    this.fallbackProvider = fallback;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.primaryProvider.get<T>(key);
      return result;
    } catch (error) {
      console.warn('Primary storage failed, falling back to secondary:', error);
      return await this.fallbackProvider.get<T>(key);
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await this.primaryProvider.set(key, value);
      // Try to sync to fallback in background
      this.fallbackProvider.set(key, value).catch(err => 
        console.warn('Failed to sync to fallback storage:', err)
      );
    } catch (error) {
      console.warn('Primary storage failed, using fallback:', error);
      await this.fallbackProvider.set(key, value);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.primaryProvider.remove(key);
      await this.fallbackProvider.remove(key);
    } catch (error) {
      console.warn('Error removing from primary, trying fallback:', error);
      await this.fallbackProvider.remove(key);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.primaryProvider.clear();
      await this.fallbackProvider.clear();
    } catch (error) {
      console.warn('Error clearing primary, trying fallback:', error);
      await this.fallbackProvider.clear();
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return await this.primaryProvider.exists(key);
    } catch (error) {
      return await this.fallbackProvider.exists(key);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await this.primaryProvider.getAllKeys();
    } catch (error) {
      return await this.fallbackProvider.getAllKeys();
    }
  }
}

/**
 * SessionStorage implementation (similar to LocalStorage but session-scoped)
 */
class SessionStorageProvider implements StorageProvider {
  private config: StorageConfig;

  constructor(config: StorageConfig = {}) {
    this.config = {
      prefix: 'billing-app-session-',
      ...config
    };
  }

  private getKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.getKey(key);
      const item = sessionStorage.getItem(fullKey);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting item with key "${key}":`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const fullKey = this.getKey(key);
      sessionStorage.setItem(fullKey, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting item with key "${key}":`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const fullKey = this.getKey(key);
      sessionStorage.removeItem(fullKey);
    } catch (error) {
      console.error(`Error removing item with key "${key}":`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      for (const key of keys) {
        sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.getKey(key);
      return sessionStorage.getItem(fullKey) !== null;
    } catch (error) {
      return false;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys: string[] = [];
      const prefix = this.config.prefix || '';
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      
      return keys;
    } catch (error) {
      return [];
    }
  }
}

/**
 * Factory class for creating storage providers
 * Implements the Factory pattern and supports dependency injection
 */
export class StorageFactory {
  private static instance: StorageFactory;
  private providers: Map<string, StorageProvider> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): StorageFactory {
    if (!StorageFactory.instance) {
      StorageFactory.instance = new StorageFactory();
    }
    return StorageFactory.instance;
  }

  /**
   * Create a storage provider based on configuration
   */
  createProvider(config: StorageFactoryConfig): StorageProvider {
    const cacheKey = `${config.type}-${JSON.stringify(config)}`;
    
    // Return cached provider if exists
    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey)!;
    }

    let provider: StorageProvider;

    switch (config.type) {
      case 'localStorage':
        provider = new LocalStorageProvider(config);
        break;

      case 'sessionStorage':
        provider = new SessionStorageProvider(config);
        break;

      case 'cloudStorage':
        if (!config.cloudConfig) {
          throw new Error('Cloud configuration required for cloud storage');
        }
        provider = new CloudStorageProvider({
          ...config,
          ...config.cloudConfig
        });
        break;

      case 'hybrid':
        const cloudProvider = config.cloudConfig 
          ? new CloudStorageProvider({ ...config, ...config.cloudConfig })
          : null;
        const localProvider = new LocalStorageProvider(config);
        
        if (cloudProvider) {
          provider = new HybridStorageProvider(cloudProvider, localProvider);
        } else {
          provider = localProvider;
        }
        break;

      default:
        throw new Error(`Unknown storage type: ${config.type}`);
    }

    // Cache the provider
    this.providers.set(cacheKey, provider);
    return provider;
  }

  /**
   * Get the default storage provider for the application
   */
  getDefaultProvider(): StorageProvider {
    return this.createProvider({
      type: 'localStorage',
      prefix: 'billing-app-',
      expirationTime: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }

  /**
   * Get a session-scoped storage provider
   */
  getSessionProvider(): StorageProvider {
    return this.createProvider({
      type: 'sessionStorage',
      prefix: 'billing-session-'
    });
  }

  /**
   * Clear all cached providers (useful for testing)
   */
  clearCache(): void {
    this.providers.clear();
  }

  /**
   * Register a custom provider
   */
  registerProvider(key: string, provider: StorageProvider): void {
    this.providers.set(key, provider);
  }
}

/**
 * Convenience function to get the default storage provider
 */
export const getDefaultStorage = (): StorageProvider => {
  return StorageFactory.getInstance().getDefaultProvider();
};

/**
 * Convenience function to get session storage provider
 */
export const getSessionStorage = (): StorageProvider => {
  return StorageFactory.getInstance().getSessionProvider();
};
