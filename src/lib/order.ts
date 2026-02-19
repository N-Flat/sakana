import { apiClient } from './api';

// ========================================
// 型定義
// ========================================

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  product_sku_id: number | null;
  product_name: string;
  size: string | null;
  color: string | null;
  other_attribute: string | null;
  quantity: number;
  purchase_unit_price: number;
  purchase_tax_rate: number;
  purchase_subtotal: number;
  created_at: string;
  product?: {
    id: number;
    name: string;
    images?: { id: number; image_path: string; is_primary: boolean }[];
  };
  product_sku?: {
    id: number;
    sku_code: string;
  };
  shipped_quantity?: number;
  unshipped_quantity?: number;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  user_address_id: number | null;
  payment_method: string;
  order_date: string;
  status: string;
  subtotal: number;
  shipping_fee: number;
  total_price: number;
  shipping_name: string;
  shipping_name_kana: string | null;
  shipping_postal_code: string;
  shipping_prefecture: string;
  shipping_city: string;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_phone: string;
  note: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  items?: OrderItem[];
  shipments?: Shipment[];
}

export interface ShipmentItem {
  id: number;
  shipment_id: number;
  order_item_id: number;
  product_sku_id: number | null;
  quantity: number;
  picked_at: string | null;
  packed_at: string | null;
  order_item?: OrderItem;
  product_sku?: {
    id: number;
    sku_code: string;
  };
}

export interface Shipment {
  id: number;
  shipment_number: string;
  order_id: number;
  shipping_carrier: string | null;
  tracking_number: string | null;
  shipping_date: string | null;
  status: string;
  note: string | null;
  packed_by: number | null;
  shipped_by: number | null;
  created_at: string;
  updated_at: string;
  items?: ShipmentItem[];
  order?: Order;
  packer?: { id: number; name: string };
  shipper?: { id: number; name: string };
}

export interface OrderStatus {
  value: string;
  label: string;
}

export interface PaymentMethod {
  value: string;
  label: string;
}

export interface OrderSearchParams {
  status?: string;
  user_id?: number;
  order_number?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface CreateOrderData {
  address_id: number;
  payment_method: string;
  items: { product_sku_id: number; quantity: number }[];
  note?: string;
}

// ========================================
// APIサービス
// ========================================

export const orderService = {
  /**
   * ステータス一覧取得
   */
  async getStatuses(): Promise<OrderStatus[]> {
    const response = await apiClient.get('/api/orders/statuses');
    return response.data.statuses;
  },

  /**
   * 支払方法一覧取得
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await apiClient.get('/api/orders/payment-methods');
    return response.data.payment_methods;
  },

  /**
   * 注文一覧取得（管理者用）
   */
  async getOrders(params?: OrderSearchParams): Promise<{
    orders: Order[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    const response = await apiClient.get('/api/admin/orders', { params });
    return response.data;
  },

  /**
   * 自分の注文一覧取得（顧客用）
   */
  async getMyOrders(params?: { status?: string; per_page?: number; page?: number }): Promise<{
    orders: Order[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    const response = await apiClient.get('/api/orders/my', { params });
    return response.data;
  },

  /**
   * 注文詳細取得
   */
  async getOrder(id: number): Promise<Order> {
    const response = await apiClient.get(`/api/orders/${id}`);
    return response.data.order;
  },

  /**
   * 注文作成
   */
  async createOrder(data: CreateOrderData): Promise<Order> {
    const response = await apiClient.post('/api/orders', data);
    return response.data.order;
  },

  /**
   * 注文キャンセル
   */
  async cancelOrder(id: number): Promise<Order> {
    const response = await apiClient.post(`/api/orders/${id}/cancel`);
    return response.data.order;
  },

  /**
   * ステータス更新（管理者用）
   */
  async updateStatus(id: number, status: string): Promise<Order> {
    const response = await apiClient.patch(`/api/admin/orders/${id}/status`, { status });
    return response.data.order;
  },

  /**
   * 注文完了（管理者用）
   */
  async completeOrder(id: number): Promise<Order> {
    const response = await apiClient.post(`/api/admin/orders/${id}/complete`);
    return response.data.order;
  },
};