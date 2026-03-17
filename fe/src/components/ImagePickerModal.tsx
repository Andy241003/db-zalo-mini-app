import React, { useState } from 'react';
import {
  Modal, Tabs, Upload, Button, message, Spin, Empty, Input, Space,
} from 'antd';
import { UploadOutlined, PictureOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '../api/request';
import { authStore } from '../stores/authStore';

const HOST_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8889';
const envApiUrl = (import.meta.env.VITE_API_BASE_URL as string) || '';
const API_BASE_URL = envApiUrl || `${HOST_ORIGIN}/api/v1`; // used for listing/upload endpoints
const UPLOAD_BASE_URL = envApiUrl ? envApiUrl.replace(/\/api\/?$/, '') : HOST_ORIGIN;

// ─── Standalone modal ────────────────────────────────────────────────────────

interface ImagePickerModalProps {
  open: boolean;
  folder: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  open, folder, onSelect, onClose,
}) => {
  const queryClient = useQueryClient();

  const { data: filesData, isLoading } = useQuery({
    queryKey: ['uploaded-images', folder],
    queryFn: () => request('get', `/upload/list?folder=${folder}&file_type=image`),
    enabled: open,
  });

  const files: any[] = (filesData as any)?.data?.files ?? [];

  const handleUploadChange = (info: any) => {
    if (info.file.status === 'done' && info.file.response?.success) {
      const url = `${API_BASE_URL}${info.file.response.data.url}`;
      message.success('Upload thành công!');
      queryClient.invalidateQueries({ queryKey: ['uploaded-images', folder] });
      onSelect(url);
      onClose();
    } else if (info.file.status === 'error') {
      message.error('Upload thất bại, thử lại.');
    }
  };

  return (
    <Modal
      title="Chọn ảnh"
      open={open}
      onCancel={onClose}
      footer={null}
      width={780}
      destroyOnClose
    >
      <Tabs
        defaultActiveKey="library"
        items={[
          {
            key: 'library',
            label: 'Thư viện ảnh đã upload',
            children: isLoading ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <Spin size="large" />
              </div>
            ) : files.length === 0 ? (
              <Empty description="Chưa có ảnh nào trong thư mục này" style={{ padding: '40px 0' }} />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 12,
                  maxHeight: 420,
                  overflowY: 'auto',
                  padding: 4,
                }}
              >
                {files.map((file: any) => (
                  <div
                    key={file.filename}
                    onClick={() => { onSelect(`${API_BASE_URL}${file.url}`); onClose(); }}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '2px solid #f0f0f0',
                      transition: 'border-color 0.2s, transform 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1890ff';
                      e.currentTarget.style.transform = 'scale(1.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#f0f0f0';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <img
                      src={`${API_BASE_URL}${file.url}`}
                      alt={file.filename}
                      style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f5f5f5"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">?</text></svg>'; }}
                    />
                  </div>
                ))}
              </div>
            ),
          },
          {
            key: 'upload',
            label: 'Upload ảnh mới',
            children: (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <Upload
                  name="file"
                  action={`${API_BASE_URL}/api/v1/upload/image`}
                  data={{ folder }}
                  headers={{ Authorization: `Bearer ${authStore.getToken()}` }}
                  accept="image/*"
                  showUploadList={false}
                  onChange={handleUploadChange}
                >
                  <Button icon={<UploadOutlined />} size="large" type="primary">
                    Chọn ảnh từ máy tính
                  </Button>
                </Upload>
                <div style={{ marginTop: 16, color: '#aaa', fontSize: 13 }}>
                  Hỗ trợ JPG, PNG, GIF, WebP&nbsp;·&nbsp;Tối đa 10 MB
                </div>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
};

// ─── Form-compatible field wrapper ───────────────────────────────────────────

interface ImageFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  folder: string;
  placeholder?: string;
}

export const ImageField: React.FC<ImageFieldProps> = ({
  value,
  onChange,
  folder,
  placeholder = 'Nhập URL hoặc chọn ảnh bên dưới',
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {value && (
        <img
          src={value}
          alt="preview"
          style={{
            width: '100%',
            maxHeight: 130,
            objectFit: 'cover',
            borderRadius: 6,
            border: '1px solid #f0f0f0',
          }}
        />
      )}
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        allowClear
      />
      <Button
        block
        icon={<PictureOutlined />}
        onClick={() => setPickerOpen(true)}
      >
        Chọn / Upload ảnh
      </Button>
      <ImagePickerModal
        open={pickerOpen}
        folder={folder}
        onSelect={(url) => { onChange?.(url); setPickerOpen(false); }}
        onClose={() => setPickerOpen(false)}
      />
    </Space>
  );
};

export default ImagePickerModal;
