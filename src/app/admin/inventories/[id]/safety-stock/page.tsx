'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { inventoryService, Inventory } from '@/lib/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SafetyStockPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { user, loading: authLoading } = useAuth();

  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [safetyStock, setSafetyStock] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchInventory();
    }
  }, [user, id]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventory(id);
      setInventory(data);
      setSafetyStock(String(data.safety_stock));
    } catch (err: any) {
      setError(err.message || '在庫の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await inventoryService.updateSafetyStock(id, Number(safetyStock));
      router.push(`/admin/inventories/${id}`);
      alert('安全在庫数を更新しました');
    } catch (err: any) {
      setError(err.response?.data?.message || '更新に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  if (!user || !inventory) return null;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/inventories/${id}`)}
          className="mb-4">← 在庫詳細に戻る</Button>
        <Card>
          <CardHeader>
            <CardTitle>安全在庫数設定</CardTitle>
            <CardDescription>
              {inventory.product_sku?.product?.name} - SKU: {inventory.product_sku?.sku_code}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
                {error}
              </div>
            )}

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">現在の設定</p>
              <p className="text-3xl font-bold">{inventory.safety_stock}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="safety_stock">新しい安全在庫数</Label>
                <Input
                  id="safety_stock"
                  type="number"
                  value={safetyStock}
                  onChange={(e) => setSafetyStock(e.target.value)}
                  required
                  min="0"
                />
                <p className="text-xs text-gray-500">
                  利用可能在庫がこの数値以下になるとアラートが発生します
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/admin/inventories/${id}`)}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? '更新中...' : '更新'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}