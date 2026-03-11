import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CartItem, Product } from '@/types/stackr';

interface CartContextType {
  items: CartItem[];
  storeId: string | null;
  addItem: (product: Product, qty: number, flavor: string | null) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  totalLBP: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'stackr_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const storeId = items.length > 0 ? items[0].product.store_id : null;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: Product, qty: number, flavor: string | null) => {
    setItems((prev) => {
      // If cart has items from a different store, clear it first
      if (prev.length > 0 && prev[0].product.store_id !== product.store_id) {
        return [{ product, quantity: qty, flavor }];
      }
      const existing = prev.find((i) => i.product.id === product.id && i.flavor === flavor);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && i.flavor === flavor
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, { product, quantity: qty, flavor }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalLBP = items.reduce((sum, i) => sum + i.product.price_lbp * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, storeId, addItem, removeItem, updateQty, clearCart, totalLBP, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
