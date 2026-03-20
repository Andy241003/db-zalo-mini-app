import React, { useState } from 'react';
import { 
  Card, Table, Button, Row, Col, Statistic, Select, 
  Typography, Tag, Space, Input, Modal, message 
} from 'antd';
import { 
  CalendarOutlined, UserOutlined, DollarOutlined, HomeOutlined,
  SearchOutlined, EyeOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '../../api/request';
import { authStore } from '../../stores/authStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;

interface BookingRequest {
  id: number;
  tenant_id: number;
  customer_id: number;
  room_id?: number;
  facility_id?: number;
  mobile_number?: string;
  booking_date: string;
  check_in_date?: string;
  check_out_date?: string;
  note?: string;
  request_channel?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

const BookingManagement: React.FC = () => {
  const [searchText, setSearchText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const queryClient = useQueryClient();
  const tenantId = authStore.getTenantId();

  // Fetch booking requests data
  const { data: bookingsData, isLoading, error } = useQuery({
    queryKey: ['booking-requests'],
    queryFn: async () => {
      try {
        const response = await request('get', `/booking-requests?tenant_id=${tenantId}`);
        return response;
      } catch (error) {
        console.error('API Error:', error);
        throw error;
      }
    },
  });

  // Safely handle the response
  const bookings = Array.isArray(bookingsData) ? bookingsData : [];

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      request('put', `/booking-requests/${id}?tenant_id=${tenantId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-requests'] });
      message.success('Cập nhật trạng thái thành công!');
    },
    onError: (error) => {
      console.error('Update Error:', error);
      message.error('Cập nhật thất bại!');
    },
  });

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'requested': 'orange',
      'confirmed': 'blue', 
      'checked_in': 'green',
      'checked_out': 'cyan',
      'cancelled': 'red',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      'requested': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận', 
      'checked_in': 'Đã nhận phòng',
      'checked_out': 'Đã trả phòng',
      'cancelled': 'Đã hủy',
    };
    return texts[status] || status;
  };

  const filteredBookings = bookings.filter((booking: BookingRequest) => {
    const matchesSearch = !searchText || 
      booking.mobile_number?.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.note?.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.status.toLowerCase().includes(searchText.toLowerCase()) ||
      String(booking.customer_id).includes(searchText) ||
      String(booking.id).includes(searchText);
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'requested').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const checkedInBookings = bookings.filter(b => b.status === 'checked_in').length;

  const handleStatusUpdate = (id: number, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <Text strong>#{id}</Text>
    },
    {
      title: 'Thông tin đặt phòng',
      key: 'booking_info',
      width: 250,
      render: (record: BookingRequest) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            👤 Khách hàng: {record.customer_id}
          </div>
          {record.mobile_number && (
            <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
              📞 {record.mobile_number}
            </div>
          )}
          {record.room_id && (
            <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
              🏠 Phòng: {record.room_id}
            </div>
          )}
          <div style={{ fontSize: 12, color: '#666' }}>
            📅 {dayjs(record.booking_date).format('DD/MM/YYYY')}
          </div>
        </div>
      ),
    },
    {
      title: 'Thời gian',
      key: 'dates',
      width: 200,
      render: (record: BookingRequest) => (
        <div>
          {record.check_in_date && (
            <div style={{ fontSize: 12, marginBottom: 2 }}>
              <strong>Nhận:</strong> {dayjs(record.check_in_date).format('DD/MM/YYYY')}
            </div>
          )}
          {record.check_out_date && (
            <div style={{ fontSize: 12, marginBottom: 2 }}>
              <strong>Trả:</strong> {dayjs(record.check_out_date).format('DD/MM/YYYY')}
            </div>
          )}
          <div style={{ fontSize: 12, color: '#999' }}>
            {dayjs(record.created_at).fromNow()}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Kênh',
      dataIndex: 'request_channel',
      key: 'request_channel',
      width: 100,
      render: (channel: string) => (
        <Tag color={channel === 'zalo_chat' ? 'blue' : 'green'}>
          {channel === 'zalo_chat' ? 'Zalo' : channel || 'Web'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (record: BookingRequest) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedBooking(record);
              setIsModalVisible(true);
            }}
          >
            Chi tiết
          </Button>
          {record.status === 'requested' && (
            <Button 
              size="small" 
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusUpdate(record.id, 'confirmed')}
              loading={updateStatusMutation.isPending}
            >
              Xác nhận
            </Button>
          )}
          {record.status === 'confirmed' && (
            <Button 
              size="small" 
              type="primary"
              onClick={() => handleStatusUpdate(record.id, 'checked_in')}
              loading={updateStatusMutation.isPending}
            >
              Nhận phòng
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (error) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Text type="danger">Lỗi tải dữ liệu: {String(error)}</Text>
          <br />
          <Button 
            type="primary" 
            style={{ marginTop: 16 }}
            onClick={() => window.location.reload()}
          >
            Thử lại
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Quản lý Đặt phòng</Title>
        </div>
      </div>

      {/* Statistics Overview */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng đặt phòng"
              value={totalBookings}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Chờ xác nhận"
              value={pendingBookings}
              prefix={<UserOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã xác nhận"
              value={confirmedBookings}
              prefix={<HomeOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã nhận phòng"
              value={checkedInBookings}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Filter */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8} lg={8}>
            <Input
              placeholder="Tìm kiếm đặt phòng..."
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
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">Tất cả</Option>
              <Option value="requested">Chờ xác nhận</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="checked_in">Đã nhận phòng</Option>
              <Option value="checked_out">Đã trả phòng</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Bookings Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredBookings}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} trong ${total} đặt phòng`,
          }}
        />
      </Card>

      {/* Booking Detail Modal */}
      <Modal
        title={`Chi tiết đặt phòng #${selectedBooking?.id}`}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedBooking(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={600}
      >
        {selectedBooking && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="Thông tin khách hàng" size="small">
                  <p><strong>ID khách hàng:</strong> {selectedBooking.customer_id}</p>
                  <p><strong>Điện thoại:</strong> {selectedBooking.mobile_number || 'N/A'}</p>
                  <p><strong>Kênh đặt:</strong> {selectedBooking.request_channel || 'N/A'}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Thông tin đặt phòng" size="small">
                  <p><strong>Phòng ID:</strong> {selectedBooking.room_id || 'N/A'}</p>
                  <p><strong>Ngày đặt:</strong> {dayjs(selectedBooking.booking_date).format('DD/MM/YYYY')}</p>
                  <p><strong>Trạng thái:</strong> 
                    <Tag color={getStatusColor(selectedBooking.status)} style={{ marginLeft: 8 }}>
                      {getStatusText(selectedBooking.status)}
                    </Tag>
                  </p>
                </Card>
              </Col>
            </Row>

            {selectedBooking.check_in_date && (
              <Card title="Lịch trình" size="small" style={{ marginTop: 16 }}>
                <p><strong>Ngày nhận phòng:</strong> {dayjs(selectedBooking.check_in_date).format('DD/MM/YYYY')}</p>
                {selectedBooking.check_out_date && (
                  <p><strong>Ngày trả phòng:</strong> {dayjs(selectedBooking.check_out_date).format('DD/MM/YYYY')}</p>
                )}
              </Card>
            )}

            {selectedBooking.note && (
              <Card title="Ghi chú" size="small" style={{ marginTop: 16 }}>
                <Text>{selectedBooking.note}</Text>
              </Card>
            )}

            <Card title="Thông tin hệ thống" size="small" style={{ marginTop: 16 }}>
              <p><strong>Tạo lúc:</strong> {dayjs(selectedBooking.created_at).format('DD/MM/YYYY HH:mm:ss')}</p>
              <p><strong>Cập nhật:</strong> {dayjs(selectedBooking.updated_at).format('DD/MM/YYYY HH:mm:ss')}</p>
              {selectedBooking.created_by && (
                <p><strong>Tạo bởi:</strong> {selectedBooking.created_by}</p>
              )}
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookingManagement;
