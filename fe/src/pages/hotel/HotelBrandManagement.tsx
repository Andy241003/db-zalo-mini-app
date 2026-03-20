import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Upload,
  message,
  Space,
  Divider,
  Typography,
  Tabs,
  Image,
  Modal,
  List,
  Tag,
  Spin,
  Alert,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
  SaveOutlined,
  ReloadOutlined,
  LinkOutlined,
  HomeOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  CameraOutlined,
  VideoCameraOutlined,
  BgColorsOutlined
} from '@ant-design/icons';
import { RcFile, UploadFile } from 'antd/es/upload/interface';
import { authStore } from '../../stores/authStore';
import { request } from '../../api/request';
import { ImageField } from '../../components/ImagePickerModal';

const HOST_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8889';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || `${HOST_ORIGIN}/api/v1`;

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface HotelBrand {
  id?: number;
  tenant_id?: number;
  hotel_name: string;
  slogan?: string;
  description?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  website_url?: string;
  phone_number?: string; // Backend field name
  email?: string;
  address?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  intro_video_url?: string;
  vr360_url?: string;
  business_license?: string;
  tax_code?: string;
  terms_url?: string;
  privacy_url?: string;
  // Additional fields from backend
  city?: string;
  country?: string;
  district?: string;
  postal_code?: string;
  google_map_url?: string;
  tiktok_url?: string;
  zalo_oa_id?: string;
  zalo_app_id?: string;
  zalo_secret_key?: string;
  copyright_text?: string;
  banner_images?: string; // This stores JSON string or text with URLs
  latitude?: number;
  longitude?: number;
}

interface HotelBrandManagementProps {
  onCancel?: () => void;
  onSave?: () => void;
}

const HotelBrandManagement: React.FC<HotelBrandManagementProps> = ({ onCancel, onSave }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [brandData, setBrandData] = useState<HotelBrand | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const isMountedRef = useRef(true);

  // Enhanced color palette with 50 colors organized by categories
  const colorPalette = [
    // Blues
    '#1890ff', '#2f54eb', '#597ef7', '#69c0ff', '#91d5ff',
    '#0050b3', '#003a8c', '#002766', '#40a9ff', '#85a5ff',
    
    // Greens  
    '#52c41a', '#73d13d', '#95de64', '#b7eb8f', '#d9f7be',
    '#389e0d', '#237804', '#135200', '#f6ffed', '#a7c957',
    
    // Oranges
    '#faad14', '#ffc53d', '#ffd666', '#ffe58f', '#fff1b8',
    '#d48806', '#ad6800', '#874d00', '#fff7e6', '#ffa940',
    
    // Reds
    '#f5222d', '#ff4d4f', '#ff7875', '#ffa39e', '#ffccc7',
    '#cf1322', '#a8071a', '#820014', '#fff1f0', '#fa541c',
    
    // Purples
    '#722ed1', '#9254de', '#b37feb', '#d3adf7', '#efdbff',
    '#531dab', '#391085', '#22075e', '#f9f0ff', '#eb2f96',
    
    // Cyans
    '#13c2c2', '#36cfc9', '#5cdbd3', '#87e8de', '#b5f5ec',
    '#08979c', '#006d75', '#00474f', '#e6fffb', '#1890ff',
    
    // Magentas
    '#eb2f96', '#f759ab', '#ff85c0', '#ffadd2', '#ffd6e7',
    '#c41d7f', '#9e1068', '#780650', '#fff0f6', '#fa8c16',
    
    // Grays
    '#8c8c8c', '#bfbfbf', '#d9d9d9', '#f0f0f0', '#fafafa',
    '#595959', '#434343', '#262626', '#1f1f1f', '#141414',
    
    // Pastels
    '#ffadd2', '#d3adf7', '#87e8de', '#b7eb8f', '#ffe58f',
    '#ffc0cb', '#e6e6fa', '#f0f8ff', '#f5fffa', '#fffacd',
    
    // Dark tones
    '#001529', '#2f3349', '#393f4f', '#4a5568', '#5a67d8'
  ];

  // Convert HEX to HSL
  const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const generateShades = (baseColor: string) => {
    if (!baseColor || !baseColor.startsWith('#')) return [];
    
    const hsl = hexToHsl(baseColor);
    const shades = [];
    
    // Generate 5 shades: lighter to darker
    for (let i = 0; i < 5; i++) {
      const lightness = Math.max(10, Math.min(90, hsl.l + (2 - i) * 15));
      const shade = hslToHex(hsl.h, hsl.s, lightness);
      shades.push(shade);
    }
    
    return shades;
  };

  // Convert HSL to HEX
  const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchBrandData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchBrandData = async () => {
    if (!isMountedRef.current) return;
    setLoading(true);
    try {
      const response: any = await request('get', '/hotel-brands/current');
      if (response && response.success && response.data && isMountedRef.current) {
        const brandData = response.data as HotelBrand;
        
        // Process banner_images for display (convert array to string)
        const formData = { ...brandData };
        if (formData.banner_images && Array.isArray(formData.banner_images)) {
          formData.banner_images = formData.banner_images.join('\n');
        }
        
        setBrandData(brandData); // Keep original data for save
        form.setFieldsValue(formData); // Set processed data for form display
      }
    } catch (error) {
      console.error('Error fetching brand data:', error);
      if (isMountedRef.current) {
        message.error('Không thể tải dữ liệu thương hiệu');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!isMountedRef.current) return;
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      // Process banner_images - convert string to array for backend
      const processedValues = { ...values };
      if (processedValues.banner_images && typeof processedValues.banner_images === 'string') {
        // Split by lines and filter out empty lines
        const urls = processedValues.banner_images
          .split('\n')
          .map((url: string) => url.trim())
          .filter((url: string) => url.length > 0);
        processedValues.banner_images = urls; // Send as array to backend
      }
      
      const payload = { ...brandData, ...processedValues };
      
      // Use the brand ID from current data for update
      if (brandData?.id) {
        const response: any = await request('put', `/hotel-brands/${brandData.id}`, payload);
        if (response && response.success && response.data && isMountedRef.current) {
          setBrandData(response.data as HotelBrand);
          message.success('Lưu thông tin thương hiệu thành công!');
          onSave?.(); // Call the callback
        }
      } else {
        // If no ID, create new brand
        const response: any = await request('post', '/hotel-brands', payload);
        if (response && response.success && response.data && isMountedRef.current) {
          setBrandData(response.data as HotelBrand);
          message.success('Tạo thương hiệu mới thành công!');
          onSave?.(); // Call the callback
        }
      }
    } catch (error) {
      console.error('Error saving brand data:', error);
      if (isMountedRef.current) {
        message.error('Không thể lưu thông tin thương hiệu');
      }
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  // Simple file upload validation
  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Chỉ có thể upload file ảnh!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Ảnh phải nhỏ hơn 2MB!');
    }
    return isImage && isLt2M;
  };

  // Real upload handlers using backend API
  const handleLogoUpload = ({ fileList }: { fileList: UploadFile[] }) => {
    if (fileList.length > 0) {
      const file = fileList[0];
      if (file.status === 'done' && file.response?.success && file.response?.data?.url) {
        // Real upload API returns URL
        const logoUrl = `${API_BASE_URL}${file.response.data.url}`;
        form.setFieldsValue({ logo_url: logoUrl });
        setBrandData(prev => prev ? { ...prev, logo_url: logoUrl } : null);
        message.success('Logo uploaded successfully');
      } else if (file.status === 'error') {
        message.error('Logo upload failed');
      }
    }
  };

  const ColorPickerWithPalette: React.FC<{
    value?: string;
    onChange?: (color: string) => void;
    label: string;
  }> = ({ value, onChange, label }) => {
    const [showShades, setShowShades] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const currentShades = generateShades(value || '#1890ff');
    const currentHsl = hexToHsl(value || '#1890ff');
    
    // Handle HSL slider changes
    const handleHslChange = (type: 'h' | 's' | 'l', newValue: number) => {
      const newHsl = { ...currentHsl, [type]: newValue };
      const newHex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
      onChange?.(newHex);
    };
    
    return (
      <div>
        <Text strong>{label}</Text>
        
        {/* Current Color Display */}
        <div style={{ 
          marginTop: 8, 
          marginBottom: 16,
          padding: 16,
          backgroundColor: value || '#ffffff',
          border: '2px solid #d9d9d9',
          borderRadius: 8,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s'
        }}
        onClick={() => copyToClipboard(value || '', 'Color')}
        >
          <Text style={{ 
            color: value && hexToHsl(value).l < 50 ? '#ffffff' : '#000000',
            fontWeight: 'bold',
            textShadow: '1px 1px 1px rgba(0,0,0,0.3)'
          }}>
            {value || 'Chọn màu'}
          </Text>
          <br />
          <Text style={{ 
            color: value && hexToHsl(value).l < 50 ? '#ffffff' : '#666666',
            fontSize: '12px'
          }}>
            Click để copy
          </Text>
        </div>

        {/* Hex Input */}
        <Input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="#1890ff"
          style={{ marginBottom: 16 }}
          addonBefore={
            <div
              style={{
                width: 20,
                height: 20,
                backgroundColor: value || '#ffffff',
                border: '1px solid #d9d9d9',
                borderRadius: 2,
              }}
            />
          }
          suffix={
            <Space>
              <Button 
                type="text" 
                size="small" 
                onClick={() => setShowShades(!showShades)}
              >
                {showShades ? 'Ẩn tông' : 'Tông màu'}
              </Button>
              <Button 
                type="text" 
                size="small" 
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Ẩn HSL' : 'HSL'}
              </Button>
            </Space>
          }
        />

        {/* HSL Sliders (when expanded) */}
        {showAdvanced && (
          <div style={{ marginBottom: 16, padding: 12, border: '1px solid #d9d9d9', borderRadius: 6 }}>
            <Text style={{ fontSize: '12px', color: '#666' }}>Điều chỉnh màu sắc (HSL):</Text>
            <div style={{ marginTop: 8 }}>
              <div style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: '11px' }}>Màu sắc (H): {currentHsl.h}°</Text>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={currentHsl.h}
                  onChange={(e) => handleHslChange('h', parseInt(e.target.value))}
                  style={{ 
                    width: '100%', 
                    background: `linear-gradient(to right, 
                      hsl(0, ${currentHsl.s}%, ${currentHsl.l}%),
                      hsl(60, ${currentHsl.s}%, ${currentHsl.l}%),
                      hsl(120, ${currentHsl.s}%, ${currentHsl.l}%),
                      hsl(180, ${currentHsl.s}%, ${currentHsl.l}%),
                      hsl(240, ${currentHsl.s}%, ${currentHsl.l}%),
                      hsl(300, ${currentHsl.s}%, ${currentHsl.l}%),
                      hsl(360, ${currentHsl.s}%, ${currentHsl.l}%))`,
                    height: 6,
                    borderRadius: 3
                  }}
                />
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: '11px' }}>Độ bão hòa (S): {currentHsl.s}%</Text>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentHsl.s}
                  onChange={(e) => handleHslChange('s', parseInt(e.target.value))}
                  style={{ 
                    width: '100%',
                    background: `linear-gradient(to right, 
                      hsl(${currentHsl.h}, 0%, ${currentHsl.l}%), 
                      hsl(${currentHsl.h}, 100%, ${currentHsl.l}%))`,
                    height: 6,
                    borderRadius: 3
                  }}
                />
              </div>
              <div>
                <Text style={{ fontSize: '11px' }}>Độ sáng (L): {currentHsl.l}%</Text>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentHsl.l}
                  onChange={(e) => handleHslChange('l', parseInt(e.target.value))}
                  style={{ 
                    width: '100%',
                    background: `linear-gradient(to right, 
                      hsl(${currentHsl.h}, ${currentHsl.s}%, 0%), 
                      hsl(${currentHsl.h}, ${currentHsl.s}%, 50%), 
                      hsl(${currentHsl.h}, ${currentHsl.s}%, 100%))`,
                    height: 6,
                    borderRadius: 3
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Color Shades (when expanded) */}
        {showShades && currentShades.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: '12px', color: '#666' }}>Các tone màu:</Text>
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {currentShades.map((shade, index) => (
                <Tooltip key={index} title={`Click để chọn tone ${index + 1}: ${shade}`}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      backgroundColor: shade,
                      borderRadius: 4,
                      cursor: 'pointer',
                      border: '1px solid #d9d9d9',
                      flex: 1
                    }}
                    onClick={() => {
                      onChange?.(shade);
                    }}
                  />
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        {/* Color Palette */}
        <div>
          <Text style={{ fontSize: '12px', color: '#666' }}>Bảng màu gợi ý:</Text>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(10, 1fr)', 
            gap: 4, 
            marginTop: 8 
          }}>
            {colorPalette.map((color, index) => (
              <Tooltip key={index} title={`${color} - Click để chọn`}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: color,
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: value === color ? '3px solid #1890ff' : '1px solid #d9d9d9',
                    transition: 'all 0.2s',
                    transform: value === color ? 'scale(1.1)' : 'scale(1)'
                  }}
                  onClick={() => onChange?.(color)}
                />
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Popular Color Categories */}
        <div style={{ marginTop: 16 }}>
          <Text style={{ fontSize: '12px', color: '#666' }}>Màu phổ biến:</Text>
          <Space wrap style={{ marginTop: 8 }}>
            {[
              { name: 'Xanh dương', color: '#1890ff' },
              { name: 'Xanh lá', color: '#52c41a' },
              { name: 'Cam', color: '#faad14' },
              { name: 'Đỏ', color: '#f5222d' },
              { name: 'Tím', color: '#722ed1' },
              { name: 'Hồng', color: '#eb2f96' }
            ].map((item, index) => (
              <Button
                key={index}
                size="small"
                style={{
                  backgroundColor: item.color,
                  color: hexToHsl(item.color).l < 50 ? '#ffffff' : '#000000',
                  border: 'none',
                  fontWeight: value === item.color ? 'bold' : 'normal'
                }}
                onClick={() => onChange?.(item.color)}
              >
                {item.name}
              </Button>
            ))}
          </Space>
        </div>
      </div>
    );
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(`${label} đã copy: ${text}`);
    });
  };

  // Tab items configuration for the new Tabs API
  const tabItems = [
    {
      key: 'basic',
      label: 'Thông tin cơ bản',
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="Thông tin thương hiệu" size="small">
              <Form.Item
                name="hotel_name"
                label="Tên khách sạn"
                rules={[{ required: true, message: 'Vui lòng nhập tên khách sạn' }]}
              >
                <Input size="large" placeholder="Nhập tên khách sạn" />
              </Form.Item>

              <Form.Item name="slogan" label="Slogan">
                <Input size="large" placeholder="Slogan ngắn gọn về khách sạn" />
              </Form.Item>

              <Form.Item name="description" label="Mô tả">
                <TextArea 
                  rows={4} 
                  placeholder="Mô tả chi tiết về khách sạn, dịch vụ và tiện ích..."
                />
              </Form.Item>

              <Form.Item name="website_url" label="Website">
                <Input 
                  size="large" 
                  placeholder="https://example.com"
                  addonBefore={<LinkOutlined />}
                />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Logo thương hiệu" size="small">
              <Form.Item name="logo_url" label="Logo chính">
                <ImageField folder="brands" placeholder="URL logo hoặc chọn ảnh bên dưới" />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'media',
      label: 'Media & VR360',
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="Banner & Slider" size="small">
              <div style={{ marginBottom: 16 }}>
                <Text strong>Banner chính & Slider ảnh</Text>
                <Form.Item name="banner_images" style={{ marginTop: 8 }}>
                  <Input.TextArea 
                    placeholder="Nhập các đường dẫn URL ảnh banner/slider (mỗi URL một dòng)" 
                    rows={6}
                  />
                </Form.Item>
                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                  💡 Mỗi URL ảnh trên một dòng. Ảnh đầu tiên sẽ là banner chính, các ảnh sau là slider. Ví dụ:
                  <br />
                  https://example.com/banner.jpg
                  <br />
                  https://example.com/slider1.jpg
                  <br />
                  https://example.com/slider2.jpg
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Media giới thiệu" size="small">
              <div style={{ marginBottom: 16 }}>
                <Text strong>Video giới thiệu</Text>
                <Form.Item name="intro_video_url">
                  <Input placeholder="URL video giới thiệu (YouTube, Vimeo...)" />
                </Form.Item>
              </div>

              <div style={{ marginBottom: 16 }}>
                <Text strong>Tour VR 360°</Text>
                <Form.Item name="vr360_url">
                  <Input placeholder="URL tour VR 360°" />
                </Form.Item>
              </div>

              <div>
                <Text strong>Ảnh khách sạn</Text>
                <Upload
                  name="gallery"
                  listType="picture-card"
                  multiple
                  showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
                  beforeUpload={beforeUpload}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload Ảnh</div>
                  </div>
                </Upload>
              </div>
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'theme',
      label: 'Màu sắc giao diện',
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="Màu sắc chính" size="small">
              <ColorPickerWithPalette
                value={brandData?.primary_color}
                onChange={(color) => setBrandData({ ...brandData!, primary_color: color })}
                label="Màu chủ đạo"
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Màu sắc phụ" size="small">
              <ColorPickerWithPalette
                value={brandData?.secondary_color}
                onChange={(color) => setBrandData({ ...brandData!, secondary_color: color })}
                label="Màu phụ"
              />
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'contact',
      label: 'Thông tin liên hệ',
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="Thông tin liên hệ" size="small">
              <Form.Item name="phone_number" label="Số điện thoại">
                <Input size="large" placeholder="+84 xxx xxx xxx" />
              </Form.Item>

              <Form.Item name="email" label="Email">
                <Input size="large" placeholder="contact@hotel.com" />
              </Form.Item>

              <Form.Item name="address" label="Địa chỉ">
                <TextArea rows={3} placeholder="Địa chỉ chi tiết của khách sạn" />
              </Form.Item>

              <Form.Item name="city" label="Thành phố">
                <Input size="large" placeholder="Hồ Chí Minh, Hà Nội..." />
              </Form.Item>

              <Form.Item name="district" label="Quận/Huyện">
                <Input size="large" placeholder="Quận 1, Quận Ba Đình..." />
              </Form.Item>

              <Form.Item name="postal_code" label="Mã bưu điện">
                <Input size="large" placeholder="70000, 10000..." />
              </Form.Item>

              <Form.Item name="country" label="Quốc gia">
                <Input size="large" placeholder="Việt Nam" defaultValue="Việt Nam" />
              </Form.Item>

              <Form.Item name="copyright_text" label="Copyright">
                <Input size="large" placeholder="© 2024 Hotel Name. All rights reserved." />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Mạng xã hội" size="small">
              <Form.Item name="facebook_url" label="Facebook">
                <Input size="large" placeholder="https://facebook.com/hotel" />
              </Form.Item>

              <Form.Item name="instagram_url" label="Instagram">
                <Input size="large" placeholder="https://instagram.com/hotel" />
              </Form.Item>

              <Form.Item name="twitter_url" label="Twitter">
                <Input size="large" placeholder="https://twitter.com/hotel" />
              </Form.Item>

              <Form.Item name="youtube_url" label="YouTube">
                <Input size="large" placeholder="https://youtube.com/hotel" />
              </Form.Item>

              <Form.Item name="tiktok_url" label="TikTok">
                <Input size="large" placeholder="https://tiktok.com/@hotel" />
              </Form.Item>

              <Form.Item name="zalo_oa_id" label="Zalo OA ID">
                <Input size="large" placeholder="ID trang Zalo Official Account" />
              </Form.Item>

              <Form.Item name="zalo_app_id" label="Zalo App ID">
                <Input size="large" placeholder="ID ứng dụng Zalo Mini App" />
              </Form.Item>

              <Form.Item
                name="zalo_secret_key"
                label="Zalo Secret Key"
                tooltip="App Secret lấy từ Zalo Developer Console — dùng để lấy số điện thoại người dùng"
              >
                <Input.Password size="large" placeholder="Secret Key của Zalo Mini App" />
              </Form.Item>

              <Form.Item name="google_map_url" label="Google Maps">
                <Input size="large" placeholder="Link Google Maps vị trí khách sạn" />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'legal',
      label: 'Thông tin pháp lý',
      children: (
        <Card title="Thông tin pháp lý & Chính sách" size="small">
          <Form.Item name="business_license" label="Giấy phép kinh doanh">
            <Input size="large" placeholder="Số giấy phép kinh doanh" />
          </Form.Item>

          <Form.Item name="tax_code" label="Mã số thuế">
            <Input size="large" placeholder="Mã số thuế" />
          </Form.Item>

          <Form.Item name="terms_url" label="Điều khoản sử dụng">
            <Input size="large" placeholder="URL trang điều khoản sử dụng" />
          </Form.Item>

          <Form.Item name="privacy_url" label="Chính sách bảo mật">
            <Input size="large" placeholder="URL trang chính sách bảo mật" />
          </Form.Item>
        </Card>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Đang tải thông tin thương hiệu...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>
          <EditOutlined /> Quản lý Thương hiệu & Giao diện
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchBrandData}>
            Làm mới
          </Button>
          {onCancel && (
            <Button onClick={onCancel}>
              Hủy
            </Button>
          )}
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            loading={saving}
            onClick={handleSave}
          >
            Lưu thay đổi
          </Button>
        </Space>
      </div>

      <Form 
        form={form} 
        layout="vertical" 
        onFinish={handleSave}
        onValuesChange={(changedValues, allValues) => {
          // Đồng bộ tất cả form values với brandData state
          setBrandData(prev => ({ ...prev, ...allValues }));
        }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Form>

      {/* Image Preview Modal */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default HotelBrandManagement;
