'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { orderService, Order, OrderStatus } from '@/lib/order';
import { shipmentService } from '@/lib/shipment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminOrderDetailPage() {
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

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    
    try {
      setActionLoading(true);
      await orderService.updateStatus(order.id, newStatus);
      await fetchOrder();
      alert('ステータスを更新しました');
    } catch (err: any) {
      alert(err.response?.data?.message || 'ステータス更新に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    if (!confirm('この注文をキャンセルしますか？在庫の引当が解除されます。')) return;

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

  const handleComplete = async () => {
    if (!order) return;
    if (!confirm('この注文を完了にしますか？')) return;

    try {
      setActionLoading(true);
      await orderService.completeOrder(order.id);
      await fetchOrder();
      alert('注文を完了しました');
    } catch (err: any) {
      alert(err.response?.data?.message || '完了処理に失敗しました');
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
  const isCompletable = order.status === 'delivered';

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/orders')}
          className="mb-4"
        >
          ← 注文一覧に戻る
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
                  注文 {order.order_number}
                  {getStatusBadge(order.status)}
                </CardTitle>
                <CardDescription>
                  注文日時: {formatDate(order.order_date)}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatPrice(order.total_price)}</p>
                <p className="text-sm text-gray-500">
                  （税込・送料 {formatPrice(order.shipping_fee)} 込）
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <Select
                value={order.status}
                onValueChange={handleStatusChange}
                disabled={actionLoading || order.status === 'cancelled'}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isCancellable && (
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={actionLoading}
                >
                  キャンセル
                </Button>
              )}

              {isCompletable && (
                <Button
                  onClick={handleComplete}
                  disabled={actionLoading}
                >
                  注文完了
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 顧客情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">顧客情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><span className="text-gray-500">氏名:</span> {order.user?.name}</p>
              <p><span className="text-gray-500">メール:</span> {order.user?.email}</p>
              <p><span className="text-gray-500">支払方法:</span> {paymentMethodLabels[order.payment_method] || order.payment_method}</p>
            </CardContent>
          </Card>

          {/* 配送先 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">配送先</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
            </CardContent>
          </Card>
        </div>

        {/* 注文明細 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">注文明細</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">商品</th>
                  <th className="text-center p-3 font-medium">数量</th>
                  <th className="text-right p-3 font-medium">単価</th>
                  <th className="text-right p-3 font-medium">小計</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3">
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-sm text-gray-500">
                        {item.size && `サイズ: ${item.size}`}
                        {item.color && ` / カラー: ${item.color}`}
                        {item.other_attribute && ` / ${item.other_attribute}`}
                      </div>
                    </td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right">
                      {formatPrice(item.purchase_unit_price)}
                      <span className="text-xs text-gray-500 block">
                        (税率 {item.purchase_tax_rate}%)
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatPrice(item.purchase_subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="p-3 text-right">小計</td>
                  <td className="p-3 text-right">{formatPrice(order.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="p-3 text-right">送料</td>
                  <td className="p-3 text-right">{formatPrice(order.shipping_fee)}</td>
                </tr>
                <tr className="font-bold">
                  <td colSpan={3} className="p-3 text-right">合計</td>
                  <td className="p-3 text-right">{formatPrice(order.total_price)}</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>

        {/* 出荷情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">出荷情報</CardTitle>
          </CardHeader>
          <CardContent>
            {order.shipments && order.shipments.length > 0 ? (
              <div className="space-y-4">
                {order.shipments.map((shipment) => (
                  <div key={shipment.id} className="border rounded p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-mono text-sm">{shipment.shipment_number}</p>
                        <div className="mt-1">{getShipmentStatusBadge(shipment.status)}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/shipments/${shipment.id}`)}
                      >
                        出荷詳細
                      </Button>
                    </div>
                    {shipment.tracking_number && (
                      <p className="text-sm">
                        <span className="text-gray-500">追跡番号:</span> {shipment.tracking_number}
                        {shipment.shipping_carrier && ` (${shipment.shipping_carrier})`}
                      </p>
                    )}
                    {shipment.shipping_date && (
                      <p className="text-sm">
                        <span className="text-gray-500">出荷日:</span> {shipment.shipping_date}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">出荷情報がありません</p>
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