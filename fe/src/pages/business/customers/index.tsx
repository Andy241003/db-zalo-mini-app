import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, message, Space, Card, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, Customer, CustomerCreate, CustomerUpdate } from '../../../api/customer.api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import dayjs from 'dayjs';

const { Option } = Select;

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();
  const { tenantId } = useTenantScope();
  const [searchText, setSearchText] = useState('');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  const membershipLevels = [
    { value: 'bronze', label: 'Bronze' },
    { value: 'silver', label: 'Silver' },
    { value: 'gold', label: 'Gold' },
    { value: 'platinum', label: 'Platinum' },
    { value: 'diamond', label: 'Diamond' },
  ];

  const fetchCustomers = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await getCustomers(tenantId);
      if (res.status && res.result) {
        setCustomers(res.result);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      message.error('Failed to fetch customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [tenantId]);

  const filteredCustomers = customers.filter((customer) => {
    const q = searchText.trim().toLowerCase();
    const matchesSearch = !q ||
      customer.customer_name?.toLowerCase().includes(q) ||
      customer.email?.toLowerCase().includes(q) ||
      customer.phone_number?.toLowerCase().includes(q);
    const matchesMembership = membershipFilter === 'all' || customer.membership_level === membershipFilter;
    const matchesGender = genderFilter === 'all' || customer.gender === genderFilter;
    return matchesSearch && matchesMembership && matchesGender;
  });

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // Convert date to string if exists
      if (values.date_of_birth) {
        values.date_of_birth = values.date_of_birth.format('YYYY-MM-DD');
      }
      
      let response;
      if (editingCustomer) {
        response = await updateCustomer(tenantId!, editingCustomer.id, values as CustomerUpdate);
        if (response.status) {
          message.success('Customer updated successfully');
        } else {
          throw new Error(response.message || 'Failed to update customer');
        }
      } else {
        response = await createCustomer(tenantId!, values as CustomerCreate);
        if (response.status) {
          message.success('Customer created successfully');
        } else {
          throw new Error(response.message || 'Failed to create customer');
        }
      }
      
      setIsModalVisible(false);
      setEditingCustomer(null);
      form.resetFields();
      fetchCustomers();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      message.error(error.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingCustomer(null);
    form.resetFields();
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    const formData = {
      ...customer,
      date_of_birth: customer.date_of_birth ? dayjs(customer.date_of_birth) : undefined
    };
    form.setFieldsValue(formData);
    setIsModalVisible(true);
  };

  const handleDelete = (customerId: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa khách hàng này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setLoading(true);
          const response = await deleteCustomer(tenantId!, customerId);
          if (response.status) {
            message.success('Xóa khách hàng thành công');
            fetchCustomers();
          } else {
            throw new Error(response.message || 'Không thể xóa khách hàng');
          }
        } catch (error: any) {
          message.error(error.message || 'Không thể xóa khách hàng');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const resetFilters = () => {
    setSearchText('');
    setMembershipFilter('all');
    setGenderFilter('all');
  };

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 70,
      render: (_: any, __: any, index: number) => {
        const { current = 1, pageSize = 10 } = pagination;
        return (current - 1) * pageSize + index + 1;
      },
    },
    { title: 'Tên khách hàng', dataIndex: 'customer_name', key: 'customer_name', width: 150 },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 200 },
    { title: 'Điện thoại', dataIndex: 'phone_number', key: 'phone_number', width: 120 },
    { title: 'Thành phố', dataIndex: 'city', key: 'city', width: 100 },
    { title: 'Hạng thành viên', dataIndex: 'membership_level', key: 'membership_level', width: 130 },
    { title: 'Điểm', dataIndex: 'loyalty_points', key: 'loyalty_points', width: 80 },
    {
      title: 'Thao tác',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      render: (_: any, record: Customer) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Quản lý khách hàng</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchCustomers} loading={loading}>
            Làm mới
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Tạo mới
          </Button>
        </Space>
      </div>

      {/* Thống kê */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Tổng khách hàng" value={customers.length} prefix={<SearchOutlined style={{ color: '#1890ff' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Kết quả lọc" value={filteredCustomers.length} prefix={<FilterOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Thành viên VIP"
              value={customers.filter(c => ['gold', 'platinum', 'diamond'].includes(c.membership_level || '')).length}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Tổng điểm tích lũy"
              value={customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0)}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tìm kiếm & Bộ lọc */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input.Search
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
            />
          </Col>
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              value={membershipFilter}
              onChange={setMembershipFilter}
              options={[
                { label: 'Tất cả hạng', value: 'all' },
                ...membershipLevels.map((level) => ({ label: level.label, value: level.value })),
              ]}
            />
          </Col>
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              value={genderFilter}
              onChange={setGenderFilter}
              options={[
                { label: 'Tất cả giới tính', value: 'all' },
                { label: 'Nam', value: 'male' },
                { label: 'Nữ', value: 'female' },
                { label: 'Khác', value: 'other' },
              ]}
            />
          </Col>
          <Col span={4}>
            Hiển thị: <strong>{filteredCustomers.length}</strong>
          </Col>
          <Col span={4}>
            <Button onClick={resetFilters} icon={<FilterOutlined />}>
              Đặt lại
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredCustomers}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          ...pagination,
          total: filteredCustomers.length,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} khách hàng`,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize: pageSize || 10 }),
        }}
      />
      <Modal
        title={editingCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical" name="customer_form">
          <Form.Item
            name="customer_name"
            label="Customer Name"
            rules={[{ required: true, message: 'Please input the customer name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Please enter a valid email!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone_number"
            label="Phone Number"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="address"
            label="Address"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="city"
            label="City"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="country"
            label="Country"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="date_of_birth"
            label="Date of Birth"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="gender"
            label="Gender"
          >
            <Select placeholder="Select gender">
              {genderOptions.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="membership_level"
            label="Membership Level"
          >
            <Select placeholder="Select membership level">
              {membershipLevels.map(level => (
                <Option key={level.value} value={level.value}>{level.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="loyalty_points"
            label="Loyalty Points"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomersPage;
