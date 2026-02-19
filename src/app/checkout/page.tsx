'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { orderService, PaymentMethod } from '@/lib/order';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Address {
  id: number;
  recipient_name: string;
  recipient_name_kana: string | null;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line1: string;
  address_line2: string | null;
  phone: string;
  is_default: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, totals, fetchCart, checkout, error: cartError } = useCart();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit_card');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchCart();
      fetchAddresses();
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const response = await apiClient.get('/api/addresses');
      setAddresses(response.data.addresses);
      
      // デフォルト住所を選択
      const defaultAddress = response.data.addresses.find((a: Address) => a.is_default);
      if (defaultAddress) {
        setSelectedAddressId(String(defaultAddress.id));
      } else if (response.data.addresses.length > 0) {
        setSelectedAddressId(String(response.data.addresses[0].id));
      }
    } catch (err) {
      console.error('住所取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const data = await orderService.getPaymentMethods();
      setPaymentMethods(data);
    } catch (err) {
      console.error('支払方法取得エラー:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedAddressId) {
      setError('配送先を選択してください');
      return;
    }

    if (items.length === 0) {
      setError('カートが空です');
      return;
    }

    setSubmitting(true);

    try {
      const result = await checkout(
        Number(selectedAddressId),
        selectedPaymentMethod,
        note || undefined
      );

      alert(`注文が完了しました！\n注文番号: ${result.order.order_number}`);
      router.push(`/orders/${result.order.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || '注文に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price);
  };

  const selectedAddress = addresses.find(a => String(a.id) === selectedAddressId);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  if (!user) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">カートに商品がありません</p>
              <Button onClick={() => router.push('/products')}>
                商品を探す
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.push('/cart')}
          className="mb-4"
        >
          ← カートに戻る
        </Button>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左カラム：配送先・支払方法 */}
            <div className="lg:col-span-2 space-y-6">
              {(error || cartError) && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                  {error || cartError}
                </div>
              )}

              {/* 配送先選択 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">配送先</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addresses.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-2">配送先が登録されていません</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/addresses/new')}
                      >
                        配送先を登録
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                        <SelectTrigger>
                          <SelectValue placeholder="配送先を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {addresses.map((address) => (
                            <SelectItem key={address.id} value={String(address.id)}>
                              {address.recipient_name} - {address.prefecture}{address.city}
                              {address.is_default && ' (デフォルト)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedAddress && (
                        <div className="bg-gray-50 p-4 rounded space-y-1 text-sm">
                          <p className="font-medium">{selectedAddress.recipient_name}</p>
                          {selectedAddress.recipient_name_kana && (
                            <p className="text-gray-500">{selectedAddress.recipient_name_kana}</p>
                          )}
                          <p>〒{selectedAddress.postal_code}</p>
                          <p>
                            {selectedAddress.prefecture}{selectedAddress.city}
                            {selectedAddress.address_line1}
                            {selectedAddress.address_line2 && ` ${selectedAddress.address_line2}`}
                          </p>
                          <p>TEL: {selectedAddress.phone}</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* 支払方法選択 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">お支払い方法</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
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
                </CardContent>
              </Card>

              {/* 備考 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">備考</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="配送に関するご要望など"
                  />
                </CardContent>
              </Card>
            </div>

            {/* 右カラム：注文サマリー */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">ご注文内容</CardTitle>
                  <CardDescription>{totals.item_count}点の商品</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 商品リスト */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.product_sku_id} className="flex gap-2 text-sm">
                        <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                          {item.product.main_image ? (
                            <img
                              src={item.product.main_image.image_path}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{item.product.name}</p>
                          <p className="text-gray-500">×{item.quantity}</p>
                        </div>
                        <div className="text-right">
                          {formatPrice(item.sku.price * (1 + item.product.tax_rate / 100) * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 合計 */}
                  <div className="border-t pt-4 space-y-2">
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
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={submitting || !selectedAddressId || addresses.length === 0}
                  >
                    {submitting ? '処理中...' : '注文を確定する'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}