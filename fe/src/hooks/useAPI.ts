import { useQuery } from '@tanstack/react-query';
import { hotelBrandAPI } from '../api/hotelBrand.api';
import { tenantsAPI } from '../api/tenants.api';
import { adminUsersAPI } from '../api/adminUsers.api';

// Hook to fetch hotel brands
export const useHotelBrands = (params?: any) => {
  return useQuery({
    queryKey: ['hotel-brands', params],
    queryFn: async () => {
      const data = await hotelBrandAPI.getAll(params);
      // Backend returns array, not paginated response
      return {
        items: Array.isArray(data) ? data : [],
        total: Array.isArray(data) ? data.length : 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Hook to fetch single hotel brand
export const useHotelBrand = (id: number) => {
  return useQuery({
    queryKey: ['hotel-brand', id],
    queryFn: () => hotelBrandAPI.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// Hook to fetch tenants (for super admin)
export const useTenants = (params?: any) => {
  return useQuery({
    queryKey: ['tenants', params],
    queryFn: () => tenantsAPI.getAll(params),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// Hook to fetch admin users
export const useAdminUsers = (params?: any) => {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: async () => {
      // Return empty data since backend GET endpoint doesn't exist
      return {
        items: [],
        total: 0,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: false, // Disable auto-fetch since backend doesn't have GET /admin-users/ endpoint
  });
};

// Hook to fetch dashboard stats
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        // Fetch multiple data in parallel
        const [hotelBrandsData, adminUsersData] = await Promise.all([
          hotelBrandAPI.getAll({ page: 1, page_size: 1 }),
          adminUsersAPI.getAll({ page: 1, page_size: 1 })
        ]);

        return {
          totalHotelBrands: Array.isArray(hotelBrandsData) ? hotelBrandsData.length : 0,
          totalAdminUsers: Array.isArray(adminUsersData) ? adminUsersData.length : 0,
        };
      } catch (error) {
        console.error('Dashboard stats error:', error);
        // Return default values on error
        return {
          totalHotelBrands: 0,
          totalAdminUsers: 0,
        };
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};
