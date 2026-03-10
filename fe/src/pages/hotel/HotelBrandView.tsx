import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Image,
  Tag,
  Spin,
  Alert,
  Tooltip,
  Divider,
  Avatar,
  Descriptions,
  Empty,
  message
} from 'antd';
import {
  EditOutlined,
  ReloadOutlined,
  LinkOutlined,
  HomeOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  CameraOutlined,
  VideoCameraOutlined,
  BgColorsOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  YoutubeOutlined,
  FileTextOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { authStore } from '../../stores/authStore';
import { request } from '../../api/request';
import HotelBrandManagement from './HotelBrandManagement';

const { Title, Text, Paragraph } = Typography;

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
  copyright_text?: string;
  banner_images?: string;
  latitude?: number;
  longitude?: number;
}

const HotelBrandView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [brandData, setBrandData] = useState<HotelBrand | null>(null);
  const [editMode, setEditMode] = useState(false);
  const isMountedRef = useRef(true);

  const fetchBrandData = async () => {
    if (!isMountedRef.current) return;
    setLoading(true);
    try {
      const token = authStore.getState().token;
      const response: any = await request('get', '/hotel-brands/current', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('API Response:', response);

      if (response?.success && isMountedRef.current) {
        setBrandData(response.data);
      } else {
        throw new Error(response?.message || 'Không thể tải thông tin thương hiệu');
      }
    } catch (error: any) {
      console.error('Error fetching brand data:', error);
      if (isMountedRef.current) {
        message.error('Không thể tải thông tin thương hiệu: ' + (error.message || 'Lỗi không xác định'));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchBrandData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const renderSocialLink = (url: string | undefined, icon: React.ReactNode, platform: string) => {
    if (!url) return null;
    return (
      <Tooltip title={`${platform}: ${url}`}>
        <Button 
          type="link" 
          icon={icon} 
          href={url} 
          target="_blank"
          size="large"
          style={{ padding: '4px' }}
        >
          {platform}
        </Button>
      </Tooltip>
    );
  };

  const renderContactInfo = () => (
    <Card title="Thông tin liên hệ" size="small" className="mb-4">
      <Descriptions column={1} size="small">
        <Descriptions.Item 
          label={<><PhoneOutlined /> Điện thoại</>}
        >
          {brandData?.phone_number ? (
            <a href={`tel:${brandData.phone_number}`}>{brandData.phone_number}</a>
          ) : (
            <Text type="secondary">Chưa cập nhật</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item 
          label={<><MailOutlined /> Email</>}
        >
          {brandData?.email ? (
            <a href={`mailto:${brandData.email}`}>{brandData.email}</a>
          ) : (
            <Text type="secondary">Chưa cập nhật</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item 
          label={<><GlobalOutlined /> Website</>}
        >
          {brandData?.website_url ? (
            <a href={brandData.website_url} target="_blank" rel="noopener noreferrer">
              {brandData.website_url}
            </a>
          ) : (
            <Text type="secondary">Chưa cập nhật</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item 
          label={<><HomeOutlined /> Địa chỉ</>}
        >
          {brandData?.address || <Text type="secondary">Chưa cập nhật</Text>}
        </Descriptions.Item>
        {(brandData?.city || brandData?.district) && (
          <Descriptions.Item 
            label="Khu vực"
          >
            {[brandData?.district, brandData?.city].filter(Boolean).join(', ') || <Text type="secondary">Chưa cập nhật</Text>}
          </Descriptions.Item>
        )}
        {brandData?.google_map_url && (
          <Descriptions.Item 
            label="Bản đồ"
          >
            <a href={brandData.google_map_url} target="_blank" rel="noopener noreferrer">
              <Button type="link" icon={<GlobalOutlined />} size="small">
                Xem trên Google Maps
              </Button>
            </a>
          </Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  );

  const renderBusinessInfo = () => (
    <Card title="Thông tin doanh nghiệp" size="small" className="mb-4">
      <Descriptions column={1} size="small">
        <Descriptions.Item 
          label={<><FileTextOutlined /> Giấy phép kinh doanh</>}
        >
          {brandData?.business_license || <Text type="secondary">Chưa cập nhật</Text>}
        </Descriptions.Item>
        <Descriptions.Item 
          label={<><SafetyOutlined /> Mã số thuế</>}
        >
          {brandData?.tax_code || <Text type="secondary">Chưa cập nhật</Text>}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );

  const renderSocialMedia = () => {
    const socialLinks = [
      { url: brandData?.facebook_url, icon: <FacebookOutlined />, platform: 'Facebook' },
      { url: brandData?.instagram_url, icon: <InstagramOutlined />, platform: 'Instagram' },
      { url: brandData?.twitter_url, icon: <TwitterOutlined />, platform: 'Twitter' },
      { url: brandData?.youtube_url, icon: <YoutubeOutlined />, platform: 'YouTube' },
      { url: brandData?.tiktok_url, icon: <GlobalOutlined />, platform: 'TikTok' },
      { url: brandData?.zalo_oa_id, icon: <PhoneOutlined />, platform: 'Zalo OA' }
    ];

    return (
      <Card title="Mạng xã hội" size="small" className="mb-4">
        <Space wrap>
          {socialLinks.map((link, index) => (
            <div key={index}>
              {link.url ? (
                renderSocialLink(link.url, link.icon, link.platform)
              ) : (
                <Button 
                  type="link" 
                  icon={link.icon} 
                  disabled
                  size="large"
                  style={{ padding: '4px' }}
                >
                  {link.platform} (Chưa cập nhật)
                </Button>
              )}
            </div>
          ))}
        </Space>
      </Card>
    );
  };

  const renderMediaContent = () => (
    <Card title="Nội dung đa phương tiện" size="small" className="mb-4">
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong><VideoCameraOutlined /> Video giới thiệu:</Text>
          <br />
          {brandData?.intro_video_url ? (
            <Button 
              type="link" 
              href={brandData.intro_video_url} 
              target="_blank"
              icon={<LinkOutlined />}
            >
              Xem video
            </Button>
          ) : (
            <Text type="secondary">Chưa cập nhật</Text>
          )}
        </div>
        <div>
          <Text strong><CameraOutlined /> VR 360°:</Text>
          <br />
          {brandData?.vr360_url ? (
            <Button 
              type="link" 
              href={brandData.vr360_url} 
              target="_blank"
              icon={<LinkOutlined />}
            >
              Xem VR 360°
            </Button>
          ) : (
            <Text type="secondary">Chưa cập nhật</Text>
          )}
        </div>
      </Space>
    </Card>
  );

  const renderColorPalette = () => (
    <Card title="Bảng màu thương hiệu" size="small" className="mb-4">
      <Space>
        <div style={{ textAlign: 'center' }}>
          <div 
            style={{
              width: 60,
              height: 60,
              backgroundColor: brandData?.primary_color || '#d9d9d9',
              borderRadius: 8,
              border: '1px solid #d9d9d9',
              marginBottom: 8
            }}
          />
          <div>
            <Text strong>Màu chính</Text>
            <br />
            <Text type="secondary">
              {brandData?.primary_color || 'Chưa chọn'}
            </Text>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div 
            style={{
              width: 60,
              height: 60,
              backgroundColor: brandData?.secondary_color || '#f0f0f0',
              borderRadius: 8,
              border: '1px solid #d9d9d9',
              marginBottom: 8
            }}
          />
          <div>
            <Text strong>Màu phụ</Text>
            <br />
            <Text type="secondary">
              {brandData?.secondary_color || 'Chưa chọn'}
            </Text>
          </div>
        </div>
      </Space>
    </Card>
  );

  const renderPolicyLinks = () => {
    const hasPolicies = brandData?.terms_url || brandData?.privacy_url;
    if (!hasPolicies) return null;

    return (
      <Card title="Chính sách" size="small" className="mb-4">
        <Space>
          {brandData?.terms_url && (
            <Button 
              type="link" 
              href={brandData.terms_url} 
              target="_blank"
              icon={<FileTextOutlined />}
            >
              Điều khoản sử dụng
            </Button>
          )}
          {brandData?.privacy_url && (
            <Button 
              type="link" 
              href={brandData.privacy_url} 
              target="_blank"
              icon={<SafetyOutlined />}
            >
              Chính sách bảo mật
            </Button>
          )}
        </Space>
      </Card>
    );
  };

  if (editMode) {
    return (
      <HotelBrandManagement 
        onCancel={() => setEditMode(false)}
        onSave={() => {
          setEditMode(false);
          fetchBrandData(); // Refresh data after save
        }}
      />
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Title level={2} style={{ margin: 0 }}>
              <BgColorsOutlined /> Thông tin thương hiệu
            </Title>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchBrandData}
                loading={loading}
              >
                Làm mới
              </Button>
              <Button 
                type="primary" 
                icon={<EditOutlined />}
                onClick={() => setEditMode(true)}
              >
                Chỉnh sửa
              </Button>
            </Space>
          </Space>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Đang tải thông tin thương hiệu...</Text>
            </div>
          </div>
        ) : brandData ? (
          <Row gutter={[24, 24]}>
            {/* Left Column - Main Info */}
            <Col xs={24} lg={16}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {/* Brand Header */}
                <Card className="mb-4">
                  <Row gutter={16} align="middle">
                    <Col flex="none">
                      {brandData.logo_url ? (
                        <Avatar 
                          size={80} 
                          src={brandData.logo_url} 
                          style={{ backgroundColor: brandData.primary_color || '#1890ff' }}
                        />
                      ) : (
                        <Avatar 
                          size={80} 
                          style={{ 
                            backgroundColor: brandData.primary_color || '#1890ff',
                            fontSize: '28px'
                          }}
                        >
                          {brandData.hotel_name.charAt(0).toUpperCase()}
                        </Avatar>
                      )}
                    </Col>
                    <Col flex="auto">
                      <Title level={3} style={{ margin: 0, color: brandData.primary_color }}>
                        {brandData.hotel_name}
                      </Title>
                      <Text type="secondary" style={{ fontSize: '16px', fontStyle: 'italic' }}>
                        {brandData.slogan ? `"${brandData.slogan}"` : 'Slogan chưa được cập nhật'}
                      </Text>
                      <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                        {brandData.description || 'Mô tả khách sạn chưa được cập nhật'}
                      </Paragraph>
                    </Col>
                  </Row>
                </Card>

                {/* Contact Info */}
                {renderContactInfo()}

                {/* Social Media */}
                {renderSocialMedia()}

                {/* Media Content */}
                {renderMediaContent()}

                {/* Policy Links */}
                {renderPolicyLinks()}
              </Space>
            </Col>

            {/* Right Column - Additional Info */}
            <Col xs={24} lg={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {/* Color Palette */}
                {renderColorPalette()}

                {/* Business Info */}
                {renderBusinessInfo()}
              </Space>
            </Col>
          </Row>
        ) : (
          <Empty 
            description="Không có thông tin thương hiệu"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => setEditMode(true)}>
              Thiết lập thương hiệu
            </Button>
          </Empty>
        )}
      </Card>
    </div>
  );
};

export default HotelBrandView;
