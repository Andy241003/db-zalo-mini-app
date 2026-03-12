import React, { useState } from 'react';
import {
  Card, Typography, Row, Col, Button, Space, Divider, Alert, Switch,
  Table, Tag, Modal, Form, Input, Select, message
} from 'antd';
import {
  SettingOutlined, BgColorsOutlined, EyeOutlined,
  SaveOutlined, ReloadOutlined, FontSizeOutlined,
  MobileOutlined, DesktopOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put } from '../../utils/request';
import { ImageField } from '../../components/ImagePickerModal';

const { Title, Text, Paragraph } = Typography;

interface ThemeConfig {
  id: number;
  tenant_id: number;
  primary_color: string;
  secondary_color: string;
  logo_url?: string;
  favicon_url?: string;
  font_family: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CustomComponent {
  id: number;
  tenant_id: number;
  name: string;
  type: 'header' | 'footer' | 'banner' | 'widget';
  content: string;
  is_active: boolean;
  position?: string;
  created_at: string;
  updated_at: string;
}

const UiComponentsPage: React.FC = () => {
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [componentModalVisible, setComponentModalVisible] = useState(false);
  const [editingComponent, setEditingComponent] = useState<CustomComponent | null>(null);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('desktop');
  const [themeForm] = Form.useForm();
  const [componentForm] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: themeConfig, isLoading: themeLoading } = useQuery({
    queryKey: ['theme-config'],
    queryFn: () => get<ThemeConfig>('/api/v1/ui/theme'),
  });

  const { data: components, isLoading: componentsLoading } = useQuery({
    queryKey: ['ui-components'],
    queryFn: () => get<CustomComponent[]>('/api/v1/ui/components'),
  });

  const updateThemeMutation = useMutation({
    mutationFn: (data: any) => put('/api/v1/ui/theme', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-config'] });
      message.success('Theme updated successfully');
      setThemeModalVisible(false);
    },
    onError: (error: any) => message.error(error.message),
  });

  const createComponentMutation = useMutation({
    mutationFn: (data: any) => post('/api/v1/ui/components', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ui-components'] });
      message.success('Component created successfully');
      handleComponentModalCancel();
    },
    onError: (error: any) => message.error(error.message),
  });

  const updateComponentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      put(`/api/v1/ui/components/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ui-components'] });
      message.success('Component updated successfully');
      handleComponentModalCancel();
    },
    onError: (error: any) => message.error(error.message),
  });

  const handleThemeSubmit = async () => {
    try {
      const values = await themeForm.validateFields();
      updateThemeMutation.mutate(values);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleComponentSubmit = async () => {
    try {
      const values = await componentForm.validateFields();
      if (editingComponent) {
        updateComponentMutation.mutate({ id: editingComponent.id, data: values });
      } else {
        createComponentMutation.mutate(values);
      }
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleComponentModalCancel = () => {
    setComponentModalVisible(false);
    setEditingComponent(null);
    componentForm.resetFields();
  };

  const componentColumns: ColumnsType<CustomComponent> = [
    {
      title: 'Component',
      key: 'component',
      render: (_, record: CustomComponent) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.name}</div>
          <Tag color="blue">{record.type}</Tag>
        </div>
      ),
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      render: (position: string) => position || 'Default',
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: CustomComponent) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => {
              // Preview functionality
              message.info('Component preview to be implemented');
            }}
          />
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => {
              setEditingComponent(record);
              componentForm.setFieldsValue(record);
              setComponentModalVisible(true);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={24}>
        {/* Theme Configuration */}
        <Col span={12}>
          <Card
            title={
              <Space>
                <BgColorsOutlined />
                <span>Theme Configuration</span>
              </Space>
            }
            extra={
              <Button
                type="primary"
                icon={<SettingOutlined />}
                onClick={() => {
                  if (themeConfig) {
                    themeForm.setFieldsValue(themeConfig);
                  }
                  setThemeModalVisible(true);
                }}
              >
                Configure
              </Button>
            }
            loading={themeLoading}
          >
            {themeConfig ? (
              <div>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={12}>
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          backgroundColor: themeConfig.primary_color,
                          borderRadius: 4,
                          margin: '0 auto 8px',
                        }}
                      />
                      <Text type="secondary">Primary Color</Text>
                      <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {themeConfig.primary_color}
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          backgroundColor: themeConfig.secondary_color,
                          borderRadius: 4,
                          margin: '0 auto 8px',
                        }}
                      />
                      <Text type="secondary">Secondary Color</Text>
                      <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {themeConfig.secondary_color}
                      </div>
                    </div>
                  </Col>
                </Row>
                <Divider />
                <Row gutter={16}>
                  <Col span={12}>
                    <Text type="secondary">Font Family:</Text>
                    <div style={{ fontWeight: 'bold' }}>{themeConfig.font_family}</div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Status:</Text>
                    <div>
                      <Tag color={themeConfig.is_active ? 'success' : 'default'}>
                        {themeConfig.is_active ? 'Active' : 'Inactive'}
                      </Tag>
                    </div>
                  </Col>
                </Row>
              </div>
            ) : (
              <Alert
                message="No theme configuration found"
                description="Click Configure to set up your theme"
                type="info"
                showIcon
              />
            )}
          </Card>
        </Col>

        {/* Preview */}
        <Col span={12}>
          <Card
            title={
              <Space>
                <EyeOutlined />
                <span>Preview</span>
              </Space>
            }
            extra={
              <Space>
                <Button
                  icon={<MobileOutlined />}
                  type={previewMode === 'mobile' ? 'primary' : 'default'}
                  onClick={() => setPreviewMode('mobile')}
                />
                <Button
                  icon={<DesktopOutlined />}
                  type={previewMode === 'desktop' ? 'primary' : 'default'}
                  onClick={() => setPreviewMode('desktop')}
                />
              </Space>
            }
          >
            <div
              style={{
                height: 300,
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {previewMode === 'mobile' ? (
                <div
                  style={{
                    width: 200,
                    height: 280,
                    backgroundColor: 'white',
                    borderRadius: 20,
                    border: '8px solid #333',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '80%',
                      height: 40,
                      backgroundColor: themeConfig?.primary_color || '#1890ff',
                      borderRadius: 4,
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  >
                    Header
                  </div>
                  <div
                    style={{
                      width: '80%',
                      flex: 1,
                      backgroundColor: '#f8f8f8',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                    }}
                  >
                    Content Area
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    width: '90%',
                    height: '90%',
                    backgroundColor: 'white',
                    borderRadius: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: 60,
                      backgroundColor: themeConfig?.primary_color || '#1890ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  >
                    Website Header
                  </div>
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: '#fafafa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                    }}
                  >
                    Main Content Area
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Custom Components */}
      <Card
        title={
          <Space>
            <BgColorsOutlined />
            <span>Custom Components</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ['ui-components'] })} />
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={() => setComponentModalVisible(true)}
            >
              Add Component
            </Button>
          </Space>
        }
      >
        <Table
          columns={componentColumns}
          dataSource={components || []}
          rowKey="id"
          loading={componentsLoading}
        />
      </Card>

      {/* Theme Configuration Modal */}
      <Modal
        title="Theme Configuration"
        open={themeModalVisible}
        onOk={handleThemeSubmit}
        onCancel={() => setThemeModalVisible(false)}
        width={600}
        confirmLoading={updateThemeMutation.isPending}
      >
        <Form form={themeForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="primary_color"
                label="Primary Color"
                rules={[{ required: true }]}
              >
                <Input placeholder="#1890ff" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="secondary_color"
                label="Secondary Color"
                rules={[{ required: true }]}
              >
                <Input placeholder="#52c41a" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="font_family"
            label="Font Family"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { label: 'Arial', value: 'Arial, sans-serif' },
                { label: 'Helvetica', value: 'Helvetica, sans-serif' },
                { label: 'Times New Roman', value: 'Times New Roman, serif' },
                { label: 'Georgia', value: 'Georgia, serif' },
                { label: 'Roboto', value: 'Roboto, sans-serif' },
              ]}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="logo_url" label="Logo URL">
                <ImageField folder="ui-themes" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="favicon_url" label="Favicon URL">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="is_active" valuePropName="checked" label="Active Theme">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Component Modal */}
      <Modal
        title={editingComponent ? 'Edit Component' : 'Add Component'}
        open={componentModalVisible}
        onOk={handleComponentSubmit}
        onCancel={handleComponentModalCancel}
        width={700}
        confirmLoading={createComponentMutation.isPending || updateComponentMutation.isPending}
      >
        <Form form={componentForm} layout="vertical" initialValues={{ is_active: true }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Component Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Component Type"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: 'Header', value: 'header' },
                    { label: 'Footer', value: 'footer' },
                    { label: 'Banner', value: 'banner' },
                    { label: 'Widget', value: 'widget' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="position" label="Position">
            <Input placeholder="e.g., top, bottom, sidebar" />
          </Form.Item>
          <Form.Item
            name="content"
            label="HTML Content"
            rules={[{ required: true }]}
          >
            <Input.TextArea
              rows={8}
              placeholder="Enter your HTML content here..."
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
          <Form.Item name="is_active" valuePropName="checked" label="Active">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UiComponentsPage;
