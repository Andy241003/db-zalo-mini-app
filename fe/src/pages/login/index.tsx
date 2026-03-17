import React from 'react';
import { Form, Input, Button, Card, Typography, Row, Col, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/store/auth';
import http from '@/services/http';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { LoginRequest, LoginResponse } from '@/types';

import './index.less';

const { Title, Text } = Typography;

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      // Real API call to backend using form data (OAuth2 standard)
      try {
        const formData = new FormData();
        formData.append('username', data.username);
        formData.append('password', data.password);

        const backendUrl = (import.meta.env.VITE_API_BASE_URL as string) || `${window.location.origin}/api/v1`;
        const response = await fetch(`${backendUrl}/auth/login`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Login failed');
        }

        const tokenData = await response.json();
        
        // Get user info using test-token endpoint
        const userResponse = await fetch(`${backendUrl}/auth/test-token`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error('Failed to get user info');
        }

        const userData = await userResponse.json();

        return {
          access_token: tokenData.access_token,
          token_type: tokenData.token_type,
          refresh_token: tokenData.access_token, // Use same token as refresh for now
          user: userData
        };
      } catch (error) {
        console.error('Login API error:', error);
        throw error;
      }
    },
    onSuccess: (response) => {
      auth.set({
        user: response.user,
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        currentTenantId: response.user.role === 'hotel_admin' ? response.user.tenant_id : null,
      });
  // Persist token for router guard in src/router/index.tsx
  localStorage.setItem('token', response.access_token);
  message.success('Đăng nhập thành công');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.detail || 'Đăng nhập thất bại');
    },
  });

  const handleSubmit = (values: LoginRequest) => {
    loginMutation.mutate(values);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Row justify="center" style={{ width: '100%' }}>
        <Col xs={24} sm={16} md={12} lg={8} xl={6}>
          <Card
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              borderRadius: '12px',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <Title level={2} style={{ marginBottom: 8 }}>
                Hotel SaaS Admin
              </Title>
              <Text type="secondary">
                Đăng nhập vào hệ thống quản lý khách sạn
              </Text>
            </div>

            <Form
              form={form}
              name="login"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="username"
                label="Tên đăng nhập"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Tên đăng nhập hoặc email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu!' },
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Mật khẩu"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ width: '100%' }}
                  loading={loginMutation.isPending}
                >
                  Đăng nhập
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                © 2024 Hotel SaaS Admin. All rights reserved.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LoginForm;
