import React, { useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  Row,
  Col,
  DatePicker,
  Switch,
} from 'antd';
import dayjs from 'dayjs';
import { useCreatePromotion, useUpdatePromotion } from '../hooks';
import type { Promotion } from '@/types';
import type { CreatePromotionRequest } from '../api';
import { ImageField } from '@/components/ImagePickerModal';

interface PromotionFormProps {
  open: boolean;
  promotion?: Promotion | null;
  onClose: () => void;
}

const PromotionForm: React.FC<PromotionFormProps> = ({ open, promotion, onClose }) => {
  const [form] = Form.useForm();
  const createMutation = useCreatePromotion();
  const updateMutation = useUpdatePromotion();

  const isEditing = !!promotion;
  const loading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (promotion) {
        form.setFieldsValue({
          ...promotion,
          start_date: dayjs(promotion.start_date),
          end_date: dayjs(promotion.end_date),
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, promotion, form]);

  const handleSubmit = async (values: any) => {
    try {
      const data: CreatePromotionRequest = {
        ...values,
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date.format('YYYY-MM-DD'),
        used_count: 0, // For new promotions
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: promotion!.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      
      onClose();
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  return (
    <Drawer
      title={isEditing ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi mới'}
      placement="right"
      onClose={onClose}
      open={open}
      width={600}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={() => form.submit()}
          >
            {isEditing ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'draft',
          discount_type: 'percentage',
        }}
      >
        <Form.Item
          name="title"
          label="Tiêu đề khuyến mãi"
          rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
        >
          <Input placeholder="VD: Giảm giá mùa hè 2024" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả"
        >
          <Input.TextArea rows={3} placeholder="Mô tả chi tiết về khuyến mãi..." />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="promo_code"
              label="Mã khuyến mãi"
            >
              <Input placeholder="VD: SUMMER2024" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
            >
              <Select
                options={[
                  { label: 'Nháp', value: 'draft' },
                  { label: 'Đang hoạt động', value: 'active' },
                  { label: 'Đã hết hạn', value: 'expired' },
                  { label: 'Đã tắt', value: 'disabled' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="discount_type"
              label="Loại giảm giá"
              rules={[{ required: true, message: 'Vui lòng chọn loại giảm giá' }]}
            >
              <Select
                options={[
                  { label: 'Phần trăm (%)', value: 'percentage' },
                  { label: 'Số tiền cố định', value: 'fixed_amount' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="discount_value"
              label="Giá trị giảm"
              rules={[{ required: true, message: 'Vui lòng nhập giá trị giảm' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                placeholder="50"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="max_discount_amount"
              label="Giảm tối đa (VND)"
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                placeholder="500000"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="start_date"
              label="Ngày bắt đầu"
              rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="end_date"
              label="Ngày kết thúc"
              rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="min_stay_nights"
              label="Số đêm tối thiểu"
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="usage_limit"
              label="Giới hạn sử dụng"
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="Để trống = không giới hạn" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="banner_image"
          label="Hình banner"
        >
          <ImageField folder="promotions" />
        </Form.Item>

        <Form.Item
          name="terms_conditions"
          label="Điều khoản và điều kiện"
        >
          <Input.TextArea
            rows={4}
            placeholder="Nhập điều khoản và điều kiện áp dụng..."
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default PromotionForm;
