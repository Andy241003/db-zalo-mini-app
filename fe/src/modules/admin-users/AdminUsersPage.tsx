import React, { useState } from 'react';
import {
  Table, Button, Space, Card, Modal, Form, Input, 
  Switch, Popconfirm, Typography, Row, Col, Tag, Select
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { 
  useAdminUsersQuery, 
  useCreateAdminUserMutation, 
  useUpdateAdminUserMutation, 
  useDeleteAdminUserMutation,
  useTenantsListQuery
} from './hooks';
import type { AdminUser, CreateAdminUserRequest, AdminUsersQueryParams } from './hooks';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const AdminUsersPage: React.FC = () => {
  const [queryParams, setQueryParams] = useState<AdminUsersQueryParams>({
    page: 1,
    size: 10,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form] = Form.useForm();

  // Queries and mutations
  const { data: usersData, isLoading, refetch, error } = useAdminUsersQuery(queryParams);
  const { data: tenants } = useTenantsListQuery();
  const createUserMutation = useCreateAdminUserMutation();
  const updateUserMutation = useUpdateAdminUserMutation();
  const deleteUserMutation = useDeleteAdminUserMutation();

  // Handle table pagination and filtering
  const handleTableChange = (pagination: any, filters: any) => {
    setQueryParams(prev => ({
      ...prev,
      page: pagination.current,
      size: pagination.pageSize,
      role: filters.role?.[0],
      is_active: filters.is_active?.[0],
    }));
  };

  // Handle search
  const handleSearch = (value: string) => {
    setQueryParams(prev => ({
      ...prev,
      page: 1,
      search: value || undefined,
    }));
  };

  // Modal handlers
  const showCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (user: AdminUser) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      password: undefined, // Don't populate password field for editing
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const userData: CreateAdminUserRequest = {
        ...values,
        tenant_id: values.role === 'hotel_admin' ? values.tenant_id : undefined,
        status: values.is_active ? 'active' : 'inactive'
      };

      if (editingUser) {
        // Don't send password if it's empty during edit
        if (!userData.password) {
          delete (userData as any).password;
        }
        await updateUserMutation.mutateAsync({
          id: editingUser.id,
          data: userData,
        });
      } else {
        await createUserMutation.mutateAsync(userData);
      }

      handleCancel();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteUserMutation.mutateAsync(id);
  };

  const columns: ColumnsType<AdminUser> = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      sorter: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: true,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: 'Super Admin', value: 'super_admin' },
        { text: 'Hotel Admin', value: 'hotel_admin' },
      ],
      render: (role) => (
        <Tag color={role === 'super_admin' ? 'red' : 'blue'}>
          {role === 'super_admin' ? 'Super Admin' : 'Hotel Admin'}
        </Tag>
      ),
    },
    {
      title: 'Khách sạn',
      dataIndex: 'tenant_name',
      key: 'tenant_name',
      render: (tenantName, record) => {
        if (record.role === 'super_admin') {
          return <Tag color="gold">Tất cả khách sạn</Tag>;
        }
        return tenantName || '-';
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Ngưng hoạt động', value: false },
      ],
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Ngưng hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Lần đăng nhập cuối',
      dataIndex: 'last_login',
      key: 'last_login',
      render: (lastLogin) => 
        lastLogin ? dayjs(lastLogin).format('DD/MM/YYYY HH:mm') : 'Chưa từng',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button 
            type="primary"
            size="small"
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa admin user này không?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button 
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>Quản lý Admin Users</Title>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => refetch()}
              >
                Làm mới
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={showCreateModal}
              >
                Tạo Admin User
              </Button>
            </Space>
          </Col>
        </Row>

        <Card>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Row gutter={16}>
              <Col span={8}>
                <Search
                  placeholder="Tìm kiếm theo username hoặc email..."
                  allowClear
                  onSearch={handleSearch}
                />
              </Col>
            </Row>

            <Table
              columns={columns}
              dataSource={usersData?.data || []}
              rowKey="id"
              loading={isLoading}
              pagination={{
                current: queryParams.page,
                pageSize: queryParams.size,
                total: usersData?.total || 0,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
              onChange={handleTableChange}
            />
          </Space>
        </Card>
      </Space>

      <Modal
        title={editingUser ? 'Chỉnh sửa Admin User' : 'Tạo Admin User mới'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        width={600}
        confirmLoading={createUserMutation.isPending || updateUserMutation.isPending}
        okText={editingUser ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            is_active: true,
            role: 'hotel_admin',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Tên đăng nhập"
                rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
              >
                <Input placeholder="Nhập tên đăng nhập" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Vui lòng nhập email hợp lệ' }
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="password"
            label={editingUser ? "Mật khẩu (bỏ trống để giữ nguyên)" : "Mật khẩu"}
            rules={editingUser ? [] : [{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select placeholder="Select role">
                  <Option value="SUPER_ADMIN">Super Admin</Option>
                  <Option value="hotel_admin">Hotel Admin</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Status"
                valuePropName="checked"
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
          >
            {({ getFieldValue }) => {
              const role = getFieldValue('role');
              return role === 'hotel_admin' ? (
                <Form.Item
                  name="tenant_id"
                  label="Assigned Tenant"
                  rules={[{ required: true, message: 'Please select tenant' }]}
                >
                  <Select placeholder="Select tenant">
                    {tenants?.map(tenant => (
                      <Option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : null;
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
