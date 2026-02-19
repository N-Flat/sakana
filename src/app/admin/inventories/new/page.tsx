'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { inventoryService } from '@/lib/inventory';
import { productService, ProductSku } from '@/lib/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NewInventoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [skus, setSkus] = useState<ProductSku[]>([]);
  const [selectedSkuId, setSelectedSkuId] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('0');
  const [safetyStock, setSafetyStock] = useState('0');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchSkus();
    }
  }, [user]);

  const fetchSkus = async () => {
    try {
      // 全商品を取得してSKUを抽出
      const data = await productService.getProducts({ per_page: 1000 });
      const allSkus: any[] = [];
      
      data.products.forEach(product => {
        if (product.skus) {
          product.skus.forEach(sku => {
            allSkus.push({
              ...sku,
              productName: product.name,  // ← 商品名を追加
            });
          });
        }
      });

      setSkus(allSkus);
    } catch (err) {
      console.error('SKU取得エラー:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await inventoryService.createInventory({
        product_sku_id: Number(selectedSkuId),
        initial_quantity: Number(initialQuantity),
        safety_stock: Number(safetyStock),
      });

      router.push('/admin/inventories');
      alert('在庫を登録しました');
    } catch (err: any) {
      setError(err.response?.data?.message || '在庫登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/inventories')}
          className="mb-4"
        >
          ← 在庫一覧に戻る
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>在庫レコード作成</CardTitle>
            <CardDescription>
              SKUに対して在庫レコードを手動で作成します
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
                {error}
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-4">
              ※ 通常はSKU作成時に自動で在庫レコードが作成されます。<br />
              この画面は既存SKUで在庫レコードがない場合の手動作成用です。
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sku">商品SKU *</Label>
                <Select value={selectedSkuId} onValueChange={setSelectedSkuId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="SKUを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {skus.map((sku) => (
                      <SelectItem key={sku.id} value={String(sku.id)}>
                        {sku.productName && `(${sku.productName})`}
                        {sku.size && ` (${sku.size})`}
                        {sku.color && ` (${sku.color})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initial_quantity">初期在庫数</Label>
                <Input
                  id="initial_quantity"
                  type="number"
                  value={initialQuantity}
                  onChange={(e) => setInitialQuantity(e.target.value)}
                  min="0"
                />
                <p className="text-xs text-gray-500">
                  在庫レコード作成時の初期在庫数（デフォルト: 0）
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="safety_stock">安全在庫数</Label>
                <Input
                  id="safety_stock"
                  type="number"
                  value={safetyStock}
                  onChange={(e) => setSafetyStock(e.target.value)}
                  min="0"
                />
                <p className="text-xs text-gray-500">
                  在庫がこの数値以下になるとアラートが発生します
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/inventories')}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !selectedSkuId}
                  className="flex-1"
                >
                  {loading ? '登録中...' : '登録'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}