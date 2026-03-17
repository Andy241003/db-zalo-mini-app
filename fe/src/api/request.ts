import type { AxiosRequestConfig, Method } from 'axios';

import { message as $message } from 'antd';
import axios from 'axios';

import store from '@/stores';
import { setGlobalState } from '@/stores/global.store';
// import { history } from '@/routes/history';

const HOST_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8889';
const baseURL = (import.meta.env.VITE_API_BASE_URL as string) || `${HOST_ORIGIN}/api/v1`;

const axiosInstance = axios.create({
  baseURL,
  timeout: 15000,
});

axiosInstance.interceptors.request.use(
  config => {
    store.dispatch(
      setGlobalState({
        loading: true,
      }),
    );
    
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });
    
    // Attach Authorization header if token exists
    try {
      // Try to get token from authState first, then fallback to direct token
      let token = null;
      const authState = localStorage.getItem('authState');
      if (authState) {
        const parsed = JSON.parse(authState);
        token = parsed.token;
      }
      // Fallback to direct token key
      if (!token) {
        token = localStorage.getItem('token');
      }
      
      console.log('Request interceptor - Token:', token ? 'EXISTS' : 'MISSING');
      if (token) {
        config.headers = config.headers || {};
        (config.headers as any)['Authorization'] = `Bearer ${token}`;
        console.log('Request interceptor - Authorization header set');
      }
      
      // Multi-tenant header injection
      let tenantId = null;
      
      // Try to get tenant ID from auth state first
      if (authState) {
        const parsed = JSON.parse(authState);
        console.log('Request interceptor - Parsed auth state:', parsed);
        const role = parsed.role;
        
        if (role === 'SUPER_ADMIN' || role === 'super_admin') {
          // Super admin can access any tenant - get from JWT or default to tenant_id from request
          console.log('Super admin detected - will use JWT tenant_id');
        } else if (role === 'HOTEL_ADMIN' || role === 'hotel_admin') {
          // Hotel admin uses their own tenant ID
          tenantId = parsed.tenantId || parsed.tenant_id || (parsed.user && parsed.user.tenant_id);
          console.log('Hotel admin tenant ID lookup:', {
            tenantId: parsed.tenantId,
            tenant_id: parsed.tenant_id,
            user_tenant_id: parsed.user && parsed.user.tenant_id,
            selected: tenantId
          });
        } else {
          console.log('Unknown role:', role, '- will try to get tenant from JWT');
        }
      }
      
      // If no tenant ID from auth state, try to decode JWT token
      if (!tenantId && token) {
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('JWT payload:', payload);
            tenantId = payload.tenant_id;
            console.log('Tenant ID from JWT:', tenantId);
          }
        } catch (e) {
          console.error('Failed to decode JWT:', e);
        }
      }
      
      if (tenantId) {
        config.headers = config.headers || {};
        (config.headers as any)['X-Tenant-Id'] = tenantId.toString();
        console.log('Added X-Tenant-Id header:', tenantId);
      } else {
        console.warn('No tenant ID found - request may fail');
      }
      
      console.log('Final request headers:', config.headers);
      console.log('Request URL:', (config.baseURL || '') + (config.url || ''));
      console.log('Request params:', config.params);
    } catch (e) {
      console.error('Request interceptor - Token error:', e);
    }

    return config;
  },
  error => {
    store.dispatch(
      setGlobalState({
        loading: false,
      }),
    );
    Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  config => {
    store.dispatch(
      setGlobalState({
        loading: false,
      }),
    );

    if (config?.data?.message) {
      // $message.success(config.data.message)
    }

    return config?.data;
  },
  error => {
    store.dispatch(
      setGlobalState({
        loading: false,
      }),
    );
    // if needs to navigate to login page when request exception
    // history.replace('/login');
    let errorMessage = '系统异常';

    if (error?.message?.includes('Network Error')) {
      errorMessage = '网络错误，请检查您的网络';
    } else {
      errorMessage = error?.message;
    }

    console.dir(error);
    error.message && $message.error(errorMessage);

    return {
      status: false,
      message: errorMessage,
      result: null,
    };
  },
);

export type Response<T = any> = {
  status: boolean;
  message: string;
  result: T;
};

export type MyResponse<T = any> = Promise<Response<T>>;

/**
 *
 * @param method - request methods
 * @param url - request url
 * @param data - request data or params
 */
export const request = <T = any>(
  method: Lowercase<Method>,
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): MyResponse<T> => {
  // Prefix all API routes with versioned base used by FastAPI backend
  const prefix = '/api/v1';

  url = prefix + url;

  if (method === 'post') {
    return axiosInstance.post(url, data, config);
  } else if (method === 'put') {
    return axiosInstance.put(url, data, config);
  } else if (method === 'delete') {
    return axiosInstance.delete(url, {
      params: data,
      ...config,
    });
  } else {
    return axiosInstance.get(url, {
      params: data,
      ...config,
    });
  }
};
