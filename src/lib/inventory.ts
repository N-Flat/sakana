import { apiClient } from './api';

export interface Inventory {
  id: number;
  product_sku_id: number;
  quantity: number;
  allocated_quantity: number;
  available_quantity: number;
  safety_stock: number;
  created_at: string;
  updated_at: string;
  product_sku?: {
    id: number;
    sku_code: string;
    size?: string;
    color?: string;
    price: number;
    product?: {
      id: number;
      name: string;
      product_code: string;
    };
  };
}

export interface InventoryTransaction {
  id: number;
  inventory_id: number;
  event_type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference_type?: string;
  reference_id?: number;
  performed_by?: number;
  note?: string;
  created_at: string;
  performer?: {
    id: number;
    name: string;
  };
}

export interface InventoryAlert {
  id: number;
  inventory_id: number;
  alert_type: string;
  threshold_quantity: number;
  current_quantity: number;
  is_resolved: boolean;
  resolved_at?: string;
  created_at: string;
  inventory?: Inventory;
}

export const inventoryService = {
  /**
   * 在庫一覧取得
   */
  async getInventories(params?: {
    status?: 'low_stock' | 'out_of_stock';
    sku_code?: string;
    per_page?: number;
    page?: number;
  }): Promise<{
    inventories: Inventory[];
    pagination: any;
  }> {
    const response = await apiClient.get('/api/inventories', { params });
    return response.data;
  },

  /**
   * 在庫レコード作成（手動）
   */
  async createInventory(data: {
    product_sku_id: number;
    initial_quantity?: number;
    safety_stock?: number;
  }): Promise<Inventory> {
    const response = await apiClient.post('/api/inventories', data);
    return response.data.inventory;
  },

  /**
   * 在庫詳細取得
   */
  async getInventory(id: number): Promise<Inventory> {
    const response = await apiClient.get(`/api/inventories/${id}`);
    return response.data.inventory;
  },

  /**
   * SKU別在庫取得
   */
  async getInventoryBySku(skuId: number): Promise<Inventory> {
    const response = await apiClient.get(`/api/inventories/sku/${skuId}`);
    return response.data.inventory;
  },

  /**
   * 在庫調整
   */
  async adjustInventory(data: {
    product_sku_id: number;
    quantity_change: number;
    note?: string;
  }): Promise<Inventory> {
    const response = await apiClient.post('/api/inventories/adjust', data);
    return response.data.inventory;
  },

  /**
   * 入庫処理
   */
  async receiveStock(data: {
    product_sku_id: number;
    quantity: number;
    note?: string;
  }): Promise<Inventory> {
    const response = await apiClient.post('/api/inventories/receive', data);
    return response.data.inventory;
  },

  /**
   * 安全在庫数更新
   */
  async updateSafetyStock(id: number, safetyStock: number): Promise<Inventory> {
    const response = await apiClient.put(`/api/inventories/${id}/safety-stock`, {
      safety_stock: safetyStock,
    });
    return response.data.inventory;
  },

  /**
   * トランザクション履歴取得
   */
  async getTransactions(inventoryId: number, params?: {
    event_type?: string;
    start_date?: string;
    end_date?: string;
    per_page?: number;
  }): Promise<{
    transactions: InventoryTransaction[];
    pagination: any;
  }> {
    const response = await apiClient.get(`/api/inventories/${inventoryId}/transactions`, { params });
    return response.data;
  },

  /**
   * アラート一覧取得
   */
  async getAlerts(params?: {
    unresolved?: boolean;
    alert_type?: string;
    per_page?: number;
  }): Promise<{
    alerts: InventoryAlert[];
    pagination: any;
  }> {
    const response = await apiClient.get('/api/inventory-alerts', { params });
    return response.data;
  },

  /**
   * アラート解決
   */
  async resolveAlert(id: number): Promise<void> {
    await apiClient.post(`/api/inventory-alerts/${id}/resolve`);
  },
};