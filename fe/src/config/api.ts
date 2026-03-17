// API Configuration for different environments
const HOST_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8889';
const envBaseURL = (import.meta.env.VITE_API_BASE_URL as string) || '';

export const API_CONFIG = {
  baseURL: envBaseURL || `${HOST_ORIGIN}/api/v1`,
  uploadURL: envBaseURL ? envBaseURL.replace(/\/api\/?$/, '') : HOST_ORIGIN,
}

// Helper functions
export const getApiUrl = (endpoint: string) => `${API_CONFIG.baseURL}${endpoint}`;
export const getUploadUrl = (endpoint: string) => `${API_CONFIG.uploadURL}${endpoint}`;

// Environment checks
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

console.log('🔧 API Config:', {
  baseURL: API_CONFIG.baseURL,
  uploadURL: API_CONFIG.uploadURL,
  isDevelopment,
  isProduction,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL
});
