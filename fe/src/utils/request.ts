import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { authStore } from '../stores/authStore';
import { tenantStore } from '../stores/tenantStore';

// Create typed axios instance
const HOST_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8889';
const axiosInstance: AxiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL as string) || `${HOST_ORIGIN}/api/v1`,
  timeout: 15000,
});

// Request interceptor: inject Authorization and X-Tenant-Id headers
axiosInstance.interceptors.request.use(
  (config) => {
    // Initialize headers if not present
    if (!config.headers) {
      config.headers = {};
    }

    const token = authStore.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Multi-tenant header injection
    const role = authStore.getRole();
    let tenantId: number | null = null;

    if (role === 'SUPER_ADMIN') {
      // Super admin uses selected tenant from tenant store
      tenantId = tenantStore.getSelectedTenantId();
    } else if (role === 'HOTEL_ADMIN') {
      // Hotel admin uses their own tenant ID
      tenantId = authStore.getTenantId();
    }

    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId.toString();
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: normalize error shape
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    console.error('API Response error:', {
      status: error?.response?.status,
      url: error?.config?.url,
      message: error?.message,
      data: error?.response?.data
    });
    
    const normalizedError = {
      message: error?.response?.data?.detail || error?.message || 'An error occurred',
      status: error?.response?.status || 500,
      data: error?.response?.data || null,
    };
    return Promise.reject(normalizedError);
  }
);

// Export main request function
export const request = axiosInstance;

// Typed helper functions
export const get = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return request.get(url, config);
};

export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return request.post(url, data, config);
};

export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return request.put(url, data, config);
};

export const del = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return request.delete(url, config);
};

export default request;
