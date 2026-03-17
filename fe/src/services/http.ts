import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { auth } from '@/store/auth';

// Create axios instance
const HOST_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8889';
const backendBaseURL = (import.meta.env.VITE_API_BASE_URL as string) || `${HOST_ORIGIN}/api/v1`;
const http = axios.create({
  baseURL: backendBaseURL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
http.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const authData = auth.get();
    if (authData?.access_token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${authData.access_token}`,
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
http.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authData = auth.get();
        if (authData?.refresh_token) {
          // Try to refresh token
          const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: authData.refresh_token,
          });

          const { access_token } = response.data;
          
          // Update auth store with new token
          auth.set({ access_token });

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return http(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        auth.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 (Forbidden)
    if (error.response?.status === 403) {
      message.error('Bạn không có quyền thực hiện hành động này');
      return Promise.reject(error);
    }

    // Handle other errors
    if (error.response?.data?.detail) {
      message.error(error.response.data.detail);
    } else if (error.message) {
      message.error(error.message);
    }

    return Promise.reject(error);
  }
);

export default http;
