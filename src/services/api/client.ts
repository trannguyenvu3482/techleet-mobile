import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

type InternalRequestOptions = {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  timeout?: number;
};

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string, timeout = 10000) {
    this.baseURL = baseURL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3030';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const authStorage = await AsyncStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        return parsed.state?.token || null;
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
    return null;
  }

  private async clearAuthAndRedirect(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth-storage');
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        if (response.data && typeof response.data === 'object' && 'data' in response.data && 'statusCode' in response.data) {
          return { ...response, data: response.data.data };
        }
        return response;
      },
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          await this.clearAuthAndRedirect();
        }

        if (error.response?.data) {
          const errorData = error.response.data as { message?: string; error?: string };
          const errorMessage = errorData.message || errorData.error || `HTTP ${error.response.status}`;
          throw new ApiError(errorMessage, error.response.status, error.response.data);
        }

        if (error.code === 'ECONNABORTED') {
          throw new ApiError('Request timeout', 408);
        }

        throw new ApiError(error.message || 'Unknown error occurred', 0);
      }
    );
  }

  async get<T = unknown>(
    endpoint: string,
    params?: Record<string, unknown>,
    options?: Omit<InternalRequestOptions, 'params'>
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      params,
      ...options,
    };
    const response = await this.client.get<T>(endpoint, config);
    return response.data;
  }

  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: InternalRequestOptions
  ): Promise<T> {
    const response = await this.client.post<T>(endpoint, body, options);
    return response.data;
  }

  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: InternalRequestOptions
  ): Promise<T> {
    const response = await this.client.put<T>(endpoint, body, options);
    return response.data;
  }

  async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: InternalRequestOptions
  ): Promise<T> {
    const response = await this.client.patch<T>(endpoint, body, options);
    return response.data;
  }

  async delete<T = unknown>(
    endpoint: string,
    params?: Record<string, unknown>,
    options?: Omit<InternalRequestOptions, 'params'>
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      params,
      ...options,
    };
    const response = await this.client.delete<T>(endpoint, config);
    return response.data;
  }

  async upload<T = unknown>(
    endpoint: string,
    fileUri: string,
    fileName: string,
    fileType: string,
    additionalData?: Record<string, unknown>
  ): Promise<T> {
    const formData = new FormData();
    
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: fileType,
    } as any);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const response = await this.client.post<T>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export class ApiError extends Error {
  public status: number;
  public data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const api = new ApiClient();

export { ApiClient };
export type { InternalRequestOptions as RequestOptions };

