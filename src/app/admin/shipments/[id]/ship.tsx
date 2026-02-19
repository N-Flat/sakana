'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { shipmentService, Shipment, ShipmentStatus } from '@/lib/shipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminShipmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { user, loading: authLoading } = useAuth();

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [statuses, setStatuses] = useState<ShipmentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 発送フォーム
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchShipment();
      fetchStatuses();
    }
  }, [user, id]);

  const fetchShipment = async () => {
    try {
      setLoading(true);
      const data = await shipmentService.getShipment(id);
      setShipment(data);
      setShippingCarrier(data.shipping_carrier || '');
      setTrackingNumber(data.tracking_number || '');
      setNote(data.note || '');
    } catch (err: any) {
      setError(err.message || '出荷の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const data = await shipmentService.getStatuses();
      setStatuses(data);
    } catch (err) {
      console.error('ステータス取得エラー:', err);
    }
  };

  // ピッキング完了（個別）
  const handlePickItem = async (itemId: number) => {
    try {
      setActionLoading(true);
      await shipmentService.pickItem(itemId);
      await fetchShipment();
    } catch (err: any) {
      alert(err.response?.data?.message || 'ピッキング完了に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // 全明細ピッキング完了
  const handlePickAll = async () => {
    if (!shipment) return;

    try {
      setActionLoading(true);
      await shipmentService.pickAll(shipment.id);
      await fetchShipment();
      alert('全明細のピッキングが完了しました');
    } catch (err: any) {
      alert(err.response?.data?.message || 'ピッキング完了に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // 梱包完了
  const handlePack = async () => {
    if (!shipment) return;
    if (!confirm('梱包完了にしますか？')) return;

    try {
      setActionLoading(true);
      await shipmentService.pack(shipment.id);
      await fetchShipment();
      alert('梱包完了しました');
    } catch (err: any) {
      alert(err.response?.data?.message || '梱包完了に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // 発送処理
  const handleShip = async () => {
    if (!shipment) return;
    if (!confirm('発送処理を実行しますか？在庫が出庫されます。')) return;

    try {
      setActionLoading(true);
      await shipmentService.ship(shipment.id, {
        shipping_carrier: shippingCarrier || undefined,
        tracking_number: trackingNumber || undefined,
      });
      await fetchShipment();
      alert('発送処理が完了しました');
    } catch (err: any) {
      alert(err.response?.data?.message || '発送処理に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // 配達完了
  const handleDeliver = async () => {
    if (!shipment) return;
    if (!confirm('配達完了にしますか？')) return;

    try {
      setActionLoading(true);
      await shipmentService.deliver(shipment.id);
      await fetchShipment();
      alert('配達完了しました');
    } catch (err: any) {
      alert(err.response?.data?.message || '配達完了に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // 配送情報更新
  const handleUpdateTracking = async () => {
    if (!shipment) return;

    try {
      setActionLoading(true);
      await shipmentService.updateTracking(shipment.id, {
        shipping_carrier: shippingCarrier || undefined,
        tracking_number: trackingNumber || undefined,
      });
      await fetchShipment();
      alert('配送情報を更新しました');
    } catch (err: any) {
      alert(err.response?.data?.message || '配送情報更新に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // 備考更新
  const handleUpdateNote = async () => {
    if (!shipment) return;

    try {
      setActionLoading(true);
      await shipmentService.updateNote(shipment.id, note);
      await fetchShipment();
      alert('備考を更新しました');
    } catch (err: any) {
      alert(err.response?.data?.message || '備考更新に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusObj = statuses.find(s => s.value === status);
    const label = statusObj?.label || status;

    const colors: Record<string, string> = {
      preparing: 'bg-yellow-100 text-yellow-800',
      packed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
        {label}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ja-JP');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  if (!user || !shipment) return null;

  const isPreparing = shipment.status === 'preparing';
  const isPacked = shipment.status === 'packed';
  const isShipped = shipment.status === 'shipped';
  const isDelivered = shipment.status === 'delivered';

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/shipments')}
          className="mb-4"
        >
          ← 出荷一覧に戻る
        </Button>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        {/* 出荷ヘッダー */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-3">
                  出荷 {shipment.shipment_number}
                  {getStatusBadge(shipment.status)}
                </CardTitle>
                <CardDescription>
                  注文番号:{' '}
                  <span
                    className="text-blue-600 cursor-pointer hover:underline"
                    onClick={() => router.push(`/admin/orders/${shipment.order_id}`)}
                  >
                    {shipment.order?.order_number}
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* アクションボタン */}
            <div className="flex gap-3 flex-wrap">
              {isPreparing && (
                <>
                  <Button
                    onClick={handlePickAll}
                    disabled={actionLoading}
                    variant="outline"
                  >
                    全明細ピッキング完了
                  </Button>
                  <Button
                    onClick={handlePack}
                    disabled={actionLoading}
                  >
                    梱包完了
                  </Button>
                </>
              )}

              {isPacked && (
                <Button
                  onClick={handleShip}
                  disabled={actionLoading}
                >
                  発送処理
                </Button>
              )}

              {isShipped && (
                <Button
                  onClick={handleDeliver}
                  disabled={actionLoading}
                >
                  配達完了
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 配送情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">配送情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shipping_carrier">配送業者</Label>
                <Input
                  id="shipping_carrier"
                  value={shippingCarrier}
                  onChange={(e) => setShippingCarrier(e.target.value)}
                  placeholder="ヤマト運輸、佐川急便など"
                  disabled={isDelivered}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tracking_number">追跡番号</Label>
                <Input
                  id="tracking_number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="追跡番号を入力"
                  disabled={isDelivered}
                />
              </div>

              {!isDelivered && (
                <Button
                  onClick={handleUpdateTracking}
                  disabled={actionLoading}
                  variant="outline"
                  className="w-full"
                >
                  配送情報を更新
                </Button>
              )}

              <div className="pt-4 border-t space-y-2 text-sm">
                <p><span className="text-gray-500">出荷日:</span> {shipment.shipping_date || '-'}</p>
                <p><span className="text-gray-500">梱包担当:</span> {shipment.packer?.name || '-'}</p>
                <p><span className="text-gray-500">発送担当:</span> {shipment.shipper?.name || '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* 備考 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">備考</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                placeholder="備考を入力..."
              />
              <Button
                onClick={handleUpdateNote}
                disabled={actionLoading}
                variant="outline"
                className="w-full"
              >
                備考を更新
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 出荷明細 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">出荷明細</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">商品</th>
                  <th className="text-center p-3 font-medium">数量</th>
                  <th className="text-center p-3 font-medium">ピッキング</th>
                  <th className="text-center p-3 font-medium">梱包</th>
                  {isPreparing && (
                    <th className="text-center p-3 font-medium">操作</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {shipment.items?.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3">
                      <div className="font-medium">
                        {item.order_item?.product_name || '-'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.order_item?.size && `サイズ: ${item.order_item.size}`}
                        {item.order_item?.color && ` / カラー: ${item.order_item.color}`}
                      </div>
                      {item.product_sku && (
                        <div className="text-xs text-gray-400">
                          SKU: {item.product_sku.sku_code}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-center">
                      {item.picked_at ? (
                        <span className="text-green-600 text-sm">
                          ✓ {formatDate(item.picked_at)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">未完了</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {item.packed_at ? (
                        <span className="text-green-600 text-sm">
                          ✓ {formatDate(item.packed_at)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">未完了</span>
                      )}
                    </td>
                    {isPreparing && (
                      <td className="p-3 text-center">
                        {!item.picked_at && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePickItem(item.id)}
                            disabled={actionLoading}
                          >
                            ピッキング完了
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}