/**
 * HTTP Client Interface - Implements Dependency Inversion Principle
 * Abstracts HTTP operations to allow switching between axios, fetch, or other HTTP libraries
 * without changing business logic
 */

export interface HttpResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface HttpError {
  message: string;
  status?: number;
  statusText?: string;
  data?: any;
  wasCancelled?: boolean;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  baseURL?: string;
  signal?: AbortSignal;
}

export interface HttpClient {
  /**
   * Perform a GET request
   */
  get<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>;

  /**
   * Perform a POST request
   */
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>;

  /**
   * Perform a PUT request
   */
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>;

  /**
   * Perform a PATCH request
   */
  patch<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>;

  /**
   * Perform a DELETE request
   */
  delete<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>;

  /**
   * Set default configuration
   */
  setDefaults(config: RequestConfig): void;

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>): void;

  /**
   * Add response interceptor
   */
  addResponseInterceptor<T>(
    onSuccess: (response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>,
    onError?: (error: HttpError) => HttpError | Promise<HttpError>
  ): void;
}

/**
 * Request/Response interceptor types
 */
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
export type ResponseInterceptor<T> = (response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>;
export type ErrorInterceptor = (error: HttpError) => HttpError | Promise<HttpError>;
