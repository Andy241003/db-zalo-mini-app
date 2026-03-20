
import type { LoginParams, LoginResult, LogoutParams, LogoutResult } from '../interface/user/login';
import { authApi } from './backend.api';

/** 登录接口 - Using real backend auth */
export const apiLogin = async (
  data: LoginParams,
): Promise<{ status: boolean; message: string; result: LoginResult }> => {
  try {
    const resp: any = await authApi.login(data);

    // Backend trả về: { access_token, token_type, user_info, tenant_info }
    if (resp && resp.access_token) {
      return {
        status: true,
        message: 'Login successful',
        result: {
          token: resp.access_token,
          username: resp.user_info?.username || data.username,
          role: resp.user_info?.role || 'admin',
          user_info: resp.user_info,
          tenant_info: resp.tenant_info
        },
      };
    }
    throw new Error('Invalid response format');
  } catch (err: any) {
    console.error('Login API error:', err); // Debug log
    const msg = err?.response?.data?.detail || err?.message || 'Login failed';
    return {
      status: false,
      message: msg,
      result: {} as any,
    };
  }
};

/** 登出接口 */
export const apiLogout = (data: LogoutParams) => {
  return Promise.resolve({
    status: true,
    message: 'Logout successful',
    result: {}
  });
};


