// Zalo Phone Resolution Service
// Flow: zmp.getPhoneNumber() -> phone_token -> POST /zalo/phone -> Zalo Server -> số điện thoại

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'https://db-zalo-mini-app-be.onrender.com';

export class ZaloPhoneService {
  /**
   * Kiểm tra có đang chạy trong Zalo Mini App không
   */
  isZaloEnvironment() {
    return typeof window !== 'undefined' && typeof window.zmp !== 'undefined';
  }

  /**
   * [MAIN] Tự động lấy số điện thoại từ Zalo SDK rồi gọi backend
   * Gọi hàm này từ UI button "Lấy số điện thoại"
   * @param {number} tenantId - ID của hotel/tenant đang dùng Mini App
   * @returns {Promise<string>} Số điện thoại
   */
  async getPhoneFromZaloSDK(tenantId) {
    if (!this.isZaloEnvironment()) {
      throw new Error('Không chạy trong môi trường Zalo Mini App. Vui lòng mở ứng dụng trong Zalo.');
    }

    try {
      // Bước 1: Lấy phone_token và access_token song song
      console.log('[Zalo] Calling zmp.getPhoneNumber() and zmp.getAccessToken()...');
      const [phoneResult, accessTokenResult] = await Promise.all([
        window.zmp.getPhoneNumber(),
        window.zmp.getAccessToken(),
      ]);

      const phoneToken = phoneResult?.token;
      const accessToken = accessTokenResult?.accessToken;

      if (!phoneToken) throw new Error('Không lấy được phone_token từ Zalo');
      if (!accessToken) throw new Error('Không lấy được access_token từ Zalo');

      console.log('[Zalo] Got tokens, calling backend...');

      // Bước 2: Gửi token lên backend để lấy số điện thoại thật
      return await this.resolvePhone(phoneToken, accessToken, tenantId);
    } catch (error) {
      // Zalo SDK trả lỗi nếu người dùng từ chối quyền
      if (error?.code === -201) {
        throw new Error('Người dùng từ chối cấp quyền truy cập số điện thoại');
      }
      throw error;
    }
  }

  /**
   * Gọi backend để resolve số điện thoại từ token
   * @param {string} token - phone_token từ zmp.getPhoneNumber()
   * @param {string} accessToken - access_token từ zmp.getAccessToken()
   * @param {number} tenantId - ID của hotel/tenant
   * @returns {Promise<string>} Số điện thoại
   */
  async resolvePhone(token, accessToken, tenantId) {
    const response = await fetch(`${API_BASE_URL}/api/v1/zalo/phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        access_token: accessToken,
        tenant_id: tenantId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[Zalo] Backend response:', result);
    return result.number;
  }
}

// Export singleton
export const zaloPhoneService = new ZaloPhoneService();
