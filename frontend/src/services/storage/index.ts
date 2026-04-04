/**
 * Storage module exports
 * Provides a clean interface for all storage-related functionality
 */

// Factory and utilities
import { 
  StorageFactory, 
  getDefaultStorage, 
  getSessionStorage,
  type StorageType,
  type StorageFactoryConfig 
} from './StorageFactory';

// Interfaces
export type { StorageProvider, StorageConfig, StorageResult } from '../../interfaces/storage';

// Implementations
export { LocalStorageProvider } from './LocalStorageProvider';
export { CloudStorageProvider } from './CloudStorageProvider';

export { 
  StorageFactory, 
  getDefaultStorage, 
  getSessionStorage,
  type StorageType,
  type StorageFactoryConfig 
};

// Re-export for convenience
export const storage = {
  getDefault: () => getDefaultStorage(),
  getSession: () => getSessionStorage(),
  createProvider: (config: StorageFactoryConfig) => StorageFactory.getInstance().createProvider(config)
};
