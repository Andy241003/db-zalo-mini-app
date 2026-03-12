import React, { useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Button,
  Space,
  Row,
  Col,
  message,
} from 'antd';
import { useCreateRoom, useUpdateRoom } from '../hooks';
import { ImageField } from '@/components/ImagePickerModal';
import type { Room } from '@/types';
import type { CreateRoomRequest } from '../api';

interface RoomFormProps {
  open: boolean;
  room?: Room | null;
  onClose: () => void;
}

const RoomForm: React.FC<RoomFormProps> = ({ open, room, onClose }) => {
  const [form] = Form.useForm();
  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom();

  const isEditing = !!room;
  const loading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (room) {
        form.setFieldsValue({
          ...room,
          amenities: room.amenities?.join(', ') || '',
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, room, form]);

  const handleSubmit = async (values: any) => {
    try {
      const data: CreateRoomRequest = {
        ...values,
        amenities: values.amenities 
          ? values.amenities.split(',').map((item: string) => item.trim()).filter(Boolean)
          : [],
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: room!.id, data });
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
      title={isEditing ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
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
          has_balcony: false,
          has_kitchen: false,
          status: 'available',
          room_type: 'standard',
          capacity_adults: 2,
          capacity_children: 0,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="room_name"
              label="Tên phòng"
              rules={[{ required: true, message: 'Vui lòng nhập tên phòng' }]}
            >
              <Input placeholder="VD: Phòng Superior 101" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="room_type"
              label="Loại phòng"
              rules={[{ required: true, message: 'Vui lòng chọn loại phòng' }]}
            >
              <Select
                options={[
                  { label: 'Tiêu chuẩn', value: 'standard' },
                  { label: 'Cao cấp', value: 'deluxe' },
                  { label: 'Suite', value: 'suite' },
                  { label: 'Gia đình', value: 'family' },
                  { label: 'Tổng thống', value: 'presidential' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Mô tả"
        >
          <Input.TextArea rows={3} placeholder="Mô tả chi tiết về phòng..." />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="price"
              label="Giá (VND)"
              rules={[{ required: true, message: 'Vui lòng nhập giá phòng' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                placeholder="500000"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="capacity_adults"
              label="Số người lớn"
              rules={[{ required: true, message: 'Vui lòng nhập số người lớn' }]}
            >
              <InputNumber min={1} max={10} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="capacity_children"
              label="Số trẻ em"
            >
              <InputNumber min={0} max={5} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="size_sqm"
              label="Diện tích (m²)"
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="view_type"
              label="Hướng view"
            >
              <Select
                allowClear
                placeholder="Chọn hướng view"
                options={[
                  { label: 'Biển', value: 'sea' },
                  { label: 'Thành phố', value: 'city' },
                  { label: 'Vườn', value: 'garden' },
                  { label: 'Núi', value: 'mountain' },
                  { label: 'Hồ bơi', value: 'pool' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
            >
              <Select
                options={[
                  { label: 'Có sẵn', value: 'available' },
                  { label: 'Đã thuê', value: 'occupied' },
                  { label: 'Bảo trì', value: 'maintenance' },
                  { label: 'Hỏng hóc', value: 'out_of_order' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="has_balcony" valuePropName="checked" label="Có ban công">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="has_kitchen" valuePropName="checked" label="Có bếp">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="image_url"
          label="Hình ảnh phòng"
        >
          <ImageField folder="rooms" />
        </Form.Item>

        <Form.Item
          name="amenities"
          label="Tiện nghi (cách nhau bằng dấu phẩy)"
        >
          <Input.TextArea
            rows={2}
            placeholder="VD: WiFi miễn phí, Minibar, Két an toàn, Máy sấy tóc"
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default RoomForm;
