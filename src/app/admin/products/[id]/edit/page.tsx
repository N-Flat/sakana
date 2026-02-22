'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { productService, Product } from '@/lib/product';
import { categoryService, Category } from '@/lib/category';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  // 商品基本情報
  const [categoryId, setCategoryId] = useState<string>('none');
  const [productCode, setProductCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [taxRate, setTaxRate] = useState('10');
  const [isPublished, setIsPublished] = useState(false);
  const [sortOrder, setSortOrder] = useState('0');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchProduct();
    }
  }, [user, productId]);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (err) {
      console.error('カテゴリ取得エラー:', err);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await productService.getProduct(productId);
      
      setCategoryId(data.category_id ? String(data.category_id) : 'none');
      setProductCode(data.product_code);
      setName(data.name);
      setDescription(data.description || '');
      setTaxRate(String(data.tax_rate));
      setIsPublished(data.is_published);
      setSortOrder(String(data.sort_order));
    } catch (err: any) {
      setError(err.message || '商品の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await productService.updateProduct(productId, {
        category_id: categoryId !== 'none' ? Number(categoryId) : undefined,
        product_code: productCode,
        name,
        description: description || undefined,
        tax_rate: Number(taxRate),
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : undefined,
        sort_order: Number(sortOrder),
        skus: [], // SKUは別画面で管理
      });

      router.push('/admin/products');
      alert('商品を更新しました');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.message ||
        '商品更新に失敗しました'
      );
    } finally {
      setSubmitting(false);
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
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/products')}
          className="mb-4"
        >
          ← 商品一覧に戻る
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>商品編集</CardTitle>
            <CardDescription>商品の基本情報を編集できます</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_code">商品コード *</Label>
                  <Input
                    id="product_code"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">カテゴリ</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未設定</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">商品名 *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">商品説明</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_rate">税率 (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sort_order">並び順</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <div className="flex items-center space-x-2 h-10">
                    <Checkbox
                      id="is_published"
                      checked={isPublished}
                      onCheckedChange={(checked) => setIsPublished(checked === true)}
                    />
                    <Label htmlFor="is_published">公開する</Label>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded text-sm text-blue-800">
                ※ SKUと画像は別画面で管理してください
                <div className="mt-2 space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/admin/products/${productId}/skus`)}
                  >
                    SKU管理
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/admin/products/${productId}/images`)}
                  >
                    画像管理
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/products')}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? '更新中...' : '更新'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}