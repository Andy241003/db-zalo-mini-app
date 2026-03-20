import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Card, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { getFacilities, createFacility, updateFacility, deleteFacility, Facility, FacilityCreate, FacilityUpdate } from '../../../api/facility.api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { ImageField } from '../../../components/ImagePickerModal';

const { Option } = Select;

const FacilitiesPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [form] = Form.useForm();
  const { tenantId } = useTenantScope();
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [mediaFilter, setMediaFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const facilityTypes = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'spa', label: 'Spa' },
    { value: 'gym', label: 'Gym' },
    { value: 'pool', label: 'Pool' },
    { value: 'bar', label: 'Bar' },
    { value: 'conference', label: 'Conference Room' },
    { value: 'parking', label: 'Parking' },
    { value: 'wifi', label: 'WiFi' },
    { value: 'other', label: 'Other' },
  ];

  const fetchFacilities = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await getFacilities(tenantId);
      if (res.status && res.result) {
        setFacilities(res.result);
      } else {
        setFacilities([]);
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
      message.error('Failed to fetch facilities');
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [tenantId]);

  const filteredFacilities = facilities.filter((facility) => {
    const q = searchText.trim().toLowerCase();
    const matchesSearch = !q ||
      facility.facility_name?.toLowerCase().includes(q) ||
      facility.description?.toLowerCase().includes(q) ||
      facility.type?.toLowerCase().includes(q);
    const matchesType = typeFilter === 'all' || facility.type === typeFilter;
    const hasMedia = Boolean(facility.image_url || facility.video_url);
    const matchesMedia =
      mediaFilter === 'all' ||
      (mediaFilter === 'with_media' && hasMedia) ||
      (mediaFilter === 'no_media' && !hasMedia);
    return matchesSearch && matchesType && matchesMedia;
  });

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      let response;
      if (editingFacility) {
        response = await updateFacility(tenantId!, editingFacility.id, values as FacilityUpdate);
        if (response.status) {
          message.success('Facility updated successfully');
        } else {
          throw new Error(response.message || 'Failed to update facility');
        }
      } else {
        response = await createFacility(tenantId!, values as FacilityCreate);
        if (response.status) {
          message.success('Facility created successfully');
        } else {
          throw new Error(response.message || 'Failed to create facility');
        }
      }
      
      setIsModalVisible(false);
      setEditingFacility(null);
      form.resetFields();
      fetchFacilities();
    } catch (error: any) {
      console.error('Error saving facility:', error);
      message.error(error.message || 'Failed to save facility');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingFacility(null);
    form.resetFields();
  };

  const handleAdd = () => {
    setEditingFacility(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (facility: Facility) => {
    setEditingFacility(facility);
    form.setFieldsValue(facility);
    setIsModalVisible(true);
  };

  const handleDelete = (facilityId: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa tiện ích này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setLoading(true);
          const response = await deleteFacility(tenantId!, facilityId);
          if (response.status) {
            message.success('Xóa tiện ích thành công');
            fetchFacilities();
          } else {
            throw new Error(response.message || 'Không thể xóa tiện ích');
          }
        } catch (error: any) {
          message.error(error.message || 'Không thể xóa tiện ích');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const resetFilters = () => {
    setSearchText('');
    setTypeFilter('all');
    setMediaFilter('all');
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
    { title: 'Tên tiện ích', dataIndex: 'facility_name', key: 'facility_name' },
    { title: 'Loại', dataIndex: 'type', key: 'type' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Thao tác',
      key: 'action',
      width: 160,
      render: (_: any, record: Facility) => (
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
        <h2 style={{ margin: 0 }}>Quản lý tiện ích</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchFacilities} loading={loading}>
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
            <Statistic title="Tổng tiện ích" value={facilities.length} prefix={<SearchOutlined style={{ color: '#1890ff' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Kết quả lọc" value={filteredFacilities.length} prefix={<FilterOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Nhà hàng / Quầy bar" value={facilities.filter(f => ['restaurant', 'bar'].includes(f.type || '')).length} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Sức khỏe / Thể thao" value={facilities.filter(f => ['spa', 'gym', 'pool'].includes(f.type || '')).length} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      {/* Tìm kiếm & Bộ lọc */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input.Search
              placeholder="Tìm kiếm tiện ích..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
            />
          </Col>
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { label: 'Tất cả loại', value: 'all' },
                ...facilityTypes.map((type) => ({ label: type.label, value: type.value })),
              ]}
            />
          </Col>
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              value={mediaFilter}
              onChange={setMediaFilter}
              options={[
                { label: 'Tất cả media', value: 'all' },
                { label: 'Có media', value: 'with_media' },
                { label: 'Không media', value: 'no_media' },
              ]}
            />
          </Col>
          <Col span={4}>
            Hiển thị: <strong>{filteredFacilities.length}</strong>
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
        dataSource={filteredFacilities}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          total: filteredFacilities.length,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} tiện ích`,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize: pageSize || 10 }),
        }}
      />
      <Modal
        title={editingFacility ? 'Chỉnh sửa tiện ích' : 'Thêm tiện ích mới'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" name="facility_form">
          <Form.Item
            name="facility_name"
            label="Facility Name"
            rules={[{ required: true, message: 'Please input the facility name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="type"
            label="Type"
          >
            <Select placeholder="Select facility type">
              {facilityTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="image_url"
            label="Hình ảnh tiện ích"
          >
            <ImageField folder="facilities" />
          </Form.Item>
          <Form.Item
            name="video_url"
            label="Video URL"
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FacilitiesPage;
