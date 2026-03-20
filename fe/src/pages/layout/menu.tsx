import type { MenuList } from '../../interface/layout/menu.interface';
import type { FC } from 'react';

import { Menu } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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

import { setUserItem } from '@/stores/user.store';

interface MenuProps {
  menuList: MenuList;
  openKey?: string;
  onChangeOpenKey: (key?: string) => void;
  selectedKey: string;
  onChangeSelectedKey: (key: string) => void;
}

const MenuComponent: FC<MenuProps> = props => {
  const { menuList, openKey, onChangeOpenKey, selectedKey, onChangeSelectedKey } = props;
  const { device, locale } = useSelector(state => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const getIconByType = (iconType: string) => {
    switch (iconType) {
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
      default:
        return <FileTextOutlined />;
    }
  };

  const getTitle = (menu: MenuList[0]) => {
    return (
      <span style={{ display: 'flex', alignItems: 'center' }}>
        {getIconByType(menu.icon!)}
        <span>{menu.label[locale]}</span>
      </span>
    );
  };

  const onMenuClick = (path: string) => {
    onChangeSelectedKey(path);
    navigate(path);

    if (device !== 'DESKTOP') {
      dispatch(setUserItem({ collapsed: true }));
    }
  };

  const onOpenChange = (keys: string[]) => {
    const key = keys.pop();

    onChangeOpenKey(key);
  };

  return (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      openKeys={openKey ? [openKey] : []}
      onOpenChange={onOpenChange}
      onSelect={k => onMenuClick(k.key)}
      className="layout-page-sider-menu text-2"
      items={menuList.map(menu => {
        return menu.children
          ? {
              key: menu.code,
              label: getTitle(menu),
              children: menu.children.map(child => ({
                key: child.path,
                label: child.label[locale],
              })),
            }
          : {
              key: menu.path,
              label: getTitle(menu),
            };
      })}
    ></Menu>
  );
};

export default MenuComponent;
