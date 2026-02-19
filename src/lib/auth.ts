// src/lib/auth.ts
import { apiClient } from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  name_kana?: string;
  gender: string;
  birthday: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
}

export const authService = {
  /**
   * CSRFトークンを取得
   */
  async getCsrfToken() {
    await apiClient.get('/sanctum/csrf-cookie');
  },

  /**
   * ログイン
   */
  async login(credentials: LoginCredentials): Promise<User> {
    await this.getCsrfToken();
    const response = await apiClient.post('/api/login', credentials);
    return response.data.user;
  },

  /**
   * ログアウト
   */
  async logout(): Promise<void> {
    await apiClient.post('/api/logout');
  },

  /**
   * 会員登録
   */
  async register(data: RegisterData): Promise<User> {
    await this.getCsrfToken();
    const response = await apiClient.post('/api/register', data);
    return response.data.user;
  },

  /**
   * 現在のユーザー情報取得
   */
  async getUser(): Promise<User | null> {
    try {
      const response = await apiClient.get('/api/user');
      return response.data.user;
    } catch (error) {
      return null;
    }
  },
};