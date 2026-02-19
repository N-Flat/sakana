'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { inventoryService, Inventory, InventoryTransaction } from '@/lib/inventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function InventoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { user, loading: authLoading } = useAuth();

  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchInventory();
      fetchTransactions();
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

  const fetchTransactions = async () => {
    try {
      const data = await inventoryService.getTransactions(id, {
        per_page: 50,
      });
      setTransactions(data.transactions);
    } catch (err: any) {
      console.error('トランザクション取得エラー:', err);
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
      <div className="max-w-6xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/inventories')}
          className="mb-4"
        >
          ← 在庫一覧に戻る
        </Button>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        {/* 在庫情報 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {inventory.product_sku?.product?.name || '商品名なし'}
            </CardTitle>
            <CardDescription>
              SKU: {inventory.product_sku?.sku_code}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">実在庫</p>
                <p className="text-3xl font-bold">{inventory.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">引当済み</p>
                <p className="text-3xl font-bold text-orange-600">
                  {inventory.allocated_quantity}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">利用可能</p>
                <p className={`text-3xl font-bold ${
                  inventory.available_quantity <= 0 ? 'text-red-600' :
                  inventory.available_quantity <= inventory.safety_stock ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {inventory.available_quantity}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">安全在庫</p>
                <p className="text-3xl font-bold text-gray-600">
                  {inventory.safety_stock}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => router.push(`/admin/inventories/${id}/adjust`)}>
                在庫調整
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/inventories/${id}/safety-stock`)}
              >
                安全在庫設定
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* トランザクション履歴 */}
        <Card>
          <CardHeader>
            <CardTitle>在庫変動履歴</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">履歴がありません</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="border-l-4 border-gray-300 pl-4 py-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          {transaction.event_type === 'inbound' && '入庫'}
                          {transaction.event_type === 'outbound' && '出庫'}
                          {transaction.event_type === 'adjustment' && '在庫調整'}
                          {transaction.event_type === 'allocation' && '引当'}
                          {transaction.event_type === 'deallocation' && '引当解除'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {transaction.quantity_before} → {transaction.quantity_after}
                          {' '}
                          <span className={transaction.quantity_change >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ({transaction.quantity_change >= 0 ? '+' : ''}{transaction.quantity_change})
                          </span>
                        </p>
                        {transaction.note && (
                          <p className="text-sm text-gray-500 mt-1">
                            備考: {transaction.note}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          実行者: {transaction.performer?.name || 'システム'} |{' '}
                          {new Date(transaction.created_at).toLocaleString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}