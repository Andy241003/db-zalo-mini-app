import React, { useState } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Row, Col, 
  message, Space, Typography, Tag, Upload, Popconfirm, Tooltip
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  GiftOutlined, CalendarOutlined, PictureOutlined,
  SearchOutlined, ClearOutlined, DownloadOutlined, TagOutlined, CopyOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '../../api/request';
import { authStore } from '../../stores/authStore';
import { ImageField } from '../../components/ImagePickerModal';

const HOST_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8889';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || `${HOST_ORIGIN}/api/v1`;
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Promotion {
  id: number;
  tenant_id?: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  banner_image?: string;
  status: string; // active, inactive, expired
  type?: string; // campaign, voucher
  code?: string;
  discount_type?: string; // percentage, fixed
  discount_value?: number;
  max_usage?: number;
  used_count?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

const PromotionManagement: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  
  // Search and filter states
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch promotions data
  const { data: promotionsData, isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: () => {
      const tenantId = authStore.getTenantId();
      return request('get', `/promotions?tenant_id=${tenantId}`);
    },
  });

  const promotions = Array.isArray(promotionsData) ? promotionsData : [];
  
  // Filter and search logic
  const filteredPromotions = promotions.filter((promotion: Promotion) => {
    // Search in title and description
    const matchesSearch = !searchText || 
      promotion.title.toLowerCase().includes(searchText.toLowerCase()) ||
      promotion.description?.toLowerCase().includes(searchText.toLowerCase());
    
    // Filter by status
    const matchesStatus = !filterStatus || promotion.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  // Clear all filters
  const clearFilters = () => {
    setSearchText('');
    setFilterStatus('');
  };
  
  // Export filtered data to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Tiêu đề', 'Mô tả', 'Ngày bắt đầu', 'Ngày kết thúc', 'Trạng thái'];
    const csvContent = [
      headers.join(','),
      ...filteredPromotions.map(promotion => [
        promotion.id,
        `"${promotion.title}"`,
        `"${promotion.description || ''}"`,
        `"${promotion.start_date}"`,
        `"${promotion.end_date}"`,
        `"${promotion.status}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `promotions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Đã xuất dữ liệu thành công');
  };

  // Create/Update promotion mutation
  const promotionMutation = useMutation({
    mutationFn: (data: Partial<Promotion>) => {
      const tenantId = authStore.getTenantId();
      return editingPromotion?.id 
        ? request('put', `/promotions/${editingPromotion.id}?tenant_id=${tenantId}`, data)
        : request('post', `/promotions?tenant_id=${tenantId}`, data);
    },
    onSuccess: () => {
      message.success(editingPromotion ? 'Cập nhật khuyến mãi thành công' : 'Tạo khuyến mãi thành công');
      setIsModalVisible(false);
      setEditingPromotion(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
    onError: (error: any) => {
      message.error(error.message || 'Có lỗi xảy ra');
    },
  });

  // Delete promotion mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      const tenantId = authStore.getTenantId();
      return request('delete', `/promotions/${id}?tenant_id=${tenantId}`);
    },
    onSuccess: () => {
      message.success('Xóa khuyến mãi thành công');
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
    onError: (error: any) => {
      message.error(error.message || 'Có lỗi xảy ra');
    },
  });

  const handleAdd = () => {
    setEditingPromotion(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    const formData = {
      ...promotion,
      date_range: [dayjs(promotion.start_date), dayjs(promotion.end_date)],
    };
    form.setFieldsValue(formData);
    setIsModalVisible(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleSubmit = async (values: any) => {
    const submitData = {
      ...values,
      start_date: values.date_range[0].format('YYYY-MM-DD'),
      end_date: values.date_range[1].format('YYYY-MM-DD'),
    };
    delete submitData.date_range;
    await promotionMutation.mutateAsync(submitData);
  };

  const getPromotionStatusColor = (promotion: Promotion) => {
    const now = dayjs();
    const startDate = dayjs(promotion.start_date);
    const endDate = dayjs(promotion.end_date);
    
    if (promotion.status === 'inactive') return 'default';
    if (now.isBefore(startDate)) return 'blue';
    if (now.isAfter(endDate)) return 'red';
    return 'green';
  };

  const getPromotionStatusText = (promotion: Promotion) => {
    const now = dayjs();
    const startDate = dayjs(promotion.start_date);
    const endDate = dayjs(promotion.end_date);
    
    if (promotion.status === 'inactive') return 'Tạm dừng';
    if (now.isBefore(startDate)) return 'Sắp diễn ra';
    if (now.isAfter(endDate)) return 'Đã kết thúc';
    return 'Đang diễn ra';
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      render: (_: any, __: any, index: number) => index + 1,
      width: 60,
    },
    {
      title: 'Banner',
      dataIndex: 'banner_image',
      key: 'banner_image',
      width: 100,
      render: (banner_image: string, record: Promotion) => (
        banner_image ? (
          <img 
            src={banner_image} 
            alt={record.title}
            style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <div style={{ 
            width: 60, height: 40, backgroundColor: '#f5f5f5', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 4, color: '#999'
          }}>
            <PictureOutlined />
          </div>
        )
      ),
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (title: string, record: Promotion) => (
        <div>
          <Text strong>{title}</Text>
          {record.description && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.description.length > 50 
                  ? `${record.description.substring(0, 50)}...` 
                  : record.description}
              </Text>
            </>
          )}
        </div>
      ),
    },
    {
      title: 'Thời gian',
      key: 'duration',
      width: 150,
      render: (record: Promotion) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            <CalendarOutlined style={{ marginRight: 4, color: '#52c41a' }} />
            {dayjs(record.start_date).format('DD/MM/YYYY')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CalendarOutlined style={{ marginRight: 4, color: '#ff4d4f' }} />
            {dayjs(record.end_date).format('DD/MM/YYYY')}
          </div>
        </div>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag icon={<TagOutlined />} color={type === 'voucher' ? 'purple' : 'blue'}>
          {type === 'voucher' ? 'Voucher' : 'Campaign'}
        </Tag>
      ),
    },
    {
      title: 'Mã / Giảm giá',
      key: 'discount',
      width: 150,
      render: (record: Promotion) => (
        <div>
          {record.code && (
            <div style={{ marginBottom: 2 }}>
              <Tooltip title="Sao chép mã">
                <Tag
                  icon={<CopyOutlined />}
                  style={{ cursor: 'pointer', fontFamily: 'monospace' }}
                  onClick={() => { navigator.clipboard.writeText(record.code!); message.success('Đã sao chép mã'); }}
                >
                  {record.code}
                </Tag>
              </Tooltip>
            </div>
          )}
          {record.discount_value != null && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Giảm: {record.discount_type === 'percentage'
                ? `${record.discount_value}%`
                : `${record.discount_value?.toLocaleString('vi-VN')}đ`
              }
            </Text>
          )}
          {record.max_usage != null && (
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {record.used_count ?? 0}/{record.max_usage} lượt
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (record: Promotion) => (
        <Tag color={getPromotionStatusColor(record)}>
          {getPromotionStatusText(record)}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (record: Promotion) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xác nhận xóa khuyến mãi này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okType="danger"
          >
            <Button 
              danger 
              size="small" 
              icon={<DeleteOutlined />}
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
          <Title level={2} style={{ margin: 0 }}>Quản lý Khuyến mãi</Title>
          <Text type="secondary">Quản lý các chương trình khuyến mãi, voucher giảm giá</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          onClick={handleAdd}
        >
          Tạo khuyến mãi mới
        </Button>
      </div>

      {/* Search and Filter */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8} lg={8}>
            <Input
              placeholder="Tìm kiếm khuyến mãi..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={8}>
            <Select
              placeholder="Trạng thái"
              style={{ width: '100%' }}
              value={filterStatus}
              onChange={setFilterStatus}
              allowClear
            >
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Tạm dừng</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8} lg={8}>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={exportToCSV}
                disabled={filteredPromotions.length === 0}
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
            <Col span={6}>
              <Text strong>Tổng khuyến mãi: </Text>
              <Text>{promotions.length}</Text>
            </Col>
            <Col span={6}>
              <Text strong>Hiển thị: </Text>
              <Text>{filteredPromotions.length}</Text>
            </Col>
            <Col span={6}>
              <Text strong>Đang hoạt động: </Text>
              <Text>{filteredPromotions.filter(p => p.status === 'active').length}</Text>
            </Col>
            <Col span={6}>
              <Text strong>Có banner: </Text>
              <Text>{filteredPromotions.filter(p => p.banner_image).length}</Text>
            </Col>
          </Row>
        </div>
        
        <Table
          columns={columns}
          dataSource={filteredPromotions}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} trong ${total} khuyến mãi`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingPromotion ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi mới'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingPromotion(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={promotionMutation.isPending}
          initialValues={{
            status: 'active',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tiêu đề khuyến mãi"
                name="title"
                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
              >
                <Input placeholder="VD: Giảm giá cuối tuần" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Trạng thái"
                name="status"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select placeholder="Chọn trạng thái">
                  <Option value="active">Hoạt động</Option>
                  <Option value="inactive">Tạm dừng</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Loại khuyến mãi"
                name="type"
                initialValue="campaign"
                rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
              >
                <Select placeholder="Chọn loại">
                  <Option value="campaign">Campaign</Option>
                  <Option value="voucher">Voucher</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Mã khuyến mãi"
                name="code"
              >
                <Input placeholder="VD: SUMMER2026" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Loại giảm giá"
                name="discount_type"
              >
                <Select placeholder="Chọn loại giảm" allowClear>
                  <Option value="percentage">Phần trăm (%)</Option>
                  <Option value="fixed">Số tiền cố định (đ)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Giá trị giảm"
                name="discount_value"
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="VD: 10 hoặc 50000" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Giới hạn số lần dùng"
            name="max_usage"
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Để trống = không giới hạn" />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
          >
            <TextArea rows={3} placeholder="Mô tả chi tiết về khuyến mãi" />
          </Form.Item>

          <Form.Item
            label="Thời gian hiệu lực"
            name="date_range"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Banner khuyến mãi"
            name="banner_image"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Upload
                name="file"
                action={`${API_BASE_URL}/api/v1/upload/image`}
                data={{ folder: 'promotions' }}
                headers={{
                  'Authorization': `Bearer ${authStore.getToken()}`
                }}
                showUploadList={false}
                onChange={(info) => {
                  if (info.file.status === 'done' && info.file.response?.success) {
                    const imageUrl = `${API_BASE_URL}${info.file.response.data.url}`;
                    form.setFieldsValue({ banner_image: imageUrl });
                  }
                }}
              >
                <Button icon={<PictureOutlined />} style={{ width: '100%' }}>
                  Tải lên banner
                </Button>
              </Upload>
              <Input placeholder="Hoặc nhập URL banner" />
            </Space>
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Hủy
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={promotionMutation.isPending}
              >
                {editingPromotion ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PromotionManagement;
