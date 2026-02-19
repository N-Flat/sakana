'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { productService, Product } from '@/lib/product';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts({
        per_page: 100,
      });
      setProducts(data.products);
    } catch (err: any) {
      setError(err.message || '商品の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getSoftDeletedItems({
        per_page: 100,
      });
      setProducts(data.products);
    } catch (err: any) {
      setError(err.message || '商品の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この商品を削除しますか？')) return;

    try {
      await productService.deleteProduct(id);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || '削除に失敗しました');
    }
  };

  const handleRestore = async (id: number) => {
    if (!confirm('商品を復元すると、紐づいた商品sku、画像も同時に復元されます。この商品を復元しますか？')) return;

    try {
      await productService.restoreProduct(id);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || '復元に失敗しました');
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
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>商品管理</CardTitle>
                <CardDescription>登録されている商品を管理できます</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={fetchProducts} variant={'outline'}>
                  商品一覧
                </Button>
                <Button onClick={fetchDeletedProducts} variant={'outline'}>
                  削除済み商品
                </Button>
                <Button onClick={() => router.push('/admin/products/new')}>
                  新規登録
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            商品が登録されていません
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => {
              const mainImage = product.images?.find(img => img.is_primary) || product.images?.[0];
              const minPrice = product.skus && product.skus.length > 0
                ? Math.min(...product.skus.map(sku => sku.price))
                : 0;

              return (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* 画像 */}
                      <div className="w-24 h-24 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        {mainImage ? (
                          <img
                            src={mainImage.image_path}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No Image
                          </div>
                        )}
                      </div>

                      {/* 商品情報 */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <p className="text-sm text-gray-600">
                          商品コード: {product.product_code}
                        </p>
                        <p className="text-sm text-gray-600">
                          カテゴリ: {product.category?.name || '未設定'}
                        </p>
                        <p className="text-lg font-bold mt-2">
                          ¥{minPrice.toLocaleString()}〜
                        </p>
                        <p className="text-xs text-gray-500">
                          SKU: {product.skus?.length || 0}件 | 
                          画像: {product.images?.length || 0}件 | 
                          {product.is_published ? (
                            <span className="text-green-600"> 公開中</span>
                          ) : (
                            <span className="text-red-600"> 非公開</span>
                          )}
                          {product.skus?.length ? (
                            <span className="text-green-600"></span>
                          ) : (
                            <span className="text-red-600"> | 削除済み商品</span>
                          )}
                        </p>
                      </div>

                      {/* アクション */}
                      {product.skus?.length ? (
                        <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                        >
                          詳細
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/products/${product.id}/skus`)}
                        >
                          SKU管理
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/products/${product.id}/images`)}
                        >
                          画像管理
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          削除
                        </Button>
                      </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(product.id)}
                        >
                          復元
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}