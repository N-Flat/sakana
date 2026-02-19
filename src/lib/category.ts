import { apiClient } from './api';

export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parent?: Category;
  children?: Category[];
  products?: any[];
}

export interface CategoryFormData {
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  sort_order?: number;
  is_active?: boolean;
}

export const categoryService = {
  /**
   * カテゴリ一覧取得（階層構造）
   */
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get('/api/categories');
    return response.data.categories;
  },

  /**
   * 全カテゴリ取得（フラット）
   */
  async getAllCategories(): Promise<Category[]> {
    const response = await apiClient.get('/api/categories/all');
    return response.data.categories;
  },

  /**
   * アクティブなカテゴリ取得（公開用）
   */
  async getActiveCategories(): Promise<Category[]> {
    const response = await apiClient.get('/api/public/categories');
    return response.data.categories;
  },

  /**
   * カテゴリ詳細取得
   */
  async getCategory(id: number): Promise<Category> {
    const response = await apiClient.get(`/api/categories/${id}`);
    return response.data.category;
  },

  /**
   * カテゴリ作成
   */
  async createCategory(data: CategoryFormData): Promise<Category> {
    const response = await apiClient.post('/api/categories', data);
    return response.data.category;
  },

  /**
   * カテゴリ更新
   */
  async updateCategory(id: number, data: CategoryFormData): Promise<Category> {
    const response = await apiClient.put(`/api/categories/${id}`, data);
    return response.data.category;
  },

  /**
   * カテゴリ削除
   */
  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(`/api/categories/${id}`);
  },
};