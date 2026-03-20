import React, { useMemo } from 'react';
import { Card, Col, Row, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { get } from '../../utils/request';
import { useTenantContext } from '../../hooks/useTenantContext';

const { Title, Text } = Typography;

interface CustomerVoucher {
  id: number;
  tenant_id: number;
  customer_id: number;
  promotion_id?: number | null;
  voucher_id?: number | null;
  status?: 'assigned' | 'used' | 'expired' | string;
  is_used?: boolean;
  assigned_date?: string;
  used_at?: string;
  created_at?: string;
}

interface CustomerInfo {
  id: number;
  name?: string;
  full_name?: string;
  phone?: string;
}

interface PromotionInfo {
  id: number;
  title?: string;
  discount_type?: string;
  discount_value?: number;
  max_usage?: number | null;
  used_count?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
}

const statusColor = (status?: string) => {
  if (status === 'used') return 'green';
  if (status === 'expired') return 'red';
  if (status === 'assigned') return 'blue';
  return 'default';
};

const VouchersPage: React.FC = () => {
  const { tenantId } = useTenantContext();

  const customerVouchersQuery = useQuery({
    queryKey: ['customer-promotions', tenantId],
    queryFn: () =>
      get<CustomerVoucher[]>('/api/v1/customer-vouchers', {
        params: { tenant_id: tenantId, limit: 500, skip: 0 },
      }),
    enabled: !!tenantId,
  });

  const customersQuery = useQuery({
    queryKey: ['customers', tenantId],
    queryFn: () =>
      get<CustomerInfo[]>('/api/v1/customers', {
        params: { tenant_id: tenantId, limit: 500, skip: 0 },
      }),
    enabled: !!tenantId,
  });

  const promotionsQuery = useQuery({
    queryKey: ['promotions', tenantId],
    queryFn: () =>
      get<PromotionInfo[]>('/api/v1/promotions', {
        params: { tenant_id: tenantId, limit: 500, skip: 0 },
      }),
    enabled: !!tenantId,
  });

  const loading =
    customerVouchersQuery.isLoading || customersQuery.isLoading || promotionsQuery.isLoading;

  const customerMap = useMemo(() => {
    const map = new Map<number, CustomerInfo>();
    (customersQuery.data || []).forEach((c) => map.set(c.id, c));
    return map;
  }, [customersQuery.data]);

  const promotionMap = useMemo(() => {
    const map = new Map<number, PromotionInfo>();
    (promotionsQuery.data || []).forEach((p) => map.set(p.id, p));
    return map;
  }, [promotionsQuery.data]);

  const rows = useMemo(() => {
    return (customerVouchersQuery.data || []).map((cv) => {
      const customer = customerMap.get(cv.customer_id);
      const promotion = cv.promotion_id ? promotionMap.get(cv.promotion_id) : undefined;
      const customerName = customer?.full_name || customer?.name || `Customer #${cv.customer_id}`;
      return {
        ...cv,
        customer_name: customerName,
        customer_phone: customer?.phone || '-',
        promotion_title: promotion?.title || `Promotion #${cv.promotion_id || '-'}`,
        promotion_usage: `${promotion?.used_count || 0}/${promotion?.max_usage ?? '?'}`,
      };
    });
  }, [customerMap, customerVouchersQuery.data, promotionMap]);

  const summary = useMemo(() => {
    const total = rows.length;
    const assigned = rows.filter((r) => (r.status || '').toLowerCase() === 'assigned').length;
    const used = rows.filter((r) => (r.status || '').toLowerCase() === 'used' || r.is_used).length;
    const expired = rows.filter((r) => (r.status || '').toLowerCase() === 'expired').length;
    return { total, assigned, used, expired };
  }, [rows]);

  const columns: ColumnsType<any> = [
    {
      title: 'Customer',
      key: 'customer',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.customer_name}</div>
          <Text type="secondary">{record.customer_phone}</Text>
        </div>
      ),
    },
    {
      title: "Customer's Promotion",
      key: 'promotion',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.promotion_title}</div>
          <Space size={8}>
            <Text type="secondary">ID: {record.promotion_id || '-'}</Text>
            <Text type="secondary">Usage: {record.promotion_usage}</Text>
          </Space>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={statusColor(record.status)}>{(record.status || 'unknown').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Assigned At',
      dataIndex: 'assigned_date',
      key: 'assigned_date',
      render: (value?: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: 'Used At',
      dataIndex: 'used_at',
      key: 'used_at',
      render: (value?: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              Customer&apos;s Promotion
            </Title>
            <Text type="secondary">Danh sách ưu đãi khách hàng</Text>
          </Col>
        </Row>

        <Row gutter={12} style={{ marginBottom: 16 }}>
          <Col>
            <Tag color="default">Total: {summary.total}</Tag>
          </Col>
          <Col>
            <Tag color="blue">Assigned: {summary.assigned}</Tag>
          </Col>
          <Col>
            <Tag color="green">Used: {summary.used}</Tag>
          </Col>
          <Col>
            <Tag color="red">Expired: {summary.expired}</Tag>
          </Col>
        </Row>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
};

export default VouchersPage;
