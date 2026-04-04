import {
  HttpClient,
  HttpResponse,
  HttpError,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor
} from '../../interfaces/http';
import { RequestConfig } from '../../interfaces/http'; // Moved RequestConfig to its own import
import { API_URL } from '../../config/api'; // Moved API_URL import to the top

/**
 * Fetch API implementation of HttpClient
 * Uses native fetch API with no external dependencies
 */
export class FetchHttpClient implements HttpClient {
  private defaultConfig: RequestConfig;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: { success: ResponseInterceptor<any>; error?: ErrorInterceptor }[] = [];

  constructor(baseConfig?: RequestConfig) {
    this.defaultConfig = {
      baseURL: API_URL, // Use centralized API_URL
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      ...baseConfig
    };
  }

  private async executeRequest<T>(
    url: string,
    method: string,
    data?: any,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const fullUrl = this.buildUrl(url, mergedConfig.baseURL || '');

    // Apply request interceptors
    let requestConfig = mergedConfig;
    for (const interceptor of this.requestInterceptors) {
      requestConfig = await interceptor(requestConfig);
    }

    const fetchOptions: RequestInit = {
      method,
      headers: requestConfig.headers,
      signal: this.createAbortSignal(requestConfig.timeout)
    };

    if (data && method !== 'GET') {
      fetchOptions.body = JSON.stringify(data);
    }

    const retries = requestConfig.retries ?? 3;
    const retryDelay = requestConfig.retryDelay ?? 1000;

    return this.executeWithRetry(
      () => this.performFetch<T>(fullUrl, fetchOptions),
      retries,
      retryDelay
    );
  }

  private async performFetch<T>(url: string, options: RequestInit): Promise<HttpResponse<T>> {
    try {
      const response = await fetch(url, options);

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      let data: T;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text() as unknown as T;
      }

      const httpResponse: HttpResponse<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers
      };

      if (!response.ok) {
        const error: HttpError = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          statusText: response.statusText,
          data
        };
        throw error;
      }

      // Apply response interceptors
      let finalResponse = httpResponse;
      for (const { success } of this.responseInterceptors) {
        finalResponse = await success(finalResponse);
      }

      return finalResponse;
    } catch (error) {
      // Handle fetch errors
      let httpError: HttpError;

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          httpError = {
            message: 'Request timeout',
            status: 408,
            statusText: 'Request Timeout'
          };
        } else {
          httpError = {
            message: error.message,
            data: error
          };
        }
      } else {
        httpError = error as HttpError;
      }

      // Apply error interceptors
      for (const { error: errorInterceptor } of this.responseInterceptors) {
        if (errorInterceptor) {
          httpError = await errorInterceptor(httpError);
        }
      }

      throw httpError;
    }
  }

  private buildUrl(url: string, baseURL: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    const base = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    const path = url.startsWith('/') ? url : `/${url}`;

    return `${base}${path}`;
  }

  private createAbortSignal(timeout?: number): AbortSignal | undefined {
    if (!timeout) return undefined;

    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
  }

  private async executeWithRetry<T>(
    operation: () => Promise<HttpResponse<T>>,
    retries: number,
    retryDelay: number
  ): Promise<HttpResponse<T>> {
    let lastError: HttpError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as HttpError;

        // Don't retry on client errors (4xx)
        if (lastError.status && lastError.status >= 400 && lastError.status < 500) {
          throw lastError;
        }

        // Wait before retrying
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    throw lastError!;
  }

  async get<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.executeRequest<T>(url, 'GET', undefined, config);
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.executeRequest<T>(url, 'POST', data, config);
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.executeRequest<T>(url, 'PUT', data, config);
  }

  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.executeRequest<T>(url, 'PATCH', data, config);
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.executeRequest<T>(url, 'DELETE', undefined, config);
  }

  setDefaults(config: RequestConfig): void {
    Object.assign(this.defaultConfig, config);
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor<T>(
    onSuccess: ResponseInterceptor<T>,
    onError?: ErrorInterceptor
  ): void {
    this.responseInterceptors.push({ success: onSuccess, error: onError });
  }

  /**
   * Create a new instance with different configuration
   */
  static create(config?: RequestConfig): FetchHttpClient {
    return new FetchHttpClient(config);
  }
}
