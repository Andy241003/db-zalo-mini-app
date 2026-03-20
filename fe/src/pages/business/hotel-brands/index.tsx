import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Card, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { getHotelBrands, createHotelBrand, updateHotelBrand, deleteHotelBrand, HotelBrand, HotelBrandCreate, HotelBrandUpdate } from '../../../api/hotel.brand.api';
import { useTenantScope } from '../../../hooks/useTenantScope'; // Assuming this hook provides the tenantId

const HotelBrandsPage: React.FC = () => {
  const [brands, setBrands] = useState<HotelBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBrand, setEditingBrand] = useState<HotelBrand | null>(null);
  const [form] = Form.useForm();
  const { tenantId } = useTenantScope(); // Get the current tenant ID
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const fetchBrands = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await getHotelBrands(tenantId);
      // Backend API returns array directly in result field
      if (res.status && res.result) {
        setBrands(res.result);
      } else {
        setBrands([]);
      }
    } catch (error) {
      console.error('Error fetching hotel brands:', error);
      message.error('Failed to fetch hotel brands');
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [tenantId]);

  const filteredBrands = brands.filter((brand) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    return (
      brand.hotel_name?.toLowerCase().includes(q) ||
      brand.city?.toLowerCase().includes(q) ||
      brand.phone_number?.toLowerCase().includes(q) ||
      brand.email?.toLowerCase().includes(q)
    );
  });

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      let response;
      if (editingBrand) {
        response = await updateHotelBrand(tenantId!, editingBrand.id, values as HotelBrandUpdate);
        if (response.status) {
          message.success('Brand updated successfully');
        } else {
          throw new Error(response.message || 'Failed to update brand');
        }
      } else {
        response = await createHotelBrand(tenantId!, values as HotelBrandCreate);
        if (response.status) {
          message.success('Brand created successfully');
        } else {
          throw new Error(response.message || 'Failed to create brand');
        }
      }
      
      setIsModalVisible(false);
      setEditingBrand(null);
      form.resetFields();
      fetchBrands(); // Refresh the list
    } catch (error: any) {
      console.error('Error saving brand:', error);
      message.error(error.message || 'Failed to save brand');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingBrand(null);
    form.resetFields();
  };

  const handleAdd = () => {
    setEditingBrand(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (brand: HotelBrand) => {
    setEditingBrand(brand);
    form.setFieldsValue(brand);
    setIsModalVisible(true);
  };

  const handleDelete = (brandId: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa thương hiệu này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setLoading(true);
          const response = await deleteHotelBrand(tenantId!, brandId);
          if (response.status) {
            message.success('Xóa thương hiệu thành công');
            fetchBrands();
          } else {
            throw new Error(response.message || 'Không thể xóa thương hiệu');
          }
        } catch (error: any) {
          message.error(error.message || 'Không thể xóa thương hiệu');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const resetFilters = () => {
    setSearchText('');
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
    { title: 'Tên thương hiệu', dataIndex: 'hotel_name', key: 'hotel_name' },
    { title: 'Slogan', dataIndex: 'slogan', key: 'slogan' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Thành phố', dataIndex: 'city', key: 'city' },
    { title: 'Điện thoại', dataIndex: 'phone_number', key: 'phone_number' },
    {
      title: 'Thao tác',
      key: 'action',
      width: 160,
      render: (_: any, record: HotelBrand) => (
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
        <h2 style={{ margin: 0 }}>Quản lý thương hiệu khách sạn</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchBrands} loading={loading}>
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
            <Statistic title="Tổng thương hiệu" value={brands.length} prefix={<SearchOutlined style={{ color: '#1890ff' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Kết quả lọc" value={filteredBrands.length} prefix={<FilterOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Số thành phố"
              value={new Set(brands.map(b => b.city).filter(Boolean)).size}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Có thông tin liên hệ"
              value={brands.filter(b => b.phone_number || b.email).length}
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
              placeholder="Tìm kiếm theo tên, thành phố, email..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
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
        dataSource={filteredBrands}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          total: filteredBrands.length,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} thương hiệu`,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize: pageSize || 10 }),
        }}
      />
      <Modal
        title={editingBrand ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu mới'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" name="brand_form">
          <Form.Item
            name="hotel_name"
            label="Hotel Name"
            rules={[{ required: true, message: 'Please input the hotel name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="slogan"
            label="Slogan"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea />
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
            name="phone_number"
            label="Phone Number"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HotelBrandsPage;
