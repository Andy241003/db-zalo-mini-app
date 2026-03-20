import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Switch, Tag, message, Space, Card, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { getVouchers, createVoucher, updateVoucher, deleteVoucher, Voucher, VoucherCreate, VoucherUpdate } from '../../../api/voucher.api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const VouchersPage: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [form] = Form.useForm();
  const { tenantId } = useTenantScope();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const discountTypes = [
    { value: 'percentage', label: 'Percentage' },
    { value: 'fixed_amount', label: 'Fixed Amount' },
  ];

  const fetchVouchers = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await getVouchers(tenantId);
      if (res.status && res.result) {
        setVouchers(res.result);
      } else {
        setVouchers([]);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      message.error('Failed to fetch vouchers');
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [tenantId]);

  const filteredVouchers = vouchers.filter((voucher) => {
    const q = searchText.trim().toLowerCase();
    const matchesSearch = !q ||
      voucher.voucher_code?.toLowerCase().includes(q) ||
      voucher.voucher_name?.toLowerCase().includes(q) ||
      voucher.description?.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && voucher.is_active) ||
      (statusFilter === 'inactive' && !voucher.is_active);
    return matchesSearch && matchesStatus;
  });

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // Convert date range to separate dates
      if (values.dateRange) {
        values.valid_from = values.dateRange[0].format('YYYY-MM-DD');
        values.valid_to = values.dateRange[1].format('YYYY-MM-DD');
        delete values.dateRange;
      }
      
      let response;
      if (editingVoucher) {
        response = await updateVoucher(tenantId!, editingVoucher.id, values as VoucherUpdate);
        if (response.status) {
          message.success('Voucher updated successfully');
        } else {
          throw new Error(response.message || 'Failed to update voucher');
        }
      } else {
        response = await createVoucher(tenantId!, values as VoucherCreate);
        if (response.status) {
          message.success('Voucher created successfully');
        } else {
          throw new Error(response.message || 'Failed to create voucher');
        }
      }
      
      setIsModalVisible(false);
      setEditingVoucher(null);
      form.resetFields();
      fetchVouchers();
    } catch (error: any) {
      console.error('Error saving voucher:', error);
      message.error(error.message || 'Failed to save voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingVoucher(null);
    form.resetFields();
  };

  const handleAdd = () => {
    setEditingVoucher(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    const formData = {
      ...voucher,
      dateRange: voucher.valid_from && voucher.valid_to ? [
        dayjs(voucher.valid_from),
        dayjs(voucher.valid_to)
      ] : undefined
    };
    form.setFieldsValue(formData);
    setIsModalVisible(true);
  };

  const handleDelete = (voucherId: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa voucher này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setLoading(true);
          const response = await deleteVoucher(tenantId!, voucherId);
          if (response.status) {
            message.success('Xóa voucher thành công');
            fetchVouchers();
          } else {
            throw new Error(response.message || 'Không thể xóa voucher');
          }
        } catch (error: any) {
          message.error(error.message || 'Không thể xóa voucher');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const resetFilters = () => {
    setSearchText('');
    setStatusFilter('all');
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
    { title: 'Mã voucher', dataIndex: 'voucher_code', key: 'voucher_code', width: 120 },
    { title: 'Tên voucher', dataIndex: 'voucher_name', key: 'voucher_name', width: 150 },
    {
      title: 'Giảm giá',
      key: 'discount',
      width: 120,
      render: (_: any, record: Voucher) => (
        <span>
          {record.discount_type === 'percentage'
            ? `${record.discount_value}%`
            : `$${record.discount_value}`
          }
        </span>
      )
    },
    { title: 'Đơn tối thiểu', dataIndex: 'min_order_value', key: 'min_order_value', width: 110 },
    { title: 'Lượt dùng', key: 'usage', width: 90, render: (_: any, record: Voucher) => `${record.used_count || 0}/${record.usage_limit || '∞'}` },
    {
      title: 'Từ ngày',
      dataIndex: 'valid_from',
      key: 'valid_from',
      width: 100,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: 'Đến ngày',
      dataIndex: 'valid_to',
      key: 'valid_to',
      width: 100,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      render: (_: any, record: Voucher) => (
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
        <h2 style={{ margin: 0 }}>Quản lý Voucher</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchVouchers} loading={loading}>
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
            <Statistic title="Tổng voucher" value={vouchers.length} prefix={<SearchOutlined style={{ color: '#1890ff' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Kết quả lọc" value={filteredVouchers.length} prefix={<FilterOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Đang hoạt động"
              value={vouchers.filter(v => v.is_active).length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Tổng lượt đã dùng"
              value={vouchers.reduce((sum, v) => sum + (v.used_count || 0), 0)}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tìm kiếm & Bộ lọc */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input.Search
              placeholder="Tìm kiếm theo mã hoặc tên voucher..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
            />
          </Col>
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'Tất cả', value: 'all' },
                { label: 'Đang hoạt động', value: 'active' },
                { label: 'Ngưng hoạt động', value: 'inactive' },
              ]}
            />
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
        dataSource={filteredVouchers}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{
          ...pagination,
          total: filteredVouchers.length,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} voucher`,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize: pageSize || 10 }),
        }}
      />
      <Modal
        title={editingVoucher ? 'Chỉnh sửa voucher' : 'Thêm voucher mới'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
        width={700}
      >
        <Form form={form} layout="vertical" name="voucher_form">
          <Form.Item
            name="voucher_code"
            label="Voucher Code"
            rules={[{ required: true, message: 'Please input the voucher code!' }]}
          >
            <Input placeholder="e.g., SUMMER2024" />
          </Form.Item>
          <Form.Item
            name="voucher_name"
            label="Voucher Name"
            rules={[{ required: true, message: 'Please input the voucher name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="discount_type"
            label="Discount Type"
            rules={[{ required: true, message: 'Please select discount type!' }]}
          >
            <Select placeholder="Select discount type">
              {discountTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="discount_value"
            label="Discount Value"
            rules={[{ required: true, message: 'Please input the discount value!' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="min_order_value"
            label="Minimum Order Value"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="max_discount_amount"
            label="Maximum Discount Amount"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="usage_limit"
            label="Usage Limit"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="dateRange"
            label="Valid Period"
            rules={[{ required: true, message: 'Please select valid period!' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="is_active"
            label="Active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="terms_conditions"
            label="Terms & Conditions"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VouchersPage;
