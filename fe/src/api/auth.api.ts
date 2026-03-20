import { request } from '../utils/request';
import { LoginRequest } from '../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_info: {
    id: number;
    username: string;
    email?: string;
    role: string;
    tenant_id?: number;
    status: string;
    created_at: string;
    updated_at: string;
  };
  tenant_info?: {
    id: number;
    name: string;
    domain: string;
    status: string;
  };
}

export const authAPI = {
  // Login user
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    // Backend expects OAuth2PasswordRequestForm format
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);
    
    return request.post('/api/v1/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },

  // Get current user profile
  getProfile: async (): Promise<LoginResponse['user_info']> => {
    return request.get('/api/v1/auth/me');
  },

  // Logout user
  logout: async (): Promise<{ message: string }> => {
    return request.post('/api/v1/auth/logout');
  },

  // Test token
  testToken: async (): Promise<LoginResponse['user_info']> => {
    return request.post('/api/v1/auth/test-token');
  }
};
