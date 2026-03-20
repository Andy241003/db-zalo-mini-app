import React, { useState } from 'react';
import { 
  Card, Table, Button, Row, Col, Statistic, Select, DatePicker,
  Typography, Tag, Progress, Space, Input, Tooltip, Avatar 
} from 'antd';
import { 
  UserOutlined, HeartOutlined, DollarOutlined, CalendarOutlined,
  TrophyOutlined, PhoneOutlined, MailOutlined, SearchOutlined,
  ExportOutlined, FilterOutlined 
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { request } from '../../api/request';
import { authStore } from '../../stores/authStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Customer {
  id: number;
  zalo_user_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  tenant_id: number;
  created_at: string;
  updated_at: string;
}

const CustomerAnalytics: React.FC = () => {
  const [searchText, setSearchText] = useState<string>('');
  const tenantId = authStore.getTenantId();

  // Fetch customers data
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => {
      return request('get', `/customers?tenant_id=${tenantId}`);
    },
  });

  const customers = Array.isArray(customersData) ? customersData : [];
  
  // Calculate analytics from real data
  const currentMonth = dayjs().format('YYYY-MM');
  const lastMonth = dayjs().subtract(1, 'month').format('YYYY-MM');
  
  const currentMonthCustomers = customers.filter(c => 
    dayjs(c.created_at).format('YYYY-MM') === currentMonth
  ).length;
  
  const lastMonthCustomers = customers.filter(c => 
    dayjs(c.created_at).format('YYYY-MM') === lastMonth
  ).length;

  const filteredCustomers = customers.filter((customer: Customer) =>
    !searchText || 
    customer.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.phone?.includes(searchText)
  );

  const columns = [
    {
      title: 'STT',
      key: 'index',
      render: (_: any, __: any, index: number) => index + 1,
      width: 60,
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 300,
      render: (record: Customer) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar 
            size={40}
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name || 'N/A'}</div>
            {record.phone && (
              <div style={{ fontSize: 12, color: '#666' }}>
                <PhoneOutlined style={{ marginRight: 4 }} />
                {record.phone}
              </div>
            )}
            {record.email && (
              <div style={{ fontSize: 12, color: '#666' }}>
                <MailOutlined style={{ marginRight: 4 }} />
                {record.email}
              </div>
            )}
            {record.zalo_user_id && (
              <div style={{ fontSize: 12, color: '#666' }}>
                Zalo ID: {record.zalo_user_id}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => (
        <div>
          <div>{dayjs(date).format('DD/MM/YYYY')}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {dayjs(date).fromNow()}
          </div>
        </div>
      ),
    },
    {
      title: 'Cập nhật gần nhất',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 120,
      render: (date: string) => (
        <div style={{ fontSize: 12, color: '#666' }}>
          {dayjs(date).format('DD/MM/YYYY HH:mm')}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Phân tích Khách hàng</Title>
        </div>
        <Space>
          <Button icon={<ExportOutlined />}>
            Xuất báo cáo
          </Button>
        </Space>
      </div>

      {/* Analytics Overview */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Tổng khách hàng"
              value={customers.length}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Khách hàng mới"
              value={currentMonthCustomers}
              prefix={<HeartOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Input
              placeholder="Tìm kiếm khách hàng..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={12}>
            <Button 
              type="primary" 
              icon={<ExportOutlined />}
              style={{ width: '100%' }}
              onClick={() => {
                // Export logic here
              }}
            >
              Xuất Excel
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Search Results Statistics */}
      {searchText && (
        <Card style={{ marginBottom: 16, backgroundColor: '#f0f9ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <SearchOutlined style={{ color: '#1890ff' }} />
            <Text>
              Tìm thấy <Text strong style={{ color: '#1890ff' }}>{filteredCustomers.length}</Text> khách hàng 
              chứa từ khóa "<Text strong>{searchText}</Text>"
            </Text>
            {filteredCustomers.length === 0 && (
              <Text type="secondary"> - Thử tìm kiếm với từ khóa khác</Text>
            )}
          </div>
        </Card>
      )}

      {/* Customer Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredCustomers}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Tổng ${total} khách hàng`,
          }}
        />
      </Card>
    </div>
  );
};

export default CustomerAnalytics;
