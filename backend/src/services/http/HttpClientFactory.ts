import { HttpClient, RequestConfig } from '../../interfaces/http';
import { API_URL } from '../../config/api';
import { AxiosHttpClient } from './AxiosHttpClient';
import { FetchHttpClient } from './FetchHttpClient';

/**
 * HTTP client types
 */
export type HttpClientType = 'axios' | 'fetch';

/**
 * Configuration for HTTP client factory
 */
export interface HttpClientFactoryConfig extends RequestConfig {
  type: HttpClientType;
  enableLogging?: boolean;
  enableMetrics?: boolean;
}

/**
 * Factory class for creating HTTP clients
 * Implements the Factory pattern and supports dependency injection
 */
export class HttpClientFactory {
  private static instance: HttpClientFactory;
  private clients: Map<string, HttpClient> = new Map();

  private constructor() { }

  /**
   * Get singleton instance
   */
  static getInstance(): HttpClientFactory {
    if (!HttpClientFactory.instance) {
      HttpClientFactory.instance = new HttpClientFactory();
    }
    return HttpClientFactory.instance;
  }

  /**
   * Create an HTTP client based on configuration
   */
  createClient(config: HttpClientFactoryConfig): HttpClient {
    const cacheKey = `${config.type}-${JSON.stringify(config)}`;

    // Return cached client if exists
    if (this.clients.has(cacheKey)) {
      return this.clients.get(cacheKey)!;
    }

    let client: HttpClient;

    switch (config.type) {
      case 'axios':
        client = new AxiosHttpClient(config);
        break;

      case 'fetch':
        client = new FetchHttpClient(config);
        break;

      default:
        throw new Error(`Unknown HTTP client type: ${config.type}`);
    }

    // Add logging interceptor if enabled
    if (config.enableLogging) {
      this.addLoggingInterceptors(client);
    }

    // Add metrics interceptor if enabled
    if (config.enableMetrics) {
      this.addMetricsInterceptors(client);
    }

    // Cache the client
    this.clients.set(cacheKey, client);
    return client;
  }

  /**
   * Get the default HTTP client for the application
   */
  getDefaultClient(): HttpClient {
    return this.createClient({
      type: 'axios',
      baseURL: API_URL, // Use centralized API_URL
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      enableLogging: process.env.NODE_ENV === 'development',
      enableMetrics: true
    });
  }

  /**
   * Get a lightweight client using fetch API
   */
  getFetchClient(): HttpClient {
    return this.createClient({
      type: 'fetch',
      baseURL: API_URL, // Use centralized API_URL
      timeout: 10000,
      enableLogging: process.env.NODE_ENV === 'development'
    });
  }

  /**
   * Add logging interceptors to a client
   */
  private addLoggingInterceptors(client: HttpClient): void {
    // Request logging
    client.addRequestInterceptor((config) => {
      console.log(`[HTTP] ${new Date().toISOString()} - Request:`, {
        url: config.baseURL,
        headers: config.headers,
        timeout: config.timeout
      });
      return config;
    });

    // Response logging
    client.addResponseInterceptor(
      (response) => {
        console.log(`[HTTP] ${new Date().toISOString()} - Response:`, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
        return response;
      },
      (error) => {
        console.error(`[HTTP] ${new Date().toISOString()} - Error:`, {
          message: error.message,
          status: error.status,
          statusText: error.statusText
        });
        return error;
      }
    );
  }

  /**
   * Add metrics interceptors to a client
   */
  private addMetricsInterceptors(client: HttpClient): void {
    const metrics = new Map<string, { count: number; totalTime: number; errors: number }>();

    client.addRequestInterceptor((config) => {
      (config as any)._startTime = Date.now();
      return config;
    });

    client.addResponseInterceptor(
      (response) => {
        const url = 'request'; // Would need to extract from config
        const startTime = (response as any)._startTime || Date.now();
        const duration = Date.now() - startTime;

        const metric = metrics.get(url) || { count: 0, totalTime: 0, errors: 0 };
        metric.count++;
        metric.totalTime += duration;
        metrics.set(url, metric);

        return response;
      },
      (error) => {
        const url = 'request'; // Would need to extract from config

        const metric = metrics.get(url) || { count: 0, totalTime: 0, errors: 0 };
        metric.errors++;
        metrics.set(url, metric);

        return error;
      }
    );

    // Expose metrics via global object for debugging
    (globalThis as any).httpMetrics = metrics;
  }

  /**
   * Clear all cached clients (useful for testing)
   */
  clearCache(): void {
    this.clients.clear();
  }

  /**
   * Register a custom client
   */
  registerClient(key: string, client: HttpClient): void {
    this.clients.set(key, client);
  }

  /**
   * Get metrics for all clients
   */
  getMetrics(): Map<string, any> {
    return (globalThis as any).httpMetrics || new Map();
  }
}

/**
 * Convenience function to get the default HTTP client
 */
export const getDefaultHttpClient = (): HttpClient => {
  return HttpClientFactory.getInstance().getDefaultClient();
};

/**
 * Convenience function to get fetch-based HTTP client
 */
export const getFetchHttpClient = (): HttpClient => {
  return HttpClientFactory.getInstance().getFetchClient();
};
