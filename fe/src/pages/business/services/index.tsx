import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Switch, message, Space, Popconfirm, Tag, Card, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { getServices, createService, updateService, deleteService, Service, ServiceCreate, ServiceUpdate } from '../../../api/service.api';
import { authStore } from '../../../stores/authStore';
import { ImageField } from '../../../components/ImagePickerModal';

const { Option } = Select;
const { Search } = Input;

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form] = Form.useForm();

  // Get tenant ID directly from auth store
  const tenantId = authStore.getTenantId();

  // Filter and search states
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSchedule, setFilterSchedule] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');

  const serviceTypes = [
    { value: 'spa', label: 'Spa & Wellness' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'laundry', label: 'Laundry' },
    { value: 'concierge', label: 'Concierge' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'business', label: 'Business Center' },
    { value: 'other', label: 'Other' },
  ];

  const fetchServices = async () => {
    if (!tenantId) {
      return;
    }
    setLoading(true);
    try {
      const res = await getServices(tenantId);
      
      // Handle different response formats
      let servicesData = [];
      if (res && res.status && res.result) {
        // Wrapped response
        servicesData = res.result;
      } else if (Array.isArray(res)) {
        // Direct array response
        servicesData = res;
      } else if (res && (res as any).data && Array.isArray((res as any).data)) {
        // Data wrapped in data property
        servicesData = (res as any).data;
      }
      
      setServices(servicesData);
      setFilteredServices(servicesData);
    } catch (error) {
      console.error('Error fetching services:', error);
      message.error('Failed to fetch services');
      setServices([]);
      setFilteredServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    // If tenantId is null but we have token, try to extract from JWT
    if (!tenantId && authStore.getToken()) {
      try {
        const token = authStore.getToken();
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.tenant_id) {
            authStore.setAuthData({ tenantId: payload.tenant_id });
          }
        }
      } catch (error) {
        console.error('Failed to extract tenantId from JWT:', error);
      }
    }
    
    if (tenantId) {
      fetchServices();
    } else {
      console.warn('No tenant ID available, cannot fetch services');
    }
  }, [tenantId]);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...services];

    // Text search
    if (searchText) {
      filtered = filtered.filter(service =>
        service.service_name.toLowerCase().includes(searchText.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        service.type?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(service => service.type === filterType);
    }

    // Schedule filter
    if (filterSchedule !== 'all') {
      const requiresSchedule = filterSchedule === 'required';
      filtered = filtered.filter(service => service.requires_schedule === requiresSchedule);
    }

    // Price range filter
    if (priceRange !== 'all') {
      filtered = filtered.filter(service => {
        const price = service.price || 0;
        switch (priceRange) {
          case 'free':
            return price === 0;
          case 'low':
            return price > 0 && price <= 500000;
          case 'medium':
            return price > 500000 && price <= 2000000;
          case 'high':
            return price > 2000000;
          default:
            return true;
        }
      });
    }

    setFilteredServices(filtered);
  }, [services, searchText, filterType, filterSchedule, priceRange]);

  const resetFilters = () => {
    setSearchText('');
    setFilterType('all');
    setFilterSchedule('all');
    setPriceRange('all');
  };

  // Test function to add mock data
  const addMockData = () => {
    const mockServices = [
      {
        id: 1,
        tenant_id: 4,
        service_name: "Airport Transfer",
        description: "Comfortable airport pickup and drop-off service",
        type: "transportation",
        price: 50000,
        unit: "trip",
        duration_minutes: 60,
        requires_schedule: true,
        created_at: "2025-09-04T16:32:09",
        updated_at: "2025-09-04T16:32:09"
      },
      {
        id: 2,
        tenant_id: 4,
        service_name: "Spa Massage",
        description: "Relaxing full-body massage",
        type: "spa",
        price: 800000,
        unit: "session",
        duration_minutes: 90,
        requires_schedule: true,
        created_at: "2025-09-04T16:32:09",
        updated_at: "2025-09-04T16:32:09"
      }
    ];
    setServices(mockServices);
    setFilteredServices(mockServices);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (!tenantId) {
        message.error('No tenant ID available. Please login again.');
        return;
      }
      
      setLoading(true);
      
      let response;
      if (editingService) {

        // Process data same as create
        const serviceData = {
          ...values,
          price: Number(values.price),
          duration_minutes: values.duration_minutes ? Number(values.duration_minutes) : undefined,
          requires_schedule: values.requires_schedule !== undefined ? Boolean(values.requires_schedule) : true
        };

        response = await updateService(tenantId!, editingService.id, serviceData as ServiceUpdate);

        // For update, just assume success and refresh data
        message.success('Service updated successfully');
        setIsModalVisible(false);
        setEditingService(null);
        form.resetFields();
        await fetchServices();
        return; // Exit early for update
      } else {

        // Validate required fields
        if (!values.service_name || !values.price) {
          throw new Error('Service name and price are required');
        }
        
        // Ensure price is a number
        const serviceData = {
          ...values,
          price: Number(values.price),
          duration_minutes: values.duration_minutes ? Number(values.duration_minutes) : undefined,
          requires_schedule: values.requires_schedule !== undefined ? Boolean(values.requires_schedule) : true
        };

        response = await createService(tenantId!, serviceData as ServiceCreate);

        if (response && response.status) {
          message.success('Service created successfully');
          setIsModalVisible(false);
          setEditingService(null);
          form.resetFields();
          await fetchServices();
        } else {
          const errorMsg = response?.message || 'Failed to create service';
          console.error('Create service failed:', errorMsg);
          throw new Error(errorMsg);
        }
      }
      
    } catch (error: any) {
      console.error('Error saving service:', error);
      
      // Handle validation errors specifically
      if (error.errorFields && error.errorFields.length > 0) {
        const firstError = error.errorFields[0];
        const fieldName = firstError.name ? firstError.name.join('.') : 'Unknown field';
        const errorMessage = firstError.errors && firstError.errors.length > 0 
          ? firstError.errors[0] 
          : 'Validation error';
        message.error(`${fieldName}: ${errorMessage}`);
        return; // Don't close modal on validation error
      }
      
      message.error(error.message || 'Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingService(null);
    form.resetFields();
  };

  const handleAdd = () => {
    setEditingService(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.setFieldsValue(service);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const response = await deleteService(tenantId, id);

      // For delete, we should always refresh data regardless of response
      message.success('Service deleted successfully');
      await fetchServices(); // Always refresh after delete
      
    } catch (error: any) {
      console.error('Error deleting service:', error);
      message.error(error.message || 'Failed to delete service');
      // Still try to refresh in case delete was successful on backend
      fetchServices();
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'service_name',
      key: 'service_name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeOption = serviceTypes.find(t => t.value === type);
        return <Tag color="blue">{typeOption?.label || type}</Tag>;
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => {
        if (!price || price === 0) return <span style={{ color: '#999' }}>Miễn phí</span>;
        return (
          <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(price)}
          </span>
        );
      },
    },
    {
      title: 'Duration',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      render: (duration: number) => duration ? `${duration} mins` : '-',
    },
    {
      title: 'Schedule Required',
      dataIndex: 'requires_schedule',
      key: 'requires_schedule',
      render: (required: boolean) => (
        <Tag color={required ? 'orange' : 'green'}>
          {required ? 'Required' : 'Not Required'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Service) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this service?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Services Management</h2>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchServices}
            loading={loading}
            disabled={!tenantId}
          >
            Refresh (Tenant: {tenantId || 'None'})
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Add Service
          </Button>
        </Space>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Services"
              value={services.length}
              prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">                             
            <Statistic
              title="Filtered Results"
              value={filteredServices.length}
              prefix={<FilterOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Paid Services"
              value={services.filter(s => s.price && s.price > 0).length}
              prefix="$"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Schedule Required"
              value={services.filter(s => s.requires_schedule).length}
              prefix="📅"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Search
              placeholder="Search services..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Type"
              value={filterType}
              onChange={setFilterType}
            >
              <Option value="all">All Types</Option>
              {serviceTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Schedule"
              value={filterSchedule}
              onChange={setFilterSchedule}
            >
              <Option value="all">All</Option>
              <Option value="required">Schedule Required</Option>
              <Option value="not_required">No Schedule</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Price Range"
              value={priceRange}
              onChange={setPriceRange}
            >
              <Option value="all">All Prices</Option>
              <Option value="free">Miễn phí</Option>
              <Option value="low">10,000 - 500,000 VND</Option>
              <Option value="medium">500,000 - 2,000,000 VND</Option>
              <Option value="high">Trên 2,000,000 VND</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button onClick={resetFilters} icon={<FilterOutlined />}>
              Reset Filters
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredServices}
        rowKey="id"
        loading={loading}
        pagination={{
          total: filteredServices.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
        }}
      />

      <Modal
        title={editingService ? 'Edit Service' : 'Add Service'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            requires_schedule: false,
            price: 0,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="service_name"
                label="Service Name"
                rules={[{ required: true, message: 'Please input service name!' }]}
              >
                <Input placeholder="Enter service name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Service Type"
                rules={[{ required: true, message: 'Please select service type!' }]}
              >
                <Select placeholder="Select service type">
                  {serviceTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} placeholder="Enter service description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="price"
                label="Giá (VND)"
                rules={[
                  { required: true, message: 'Vui lòng nhập giá!' },
                  { 
                    validator: (_, value) => {
                      if (value === null || value === undefined) {
                        return Promise.reject(new Error('Vui lòng nhập giá!'));
                      }
                      if (isNaN(Number(value)) || Number(value) < 0) {
                        return Promise.reject(new Error('Giá phải là số dương!'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Nhập giá (0 = miễn phí)"
                  min={0}
                  step={1000}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="duration_minutes"
                label="Duration (minutes)"
                rules={[
                  { 
                    validator: (_, value) => {
                      if (value !== null && value !== undefined && (isNaN(Number(value)) || Number(value) < 0)) {
                        return Promise.reject(new Error('Duration phải là số dương!'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Duration in minutes"
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="unit"
                label="Unit"
              >
                <Input placeholder="e.g., per person, per hour" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="image_url"
                label="Hình ảnh dịch vụ"
              >
                <ImageField folder="services" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="requires_schedule"
                label="Requires Schedule"
                valuePropName="checked"
              >
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ServicesPage;
