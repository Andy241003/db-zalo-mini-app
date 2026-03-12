import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select, 
  Avatar, Typography, Row, Col, Statistic, Badge, Drawer,
  message, Popconfirm, Switch, DatePicker, Tooltip
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  UserOutlined, DollarOutlined, CalendarOutlined, SettingOutlined,
  ExportOutlined, FilterOutlined, ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { tenantApi } from '../../api/backend.api';
import { ImageField } from '../../components/ImagePickerModal';
import type { Tenant, CreateTenantRequest } from '../../types/api';

const { Title, Text } = Typography;
const { Search } = Input;

interface TenantWithStats extends Tenant {
  totalBookings?: number;
  totalRevenue?: number;
  activeRooms?: number;
  lastActivity?: string;
  status?: 'active' | 'inactive' | 'suspended';
  domain?: string; // For display purposes
  contact_email?: string; // Map to email
  contact_phone?: string; // Map to phone_number
}

const AdvancedTenantManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<TenantWithStats[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<TenantWithStats[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithStats | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [form] = Form.useForm();

  // Load tenants
  const loadTenants = async () => {
    setLoading(true);
    try {
      const response = await tenantApi.getAll();
      
      // Mock additional statistics for demo
      const responseData = Array.isArray(response) ? response : [];
      const tenantsWithStats: TenantWithStats[] = responseData.map((tenant: Tenant) => ({
        ...tenant,
        totalBookings: Math.floor(Math.random() * 500) + 50,
        totalRevenue: Math.floor(Math.random() * 100000) + 10000,
        activeRooms: Math.floor(Math.random() * 50) + 10,
        lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: ['active', 'inactive', 'suspended'][Math.floor(Math.random() * 3)] as any,
        domain: `${tenant.name?.toLowerCase().replace(/\s+/g, '')}.hotels.com`,
        contact_email: tenant.email,
        contact_phone: tenant.phone_number,
      }));

      setTenants(tenantsWithStats);
      setFilteredTenants(tenantsWithStats);
    } catch (error) {
      message.error('Failed to load tenants');
      console.error('Load tenants error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter tenants
  const filterTenants = () => {
    let filtered = tenants;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(tenant => 
        tenant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.domain?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tenant => tenant.status === statusFilter);
    }

    setFilteredTenants(filtered);
  };

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    filterTenants();
  }, [searchQuery, statusFilter, tenants]);

  // Handle create/update tenant
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (editMode && selectedTenant) {
        await tenantApi.update(selectedTenant.id, values);
        message.success('Tenant updated successfully');
      } else {
        await tenantApi.create(values);
        message.success('Tenant created successfully');
      }
      
      setModalVisible(false);
      setEditMode(false);
      setSelectedTenant(null);
      form.resetFields();
      loadTenants();
    } catch (error) {
      message.error(editMode ? 'Failed to update tenant' : 'Failed to create tenant');
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete tenant
  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await tenantApi.delete(id);
      message.success('Tenant deleted successfully');
      loadTenants();
    } catch (error) {
      message.error('Failed to delete tenant');
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle view details
  const handleViewDetails = (tenant: TenantWithStats) => {
    setSelectedTenant(tenant);
    setDetailDrawerVisible(true);
  };

  // Handle edit
  const handleEdit = (tenant: TenantWithStats) => {
    setSelectedTenant(tenant);
    setEditMode(true);
    form.setFieldsValue(tenant);
    setModalVisible(true);
  };

  // Table columns
  const columns: ColumnsType<TenantWithStats> = [
    {
      title: 'Hotel',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space>
          <Avatar 
            size="large" 
            src={record.logo_url} 
            icon={<UserOutlined />}
            style={{ backgroundColor: '#1890ff' }}
          >
            {name?.[0]?.toUpperCase()}
          </Avatar>
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.domain}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          active: 'success',
          inactive: 'default',
          suspended: 'error',
        };
        const labels = {
          active: 'Active',
          inactive: 'Inactive',
          suspended: 'Suspended',
        };
        return (
          <Badge 
            status={colors[status as keyof typeof colors] as any} 
            text={labels[status as keyof typeof labels]}
          />
        );
      },
    },
    {
      title: 'Rooms',
      dataIndex: 'activeRooms',
      key: 'activeRooms',
      render: (rooms: number) => (
        <Statistic 
          value={rooms} 
          valueStyle={{ fontSize: 14 }}
          suffix="rooms"
        />
      ),
    },
    {
      title: 'Bookings',
      dataIndex: 'totalBookings',
      key: 'totalBookings',
      render: (bookings: number) => (
        <Text strong>{bookings?.toLocaleString()}</Text>
      ),
    },
    {
      title: 'Revenue',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      render: (revenue: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          ${revenue?.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Last Activity',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      render: (date: string) => (
        <Text type="secondary">
          {new Date(date).toLocaleDateString()}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              icon={<EyeOutlined />} 
              size="small" 
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              icon={<EditOutlined />} 
              size="small" 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this tenant?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button 
                icon={<DeleteOutlined />} 
                size="small" 
                danger 
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Tenant Management
          </Title>
          <Text type="secondary">
            Manage all hotel tenants and their configurations
          </Text>
        </Col>
        <Col>
          <Space>
            <Button icon={<ExportOutlined />}>Export</Button>
            <Button icon={<ReloadOutlined />} onClick={loadTenants} loading={loading}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditMode(false);
                setSelectedTenant(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              Add Tenant
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Tenants"
              value={tenants.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Tenants"
              value={tenants.filter(t => t.status === 'active').length}
              valueStyle={{ color: '#3f8600' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={tenants.reduce((sum, t) => sum + (t.totalRevenue || 0), 0)}
              prefix={<DollarOutlined />}
              precision={0}
              formatter={(value) => `$${value?.toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Bookings"
              value={tenants.reduce((sum, t) => sum + (t.totalBookings || 0), 0)}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex={1}>
            <Search
              placeholder="Search tenants by name or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: 400 }}
            />
          </Col>
          <Col>
            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              options={[
                { label: 'All Status', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Suspended', value: 'suspended' },
              ]}
            />
          </Col>
          <Col>
            <Button icon={<FilterOutlined />}>More Filters</Button>
          </Col>
        </Row>
      </Card>

      {/* Tenants Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredTenants}
          loading={loading}
          rowKey="id"
          pagination={{
            total: filteredTenants.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} tenants`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editMode ? 'Edit Tenant' : 'Create New Tenant'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditMode(false);
          setSelectedTenant(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Hotel Name"
            rules={[{ required: true, message: 'Please enter hotel name' }]}
          >
            <Input placeholder="Enter hotel name" />
          </Form.Item>

          <Form.Item
            name="domain"
            label="Domain"
            rules={[{ required: true, message: 'Please enter domain' }]}
          >
            <Input placeholder="e.g., grandhotel.example.com" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contact_email"
                label="Contact Email"
                rules={[
                  { required: true, message: 'Please enter contact email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input placeholder="contact@hotel.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contact_phone"
                label="Contact Phone"
              >
                <Input placeholder="+1 234 567 8900" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Address"
          >
            <Input.TextArea rows={3} placeholder="Hotel address" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                initialValue="active"
              >
                <Select
                  options={[
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' },
                    { label: 'Suspended', value: 'suspended' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="logo_url"
                label="Logo"
              >
                <ImageField folder="tenants" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editMode ? 'Update Tenant' : 'Create Tenant'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Tenant Details Drawer */}
      <Drawer
        title="Tenant Details"
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        width={600}
      >
        {selectedTenant && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar 
                size={80} 
                src={selectedTenant.logo_url} 
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
              <Title level={3} style={{ marginTop: 16 }}>
                {selectedTenant.name}
              </Title>
              <Tag color={selectedTenant.status === 'active' ? 'success' : 'default'}>
                {selectedTenant.status?.toUpperCase()}
              </Tag>
            </div>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Total Bookings"
                    value={selectedTenant.totalBookings}
                    prefix={<CalendarOutlined />}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Total Revenue"
                    value={selectedTenant.totalRevenue}
                    prefix={<DollarOutlined />}
                    formatter={(value) => `$${value?.toLocaleString()}`}
                  />
                </Card>
              </Col>
            </Row>

            <Card title="Contact Information" style={{ marginTop: 16 }}>
              <p><strong>Domain:</strong> {selectedTenant.domain}</p>
              <p><strong>Email:</strong> {selectedTenant.contact_email}</p>
              <p><strong>Phone:</strong> {selectedTenant.contact_phone}</p>
              <p><strong>Address:</strong> {selectedTenant.address}</p>
            </Card>

            <Card title="Statistics" style={{ marginTop: 16 }}>
              <p><strong>Active Rooms:</strong> {selectedTenant.activeRooms}</p>
              <p><strong>Last Activity:</strong> {new Date(selectedTenant.lastActivity || '').toLocaleString()}</p>
              <p><strong>Created:</strong> {new Date(selectedTenant.created_at || '').toLocaleString()}</p>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AdvancedTenantManagement;
