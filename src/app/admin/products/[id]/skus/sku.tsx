'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { productService, Product, ProductSku } from '@/lib/product';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProductSkusPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);
  const { user, loading: authLoading } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // フォーム状態
  const [skuCode, setSkuCode] = useState('');
  const [janCode, setJanCode] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchProduct();
    }
  }, [user, productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await productService.getProduct(productId);
      setProduct(data);
    } catch (err: any) {
      setError(err.message || '商品の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSku = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiClient.post(`/api/products/${productId}/skus`, {
        skus: [{
          sku_code: skuCode,
          jan_code: janCode || null,
          size: size || null,
          color: color || null,
          price: Number(price),
          cost_price: costPrice ? Number(costPrice) : null,
          is_active: true,
        }]
      });

      // フォームリセット
      setSkuCode('');
      setJanCode('');
      setSize('');
      setColor('');
      setPrice('');
      setCostPrice('');
      setShowAddForm(false);

      fetchProduct();
      alert('SKUを追加しました');
    } catch (err: any) {
      alert(err.response?.data?.message || 'SKU追加に失敗しました');
    }
  };

  const handleDeleteSku = async (skuId: number) => {
    if (!confirm('このSKUを削除しますか？')) return;

    try {
      await apiClient.delete(`/api/products/${productId}/skus/${skuId}`);
      fetchProduct();
      alert('SKUを削除しました');
    } catch (err: any) {
      alert(err.response?.data?.message || 'SKU削除に失敗しました');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  if (!user || !product) return null;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/products')}
          className="mb-4"
        >
          ← 商品一覧に戻る
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>SKU管理: {product.name}</CardTitle>
            <CardDescription>商品コード: {product.product_code}</CardDescription>
          </CardHeader>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        {/* SKU追加フォーム */}
        {showAddForm ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>SKU追加</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSku} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku_code">SKUコード *</Label>
                    <Input
                      id="sku_code"
                      value={skuCode}
                      onChange={(e) => setSkuCode(e.target.value)}
                      required
                      placeholder="PROD-001-S-RED"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jan_code">JANコード</Label>
                    <Input
                      id="jan_code"
                      value={janCode}
                      onChange={(e) => setJanCode(e.target.value)}
                      placeholder="4901234567890"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">サイズ</Label>
                    <Input
                      id="size"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder="M"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">色</Label>
                    <Input
                      id="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="赤"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">価格 *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      placeholder="2980"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost_price">原価</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="1500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    キャンセル
                  </Button>
                  <Button type="submit">追加</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Button onClick={() => setShowAddForm(true)} className="mb-6">
            SKU追加
          </Button>
        )}

        {/* SKU一覧 */}
        <div className="space-y-4">
          {product.skus && product.skus.length > 0 ? (
            product.skus.map((sku) => (
              <Card key={sku.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">
                        {[sku.size, sku.color].filter(Boolean).join(' / ') || 'デフォルト'}
                      </p>
                      <p className="text-sm text-gray-600">SKU: {sku.sku_code}</p>
                      {sku.jan_code && (
                        <p className="text-sm text-gray-600">JAN: {sku.jan_code}</p>
                      )}
                      <p className="text-xl font-bold mt-2">
                        ¥{sku.price.toLocaleString()}
                      </p>
                      {sku.cost_price && (
                        <p className="text-sm text-gray-500">
                          原価: ¥{sku.cost_price.toLocaleString()}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {sku.is_active ? (
                          <span className="text-green-600">有効</span>
                        ) : (
                          <span className="text-red-600">無効</span>
                        )}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {/* <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/products/${productId}/skus/${sku.id}/edit`)}
                      >
                        編集
                      </Button> */}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteSku(sku.id)}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              SKUが登録されていません
            </div>
          )}
        </div>
      </div>
    </div>
  );
}