// Simple Zalo Phone Resolution Service

export class ZaloPhoneService {
  /**
   * Gọi backend để resolve số điện thoại từ Zalo
   * @param {string} token - Token/code từ Zalo Mini App
   * @param {string} accessToken - Access token từ Zalo Mini App
   * @returns {Promise<string>} Số điện thoại
   */
  async resolvePhone(token, accessToken) {
    try {
      console.log('Calling backend to resolve phone number...');
      
      const response = await fetch('/api/v1/zalo/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Thêm auth header nếu cần
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
        },
        body: JSON.stringify({
          token: token,
          access_token: accessToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Backend response:', result);
      
      return result.number;
    } catch (error) {
      console.error('Error calling backend:', error);
      throw error;
    }
  }

  /**
   * Demo function - sử dụng mock data để test
   * @returns {Promise<string>} Mock phone number
   */
  async resolvePhoneDemo() {
    const mockToken = 'demo_token_' + Date.now();
    const mockAccessToken = 'demo_access_token_' + Date.now();
    
    return this.resolvePhone(mockToken, mockAccessToken);
  }
}

// Export singleton
export const zaloPhoneService = new ZaloPhoneService();
