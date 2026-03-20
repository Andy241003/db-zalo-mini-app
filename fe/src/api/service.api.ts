import { request } from './request';

// Interface for Service data based on backend schema
export interface Service {
  id: number;
  tenant_id: number;
  service_name: string;
  description?: string;
  price?: number;
  type?: string;
  image_url?: string;
  unit?: string;
  duration_minutes?: number;
  requires_schedule?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted?: number;
  deleted_at?: string;
  deleted_by?: string;
}

export interface ServiceCreate {
  service_name: string;
  description?: string;
  price?: number;
  type?: string;
  image_url?: string;
  unit?: string;
  duration_minutes?: number;
  requires_schedule?: boolean;
  created_by?: string;
  updated_by?: string;
}

export interface ServiceUpdate {
  service_name?: string;
  description?: string;
  price?: number;
  type?: string;
  image_url?: string;
  unit?: string;
  duration_minutes?: number;
  requires_schedule?: boolean;
  updated_by?: string;
}

/**
 * Get all services for a specific tenant.
 * @param tenantId - The ID of the tenant.
 * @returns A list of services.
 */
export const getServices = async (tenantId: number) => {
  try {
    const response = await request<Service[]>('get', `/services?tenant_id=${tenantId}`);

    // Backend returns direct array, not wrapped in response object
    if (Array.isArray(response)) {
      return { status: true, result: response };
    } else if (response && (response as any).data && Array.isArray((response as any).data)) {
      return { status: true, result: (response as any).data };
    } else {
      console.error('Unexpected response format:', response);
      return { status: false, result: [], message: 'Unexpected response format' };
    }
  } catch (error) {
    console.error('getServices API error:', error);
    throw error;
  }
};

/**
 * Create a new service for a specific tenant.
 * @param tenantId - The ID of the tenant.
 * @param data - The data for the new service.
 * @returns The newly created service.
 */
export const createService = async (tenantId: number, data: ServiceCreate) => {
  try {
    const response = await request<Service>('post', `/services?tenant_id=${tenantId}`, data);

    // Handle response format
    if (response && (response as any).id) {
      return { status: true, result: response as unknown as Service };
    } else if (response && (response as any).data && (response as any).data.id) {
      return { status: true, result: (response as any).data };
    } else {
      console.error('Unexpected create response format:', response);
      return { status: false, result: null, message: 'Failed to create service' };
    }
  } catch (error) {
    console.error('createService API error:', error);
    throw error;
  }
};

/**
 * Get a single service by its ID for a specific tenant.
 * @param tenantId - The ID of the tenant.
 * @param serviceId - The ID of the service.
 * @returns The service data.
 */
export const getServiceById = (tenantId: number, serviceId: number) => {
    return request<Service>('get', `/services/${serviceId}`, { tenant_id: tenantId });
};

/**
 * Update an existing service for a specific tenant.
 * @param tenantId - The ID of the tenant.
 * @param serviceId - The ID of the service to update.
 * @param data - The new data for the service.
 * @returns The updated service.
 */
export const updateService = (tenantId: number, serviceId: number, data: ServiceUpdate) => {
  return request<Service>('put', `/services/${serviceId}?tenant_id=${tenantId}`, data);
};

/**
 * Delete a service for a specific tenant.
 * @param tenantId - The ID of the tenant.
 * @param serviceId - The ID of the service to delete.
 */
export const deleteService = (tenantId: number, serviceId: number) => {
  return request('delete', `/services/${serviceId}?tenant_id=${tenantId}`);
};
