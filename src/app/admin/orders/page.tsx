'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { orderService, Order, OrderStatus } from '@/lib/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);
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
  const [searchOrderNumber, setSearchOrderNumber] = useState('');
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
      fetchOrders();
    }
  }, [user, currentPage, filterStatus]);

  const fetchStatuses = async () => {
    try {
      const data = await orderService.getStatuses();
      setStatuses(data);
    } catch (err) {
      console.error('ステータス取得エラー:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders({
        status: filterStatus || undefined,
        order_number: searchOrderNumber || undefined,
        page: currentPage,
        per_page: 20,
      });
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || '注文の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price);
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
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>注文管理</CardTitle>
                <CardDescription>全注文の一覧・管理</CardDescription>
              </div>
              <Button onClick={() => router.push('/admin/orders/new')}>
                テスト注文作成
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="注文番号で検索..."
                  value={searchOrderNumber}
                  onChange={(e) => setSearchOrderNumber(e.target.value)}
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
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            注文がありません
          </div>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">注文番号</th>
                      <th className="text-left p-4 font-medium">顧客</th>
                      <th className="text-left p-4 font-medium">注文日時</th>
                      <th className="text-left p-4 font-medium">ステータス</th>
                      <th className="text-right p-4 font-medium">合計金額</th>
                      <th className="text-center p-4 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <span className="font-mono text-sm">{order.order_number}</span>
                        </td>
                        <td className="p-4">
                          <div>{order.user?.name || '-'}</div>
                          <div className="text-xs text-gray-500">{order.user?.email}</div>
                        </td>
                        <td className="p-4 text-sm">
                          {formatDate(order.order_date)}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="p-4 text-right font-medium">
                          {formatPrice(order.total_price)}
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/orders/${order.id}`)}
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