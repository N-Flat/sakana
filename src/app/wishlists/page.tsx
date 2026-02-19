'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { wishlistService, Wishlist } from '@/lib/wishlist';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WishlistsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchWishlists();
    }
  }, [user]);

  const fetchWishlists = async () => {
    try {
      setLoading(true);
      const data = await wishlistService.getWishlists();
      setWishlists(data);
    } catch (err: any) {
      setError(err.message || 'お気に入りの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm('お気に入りから削除しますか？')) return;

    try {
      await wishlistService.removeFromWishlist(id);
      fetchWishlists();
    } catch (err: any) {
      alert(err.response?.data?.message || '削除に失敗しました');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price);
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
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>お気に入り</CardTitle>
            <CardDescription>保存した商品一覧</CardDescription>
          </CardHeader>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        {wishlists.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-gray-500 mb-4">お気に入りがありません</p>
              <Button onClick={() => router.push('/products')}>
                商品を探す
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {wishlists.map((wishlist) => {
              const product = wishlist.product!;
              const mainImage = product.images?.find(img => img.is_primary) || product.images?.[0];
              const sku = wishlist.productSku;

              return (
                <Card key={wishlist.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4 items-center">
                      {/* 商品画像 */}
                      <div
                        className="w-20 h-20 bg-gray-200 rounded flex-shrink-0 cursor-pointer overflow-hidden"
                        onClick={() => router.push(`/products/${product.id}`)}
                      >
                        {mainImage ? (
                          <img
                            src={mainImage.image_path}
                            alt={mainImage.alt_text || product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No Image
                          </div>
                        )}
                      </div>

                      {/* 商品情報 */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-semibold truncate cursor-pointer hover:text-blue-600"
                          onClick={() => router.push(`/products/${product.id}`)}
                        >
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {product.category?.name}
                          {sku && (
                            <span className="ml-2">
                              {[sku.size, sku.color].filter(Boolean).join(' / ')}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* 価格 */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold">
                          {sku ? formatPrice(sku.price) : '---'}
                        </p>
                      </div>

                      {/* 削除ボタン */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemove(wishlist.id)}
                      >
                        削除
                      </Button>
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