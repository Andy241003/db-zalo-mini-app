// API Configuration for different environments
export const API_CONFIG = {
  baseURL: (import.meta.env.VITE_API_BASE_URL as string) || 'https://db-zalo-mini-app-be.onrender.com',
  uploadURL: (import.meta.env.VITE_API_BASE_URL as string)?.replace('/api', '') || 'https://db-zalo-mini-app-be.onrender.com',
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
