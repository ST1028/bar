export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  recipe?: string;
  thumbnail?: string;
  isRemarksRequired: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  order: number;
  thumbnail: string;
  isActive: boolean;
  items: MenuItem[];
}

export interface Patron {
  id: string;
  name: string;
  createdAt: string;
}

export interface OrderItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  remarks?: string;
}

export interface Order {
  id: string;
  patronId: string;
  patronName: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface CartItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  remarks?: string;
}

export interface User {
  sub: string;
  email: string;
  groups: string[];
}