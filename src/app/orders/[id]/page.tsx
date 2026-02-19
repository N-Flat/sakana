'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { orderService, Order, OrderStatus } from '@/lib/order';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchOrder();
      fetchStatuses();
    }
  }, [user, id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrder(id);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || '注文の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const data = await orderService.getStatuses();
      setStatuses(data);
    } catch (err) {
      console.error('ステータス取得エラー:', err);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    if (!confirm('この注文をキャンセルしますか？')) return;

    try {
      setActionLoading(true);
      await orderService.cancelOrder(order.id);
      await fetchOrder();
      alert('注文をキャンセルしました');
    } catch (err: any) {
      alert(err.response?.data?.message || 'キャンセルに失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusObj = statuses.find(s => s.value === status);
    const label = statusObj?.label || status;

    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
        {label}
      </span>
    );
  };

  const getShipmentStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      preparing: '出荷準備中',
      packed: '梱包完了',
      shipped: '発送済み',
      delivered: '配達完了',
    };

    const colors: Record<string, string> = {
      preparing: 'bg-yellow-100 text-yellow-800',
      packed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const paymentMethodLabels: Record<string, string> = {
    credit_card: 'クレジットカード',
    bank_transfer: '銀行振込',
    cod: '代金引換',
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  if (!user || !order) return null;

  const isCancellable = ['pending', 'confirmed'].includes(order.status);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.push('/orders')}
          className="mb-4"
        >
          ← 注文履歴に戻る
        </Button>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        {/* 注文ヘッダー */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-3">
                  注文詳細
                  {getStatusBadge(order.status)}
                </CardTitle>
                <CardDescription>
                  注文番号: {order.order_number}
                </CardDescription>
                <CardDescription>
                  注文日時: {formatDate(order.order_date)}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatPrice(order.total_price)}</p>
                <p className="text-sm text-gray-500">
                  （税込・送料込）
                </p>
              </div>
            </div>
          </CardHeader>
          {isCancellable && (
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={actionLoading}
              >
                注文をキャンセル
              </Button>
            </CardContent>
          )}
        </Card>

        {/* 配送先 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">配送先</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-medium">{order.shipping_name}</p>
            {order.shipping_name_kana && (
              <p className="text-sm text-gray-500">{order.shipping_name_kana}</p>
            )}
            <p>〒{order.shipping_postal_code}</p>
            <p>
              {order.shipping_prefecture}{order.shipping_city}
              {order.shipping_address_line1}
              {order.shipping_address_line2 && ` ${order.shipping_address_line2}`}
            </p>
            <p>TEL: {order.shipping_phone}</p>
            <p className="pt-2">
              <span className="text-gray-500">お支払い方法:</span>{' '}
              {paymentMethodLabels[order.payment_method] || order.payment_method}
            </p>
          </CardContent>
        </Card>

        {/* 注文明細 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">ご注文内容</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                  {/* 商品画像 */}
                  <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                    {item.product?.images?.[0] ? (
                      <img
                        src={item.product.images[0].image_path}
                        alt={item.product_name}
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
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-gray-500">
                      {item.size && `サイズ: ${item.size}`}
                      {item.color && ` / カラー: ${item.color}`}
                      {item.other_attribute && ` / ${item.other_attribute}`}
                    </p>
                    <p className="text-sm">
                      {formatPrice(item.purchase_unit_price)} × {item.quantity}
                    </p>
                  </div>

                  {/* 小計 */}
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(item.purchase_subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 合計 */}
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span>小計</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>送料</span>
                <span>{formatPrice(order.shipping_fee)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>合計</span>
                <span>{formatPrice(order.total_price)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 配送状況 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">配送状況</CardTitle>
          </CardHeader>
          <CardContent>
            {order.shipments && order.shipments.length > 0 ? (
              <div className="space-y-4">
                {order.shipments.map((shipment) => (
                  <div key={shipment.id} className="border rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>{getShipmentStatusBadge(shipment.status)}</div>
                      {shipment.shipping_date && (
                        <p className="text-sm text-gray-500">
                          出荷日: {shipment.shipping_date}
                        </p>
                      )}
                    </div>
                    {shipment.tracking_number && (
                      <p className="text-sm">
                        <span className="text-gray-500">追跡番号:</span>{' '}
                        <span className="font-mono">{shipment.tracking_number}</span>
                        {shipment.shipping_carrier && (
                          <span className="text-gray-500"> ({shipment.shipping_carrier})</span>
                        )}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">配送情報はまだありません</p>
            )}
          </CardContent>
        </Card>

        {/* 備考 */}
        {order.note && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">備考</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{order.note}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}