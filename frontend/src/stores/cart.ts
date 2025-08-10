import { create } from 'zustand';
import type { CartItem } from '../types';

interface CartState {
  items: CartItem[];
  selectedPatronId: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (menuId: string) => void;
  updateQuantity: (menuId: string, quantity: number) => void;
  updateRemarks: (menuId: string, remarks: string) => void;
  clearCart: () => void;
  setSelectedPatronId: (patronId: string | null) => void;
  getTotalAmount: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  selectedPatronId: null,
  
  addItem: (newItem) =>
    set((state) => {
      const existingItemIndex = state.items.findIndex(
        (item) => item.menuId === newItem.menuId
      );
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        return { items: updatedItems };
      }
      
      return { items: [...state.items, newItem] };
    }),
  
  removeItem: (menuId) =>
    set((state) => ({
      items: state.items.filter((item) => item.menuId !== menuId),
    })),
  
  updateQuantity: (menuId, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.menuId === menuId ? { ...item, quantity } : item
      ),
    })),
  
  updateRemarks: (menuId, remarks) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.menuId === menuId ? { ...item, remarks } : item
      ),
    })),
  
  clearCart: () => set({ items: [], selectedPatronId: null }),
  
  setSelectedPatronId: (patronId) => set({ selectedPatronId: patronId }),
  
  getTotalAmount: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  },
  
  getItemCount: () => {
    const { items } = get();
    return items.reduce((count, item) => count + item.quantity, 0);
  },
}));