'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { categoryService, Category } from '@/lib/category';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CategoriesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'カテゴリの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このカテゴリを削除しますか？')) return;

    try {
      await categoryService.deleteCategory(id);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || '削除に失敗しました');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>カテゴリ一覧</CardTitle>
              <CardDescription>登録されているカテゴリを管理できます</CardDescription>
            </div>
            <Button onClick={() => router.push('/admin/categories/new')}>
              新規登録
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
              {error}
            </div>
          )}

          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              カテゴリが登録されていません
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id}>
                  {/* 親カテゴリ */}
                  <div className="border rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-lg">{category.name}</p>
                        <p className="text-sm text-gray-600">スラッグ: {category.slug}</p>
                        {category.description && (
                          <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          並び順: {category.sort_order} | 
                          {category.is_active ? (
                            <span className="text-green-600"> 公開中</span>
                          ) : (
                            <span className="text-red-600"> 非公開</span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/categories/${category.id}/edit`)}
                        >
                          編集
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(category.id)}
                        >
                          削除
                        </Button>
                      </div>
                    </div>

                    {/* 子カテゴリ */}
                    {category.children && category.children.length > 0 && (
                      <div className="ml-6 mt-3 space-y-2">
                        {category.children.map((child) => (
                          <div
                            key={child.id}
                            className="border-l-2 border-gray-300 pl-4 py-2 bg-gray-50"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{child.name}</p>
                                <p className="text-sm text-gray-600">スラッグ: {child.slug}</p>
                                {child.description && (
                                  <p className="text-sm text-gray-600 mt-1">{child.description}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/admin/categories/${child.id}/edit`)}
                                >
                                  編集
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(child.id)}
                                >
                                  削除
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}