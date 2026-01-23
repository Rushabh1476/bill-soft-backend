import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosHeaders
} from 'axios';

import {
  HttpClient,
  HttpResponse,
  HttpError,
  RequestConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor
} from '../../interfaces/http';

/**
 * Axios implementation of HttpClient
 * Provides a consistent HTTP interface while using axios internally
 */
export class AxiosHttpClient implements HttpClient {
  private axiosInstance: AxiosInstance;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: {
    success: ResponseInterceptor<any>;
    error?: ErrorInterceptor;
  }[] = [];

  constructor(baseConfig?: RequestConfig) {
    this.axiosInstance = axios.create({
      // BillSoft API standard port 5000
      baseURL: baseConfig?.baseURL || 'http://localhost:5000/api',
      timeout: baseConfig?.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...baseConfig?.headers
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // ============================
    // REQUEST INTERCEPTOR
    // ============================
    this.axiosInstance.interceptors.request.use(
      async (config) => {

        /**
         * ✅ FINAL SAFE FIX (NO TS ERROR)
         * Attach Token from localStorage. 
         * Checking both 'token' and 'authToken' for maximum compatibility
         */
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');

        if (token && config.headers instanceof AxiosHeaders) {
          config.headers.set(
            'Authorization',
            `Bearer ${token}`
          );
        }

        // Apply custom request interceptors (UNCHANGED)
        for (const interceptor of this.requestInterceptors) {
          const modifiedConfig = await interceptor(
            this.convertAxiosConfigToRequestConfig(config)
          );
          Object.assign(
            config,
            this.convertRequestConfigToAxiosConfig(modifiedConfig)
          );
        }

        return config;
      },
      (error) => Promise.reject(this.convertAxiosErrorToHttpError(error))
    );

    // ============================
    // RESPONSE INTERCEPTOR
    // ============================
    this.axiosInstance.interceptors.response.use(
      (response) => {
        let httpResponse =
          this.convertAxiosResponseToHttpResponse(response);

        for (const { success } of this.responseInterceptors) {
          try {
            const result = success(httpResponse);
            if (result instanceof Promise) {
              result.then((modifiedResponse) => {
                Object.assign(httpResponse, modifiedResponse);
              });
            } else {
              httpResponse = result;
            }
          } catch (error) {
            console.warn('Response interceptor error:', error);
          }
        }

        return response;
      },
      (error) => {
        let httpError = this.convertAxiosErrorToHttpError(error);

        for (const { error: errorInterceptor } of this.responseInterceptors) {
          if (errorInterceptor) {
            try {
              const result = errorInterceptor(httpError);
              if (result instanceof Promise) {
                result.then((modifiedError) => {
                  Object.assign(httpError, modifiedError);
                });
              } else {
                httpError = result;
              }
            } catch (interceptorError) {
              console.warn(
                'Error interceptor error:',
                interceptorError
              );
            }
          }
        }

        return Promise.reject(httpError);
      }
    );
  }

  private convertAxiosResponseToHttpResponse<T>(
    axiosResponse: AxiosResponse<T>
  ): HttpResponse<T> {
    return {
      data: axiosResponse.data,
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
      headers: axiosResponse.headers as Record<string, string>
    };
  }

  private convertAxiosErrorToHttpError(
    axiosError: AxiosError
  ): HttpError {
    return {
      // ✅ Fix: Extracting nested server message if available
      message: (axiosError.response?.data as any)?.message || axiosError.message,
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      data: axiosError.response?.data
    };
  }

  private convertRequestConfigToAxiosConfig(
    config: RequestConfig
  ): AxiosRequestConfig {
    return {
      headers: config.headers,
      timeout: config.timeout,
      baseURL: config.baseURL
    };
  }

  private convertAxiosConfigToRequestConfig(
    axiosConfig: AxiosRequestConfig
  ): RequestConfig {
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

        if (
          axios.isAxiosError(error) &&
          error.response?.status &&
          error.response.status < 500
        ) {
          throw this.convertAxiosErrorToHttpError(error);
        }

        if (attempt < retries) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    throw this.convertAxiosErrorToHttpError(lastError);
  }

  async get<T>(
    url: string,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> {
    return this.executeWithRetry(
      () =>
        this.axiosInstance.get<T>(
          url,
          this.convertRequestConfigToAxiosConfig(config || {})
        ),
      config?.retries,
      config?.retryDelay
    );
  }

  async post<T>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> {
    return this.executeWithRetry(
      () =>
        this.axiosInstance.post<T>(
          url,
          data,
          this.convertRequestConfigToAxiosConfig(config || {})
        ),
      config?.retries,
      config?.retryDelay
    );
  }

  async put<T>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> {
    return this.executeWithRetry(
      () =>
        this.axiosInstance.put<T>(
          url,
          data,
          this.convertRequestConfigToAxiosConfig(config || {})
        ),
      config?.retries,
      config?.retryDelay
    );
  }

  async patch<T>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> {
    return this.executeWithRetry(
      () =>
        this.axiosInstance.patch<T>(
          url,
          data,
          this.convertRequestConfigToAxiosConfig(config || {})
        ),
      config?.retries,
      config?.retryDelay
    );
  }

  async delete<T>(
    url: string,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> {
    return this.executeWithRetry(
      () =>
        this.axiosInstance.delete<T>(
          url,
          this.convertRequestConfigToAxiosConfig(config || {})
        ),
      config?.retries,
      config?.retryDelay
    );
  }

  setDefaults(config: RequestConfig): void {
    Object.assign(
      this.axiosInstance.defaults,
      this.convertRequestConfigToAxiosConfig(config)
    );
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor<T>(
    onSuccess: ResponseInterceptor<T>,
    onError?: ErrorInterceptor
  ): void {
    this.responseInterceptors.push({
      success: onSuccess,
      error: onError
    });
  }

  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  static create(config?: RequestConfig): AxiosHttpClient {
    return new AxiosHttpClient(config);
  }
}