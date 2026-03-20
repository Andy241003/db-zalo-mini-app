import type { FC } from 'react';
import {
  DashboardOutlined,
  ShopOutlined,
  HomeOutlined,
  ToolOutlined,
  CustomerServiceOutlined,
  GiftOutlined,
  TrophyOutlined,
  TagOutlined,
  UserOutlined,
  CalendarOutlined,
  CrownOutlined,
  SettingOutlined,
  FileTextOutlined,
  TeamOutlined
} from '@ant-design/icons';

import { ReactComponent as AccountSvg } from '@/assets/menu/account.svg';
import { ReactComponent as DashboardSvg } from '@/assets/menu/dashboard.svg';
import { ReactComponent as DocumentationSvg } from '@/assets/menu/documentation.svg';
import { ReactComponent as GuideSvg } from '@/assets/menu/guide.svg';
import { ReactComponent as PermissionSvg } from '@/assets/menu/permission.svg';

interface CustomIconProps {
  type: string;
}

export const CustomIcon: FC<CustomIconProps> = props => {
  const { type } = props;

  // Use Ant Design icons for hotel management
  switch (type) {
    case 'dashboard':
      return <DashboardOutlined />;
    case 'shop':
      return <ShopOutlined />;
    case 'home':
      return <HomeOutlined />;
    case 'tool':
      return <ToolOutlined />;
    case 'service':
      return <CustomerServiceOutlined />;
    case 'gift':
      return <GiftOutlined />;
    case 'trophy':
      return <TrophyOutlined />;
    case 'tag':
      return <TagOutlined />;
    case 'user':
      return <UserOutlined />;
    case 'calendar':
      return <CalendarOutlined />;
    case 'crown':
      return <CrownOutlined />;
    case 'setting':
      return <SettingOutlined />;
    case 'team':
      return <TeamOutlined />;
    
    // Legacy SVG icons
    case 'guide':
      return <span className="anticon"><GuideSvg /></span>;
    case 'permission':
      return <span className="anticon"><PermissionSvg /></span>;
    case 'account':
      return <span className="anticon"><AccountSvg /></span>;
    case 'documentation':
      return <span className="anticon"><DocumentationSvg /></span>;
    
    default:
      return <FileTextOutlined />;
  }
};
