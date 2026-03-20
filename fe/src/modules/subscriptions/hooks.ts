import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put, del } from '../../utils/request';
import { message } from 'antd';

export interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly?: number;
  max_rooms: number;
  max_bookings_per_month: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanRequest {
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly?: number;
  max_rooms: number;
  max_bookings_per_month: number;
  features: string[];
  is_active: boolean;
}

export interface PlansQueryParams {
  page?: number;
  size?: number;
  search?: string;
  is_active?: boolean;
}

// Hook for fetching subscription plans
export function usePlansQuery(params: PlansQueryParams = {}) {
  const { page = 1, size = 10, ...filters } = params;
  const offset = (page - 1) * size;

  return useQuery({
    queryKey: ['subscription-plans', { offset, limit: size, ...filters }],
    queryFn: async (): Promise<{ data: SubscriptionPlan[]; total: number }> => {
      // Return empty data since backend endpoint doesn't exist
      return {
        data: [],
        total: 0,
      };
    },
    enabled: false, // Disable auto-fetch since backend doesn't exist
  });
}

// Hook for creating a subscription plan
export function useCreatePlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlanRequest) => {
      // Mock function since backend endpoint doesn't exist
      return Promise.resolve({} as SubscriptionPlan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      message.warning('Backend endpoint not available');
    },
    onError: (error: any) => {
      message.error('Backend endpoint not available');
    },
  });
}

// Hook for updating a subscription plan
export function useUpdatePlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreatePlanRequest> }) => {
      // Mock function since backend endpoint doesn't exist
      return Promise.resolve({} as SubscriptionPlan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      message.warning('Backend endpoint not available');
    },
    onError: (error: any) => {
      message.error('Backend endpoint not available');
    },
  });
}

// Hook for deleting a subscription plan
export function useDeletePlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      // Mock function since backend endpoint doesn't exist
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      message.warning('Backend endpoint not available');
    },
    onError: (error: any) => {
      message.error('Backend endpoint not available');
    },
  });
}
