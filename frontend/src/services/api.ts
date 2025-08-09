import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { MenuCategory, Patron, Order, CartItem } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    if (session.tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${session.tokens.accessToken}`;
    }
  } catch (error) {
    console.error('Failed to get auth session:', error);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const menuAPI = {
  getMenus: async (): Promise<MenuCategory[]> => {
    const response = await apiClient.get<{ categories: MenuCategory[] }>('/menus');
    return response.data.categories;
  },
};

export const patronAPI = {
  getPatrons: async (): Promise<Patron[]> => {
    const response = await apiClient.get<{ patrons: Patron[] }>('/patrons');
    return response.data.patrons;
  },
  
  createPatron: async (name: string): Promise<Patron> => {
    const response = await apiClient.post<{ patron: Patron }>('/patrons', { name });
    return response.data.patron;
  },
  
  updatePatron: async (patronId: string, name: string): Promise<Patron> => {
    const response = await apiClient.patch<{ patron: Patron }>(`/patrons/${patronId}`, { name });
    return response.data.patron;
  },
};

export const orderAPI = {
  getOrders: async (patronId?: string): Promise<Order[]> => {
    const params = patronId ? { patronId } : {};
    const response = await apiClient.get<{ orders: Order[] }>('/orders', { params });
    return response.data.orders;
  },
  
  createOrder: async (patronId: string, items: CartItem[]): Promise<Order> => {
    const orderItems = items.map((item) => ({
      menuId: item.menuId,
      quantity: item.quantity,
      remarks: item.remarks || '',
    }));
    
    const response = await apiClient.post<{ order: Order }>('/orders', {
      patronId,
      items: orderItems,
    });
    return response.data.order;
  },
};

export const adminAPI = {
  resetUserData: async (tenantId: string): Promise<void> => {
    await apiClient.post('/admin/reset', { tenantId });
  },
};