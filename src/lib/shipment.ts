import { apiClient } from './api';
import { Shipment, ShipmentItem } from './order';

// ========================================
// 型定義
// ========================================

export interface ShipmentStatus {
  value: string;
  label: string;
}

export interface ShipmentSearchParams {
  status?: string;
  order_id?: number;
  shipment_number?: string;
  tracking_number?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface CreateShipmentData {
  order_id: number;
  items: { order_item_id: number; quantity: number }[];
}

export interface ShipData {
  shipping_carrier?: string;
  tracking_number?: string;
}

// ========================================
// APIサービス
// ========================================

export const shipmentService = {
  /**
   * ステータス一覧取得
   */
  async getStatuses(): Promise<ShipmentStatus[]> {
    const response = await apiClient.get('/api/shipments/statuses');
    return response.data.statuses;
  },

  /**
   * 出荷一覧取得
   */
  async getShipments(params?: ShipmentSearchParams): Promise<{
    shipments: Shipment[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    const response = await apiClient.get('/api/admin/shipments', { params });
    return response.data;
  },

  /**
   * 出荷詳細取得
   */
  async getShipment(id: number): Promise<Shipment> {
    const response = await apiClient.get(`/api/admin/shipments/${id}`);
    return response.data.shipment;
  },

  /**
   * 追加出荷作成（部分出荷用）
   */
  async createShipment(data: CreateShipmentData): Promise<Shipment> {
    const response = await apiClient.post('/api/admin/shipments', data);
    return response.data.shipment;
  },

  /**
   * 明細ピッキング完了
   */
  async pickItem(itemId: number): Promise<ShipmentItem> {
    const response = await apiClient.post(`/api/admin/shipments/items/${itemId}/pick`);
    return response.data.shipment_item;
  },

  /**
   * 全明細ピッキング完了
   */
  async pickAll(shipmentId: number): Promise<Shipment> {
    const response = await apiClient.post(`/api/admin/shipments/${shipmentId}/pick-all`);
    return response.data.shipment;
  },

  /**
   * 梱包完了
   */
  async pack(shipmentId: number): Promise<Shipment> {
    const response = await apiClient.post(`/api/admin/shipments/${shipmentId}/pack`);
    return response.data.shipment;
  },

  /**
   * 発送処理
   */
  async ship(shipmentId: number, data?: ShipData): Promise<Shipment> {
    const response = await apiClient.post(`/api/admin/shipments/${shipmentId}/ship`, data || {});
    return response.data.shipment;
  },

  /**
   * 配達完了
   */
  async deliver(shipmentId: number): Promise<Shipment> {
    const response = await apiClient.post(`/api/admin/shipments/${shipmentId}/deliver`);
    return response.data.shipment;
  },

  /**
   * 配送情報更新
   */
  async updateTracking(shipmentId: number, data: ShipData): Promise<Shipment> {
    const response = await apiClient.patch(`/api/admin/shipments/${shipmentId}/tracking`, data);
    return response.data.shipment;
  },

  /**
   * 備考更新
   */
  async updateNote(shipmentId: number, note: string): Promise<Shipment> {
    const response = await apiClient.patch(`/api/admin/shipments/${shipmentId}/note`, { note });
    return response.data.shipment;
  },
};

export type { Shipment, ShipmentItem };