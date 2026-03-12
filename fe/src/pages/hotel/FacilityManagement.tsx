import React, { useState } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, Select, Row, Col, 
  message, Space, Typography, Tag, Switch, Popconfirm, Upload,
  Slider, DatePicker
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  WifiOutlined, CarOutlined, CoffeeOutlined, 
  ThunderboltOutlined, FireOutlined, MedicineBoxOutlined,
  SearchOutlined, FilterOutlined, ClearOutlined, DownloadOutlined,
  PictureOutlined, PlayCircleOutlined, GlobalOutlined, UploadOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '../../api/request';
import { authStore } from '../../stores/authStore';
import { getUploadUrl } from '../../config/api';
import { ImageField } from '../../components/ImagePickerModal';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Facility {
  id: number;
  tenant_id?: number;
  facility_name: string;
  description: string;
  type: string; // restaurant, spa, gym, pool, etc.
  image_url?: string;
  video_url?: string;
  vr360_url?: string;
  gallery_url?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  deleted?: number;
  deleted_at?: string;
  deleted_by?: string;
}

const facilityIcons: { [key: string]: React.ReactNode } = {
  'wifi': <WifiOutlined />,
  'parking': <CarOutlined />,
  'restaurant': <CoffeeOutlined />,
  'gym': <ThunderboltOutlined />,
  'spa': <FireOutlined />,
  'medical': <MedicineBoxOutlined />,
};

const FacilityManagement: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  
  // Search and Filter states
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  // Fetch facilities data
  const { data: facilitiesData, isLoading } = useQuery({
    queryKey: ['facilities'],
    queryFn: () => {
      const tenantId = authStore.getTenantId();
      return request('get', `/facilities?tenant_id=${tenantId}`);
    },
  });

  const facilities = Array.isArray(facilitiesData) ? facilitiesData : [];
  
  // Filter and search logic
  const filteredFacilities = facilities.filter((facility: Facility) => {
    // Search in facility name, description, type
    const matchesSearch = !searchText || 
      facility.facility_name.toLowerCase().includes(searchText.toLowerCase()) ||
      facility.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      facility.type.toLowerCase().includes(searchText.toLowerCase());
    
    // Filter by type
    const matchesType = !filterType || facility.type === filterType;
    
    return matchesSearch && matchesType;
  });
  
  // Clear all filters
  const clearFilters = () => {
    setSearchText('');
    setFilterType('');
  };
  
  // Export filtered data to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Tên tiện ích', 'Loại', 'Mô tả'];
    const csvContent = [
      headers.join(','),
      ...filteredFacilities.map(facility => [
        facility.id,
        `"${facility.facility_name}"`,
        `"${facility.type}"`,
        `"${facility.description || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `facilities_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Đã xuất dữ liệu thành công');
  };

  // Create/Update facility mutation
  const facilityMutation = useMutation({
    mutationFn: (data: Partial<Facility>) => {
      const tenantId = authStore.getTenantId();
      return editingFacility?.id 
        ? request('put', `/facilities/${editingFacility.id}?tenant_id=${tenantId}`, data)
        : request('post', `/facilities?tenant_id=${tenantId}`, data);
    },
    onSuccess: () => {
      message.success(editingFacility ? 'Cập nhật tiện ích thành công' : 'Tạo tiện ích thành công');
      setIsModalVisible(false);
      setEditingFacility(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
    },
    onError: (error: any) => {
      message.error(error.message || 'Có lỗi xảy ra');
    },
  });

  // Delete facility mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      const tenantId = authStore.getTenantId();
      return request('delete', `/facilities/${id}?tenant_id=${tenantId}`);
    },
    onSuccess: () => {
      message.success('Xóa tiện ích thành công');
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
    },
    onError: (error: any) => {
      message.error(error.message || 'Có lỗi xảy ra');
    },
  });

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

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleSubmit = async (values: any) => {
    await facilityMutation.mutateAsync(values);
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      render: (_: any, __: any, index: number) => index + 1,
      width: 60,
    },
    {
      title: 'Tên tiện ích',
      dataIndex: 'facility_name',
      key: 'facility_name',
      width: 200,
    },
    {
      title: 'Loại tiện ích',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const colors: { [key: string]: string } = {
          'restaurant': 'green',
          'spa': 'purple',
          'gym': 'orange',
          'pool': 'blue',
          'parking': 'cyan',
          'wifi': 'blue',
          'business': 'purple',
        };
        return <Tag color={colors[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      render: (description: string) => (
        description ? (
          <span title={description}>
            {description.length > 50 ? `${description.substring(0, 50)}...` : description}
          </span>
        ) : (
          <Text type="secondary">Chưa có mô tả</Text>
        )
      ),
    },
    {
      title: 'Media',
      key: 'media',
      width: 120,
      render: (record: Facility) => (
        <Space>
          {record.image_url && <Tag color="blue" icon={<PictureOutlined />}>Ảnh</Tag>}
          {record.video_url && <Tag color="purple" icon={<PlayCircleOutlined />}>Video</Tag>}
          {record.vr360_url && <Tag color="orange" icon={<GlobalOutlined />}>VR360</Tag>}
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (record: Facility) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xác nhận xóa tiện ích này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okType="danger"
          >
            <Button 
              danger 
              size="small" 
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Quản lý Tiện ích</Title>
          <Text type="secondary">Quản lý các tiện ích, dịch vụ khách sạn</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          onClick={handleAdd}
        >
          Thêm tiện ích mới
        </Button>
      </div>

      {/* Search and Filter Section */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={8}>
            <Input
              placeholder="Tìm kiếm tiện ích..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={8}>
            <Select
              placeholder="Loại tiện ích"
              style={{ width: '100%' }}
              value={filterType}
              onChange={setFilterType}
              allowClear
            >
              <Option value="restaurant">Restaurant</Option>
              <Option value="spa">Spa</Option>
              <Option value="gym">Gym</Option>
              <Option value="pool">Pool</Option>
              <Option value="parking">Parking</Option>
              <Option value="wifi">WiFi</Option>
              <Option value="business">Business Center</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8} lg={8}>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={exportToCSV}
                disabled={filteredFacilities.length === 0}
              >
                Xuất Excel
              </Button>
              <Button
                icon={<ClearOutlined />}
                onClick={clearFilters}
              >
                Xóa bộ lọc
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        {/* Statistics */}
        <div style={{ marginBottom: 16, padding: '12px 16px', backgroundColor: '#f5f5f5', borderRadius: 6 }}>
          <Row gutter={24}>
            <Col span={8}>
              <Text strong>Tổng tiện ích: </Text>
              <Text>{facilities.length}</Text>
            </Col>
            <Col span={8}>
              <Text strong>Hiển thị: </Text>
              <Text>{filteredFacilities.length}</Text>
            </Col>
            <Col span={8}>
              <Text strong>Có media: </Text>
              <Text>{filteredFacilities.filter(f => f.image_url || f.video_url || f.vr360_url).length}</Text>
            </Col>
          </Row>
        </div>
        
        <Table
          columns={columns}
          dataSource={filteredFacilities}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} trong ${total} tiện ích`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingFacility ? 'Chỉnh sửa tiện ích' : 'Thêm tiện ích mới'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingFacility(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={facilityMutation.isPending}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tên tiện ích"
                name="facility_name"
                rules={[{ required: true, message: 'Vui lòng nhập tên tiện ích' }]}
              >
                <Input placeholder="VD: Hồ bơi ngoài trời" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Loại tiện ích"
                name="type"
                rules={[{ required: true, message: 'Vui lòng chọn loại tiện ích' }]}
              >
                <Select placeholder="Chọn loại tiện ích">
                  <Option value="restaurant">Restaurant</Option>
                  <Option value="spa">Spa</Option>
                  <Option value="gym">Gym</Option>
                  <Option value="pool">Pool</Option>
                  <Option value="parking">Parking</Option>
                  <Option value="wifi">WiFi</Option>
                  <Option value="business">Business Center</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Mô tả"
            name="description"
          >
            <TextArea rows={3} placeholder="Mô tả chi tiết về tiện ích" />
          </Form.Item>

          {/* Media Upload Section */}
          <Typography.Title level={5}>Đa phương tiện</Typography.Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Hình ảnh tiện ích"
                name="image_url"
              >
                <ImageField folder="facilities" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Video giới thiệu"
                name="video_url"
              >
                <Input placeholder="Nhập URL video (YouTube, Vimeo, etc.)" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="VR 360° Link"
                name="vr360_url"
              >
                <Input placeholder="Nhập URL tour VR 360°" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Gallery URL (Album ảnh)"
            name="gallery_url"
          >
            <Input placeholder="URL album ảnh của tiện ích (tùy chọn)" />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Hủy
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={facilityMutation.isPending}
              >
                {editingFacility ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default FacilityManagement;
