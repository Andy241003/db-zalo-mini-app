import React, { useState } from 'react';
import { Button, message, Card, Typography, Input, Space, Alert } from 'antd';
import { PhoneOutlined } from '@ant-design/icons';
import { zaloPhoneService } from '../utils/zaloUtils';

const { Text, Title } = Typography;

// Khai báo zmp global (inject bởi Zalo WebView)
declare const window: Window & { zmp?: unknown };

const ZaloPhoneResolver = () => {
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  // Fallback manual inputs (dùng khi test ngoài Zalo WebView)
  const [manualToken, setManualToken] = useState('');
  const [manualAccessToken, setManualAccessToken] = useState('');

  const isZaloEnv = zaloPhoneService.isZaloEnvironment();

  /**
   * Luồng chính: Frontend → zmp.getPhoneNumber() → backend → Zalo Server → số điện thoại
   */
  const handleGetPhoneNumber = async () => {
    setLoading(true);
    try {
      let phone: string;
      if (isZaloEnv) {
        // Chạy trong Zalo Mini App: tự động lấy token từ SDK
        phone = await zaloPhoneService.getPhoneFromZaloSDK();
      } else {
        // Chạy ngoài Zalo (dev/test): dùng manual input
        if (!manualToken.trim() || !manualAccessToken.trim()) {
          message.error('Ngoài Zalo WebView: vui lòng nhập token và access_token thủ công');
          return;
        }
        phone = await zaloPhoneService.resolvePhone(manualToken.trim(), manualAccessToken.trim());
      }

      setPhoneNumber(phone);
      message.success(`✅ Lấy số điện thoại thành công: ${phone}`);
    } catch (error: any) {
      console.error('Error:', error);
      message.error(`❌ Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '500px', margin: '0 auto' }}>
      <Title level={3}>📱 Lấy số điện thoại Zalo</Title>

      {!isZaloEnv && (
        <Alert
          type="warning"
          message="Đang chạy ngoài Zalo Mini App"
          description="Nhập token thủ công để test. Trong Zalo sẽ tự động lấy token."
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>

          {/* Manual inputs — chỉ hiện khi ngoài Zalo */}
          {!isZaloEnv && (
            <>
              <div>
                <Text strong>phone_token (từ zmp.getPhoneNumber()):</Text>
                <Input
                  placeholder="Token từ Zalo Mini App SDK"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>
              <div>
                <Text strong>access_token (từ zmp.getAccessToken()):</Text>
                <Input
                  placeholder="Access token từ Zalo Mini App SDK"
                  value={manualAccessToken}
                  onChange={(e) => setManualAccessToken(e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>
            </>
          )}

          {/* Nút chính */}
          <Button
            type="primary"
            size="large"
            icon={<PhoneOutlined />}
            onClick={handleGetPhoneNumber}
            loading={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Đang xử lý...' : 'Lấy số điện thoại'}
          </Button>

          {/* Kết quả */}
          {phoneNumber && (
            <div style={{
              padding: '16px',
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '6px',
              textAlign: 'center',
            }}>
              <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                📱 {phoneNumber}
              </Text>
            </div>
          )}

        </Space>
      </Card>

      <Card style={{ marginTop: 16 }} title="📋 Luồng hoạt động">
        <Text>
          1. Người dùng click nút → <code>zmp.getPhoneNumber()</code><br/>
          2. Zalo trả về <code>phone_token</code> (hỏi quyền nếu cần)<br/>
          3. Backend nhận token → gọi Zalo API với <code>secret_key</code><br/>
          4. Trả về số điện thoại thực
        </Text>
      </Card>
    </div>
  );
};

export default ZaloPhoneResolver;
