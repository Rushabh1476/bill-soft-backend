import axios, { AxiosInstance, CreateAxiosDefaults, AxiosResponse, AxiosError, InternalAxiosRequestConfig as AxiosRequestConfig } from 'axios';
import {
  HttpClient,
  HttpResponse,
  HttpError,
  RequestConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor
} from '../../interfaces/http';
import { API_URL } from '../../config/api';

/**
 * Axios implementation of HttpClient
 * Provides a consistent HTTP interface while using axios internally
 */
export class AxiosHttpClient implements HttpClient {
  private axiosInstance: AxiosInstance;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: { success: ResponseInterceptor<any>; error?: ErrorInterceptor }[] = [];

  constructor(baseConfig?: RequestConfig) {
    this.axiosInstance = axios.create({
      baseURL: API_URL, // Use centralized API_URL
      timeout: baseConfig?.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...baseConfig?.headers
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Apply custom request interceptors
        for (const interceptor of this.requestInterceptors) {
          const modifiedConfig = await interceptor(this.convertAxiosConfigToRequestConfig(config));
          Object.assign(config, this.convertRequestConfigToAxiosConfig(modifiedConfig));
        }
        return config;
      },
      (error) => Promise.reject(this.convertAxiosErrorToHttpError(error))
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Convert and apply custom response interceptors
        let httpResponse = this.convertAxiosResponseToHttpResponse(response);

        // Apply custom response interceptors synchronously for compatibility
        for (const { success } of this.responseInterceptors) {
          try {
            const result = success(httpResponse);
            if (result instanceof Promise) {
              // For async interceptors, we'll handle them differently
              result.then(modifiedResponse => {
                Object.assign(httpResponse, modifiedResponse);
              });
            } else {
              httpResponse = result;
            }
          } catch (error) {
            console.warn('Response interceptor error:', error);
          }
        }

        return response; // Return original axios response to maintain compatibility
      },
      (error) => {
        let httpError = this.convertAxiosErrorToHttpError(error);

        // Apply custom error interceptors
        for (const { error: errorInterceptor } of this.responseInterceptors) {
          if (errorInterceptor) {
            try {
              const result = errorInterceptor(httpError);
              if (result instanceof Promise) {
                result.then(modifiedError => {
                  Object.assign(httpError, modifiedError);
                });
              } else {
                httpError = result;
              }
            } catch (interceptorError) {
              console.warn('Error interceptor error:', interceptorError);
            }
          }
        }

        return Promise.reject(httpError);
      }
    );
  }

  private convertAxiosResponseToHttpResponse<T>(axiosResponse: AxiosResponse<T>): HttpResponse<T> {
    return {
      data: axiosResponse.data,
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
      headers: axiosResponse.headers as Record<string, string>
    };
  }

  private convertAxiosErrorToHttpError(axiosError: AxiosError): HttpError {
    return {
      message: axiosError.message,
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      data: axiosError.response?.data
    };
  }

  private convertRequestConfigToAxiosConfig(config: RequestConfig): AxiosRequestConfig {
    return {
      headers: config.headers as any,
      timeout: config.timeout,
      baseURL: config.baseURL
    };
  }

  private convertAxiosConfigToRequestConfig(axiosConfig: AxiosRequestConfig): RequestConfig {
    return {
      headers: axiosConfig.headers as Record<string, string>,
      timeout: axiosConfig.timeout,
      baseURL: axiosConfig.baseURL
    };
  }

  private async executeWithRetry<T>(
    operation: () => Promise<AxiosResponse<T>>,
    retries: number = 3,
    retryDelay: number = 1000
  ): Promise<HttpResponse<T>> {
    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await operation();
        return this.convertAxiosResponseToHttpResponse(response);
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
          throw this.convertAxiosErrorToHttpError(error);
        }

        // Wait before retrying
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    throw this.convertAxiosErrorToHttpError(lastError);
  }

  async get<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    const retries = config?.retries ?? 3;
    const retryDelay = config?.retryDelay ?? 1000;

    return this.executeWithRetry(
      () => this.axiosInstance.get<T>(url, this.convertRequestConfigToAxiosConfig(config || {})),
      retries,
      retryDelay
    );
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
    const retries = config?.retries ?? 3;
    const retryDelay = config?.retryDelay ?? 1000;

    return this.executeWithRetry(
      () => this.axiosInstance.post<T>(url, data, this.convertRequestConfigToAxiosConfig(config || {})),
      retries,
      retryDelay
    );
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
    const retries = config?.retries ?? 3;
    const retryDelay = config?.retryDelay ?? 1000;

    return this.executeWithRetry(
      () => this.axiosInstance.put<T>(url, data, this.convertRequestConfigToAxiosConfig(config || {})),
      retries,
      retryDelay
    );
  }

  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
    const retries = config?.retries ?? 3;
    const retryDelay = config?.retryDelay ?? 1000;

    return this.executeWithRetry(
      () => this.axiosInstance.patch<T>(url, data, this.convertRequestConfigToAxiosConfig(config || {})),
      retries,
      retryDelay
    );
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    const retries = config?.retries ?? 3;
    const retryDelay = config?.retryDelay ?? 1000;

    return this.executeWithRetry(
      () => this.axiosInstance.delete<T>(url, this.convertRequestConfigToAxiosConfig(config || {})),
      retries,
      retryDelay
    );
  }

  setDefaults(config: RequestConfig): void {
    Object.assign(this.axiosInstance.defaults, this.convertRequestConfigToAxiosConfig(config));
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
   * Get the underlying axios instance for advanced usage
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Create a new instance with different configuration
   */
  static create(config?: RequestConfig): AxiosHttpClient {
    return new AxiosHttpClient(config);
  }
}
