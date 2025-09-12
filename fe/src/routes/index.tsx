import type { FC } from 'react';
import type { RouteObject } from 'react-router';

import { lazy } from 'react';
import { Navigate } from 'react-router';
import { useRoutes } from 'react-router-dom';

import Dashboard from '@/pages/dashboard';
import LayoutPage from '@/pages/layout';
import LoginPage from '@/pages/login';
import { withRole } from '@/router/withRole';

import WrapperRouteComponent from './config';

const NotFound = lazy(() => import(/* webpackChunkName: "404'"*/ '@/pages/404'));

// Hotel Management Pages
const RoomsList = lazy(() => import(/* webpackChunkName: "rooms"*/ '@/features/rooms/pages/RoomsList'));
const PromotionsList = lazy(() => import(/* webpackChunkName: "promotions"*/ '@/features/promotions/pages/PromotionsList'));
const HotelBrandsList = lazy(() => import(/* webpackChunkName: "hotel-brands"*/ '@/pages/business/hotel-brands'));
const FacilitiesList = lazy(() => import(/* webpackChunkName: "facilities"*/ '@/pages/business/facilities'));
const CustomersList = lazy(() => import(/* webpackChunkName: "customers"*/ '@/pages/business/customers'));
const VouchersList = lazy(() => import(/* webpackChunkName: "vouchers"*/ '@/pages/business/vouchers'));
const ServicesList = lazy(() => import(/* webpackChunkName: "services"*/ '@/pages/service/ServiceManagementSimple'));
const BookingRequestsList = lazy(() => import(/* webpackChunkName: "booking-requests"*/ '@/pages/business/booking-requests'));
const RoomStaysList = lazy(() => import(/* webpackChunkName: "room-stays"*/ '@/pages/business/room-stays'));
const ZaloTestPage = lazy(() => import(/* webpackChunkName: "zalo-test"*/ '@/pages/ZaloTestPage'));

const routeList: RouteObject[] = [
  {
    path: '/login',
    element: <WrapperRouteComponent element={<LoginPage />} titleId="title.login" />,
  },
  {
    path: '/',
    element: <WrapperRouteComponent element={<LayoutPage />} titleId="" auth />,
    children: [
      {
        path: 'services',
        element: <WrapperRouteComponent element={<ServicesList />} titleId="Dịch vụ" auth />,
      },
      {
        path: '',
        element: <Navigate to="dashboard" />,
      },
      {
        path: 'dashboard',
        element: <WrapperRouteComponent element={<Dashboard />} titleId="Dashboard" auth />,
      },
      
      // Hotel Management Routes
      {
        path: 'rooms',
        element: <WrapperRouteComponent element={<RoomsList />} titleId="Quản lý phòng" auth />,
      },
      {
        path: 'promotions',
        element: <WrapperRouteComponent element={<PromotionsList />} titleId="Quản lý khuyến mãi" auth />,
      },
      {
        path: 'hotel-brands',
        element: <WrapperRouteComponent element={<HotelBrandsList />} titleId="Thương hiệu khách sạn" auth />,
      },
      {
        path: 'facilities',
        element: <WrapperRouteComponent element={<FacilitiesList />} titleId="Tiện ích" auth />,
      },
      {
        path: 'customers',
        element: <WrapperRouteComponent element={<CustomersList />} titleId="Khách hàng" auth />,
      },
      {
        path: 'vouchers',
        element: <WrapperRouteComponent element={<VouchersList />} titleId="Phiếu giảm giá" auth />,
      },
      {
        path: 'booking-requests',
        element: <WrapperRouteComponent element={<BookingRequestsList />} titleId="Yêu cầu đặt phòng" auth />,
      },
      {
        path: 'room-stays',
        element: <WrapperRouteComponent element={<RoomStaysList />} titleId="Lưu trú" auth />,
      },
      {
        path: 'zalo-test',
        element: <WrapperRouteComponent element={<ZaloTestPage />} titleId="Zalo API Test" auth />,
      },
      // {
      //   path: 'facilities',
      //   element: <WrapperRouteComponent element={<FacilitiesList />} titleId="Tiện ích" auth />,
      // },
      // {
      //   path: 'vouchers',
      //   element: <WrapperRouteComponent element={<VouchersList />} titleId="Phiếu giảm giá" auth />,
      // },
      // {
      //   path: 'customers',
      //   element: <WrapperRouteComponent element={<CustomersList />} titleId="Khách hàng" auth />,
      // },
      // {
      //   path: 'room-stays',
      //   element: <WrapperRouteComponent element={<RoomStaysList />} titleId="Lưu trú" auth />,
      // },
      // {
      //   path: 'services',
      //   element: <WrapperRouteComponent element={<ServicesList />} titleId="Dịch vụ" auth />,
      // },
      // {
      //   path: 'service-bookings',
      //   element: <WrapperRouteComponent element={<ServiceBookingsList />} titleId="Đặt dịch vụ" auth />,
      // },
      // {
      //   path: 'booking-requests',
      //   element: <WrapperRouteComponent element={<BookingRequestsList />} titleId="Yêu cầu đặt phòng" auth />,
      // },
      // {
      //   path: 'games',
      //   element: <WrapperRouteComponent element={<GamesList />} titleId="Trò chơi" auth />,
      // },
      
      // Admin-only routes (super_admin)
      // {
      //   path: 'tenants',
      //   element: <WrapperRouteComponent element={<TenantsList />} titleId="Khách sạn" auth />,
      // },
      // {
      //   path: 'admin-users',
      //   element: <WrapperRouteComponent element={<AdminUsersList />} titleId="Quản trị viên" auth />,
      // },
      
      {
        path: '*',
        element: <WrapperRouteComponent element={<NotFound />} titleId="title.notFount" />,
      },
    ],
  },
];

const RenderRouter: FC = () => {
  const element = useRoutes(routeList);

  return element;
};

export default RenderRouter;
