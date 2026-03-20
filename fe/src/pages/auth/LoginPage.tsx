import React, { useState, useRef, useEffect } from 'react';
import { Form, Input, Button, Card, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../api/auth.api';
import { authStore } from '../../stores/authStore';

interface LoginForm {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const onFinish = async (values: LoginForm) => {
    if (loading || !mountedRef.current) return; // Prevent double submission or action on unmounted component
    
    setLoading(true);
    try {
      const result = await authAPI.login(values);
      
      // Check if component is still mounted before updating state
      if (!mountedRef.current) return;
      
      if (result.access_token) {
        message.success('Login successful!');
        
        // Map role from backend response
        const backendRole = result.user_info?.role || 'hotel_admin';
        
        // Default mapping: if username is 'superadmin' or role contains 'super', then SUPER_ADMIN
        let role: 'SUPER_ADMIN' | 'HOTEL_ADMIN' = 'HOTEL_ADMIN';
        if (values.username === 'superadmin' || 
            String(backendRole).toLowerCase().includes('super') ||
            String(backendRole).toUpperCase() === 'SUPER_ADMIN') {
          role = 'SUPER_ADMIN';
        }
        
        // Use authStore to handle login
        authStore.login({
          token: result.access_token,
          role: role,
          tenantId: result.tenant_info?.id || result.user_info?.tenant_id,
          userId: result.user_info?.id,
          username: values.username,
        });
        
        // Trigger auth state change for router
        window.dispatchEvent(new Event('auth-change'));

        navigate('/dashboard');
      } else {
        message.error('Login failed: Invalid credentials');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // Only show error message if component is still mounted
      if (mountedRef.current) {
        const errorMessage = error?.message || 'Login failed. Please try again.';
        message.error(errorMessage);
      }
    } finally {
      // Only update loading state if component is still mounted
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Col xs={22} sm={16} md={12} lg={8} xl={6}>
        <Card
          title={
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: '#1890ff', marginBottom: 8 }}>Hotel Management</h2>
              <p style={{ color: '#666', margin: 0 }}>Sign in to your account</p>
            </div>
          }
          style={{ 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            borderRadius: '8px'
          }}
        >
          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: 'Please input your username!' },
                { min: 3, message: 'Username must be at least 3 characters!' },
              ]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                placeholder="Username"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 6, message: 'Password must be at least 6 characters!' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#1890ff' }} />}
                placeholder="Password"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: '40px' }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
          
        </Card>
      </Col>
    </Row>
  );
};

export default LoginPage;
