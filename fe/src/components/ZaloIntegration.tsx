import React, { useState } from 'react';
import { Button, message, Card, Typography, Input, Space } from 'antd';
import { PhoneOutlined } from '@ant-design/icons';
import { zaloPhoneService } from '../utils/zaloUtils';

const { Text, Title } = Typography;

const ZaloPhoneResolver = () => {
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [token, setToken] = useState('');
  const [accessToken, setAccessToken] = useState('');

  // Hàm chính: gọi backend để lấy số điện thoại
  const handleGetPhoneNumber = async () => {
    // Validate input
    if (!token.trim()) {
      message.error('Vui lòng nhập Token!');
      return;
    }
    if (!accessToken.trim()) {
      message.error('Vui lòng nhập Access Token!');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending request to backend...');
      const phone = await zaloPhoneService.resolvePhone(token.trim(), accessToken.trim());
      
      setPhoneNumber(phone);
      message.success(`✅ Lấy số điện thoại thành công: ${phone}`);
    } catch (error) {
      console.error('Error:', error);
      message.error(`❌ Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Demo với mock data
  const handleDemo = async () => {
    setLoading(true);
    try {
      const phone = await zaloPhoneService.resolvePhoneDemo();
      setPhoneNumber(phone);
      message.success(`🧪 Demo thành công: ${phone}`);
    } catch (error) {
      console.error('Demo error:', error);
      message.error(`❌ Demo lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '500px', margin: '0 auto' }}>
      <Title level={3}>🔍 Zalo Phone Resolver</Title>
      
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          
          {/* Input fields */}
          <div>
            <Text strong>Token (từ Zalo Mini App):</Text>
            <Input
              placeholder="Nhập token từ zmp.getPhoneNumber()"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              style={{ marginTop: '8px' }}
            />
          </div>

          <div>
            <Text strong>Access Token (từ Zalo Mini App):</Text>
            <Input
              placeholder="Nhập access token từ zmp.getAccessToken()"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              style={{ marginTop: '8px' }}
            />
          </div>

          {/* Main button */}
          <Button 
            type="primary" 
            size="large"
            icon={<PhoneOutlined />}
            onClick={handleGetPhoneNumber}
            loading={loading}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Đang xử lý...' : 'Lấy số điện thoại'}
          </Button>

          {/* Demo button */}
          <Button 
            type="dashed" 
            onClick={handleDemo}
            loading={loading}
            disabled={loading}
            style={{ width: '100%' }}
          >
            🧪 Demo với mock data
          </Button>

          {/* Result */}
          {phoneNumber && (
            <div style={{
              padding: '16px',
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                📱 Kết quả: {phoneNumber}
              </Text>
            </div>
          )}

        </Space>
      </Card>

      {/* Instructions */}
      <Card style={{ marginTop: '16px' }} title="📋 Hướng dẫn">
        <Text>
          <strong>Cách sử dụng:</strong><br/>
          1. Nhập <code>token</code> và <code>access_token</code> từ Zalo Mini App<br/>
          2. Click "<strong>Lấy số điện thoại</strong>"<br/>
          3. Frontend sẽ gửi data xuống Backend<br/>
          4. Backend gọi Zalo API và trả về số điện thoại<br/><br/>
          
          <strong>Hoặc:</strong><br/>
          - Click "<strong>🧪 Demo với mock data</strong>" để test với dữ liệu giả
        </Text>
      </Card>
    </div>
  );
};

export default ZaloPhoneResolver;
