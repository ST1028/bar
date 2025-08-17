export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  recipe?: string;
  thumbnail?: string;
  isRemarksRequired: boolean;
  categoryId: string;
  isActive?: boolean;
  availableBlends?: string[]; // Blend IDs that can be selected for this menu item
}

export interface MenuCategory {
  id: string;
  name: string;
  nameEn: string; // 英語表記（必須）
  order: number;
  thumbnail?: string;
  imageUrl?: string;
  isActive?: boolean;
  visible?: boolean;
  description?: string;
  items?: MenuItem[];
}

export interface Blend {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  order?: number;
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
  blendId?: string;
  blendName?: string;
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
  blendId?: string;
  blendName?: string;
}

export interface User {
  sub: string;
  email: string;
  groups: string[];
}