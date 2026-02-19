'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, totals, loading, error, fetchCart, updateQuantity, removeItem, clearCart } = useCart();
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user, fetchCart]);

  const handleQuantityChange = async (productSkuId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setActionLoading(productSkuId);
    await updateQuantity(productSkuId, newQuantity);
    setActionLoading(null);
  };

  const handleRemove = async (productSkuId: number) => {
    if (!confirm('この商品をカートから削除しますか？')) return;
    setActionLoading(productSkuId);
    await removeItem(productSkuId);
    setActionLoading(null);
  };

  const handleClear = async () => {
    if (!confirm('カートを空にしますか？')) return;
    await clearCart();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price);
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
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>ショッピングカート</CardTitle>
                <CardDescription>
                  {totals.item_count > 0
                    ? `${totals.item_count}点の商品`
                    : 'カートは空です'}
                </CardDescription>
              </div>
              {items.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleClear}>
                  カートを空にする
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">読み込み中...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">カートに商品がありません</p>
              <Button onClick={() => router.push('/products')}>
                商品を探す
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 商品リスト */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.product_sku_id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* 商品画像 */}
                      <div className="w-24 h-24 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                        {item.product.main_image ? (
                          <img
                            src={item.product.main_image.image_path}
                            alt={item.product.main_image.alt_text || item.product.name}
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
                        <h3
                          className="font-medium hover:text-blue-600 cursor-pointer"
                          onClick={() => router.push(`/products/${item.product.id}`)}
                        >
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {item.sku.size && `サイズ: ${item.sku.size}`}
                          {item.sku.color && ` / カラー: ${item.sku.color}`}
                          {item.sku.other_attribute && ` / ${item.sku.other_attribute}`}
                        </p>
                        <p className="text-sm text-gray-400">
                          SKU: {item.sku.sku_code}
                        </p>

                        {/* 在庫警告 */}
                        {!item.is_available && (
                          <p className="text-sm text-red-600 mt-1">
                            ※ 在庫が不足しています（在庫: {item.available_quantity}個）
                          </p>
                        )}
                      </div>

                      {/* 価格・数量 */}
                      <div className="text-right">
                        <p className="font-bold">
                          {formatPrice(item.sku.price * (1 + item.product.tax_rate / 100) * item.quantity)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatPrice(item.sku.price)} × {item.quantity}
                        </p>

                        <div className="flex items-center gap-2 mt-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.product_sku_id, item.quantity - 1)}
                            disabled={actionLoading === item.product_sku_id || item.quantity <= 1}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.product_sku_id, Number(e.target.value))}
                            className="w-16 text-center"
                            min="1"
                            max={item.available_quantity}
                            disabled={actionLoading === item.product_sku_id}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.product_sku_id, item.quantity + 1)}
                            disabled={actionLoading === item.product_sku_id || item.quantity >= item.available_quantity}
                          >
                            +
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 mt-2"
                          onClick={() => handleRemove(item.product_sku_id)}
                          disabled={actionLoading === item.product_sku_id}
                        >
                          削除
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 注文サマリー */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">ご注文内容</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>小計</span>
                      <span>{formatPrice(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>送料</span>
                      <span>{formatPrice(totals.shipping_fee)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>合計</span>
                      <span>{formatPrice(totals.total_price)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => router.push('/checkout')}
                    disabled={items.some(item => !item.is_available)}
                  >
                    レジに進む
                  </Button>

                  {items.some(item => !item.is_available) && (
                    <p className="text-sm text-red-600 text-center">
                      在庫不足の商品があります
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}