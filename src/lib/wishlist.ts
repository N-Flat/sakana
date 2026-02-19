import { apiClient } from './api';
import { Product, ProductSku } from './product';

export interface Wishlist {
  id: number;
  user_id: number;
  product_id: number;
  product_sku_id: number | null;
  created_at: string;
  product?: Product;
  productSku?: ProductSku;
}

export const wishlistService = {
  /**
   * お気に入り一覧取得
   */
  async getWishlists(): Promise<Wishlist[]> {
    const response = await apiClient.get('/api/wishlists');
    return response.data.wishlists;
  },

  /**
   * お気に入り追加
   */
  async addToWishlist(productId: number, skuId?: number): Promise<Wishlist> {
    const response = await apiClient.post('/api/wishlists', {
      product_id: productId,
      product_sku_id: skuId || null,
    });
    return response.data.wishlist;
  },

  /**
   * お気に入り削除
   */
  async removeFromWishlist(id: number): Promise<void> {
    await apiClient.delete(`/api/wishlists/${id}`);
  },

  /**
   * お気に入り状態確認
   */
  async checkWishlist(productId: number, skuId?: number): Promise<boolean> {
    const response = await apiClient.get('/api/wishlists/check', {
      params: {
        product_id: productId,
        product_sku_id: skuId || null,
      },
    });
    return response.data.is_favorite;
  },
};