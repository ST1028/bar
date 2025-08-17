import { create } from 'zustand';
import type { CartItem } from '../types';

interface CartState {
  items: CartItem[];
  selectedPatronId: string | null;
  onItemAdded?: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (menuId: string) => void;
  updateQuantity: (menuId: string, quantity: number) => void;
  updateRemarks: (menuId: string, remarks: string) => void;
  clearCart: () => void;
  setSelectedPatronId: (patronId: string | null) => void;
  setOnItemAdded: (callback: () => void) => void;
  getTotalAmount: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  selectedPatronId: null,
  onItemAdded: undefined,
  
  addItem: (newItem) =>
    set((state) => {
      const existingItemIndex = state.items.findIndex(
        (item) => item.menuId === newItem.menuId
      );
      
      let updatedItems;
      if (existingItemIndex >= 0) {
        updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
      } else {
        updatedItems = [...state.items, newItem];
      }
      
      // Trigger animation callback if set
      if (state.onItemAdded) {
        state.onItemAdded();
      }
      
      return { items: updatedItems };
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
  
  setOnItemAdded: (callback) => set({ onItemAdded: callback }),
  
  getTotalAmount: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  },
  
  getItemCount: () => {
    const { items } = get();
    return items.reduce((count, item) => count + item.quantity, 0);
  },
}));