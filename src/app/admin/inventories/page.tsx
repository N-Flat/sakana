'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { inventoryService, Inventory } from '@/lib/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function InventoriesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [skuCode, setSkuCode] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchInventories();
    }
  }, [user, statusFilter]);

  const fetchInventories = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventories({
        status: statusFilter !== 'all' ? statusFilter as any : undefined,
        sku_code: skuCode || undefined,
        per_page: 100,
      });
      setInventories(data.inventories);
    } catch (err: any) {
      setError(err.message || '在庫の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventories();
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
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>在庫管理</CardTitle>
                <CardDescription>商品在庫の一覧と管理</CardDescription>
              </div>
              <Button onClick={() => router.push('/admin/inventories/new')}>
                在庫作成
              </Button>
              <Button onClick={() => router.push('/admin/inventories/alerts')}>
                アラート確認
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="SKUコードで検索"
                  value={skuCode}
                  onChange={(e) => setSkuCode(e.target.value)}
                  className="flex-1"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全て</SelectItem>
                    <SelectItem value="low_stock">在庫僅少</SelectItem>
                    <SelectItem value="out_of_stock">在庫切れ</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit">検索</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        {inventories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            在庫がありません
          </div>
        ) : (
          <div className="space-y-4">
            {inventories.map((inventory) => (
              <Card key={inventory.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {inventory.product_sku?.product?.name || '商品名なし'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        SKU: {inventory.product_sku?.sku_code}
                      </p>
                      {inventory.product_sku?.size && (
                        <p className="text-sm text-gray-600">
                          サイズ: {inventory.product_sku.size}
                        </p>
                      )}
                      {inventory.product_sku?.color && (
                        <p className="text-sm text-gray-600">
                          色: {inventory.product_sku.color}
                        </p>
                      )}

                      <div className="grid grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-500">実在庫</p>
                          <p className="text-xl font-bold">{inventory.quantity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">引当済み</p>
                          <p className="text-xl font-bold text-orange-600">
                            {inventory.allocated_quantity}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">利用可能</p>
                          <p className={`text-xl font-bold ${
                            inventory.available_quantity <= 0 ? 'text-red-600' :
                            inventory.available_quantity <= inventory.safety_stock ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {inventory.available_quantity}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">安全在庫</p>
                          <p className="text-xl font-bold text-gray-600">
                            {inventory.safety_stock}
                          </p>
                        </div>
                      </div>

                      {inventory.available_quantity <= 0 && (
                        <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mt-2">
                          在庫切れ
                        </span>
                      )}
                      {inventory.available_quantity > 0 && inventory.available_quantity <= inventory.safety_stock && (
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mt-2">
                          在庫僅少
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => router.push(`/admin/inventories/${inventory.id}`)}
                      >
                        詳細
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/inventories/${inventory.id}/adjust`)}
                      >
                        在庫調整
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