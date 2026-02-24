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
   * ログイン（トークン取得）
   */
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await apiClient.post('/api/login', credentials);

    const { token, user } = response.data;

    // トークン保存
    localStorage.setItem('auth_token', token);

    return user;
  },

  /**
   * ログアウト
   */
  async logout(): Promise<void> {
    await apiClient.post('/api/logout');
    localStorage.removeItem('auth_token');
  },

  /**
   * 会員登録
   */
  async register(data: RegisterData): Promise<User> {
    const response = await apiClient.post('/api/register', data);

    const { token, user } = response.data;
    localStorage.setItem('auth_token', token);

    return user;
  },

  /**
   * 現在のユーザー取得
   */
  async getUser(): Promise<User | null> {
    try {
      const response = await apiClient.get('/api/user');
      return response.data.user;
    } catch {
      return null;
    }
  },
};
