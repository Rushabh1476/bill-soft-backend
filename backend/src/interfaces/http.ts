/**
 * HTTP client interface definitions
 * Defines the contract for all HTTP client implementations
 */

export interface RequestConfig {
    baseURL?: string;
    headers?: Record<string, string>;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    params?: Record<string, any>;
}

export interface HttpResponse<T = any> {
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
}

export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
export type ResponseInterceptor<T = any> = (response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>;
export type ErrorInterceptor = (error: HttpError) => HttpError | Promise<HttpError>;

/**
 * Core HTTP client interface
 * All HTTP client implementations must implement this interface
 */
export interface HttpClient {
    get<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>;
    post<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>;
    put<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>;
    patch<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>;
    delete<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>;
    setDefaults(config: RequestConfig): void;
    addRequestInterceptor(interceptor: RequestInterceptor): void;
    addResponseInterceptor<T>(onSuccess: ResponseInterceptor<T>, onError?: ErrorInterceptor): void;
}
