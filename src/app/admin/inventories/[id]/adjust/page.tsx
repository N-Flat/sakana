'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { inventoryService, Inventory } from '@/lib/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function InventoryAdjustPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { user, loading: authLoading } = useAuth();

  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [quantityChange, setQuantityChange] = useState('');
  const [note, setNote] = useState('');

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
      await inventoryService.adjustInventory({
        product_sku_id: inventory!.product_sku_id,
        quantity_change: Number(quantityChange),
        note: note || undefined,
      });

      router.push(`/admin/inventories/${id}`);
      alert('在庫を調整しました');
    } catch (err: any) {
      setError(err.response?.data?.message || '在庫調整に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceive = async () => {
    if (!quantityChange || Number(quantityChange) <= 0) {
      alert('入庫数量を入力してください');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await inventoryService.receiveStock({
        product_sku_id: inventory!.product_sku_id,
        quantity: Number(quantityChange),
        note: note || undefined,
      });

      router.push(`/admin/inventories/${id}`);
      alert('入庫処理を完了しました');
    } catch (err: any) {
      setError(err.response?.data?.message || '入庫処理に失敗しました');
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
          className="mb-4"
        >
          ← 在庫詳細に戻る
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>在庫調整</CardTitle>
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
              <p className="text-sm text-gray-600">現在の在庫数</p>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <p className="text-xs text-gray-500">実在庫</p>
                  <p className="text-2xl font-bold">{inventory.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">引当済み</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {inventory.allocated_quantity}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">利用可能</p>
                  <p className="text-2xl font-bold text-green-600">
                    {inventory.available_quantity}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quantity_change">変動数量</Label>
                <Input
                  id="quantity_change"
                  type="number"
                  value={quantityChange}
                  onChange={(e) => setQuantityChange(e.target.value)}
                  required
                  placeholder="正の数で増加、負の数で減少"
                />
                <p className="text-xs text-gray-500">
                  例: +10 で10個増加、-5 で5個減少
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">備考</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="調整理由など"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? '処理中...' : '在庫調整'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReceive}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? '処理中...' : '入庫処理'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}