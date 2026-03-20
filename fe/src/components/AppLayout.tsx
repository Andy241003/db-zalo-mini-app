import React, { useState } from 'react';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Space,
  MenuProps,
  theme,
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getHotelMenuList } from '../config/menu';
import { authStore } from '../stores/authStore';

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer } } = theme.useToken();

  // Get user info from auth store
  const authState = authStore.getState();
  const currentUser = {
    name: authState.username || 'Admin User',
    email: 'admin@hotel.com',
    avatar: null,
  };

  // Get menu items from configuration
  const menuConfig = getHotelMenuList();
  const menuItems = menuConfig.map(item => ({
    key: item.path,
    icon: getMenuIcon(item.icon || 'user'),
    label: item.label.en_US, // Using English labels for simplicity
    children: item.children?.map(child => ({
      key: child.path,
      label: child.label.en_US,
    })),
  }));

  // Helper function to get icon component
  function getMenuIcon(iconName: string) {
    const iconMap: Record<string, React.ReactElement> = {
      dashboard: <UserOutlined />, // Using available icons as placeholders
      home: <UserOutlined />,
      gift: <UserOutlined />,
      shop: <UserOutlined />,
      appstore: <UserOutlined />,
      user: <UserOutlined />,
      tag: <UserOutlined />,
      tool: <UserOutlined />,
      calendar: <UserOutlined />,
      setting: <SettingOutlined />,
      apartment: <UserOutlined />,
    };
    return iconMap[iconName] || <UserOutlined />;
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    authStore.logout();
    // Navigate will happen after page reload
  };

  const handleUserMenuClick = (e: any) => {
    if (e.key === 'profile') {
      navigate('/profile');
    } else if (e.key === 'logout') {
      handleLogout();
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
        style={{
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          margin: '0 16px',
        }}>
          {!collapsed ? (
            <h2 style={{ margin: 0, color: '#1890ff' }}>Hotel Mgmt</h2>
          ) : (
            <h2 style={{ margin: 0, color: '#1890ff' }}>HM</h2>
          )}
        </div>
        
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      
      <Layout>
        <Header 
          style={{ 
            padding: 0, 
            background: colorBgContainer,
            borderBottom: '1px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: 24,
          }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            
            <Space>              
              <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
                <Button type="text" style={{ padding: '4px 8px' }}>
                  <Space>
                    <Avatar 
                      size="small" 
                      icon={<UserOutlined />}
                      src={currentUser.avatar}
                    />
                    {currentUser.name}
                  </Space>
                </Button>
              </Dropdown>
            </Space>
          </div>
        </Header>
        
        <Content
          style={{
            margin: '24px 16px',
            padding: 0,
            minHeight: 0,
            background: 'transparent',
            borderRadius: 0,
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
