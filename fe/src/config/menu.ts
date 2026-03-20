import type { MenuList } from '@/interface/layout/menu.interface';
import { authStore } from '../stores/authStore';

export const getHotelMenuList = (): MenuList => {
  const role = authStore.getRole();
  const isSuperAdmin = authStore.isSuperAdmin();

  const menuList: MenuList = [
    {
      code: 'dashboard',
      label: {
        zh_CN: 'Dashboard',
        en_US: 'Dashboard', 
        vi_VN: role === 'HOTEL_ADMIN' ? 'Tổng quan Khách sạn' : 'Tổng quan',
      },
      icon: 'dashboard',
      path: '/dashboard',
    },
  ];

  // Super Admin only menu items - với submenu cho dashboard
  if (isSuperAdmin) {
    menuList.push(
      {
        code: 'super-admin',
        label: {
          zh_CN: '超级管理',
          en_US: 'Super Admin',
          vi_VN: 'Quản trị tổng',
        },
        icon: 'crown',
        path: '/super-admin',
        children: [
          {
            code: 'tenants-management',
            label: {
              zh_CN: '租户管理',
              en_US: 'Tenant Management',
              vi_VN: 'Quản lý khách sạn',
            },
            path: '/super-admin/tenants',
          },
          {
            code: 'admin-management',
            label: {
              zh_CN: '管理员管理',
              en_US: 'Admin Management', 
              vi_VN: 'Quản lý Admin',
            },
            path: '/super-admin/admins',
          },
          {
            code: 'system-activities',
            label: {
              zh_CN: '系统活动',
              en_US: 'System Activities',
              vi_VN: 'Lịch sử hoạt động',
            },
            path: '/super-admin/activities',
          },
          {
            code: 'system-config',
            label: {
              zh_CN: '系统配置',
              en_US: 'System Config',
              vi_VN: 'Cấu hình hệ thống',
            },
            path: '/super-admin/config',
          },
        ],
      },
    );
  }

  // Hotel Admin only menu items - quản lý thông tin liên quan đến tenant của họ
  if (role === 'HOTEL_ADMIN') {
    const hotelMenuItems = [
      {
        code: 'brand',
        label: {
          zh_CN: '酒店品牌',
          en_US: 'Hotel Brand',
          vi_VN: 'Thương hiệu khách sạn',
        },
        icon: 'shop',
        path: '/brand',
      },
      {
        code: 'rooms',
        label: {
          zh_CN: '房间管理',
          en_US: 'Rooms',
          vi_VN: 'Phòng',
        },
        icon: 'home',
        path: '/rooms',
      },
      {
        code: 'facilities',
        label: {
          zh_CN: '设施管理',
          en_US: 'Facilities',
          vi_VN: 'Tiện nghi',
        },
        icon: 'tool',
        path: '/facilities',
      },
      {
        code: 'services',
        label: {
          zh_CN: '服务管理',
          en_US: 'Services',
          vi_VN: 'Dịch vụ',
        },
        icon: 'service',
        path: '/services',
      },
      {
        code: 'promotions',
        label: {
          zh_CN: '促销管理',
          en_US: 'Promotions',
          vi_VN: 'Khuyến mãi',
        },
        icon: 'gift',
        path: '/promotions',
      },

      {
        code: 'vouchers',
        label: {
          zh_CN: '客户优惠',
          en_US: "Customer's Promotion",
          vi_VN: 'Ưu đãi khách hàng',
        },
        icon: 'tag',
        path: '/vouchers',
      },
      {
        code: 'customers',
        label: {
          zh_CN: '客户管理',
          en_US: 'Customers',
          vi_VN: 'Khách hàng',
        },
        icon: 'user',
        path: '/customers',
      },

    ];

    menuList.push(...hotelMenuItems);
  }

  return menuList;
};
