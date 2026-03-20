import React from 'react';
import { authStore } from '../stores/authStore';

// Route definitions with role-based access
export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  title: string;
  roles?: ('SUPER_ADMIN' | 'HOTEL_ADMIN')[];
  children?: RouteConfig[];
}

// Lazy imports for code splitting
const DashboardPage = React.lazy(() => import('../modules/dashboard/DashboardPage'));
const TenantsPage = React.lazy(() => import('../modules/tenants/TenantsPage'));
const PlansPage = React.lazy(() => import('../modules/subscriptions/PlansPage'));
const AdminUsersPage = React.lazy(() => import('../modules/admin-users/AdminUsersPage'));
const ProfilePage = React.lazy(() => import('../pages/profile/ProfilePage'));
const RoomsPage = React.lazy(() => import('../modules/rooms/RoomsPage'));
const FacilitiesPage = React.lazy(() => import('../modules/facilities/FacilitiesPage'));
const PromotionsPage = React.lazy(() => import('../modules/promotions/PromotionsPage'));
const VouchersPage = React.lazy(() => import('../modules/vouchers/VouchersPage'));
const CustomersPage = React.lazy(() => import('../modules/customers/CustomersPage'));
const BookingsPage = React.lazy(() => import('../modules/bookings/BookingsPage'));

// Default Dashboard with role-based routing
const DefaultDashboard = React.lazy(() => import('../pages/common/DefaultDashboard'));

// Hotel Management Components
const HotelBrandView = React.lazy(() => import('../pages/hotel/HotelBrandView'));
const BrandManagement = React.lazy(() => import('../pages/hotel/BrandManagement'));
const RoomManagement = React.lazy(() => import('../pages/hotel/RoomManagement'));
const FacilityManagement = React.lazy(() => import('../pages/hotel/FacilityManagement'));
const PromotionManagement = React.lazy(() => import('../pages/hotel/PromotionManagement'));
const ServiceManagement = React.lazy(() => import('../pages/business/services'));
const GameManagement = React.lazy(() => import('../pages/hotel/GameManagement'));
const CustomerAnalytics = React.lazy(() => import('../pages/hotel/CustomerAnalytics'));
const BookingManagement = React.lazy(() => import('../pages/hotel/BookingManagement'));

// Super Admin pages
const TenantsManagementPage = React.lazy(() => import('../pages/super-admin/TenantsManagementPage'));
const AdminManagementPage = React.lazy(() => import('../pages/super-admin/AdminManagementPage'));
const SystemActivitiesPage = React.lazy(() => import('../pages/super-admin/SystemActivitiesPage'));
const SystemConfigPage = React.lazy(() => import('../pages/super-admin/SystemConfigPage'));

export const routes: RouteConfig[] = [
  // Main Dashboard - role-based routing
  {
    path: '/dashboard',
    element: DefaultDashboard,
    title: 'Dashboard',
    roles: ['SUPER_ADMIN', 'HOTEL_ADMIN'],
  },
  // Individual Hotel Management pages
  {
    path: '/brand',
    element: HotelBrandView,
    title: 'Quản lý Thương hiệu & Giao diện',
    roles: ['HOTEL_ADMIN'],
  },
  {
    path: '/rooms',
    element: RoomManagement,
    title: 'Quản lý Phòng',
    roles: ['HOTEL_ADMIN'],
  },
  {
    path: '/facilities',
    element: FacilityManagement,
    title: 'Tiện ích & Dịch vụ',
    roles: ['HOTEL_ADMIN'],
  },
  {
    path: '/services',
    element: ServiceManagement,
    title: 'Quản lý Dịch vụ',
    roles: ['HOTEL_ADMIN'],
  },
  {
    path: '/promotions',
    element: PromotionManagement,
    title: 'Khuyến mãi & Voucher',
    roles: ['HOTEL_ADMIN'],
  },
  {
    path: '/games',
    element: GameManagement,
    title: 'Trò chơi may mắn',
    roles: ['HOTEL_ADMIN'],
  },
  {
    path: '/vouchers',
    element: VouchersPage,
    title: "Customer's Promotion",
    roles: ['HOTEL_ADMIN'],
  },
  {
    path: '/customers',
    element: CustomerAnalytics,
    title: 'Khách hàng & Báo cáo',
    roles: ['HOTEL_ADMIN'],
  },
  {
    path: '/bookings',
    element: BookingManagement,
    title: 'Quản lý Đặt phòng',
    roles: ['HOTEL_ADMIN'],
  },
  {
    path: '/tenants',
    element: TenantsPage,
    title: 'Tenant Management',
    roles: ['SUPER_ADMIN'],
  },
  // Super Admin Dashboard routes
  {
    path: '/super-admin/tenants',
    element: TenantsManagementPage,
    title: 'Quản lý khách sạn',
    roles: ['SUPER_ADMIN'],
  },
  {
    path: '/super-admin/admins',
    element: AdminUsersPage,
    title: 'Quản lý Admin Users',
    roles: ['SUPER_ADMIN'],
  },
  {
    path: '/super-admin/activities',
    element: SystemActivitiesPage,
    title: 'Lịch sử hoạt động',
    roles: ['SUPER_ADMIN'],
  },
  {
    path: '/super-admin/config',
    element: SystemConfigPage,
    title: 'Cấu hình hệ thống',
    roles: ['SUPER_ADMIN'],
  },
  // Commented out subscription-plans route since backend endpoint doesn't exist
  // {
  //   path: '/subscription-plans',
  //   element: PlansPage,
  //   title: 'Subscription Plans',
  //   roles: ['SUPER_ADMIN'],
  // },
  {
    path: '/profile',
    element: ProfilePage,
    title: 'Thông tin cá nhân',
    roles: ['SUPER_ADMIN', 'HOTEL_ADMIN'],
  },
  {
    path: '/admin-users',
    element: AdminUsersPage,
    title: 'Admin Users',
    roles: ['SUPER_ADMIN'],
  },
  {
    path: '/rooms',
    element: RoomsPage,
    title: 'Room Management',
    roles: ['HOTEL_ADMIN'], // Chỉ HOTEL_ADMIN quản lý rooms
  },
  {
    path: '/facilities',
    element: FacilitiesPage,
    title: 'Facilities',
    roles: ['HOTEL_ADMIN'], // Chỉ HOTEL_ADMIN quản lý facilities
  },
  {
    path: '/promotions',
    element: PromotionsPage,
    title: 'Promotion Management',
    roles: ['HOTEL_ADMIN'], // Chỉ HOTEL_ADMIN quản lý promotions
  },
  {
    path: '/vouchers',
    element: VouchersPage,
    title: "Customer's Promotion",
    roles: ['HOTEL_ADMIN'], // Chỉ HOTEL_ADMIN quản lý customer promotions
  },
  {
    path: '/customers',
    element: CustomersPage,
    title: 'Customer Management',
    roles: ['HOTEL_ADMIN'], // Chỉ HOTEL_ADMIN quản lý customers
  },
  {
    path: '/bookings',
    element: BookingsPage,
    title: 'Booking Management',
    roles: ['HOTEL_ADMIN'], // Chỉ HOTEL_ADMIN quản lý bookings
  },
];

// Route guard HOC
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: ('SUPER_ADMIN' | 'HOTEL_ADMIN')[]
) {
  return function GuardedComponent(props: P) {
    const currentRole = authStore.getRole();
    
    if (!currentRole || !allowedRoles.includes(currentRole)) {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}

// Filter routes based on current user role
export function getAccessibleRoutes(): RouteConfig[] {
  const currentRole = authStore.getRole();
  if (!currentRole) return [];
  
  return routes.filter(route => 
    !route.roles || route.roles.includes(currentRole)
  );
}
