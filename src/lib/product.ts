import { apiClient } from './api';

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface ProductFormData {
  category_id?: number;
  product_code: string;
  name: string;
  description?: string;
  tax_rate?: number;
  is_published?: boolean;
  published_at?: string;
  sort_order?: number;
  skus: SkuFormData[];
  images?: ImageFormData[];
}


export interface ProductImage {
  id: number;
  product_id: number;
  image_path: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductSku {
  id: number;
  product_id: number;
  sku_code: string;
  jan_code: string | null;
  size: string | null;
  color: string | null;
  other_attribute: string | null;
  price: number;
  cost_price: number | null;
  is_active: boolean;
  productName: string | null;
  available_quantity?: number | null;
}

export interface Product {
  id: number;
  category_id: number | null;
  product_code: string;
  name: string;
  description: string | null;
  tax_rate: number;
  is_published: boolean;
  published_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  images?: ProductImage[];
  skus?: ProductSku[];
}

export interface ProductSearchParams {
  search?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  sort_by?: 'created_at' | 'price_asc' | 'price_desc' | 'name';
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface SkuFormData {
  sku_code: string;
  jan_code?: string;
  size?: string;
  color?: string;
  other_attribute?: string;
  price: number;
  cost_price?: number;
  is_active?: boolean;
}

export interface ImageFormData {
  image_path: string;
  alt_text?: string | null;
  sort_order?: number;
  is_primary?: boolean;
}

export const productService = {
  /**
   * 商品一覧取得（検索・フィルタ対応）
   */
  async getProducts(params?: ProductSearchParams): Promise<{
    products: Product[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    const response = await apiClient.get('/api/products', { params });
    return response.data;
  },

  /**
   * 削除商品一覧取得
   */
  async getSoftDeletedItems(params?: ProductSearchParams): Promise<{
    products: Product[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    const response = await apiClient.get('/api/admin/products/trashed', { params });
    return response.data;
  },

  /**
   * 商品詳細取得
   */
  async getProduct(id: number): Promise<Product> {
    const response = await apiClient.get(`/api/products/${id}`);
    return response.data.product;
  },

  /**
   * 商品登録（管理者用）
   */
  async createProduct(data: any): Promise<Product> {
    const response = await apiClient.post('/api/products', data);
    return response.data.product;
  },

  /**
   * 商品更新（管理者用）
   */
  async updateProduct(id: number, data: any): Promise<Product> {
    const response = await apiClient.put(`/api/products/${id}`, data);
    return response.data.product;
  },

  /**
   * 商品削除（管理者用）
   */
  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(`/api/products/${id}`);
  },

  /**
   * 商品復元（管理者用）
   */
  async restoreProduct(id: number): Promise<Product> {
    const response = await apiClient.post(`/api/products/${id}/restore`, {});
    return response.data.product;
  },

  /**
   * SKU詳細取得
   */
  async getSku(productId: number, skuId: number): Promise<ProductSku> {
    const response = await apiClient.get(`/api/products/${productId}/skus/${skuId}`);
    return response.data.sku;
  },

  /**
   * SKU追加（複数対応）
   */
  async addSkus(productId: number, skus: SkuFormData[]): Promise<ProductSku[]> {
    const response = await apiClient.post(`/api/products/${productId}/skus`, { skus });
    return response.data.skus;
  },

  /**
   * SKU更新
   */
  async updateSku(productId: number, skuId: number, data: SkuFormData): Promise<ProductSku> {
    const response = await apiClient.put(`/api/products/${productId}/skus/${skuId}`, data);
    return response.data.sku;
  },

  /**
   * SKU削除
   */
  async deleteSku(productId: number, skuId: number): Promise<void> {
    await apiClient.delete(`/api/products/${productId}/skus/${skuId}`);
  },

  // ==================== 画像管理 ====================

  /**
   * 画像追加（複数対応）
   */
  async addImages(productId: number, images: ImageFormData[]): Promise<ProductImage[]> {
    const response = await apiClient.post(`/api/products/${productId}/images`, { images });
    return response.data.images;
  },

  /**
   * 画像更新
   */
  async updateImage(productId: number, imageId: number, data: ImageFormData): Promise<ProductImage> {
    const response = await apiClient.put(`/api/products/${productId}/images/${imageId}`, data);
    return response.data.image;
  },

  /**
   * 画像削除
   */
  async deleteImage(productId: number, imageId: number): Promise<void> {
    await apiClient.delete(`/api/products/${productId}/images/${imageId}`);
  },
};