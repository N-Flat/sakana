import { apiClient } from './api';

// ========================================
// 型定義
// ========================================

export interface CartItemProduct {
  id: number;
  name: string;
  product_code: string;
  tax_rate: number;
  category: {
    id: number;
    name: string;
  } | null;
  main_image: {
    image_path: string;
    alt_text: string | null;
  } | null;
}

export interface CartItemSku {
  id: number;
  sku_code: string;
  price: number;
  size: string | null;
  color: string | null;
  other_attribute: string | null;
}

export interface CartItem {
  product_sku_id: number;
  quantity: number;
  product: CartItemProduct;
  sku: CartItemSku;
  available_quantity: number;
  is_available: boolean;
}

export interface CartTotals {
  subtotal: number;
  shipping_fee: number;
  total_price: number;
  item_count: number;
}

export interface CartResponse {
  items: CartItem[];
  totals: CartTotals;
}

// ========================================
// APIサービス
// ========================================

export const cartService = {
  /**
   * カート内容取得
   */
  async getCart(): Promise<CartResponse> {
    const response = await apiClient.get('/api/cart');
    return response.data;
  },

  /**
   * カート内商品数のみ取得（ナビ用）
   */
  async getCount(): Promise<number> {
    const response = await apiClient.get('/api/cart/count');
    return response.data.count;
  },

  /**
   * 商品をカートに追加
   */
  async addItem(productSkuId: number, quantity: number = 1): Promise<CartResponse> {
    const response = await apiClient.post('/api/cart/add', {
      product_sku_id: productSkuId,
      quantity,
    });
    return response.data;
  },

  /**
   * カート内商品の数量を更新
   */
  async updateQuantity(productSkuId: number, quantity: number): Promise<CartResponse> {
    const response = await apiClient.put('/api/cart/update', {
      product_sku_id: productSkuId,
      quantity,
    });
    return response.data;
  },

  /**
   * 商品をカートから削除
   */
  async removeItem(productSkuId: number): Promise<CartResponse> {
    const response = await apiClient.delete('/api/cart/remove', {
      data: { product_sku_id: productSkuId },
    });
    return response.data;
  },

  /**
   * カートをクリア
   */
  async clearCart(): Promise<CartResponse> {
    const response = await apiClient.delete('/api/cart/clear');
    return response.data;
  },

  /**
   * 購入手続き（注文確定）
   */
  async checkout(addressId: number, paymentMethod: string, note?: string): Promise<any> {
    const response = await apiClient.post('/api/cart/checkout', {
      address_id: addressId,
      payment_method: paymentMethod,
      note,
    });
    return response.data;
  },
};