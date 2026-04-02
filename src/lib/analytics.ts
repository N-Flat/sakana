import { apiClient } from './api';

// ========================================
// 型定義
// ========================================
export interface MonthlySales {
  total: number;
}

export interface MonthlyOrders {
  count: number;
}

export interface AlertCount {
  count: number;
}

// ========================================
// API
// ========================================
export const analyticsService = {
  /**
   * 今月の売上合計取得
   */
  async getThisMonthTotalSales(): Promise<MonthlySales> {
    const response = await apiClient.get('/api/admin/sales/monthly');
    return response.data;
  },

  /**
   * 今月の注文数取得
   */
  async getThisMonthTotalOrders(): Promise<MonthlyOrders> {
    const response = await apiClient.get('/api/admin/orders/monthly');
    return response.data;
  },

  /**
   * 在庫アラート一覧取得
   */
  async getTotalInventoryAlerts(): Promise<AlertCount> {
    const response = await apiClient.get('/api/admin/stock/alert');
    return response.data;
  },
};
