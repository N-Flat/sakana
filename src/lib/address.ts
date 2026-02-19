import { apiClient } from './api';

export interface Address {
  id: number;
  user_id: number;
  address_type: 'home' | 'office' | 'other';
  is_default: boolean;
  recipient_name: string;
  recipient_name_kana?: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line1: string;
  address_line2?: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface AddressFormData {
  recipient_name: string;
  recipient_name_kana?: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line1: string;
  address_line2?: string;
  phone: string;
  address_type?: 'home' | 'office' | 'other';
  is_default?: boolean;
}

export const addressService = {
  /**
   * 住所一覧取得
   */
  async getAddresses(): Promise<Address[]> {
    const response = await apiClient.get('/api/addresses');
    return response.data.addresses;
  },

  /**
   * 住所詳細取得
   */
  async getAddress(id: number): Promise<Address> {
    const response = await apiClient.get(`/api/addresses/${id}`);
    return response.data.address;
  },

  /**
   * デフォルト住所取得
   */
  async getDefaultAddress(): Promise<Address | null> {
    try {
      const response = await apiClient.get('/api/addresses/default');
      return response.data.address;
    } catch (error) {
      return null;
    }
  },

  /**
   * 住所登録
   */
  async createAddress(data: AddressFormData): Promise<Address> {
    const response = await apiClient.post('/api/addresses', data);
    return response.data.address;
  },

  /**
   * 住所更新
   */
  async updateAddress(id: number, data: AddressFormData): Promise<Address> {
    const response = await apiClient.put(`/api/addresses/${id}`, data);
    return response.data.address;
  },

  /**
   * 住所削除
   */
  async deleteAddress(id: number): Promise<void> {
    await apiClient.delete(`/api/addresses/${id}`);
  },

  /**
   * デフォルト変更
   */
  async setDefaultAddress(id: number): Promise<Address> {
    const response = await apiClient.put(`/api/addresses/${id}/default`, {});
    return response.data.address;
  },
};
