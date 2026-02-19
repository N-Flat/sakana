'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { shipmentService, Shipment, ShipmentStatus } from '@/lib/shipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminShipmentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [statuses, setStatuses] = useState<ShipmentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  // フィルター
  const [filterStatus, setFilterStatus] = useState('');
  const [searchShipmentNumber, setSearchShipmentNumber] = useState('');
  const [searchTrackingNumber, setSearchTrackingNumber] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchStatuses();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchShipments();
    }
  }, [user, currentPage, filterStatus]);

  const fetchStatuses = async () => {
    try {
      const data = await shipmentService.getStatuses();
      setStatuses(data);
    } catch (err) {
      console.error('ステータス取得エラー:', err);
    }
  };

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const data = await shipmentService.getShipments({
        status: filterStatus || undefined,
        shipment_number: searchShipmentNumber || undefined,
        tracking_number: searchTrackingNumber || undefined,
        page: currentPage,
        per_page: 20,
      });
      setShipments(data.shipments);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || '出荷の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchShipments();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
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
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>出荷管理</CardTitle>
            <CardDescription>出荷の一覧・処理</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="出荷番号で検索..."
                  value={searchShipmentNumber}
                  onChange={(e) => setSearchShipmentNumber(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="追跡番号で検索..."
                  value={searchTrackingNumber}
                  onChange={(e) => setSearchTrackingNumber(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">検索</Button>
              </div>

              <div className="flex gap-4">
                <Select value={filterStatus} onValueChange={(value) => {
                  setFilterStatus(value === 'all' ? '' : value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="ステータス" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">読み込み中...</div>
        ) : shipments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            出荷がありません
          </div>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">出荷番号</th>
                      <th className="text-left p-4 font-medium">注文番号</th>
                      <th className="text-left p-4 font-medium">ステータス</th>
                      <th className="text-left p-4 font-medium">追跡番号</th>
                      <th className="text-left p-4 font-medium">作成日時</th>
                      <th className="text-center p-4 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((shipment) => (
                      <tr key={shipment.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <span className="font-mono text-sm">{shipment.shipment_number}</span>
                        </td>
                        <td className="p-4">
                          <span
                            className="font-mono text-sm text-blue-600 cursor-pointer hover:underline"
                            onClick={() => router.push(`/admin/orders/${shipment.order_id}`)}
                          >
                            {shipment.order?.order_number || '-'}
                          </span>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(shipment.status)}
                        </td>
                        <td className="p-4 text-sm">
                          {shipment.tracking_number || '-'}
                          {shipment.shipping_carrier && (
                            <span className="text-gray-500 block text-xs">
                              ({shipment.shipping_carrier})
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-sm">
                          {formatDate(shipment.created_at)}
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/shipments/${shipment.id}`)}
                          >
                            詳細
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* ページネーション */}
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                前へ
              </Button>
              <span className="text-sm text-gray-600">
                {pagination.current_page} / {pagination.last_page} ページ
                （全{pagination.total}件）
              </span>
              <Button
                variant="outline"
                disabled={currentPage >= pagination.last_page}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                次へ
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}