'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { inventoryService, InventoryAlert } from '@/lib/inventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function InventoryAlertsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getAlerts({
        unresolved: true,
        per_page: 100,
      });
      setAlerts(data.alerts);
    } catch (err: any) {
      setError(err.message || 'アラートの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: number) => {
    if (!confirm('このアラートを解決済みにしますか？')) return;

    try {
      await inventoryService.resolveAlert(id);
      fetchAlerts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'アラート解決に失敗しました');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/inventories')}
          className="mb-4"
        >
          ← 在庫一覧に戻る
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>在庫アラート</CardTitle>
            <CardDescription>未解決の在庫アラート一覧</CardDescription>
          </CardHeader>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        {alerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              未解決のアラートはありません
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className={
                alert.alert_type === 'out_of_stock' ? 'border-red-500' : 'border-yellow-500'
              }>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          alert.alert_type === 'out_of_stock'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {alert.alert_type === 'out_of_stock' ? '在庫切れ' : '在庫僅少'}
                        </span>
                      </div>

                      <h3 className="font-semibold text-lg">
                        {alert.inventory?.product_sku?.product?.name || '商品名なし'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        SKU: {alert.inventory?.product_sku?.sku_code}
                      </p>

                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-500">現在の在庫数</p>
                          <p className="text-xl font-bold text-red-600">
                            {alert.current_quantity}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">閾値</p>
                          <p className="text-xl font-bold text-gray-600">
                            {alert.threshold_quantity}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">アラート発生日時</p>
                          <p className="text-sm">
                            {new Date(alert.created_at).toLocaleString('ja-JP')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => router.push(`/admin/inventories/${alert.inventory_id}`)}
                      >
                        在庫詳細
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(alert.id)}
                      >
                        解決済み
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}