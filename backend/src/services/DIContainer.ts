/**
 * Dependency Injection Container
 * Implements the Dependency Inversion Principle by managing dependencies
 * and their lifecycles through a centralized container
 */

import { StorageProvider } from '../interfaces/storage';
import { HttpClient } from '../interfaces/http';
import { getDefaultStorage } from '../services/storage';
import { getDefaultHttpClient } from '../services/http';
import { CustomerService, ICustomerService } from '../services/customerService';
import { ProductService, IProductService } from '../services/productService';
import { BillService, IBillService } from '../services/billService';

/**
 * Service registry for type-safe dependency injection
 */
export interface ServiceRegistry {
  storageProvider: StorageProvider;
  httpClient: HttpClient;
  customerService: ICustomerService;
  productService: IProductService;
  billService: IBillService;
  // Add other services here as we create them
}

/**
 * Service configuration for dependency injection
 */
export interface ServiceConfig {
  storage?: {
    type: 'localStorage' | 'sessionStorage' | 'cloudStorage';
    config?: any;
  };
  http?: {
    type: 'axios' | 'fetch';
    config?: any;
  };
  features?: {
    enableOfflineMode?: boolean;
    enableCaching?: boolean;
    enableMetrics?: boolean;
  };
}

/**
 * Dependency injection container implementation
 * Uses singleton pattern with lazy initialization
 */
export class DIContainer {
  private static instance: DIContainer;
  private services: Map<string, any> = new Map();
  private config: ServiceConfig;

  private constructor(config: ServiceConfig = {}) {
    this.config = {
      storage: {
        type: 'localStorage',
        ...config.storage
      },
      http: {
        type: 'axios',
        ...config.http
      },
      features: {
        enableOfflineMode: true,
        enableCaching: true,
        enableMetrics: process.env.NODE_ENV === 'development',
        ...config.features
      },
      ...config
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: ServiceConfig): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer(config);
    }
    return DIContainer.instance;
  }

  /**
   * Register a service instance
   */
  register<T>(key: keyof ServiceRegistry, instance: T): void {
    this.services.set(key as string, instance);
  }

  /**
   * Get a service instance (lazy initialization)
   */
  get<K extends keyof ServiceRegistry>(key: K): ServiceRegistry[K] {
    const service = this.services.get(key as string);

    if (service) {
      return service;
    }

    // Lazy initialization
    const newService = this.createService(key);
    this.services.set(key as string, newService);
    return newService;
  }

  /**
   * Create service instances based on configuration
   */
  private createService<K extends keyof ServiceRegistry>(key: K): ServiceRegistry[K] {
    switch (key) {
      case 'storageProvider':
        return this.createStorageProvider() as ServiceRegistry[K];

      case 'httpClient':
        return this.createHttpClient() as ServiceRegistry[K];

      case 'customerService':
        return this.createCustomerService() as ServiceRegistry[K];

      case 'productService':
        return this.createProductService() as ServiceRegistry[K];

      case 'billService':
        return this.createBillService() as ServiceRegistry[K];

      default:
        throw new Error(`Unknown service: ${key}`);
    }
  }

  private createStorageProvider(): StorageProvider {
    // For now, use default storage - can be enhanced to support different types
    return getDefaultStorage();
  }

  private createHttpClient(): HttpClient {
    // For now, use default HTTP client - can be enhanced to support different types
    const client = getDefaultHttpClient();

    // Add authentication interceptor if needed
    // Add authentication interceptor
    client.addRequestInterceptor((config) => {
      // Add auth headers, API keys, etc.
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        ...config.headers,
        'X-API-Version': '1.0',
        'X-Client': 'billing-app'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      return {
        ...config,
        headers
      };
    });

    return client;
  }

  private createCustomerService(): ICustomerService {
    const storage = this.get('storageProvider');
    const httpClient = this.get('httpClient');

    return new CustomerService(storage, httpClient, {
      enableOfflineMode: this.config.features?.enableOfflineMode,
      cacheTimeout: this.config.features?.enableCaching ? 5 * 60 * 1000 : 0,
      apiEndpoint: 'customers'
    });
  }

  private createProductService(): IProductService {
    const storage = this.get('storageProvider');
    const httpClient = this.get('httpClient');

    return new ProductService(storage, httpClient, {
      enableOfflineMode: this.config.features?.enableOfflineMode,
      cacheTimeout: this.config.features?.enableCaching ? 5 * 60 * 1000 : 0,
      apiEndpoint: 'products',
      lowStockThreshold: 10
    });
  }

  private createBillService(): IBillService {
    const storage = this.get('storageProvider');
    const httpClient = this.get('httpClient');

    return new BillService(storage, httpClient, {
      enableOfflineMode: this.config.features?.enableOfflineMode,
      cacheTimeout: this.config.features?.enableCaching ? 5 * 60 * 1000 : 0,
      apiEndpoint: 'bills',
      billNumberPrefix: 'INV',
      defaultTaxRate: 0 // Tax is per-product, not a global flat rate
    });
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    DIContainer.instance = null as any;
  }

  /**
   * Get all registered service keys
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Check if a service is registered
   */
  has(key: keyof ServiceRegistry): boolean {
    return this.services.has(key as string);
  }
}

/**
 * Convenience functions for common services
 */
export const getCustomerService = (): ICustomerService => {
  return DIContainer.getInstance().get('customerService');
};

export const getProductService = (): IProductService => {
  return DIContainer.getInstance().get('productService');
};

export const getBillService = (): IBillService => {
  return DIContainer.getInstance().get('billService');
};

export const getStorageProvider = (): StorageProvider => {
  return DIContainer.getInstance().get('storageProvider');
};

export const getHttpClient = (): HttpClient => {
  return DIContainer.getInstance().get('httpClient');
};

/**
 * Initialize the DI container with custom configuration
 */
export const initializeDI = (config?: ServiceConfig): DIContainer => {
  DIContainer.reset();
  return DIContainer.getInstance(config);
};

/**
 * React hook for dependency injection (to be used later)
 */
export const useDI = () => {
  return {
    container: DIContainer.getInstance(),
    customerService: getCustomerService(),
    productService: getProductService(),
    billService: getBillService(),
    storageProvider: getStorageProvider(),
    httpClient: getHttpClient()
  };
};
