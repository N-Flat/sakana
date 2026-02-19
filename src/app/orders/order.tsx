'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { orderService, Order, OrderStatus } from '@/lib/order';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const [filterStatus, setFilterStatus] = useState('');
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
      const data = await orderService.getMyOrders({
        status: filterStatus || undefined,
        page: currentPage,
        per_page: 10,
      });
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || '注文の取得に失敗しました');
    } finally {
      setLoading(false);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
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
            <CardTitle>注文履歴</CardTitle>
            <CardDescription>過去のご注文を確認できます</CardDescription>
          </CardHeader>
          <CardContent>
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
            注文履歴がありません
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-mono text-sm text-gray-600">
                          {order.order_number}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.order_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(order.status)}
                        <p className="text-lg font-bold mt-1">
                          {formatPrice(order.total_price)}
                        </p>
                      </div>
                    </div>

                    {/* 商品サマリー */}
                    <div className="border-t pt-3 mb-3">
                      {order.items?.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex justify-between text-sm py-1">
                          <span className="text-gray-600">
                            {item.product_name}
                            {item.size && ` (${item.size})`}
                            {item.color && ` / ${item.color}`}
                          </span>
                          <span>×{item.quantity}</span>
                        </div>
                      ))}
                      {order.items && order.items.length > 2 && (
                        <p className="text-sm text-gray-500">
                          他 {order.items.length - 2} 点
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/orders/${order.id}`)}
                      >
                        詳細を見る
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

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