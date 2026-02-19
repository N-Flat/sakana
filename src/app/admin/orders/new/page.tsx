'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { orderService, PaymentMethod } from '@/lib/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CartItem {
  product_sku_id: string;
  quantity: string;
}

export default function AdminOrderCreatePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [addressId, setAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<CartItem[]>([
    { product_sku_id: '', quantity: '1' }
  ]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    try {
      const data = await orderService.getPaymentMethods();
      setPaymentMethods(data);
    } catch (err) {
      console.error('支払方法取得エラー:', err);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { product_sku_id: '', quantity: '1' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof CartItem, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!addressId) {
      setError('配送先住所IDを入力してください');
      return;
    }

    const validItems = items.filter(item => item.product_sku_id && item.quantity);
    if (validItems.length === 0) {
      setError('商品を1つ以上入力してください');
      return;
    }

    setLoading(true);

    try {
      const order = await orderService.createOrder({
        address_id: Number(addressId),
        payment_method: paymentMethod,
        items: validItems.map(item => ({
          product_sku_id: Number(item.product_sku_id),
          quantity: Number(item.quantity),
        })),
        note: note || undefined,
      });

      alert(`注文を作成しました: ${order.order_number}`);
      router.push(`/admin/orders/${order.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || '注文作成に失敗しました');
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
          onClick={() => router.push('/admin/orders')}
          className="mb-4"
        >
          ← 注文一覧に戻る
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>テスト注文作成</CardTitle>
            <CardDescription>
              デバッグ用：SKU IDと住所IDを手入力して注文を作成します
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
                {error}
              </div>
            )}

            <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 mb-4">
              ※ このページはテスト用です。実際の注文はカート経由で作成されます。
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 配送先住所ID */}
              <div className="space-y-2">
                <Label htmlFor="address_id">配送先住所ID *</Label>
                <Input
                  id="address_id"
                  type="number"
                  value={addressId}
                  onChange={(e) => setAddressId(e.target.value)}
                  placeholder="customer_addresses.id を入力"
                  required
                />
                <p className="text-xs text-gray-500">
                  ※ ログイン中ユーザーの住所IDを入力してください
                </p>
              </div>

              {/* 支払方法 */}
              <div className="space-y-2">
                <Label>支払方法 *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 商品リスト */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>商品リスト *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                  >
                    + 商品を追加
                  </Button>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-end p-3 bg-gray-50 rounded">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">SKU ID</Label>
                      <Input
                        type="number"
                        value={item.product_sku_id}
                        onChange={(e) => handleItemChange(index, 'product_sku_id', e.target.value)}
                        placeholder="product_skus.id"
                      />
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-xs">数量</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      />
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        削除
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* 備考 */}
              <div className="space-y-2">
                <Label htmlFor="note">備考</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="テスト注文など"
                />
              </div>

              {/* 送信ボタン */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/orders')}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? '作成中...' : '注文を作成'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ヘルプ情報 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">テスト用メモ</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>SKU IDの確認方法:</strong><br />
              商品管理画面 → 商品詳細 → SKU一覧でIDを確認
            </p>
            <p>
              <strong>住所IDの確認方法:</strong><br />
              DBの customer_addresses テーブルを確認、または配送先管理画面で確認
            </p>
            <p>
              <strong>注文作成時の動作:</strong><br />
              ・在庫の引当（allocate）が実行されます<br />
              ・出荷レコードが自動作成されます<br />
              ・ステータスは「確定」で作成されます
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}