/**
 * HTTP module exports
 * Provides a clean interface for all HTTP-related functionality
 */

// Factory and utilities
import { 
  HttpClientFactory, 
  getDefaultHttpClient, 
  getFetchHttpClient,
  type HttpClientType,
  type HttpClientFactoryConfig 
} from './HttpClientFactory';

// Interfaces
export type { 
  HttpClient, 
  HttpResponse, 
  HttpError, 
  RequestConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor
} from '../../interfaces/http';

// Implementations
export { AxiosHttpClient } from './AxiosHttpClient';
export { FetchHttpClient } from './FetchHttpClient';

export { 
  HttpClientFactory, 
  getDefaultHttpClient, 
  getFetchHttpClient,
  type HttpClientType,
  type HttpClientFactoryConfig 
};

// Re-export for convenience
export const http = {
  getDefault: () => getDefaultHttpClient(),
  getFetch: () => getFetchHttpClient(),
  createClient: (config: HttpClientFactoryConfig) => HttpClientFactory.getInstance().createClient(config)
};
