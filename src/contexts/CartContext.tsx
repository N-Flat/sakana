'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { cartService, CartItem, CartTotals } from '@/lib/cart';
import { useAuth } from '@/contexts/AuthContext';

interface CartContextType {
  items: CartItem[];
  totals: CartTotals;
  itemCount: number;
  loading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  fetchCount: () => Promise<void>;
  addItem: (productSkuId: number, quantity?: number) => Promise<boolean>;
  updateQuantity: (productSkuId: number, quantity: number) => Promise<boolean>;
  removeItem: (productSkuId: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  checkout: (addressId: number, paymentMethod: string, note?: string) => Promise<any>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const defaultTotals: CartTotals = {
  subtotal: 0,
  shipping_fee: 0,
  total_price: 0,
  item_count: 0,
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState<CartTotals>(defaultTotals);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // カート内容を取得
  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setTotals(defaultTotals);
      setItemCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await cartService.getCart();
      setItems(data.items);
      setTotals(data.totals);
      setItemCount(data.totals.item_count);
    } catch (err: any) {
      setError(err.message || 'カートの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // カート内商品数のみ取得（軽量）
  const fetchCount = useCallback(async () => {
    if (!user) {
      setItemCount(0);
      return;
    }

    try {
      const count = await cartService.getCount();
      setItemCount(count);
    } catch (err) {
      console.error('カート数取得エラー:', err);
    }
  }, [user]);

  // ログイン状態が変わったらカート数を取得
  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // カートに追加
  const addItem = useCallback(async (productSkuId: number, quantity: number = 1): Promise<boolean> => {
    try {
      setError(null);
      const data = await cartService.addItem(productSkuId, quantity);
      setItems(data.items);
      setTotals(data.totals);
      setItemCount(data.totals.item_count);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'カートへの追加に失敗しました');
      return false;
    }
  }, []);

  // 数量更新
  const updateQuantity = useCallback(async (productSkuId: number, quantity: number): Promise<boolean> => {
    try {
      setError(null);
      const data = await cartService.updateQuantity(productSkuId, quantity);
      setItems(data.items);
      setTotals(data.totals);
      setItemCount(data.totals.item_count);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || '数量の更新に失敗しました');
      return false;
    }
  }, []);

  // 削除
  const removeItem = useCallback(async (productSkuId: number): Promise<boolean> => {
    try {
      setError(null);
      const data = await cartService.removeItem(productSkuId);
      setItems(data.items);
      setTotals(data.totals);
      setItemCount(data.totals.item_count);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'カートからの削除に失敗しました');
      return false;
    }
  }, []);

  // クリア
  const clearCart = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const data = await cartService.clearCart();
      setItems(data.items);
      setTotals(data.totals);
      setItemCount(data.totals.item_count);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'カートのクリアに失敗しました');
      return false;
    }
  }, []);

  // 購入手続き
  const checkout = useCallback(async (addressId: number, paymentMethod: string, note?: string): Promise<any> => {
    try {
      setError(null);
      const data = await cartService.checkout(addressId, paymentMethod, note);
      // 成功したらカートをクリア
      setItems([]);
      setTotals(defaultTotals);
      setItemCount(0);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || '注文に失敗しました');
      throw err;
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        totals,
        itemCount,
        loading,
        error,
        fetchCart,
        fetchCount,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}