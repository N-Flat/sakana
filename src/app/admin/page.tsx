'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">管理者ダッシュボード</h1>

        {/* 統計カード（上部・横長） */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>今月の売上</CardDescription>
              <CardTitle className="text-3xl">¥0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">※ 今後実装予定</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>今月の注文数</CardDescription>
              <CardTitle className="text-3xl">0件</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">※ 今後実装予定</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>在庫アラート</CardDescription>
              <CardTitle className="text-3xl">0件</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">※ 今後実装予定</p>
            </CardContent>
          </Card>
        </div>

        {/* 機能カード（正方形・3列） */}
        <div className="grid grid-cols-3 gap-4">
          <Card
            className="aspect-square cursor-pointer hover:shadow-md transition-shadow flex flex-col"
            onClick={() => router.push('/admin/categories')}
          >
            <CardHeader>
              <CardTitle>カテゴリ管理</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription>
                商品カテゴリの追加・編集・削除。階層構造でカテゴリを整理できます。
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className="aspect-square cursor-pointer hover:shadow-md transition-shadow flex flex-col"
            onClick={() => router.push('/admin/products')}
          >
            <CardHeader>
              <CardTitle>商品管理</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription>
                商品の登録・編集・削除。SKU、価格、画像、在庫の管理ができます。
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className="aspect-square cursor-pointer hover:shadow-md transition-shadow flex flex-col"
            onClick={() => router.push('/admin/inventories')}
          >
            <CardHeader>
              <CardTitle>在庫管理</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription>
                在庫数の確認・調整・入庫処理。安全在庫の設定やアラート管理ができます。
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className="aspect-square cursor-pointer hover:shadow-md transition-shadow flex flex-col"
            onClick={() => router.push('/admin/orders')}
          >
            <CardHeader>
              <CardTitle>注文管理</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription>
                注文の一覧・詳細確認。ステータス更新やキャンセル処理ができます。
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className="aspect-square cursor-pointer hover:shadow-md transition-shadow flex flex-col"
            onClick={() => router.push('/admin/shipments')}
          >
            <CardHeader>
              <CardTitle>出荷管理</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription>
                出荷の一覧・処理。ピッキング、梱包、発送、配達完了の管理ができます。
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className="aspect-square cursor-not-allowed opacity-60 flex flex-col"
          >
            <CardHeader>
              <CardTitle>発注管理</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription>
                仕入先への発注・入荷管理。※ 今後実装予定
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}