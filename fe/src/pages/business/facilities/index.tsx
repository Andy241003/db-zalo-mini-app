import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
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

  const handleDelete = async (facilityId: number) => {
    try {
      setLoading(true);
      const response = await deleteFacility(tenantId!, facilityId);
      if (response.status) {
        message.success('Facility deleted successfully');
        fetchFacilities();
      } else {
        throw new Error(response.message || 'Failed to delete facility');
      }
    } catch (error: any) {
      console.error('Error deleting facility:', error);
      message.error(error.message || 'Failed to delete facility');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Facility Name', dataIndex: 'facility_name', key: 'facility_name' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Facility) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm
            title="Are you sure to delete this facility?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAdd}
        style={{ marginBottom: 16 }}
      >
        Add Facility
      </Button>
      <Table
        columns={columns}
        dataSource={facilities}
        rowKey="id"
        loading={loading}
        bordered
      />
      <Modal
        title={editingFacility ? 'Edit Facility' : 'Add Facility'}
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
