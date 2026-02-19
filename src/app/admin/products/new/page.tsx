'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { productService, ProductFormData } from '@/lib/product';
import { categoryService, Category } from '@/lib/category';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { imageService } from '@/lib/image';

export default function NewProductPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
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

  // SKU情報
  const [skus, setSkus] = useState([
    {
      sku_code: '',
      jan_code: '',
      size: '',
      color: '',
      other_attribute: '',
      price: '',
      cost_price: '',
      is_active: true,
    }
  ]);

  // 画像パスの配列
  const [images, setImages] = useState<Array<{
    image_path: string;
    alt_text: string;
    sort_order: number;
    is_primary: boolean;
  }>>([]);

  const [uploading, setUploading] = useState(false);

  // 画像アップロード処理
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // 画像をアップロード
      const imageUrl = await imageService.uploadImage(file);
      
      // useStateの配列に追加
      setImages([
        ...images,
        {
          image_path: imageUrl,
          alt_text: '',
          sort_order: images.length,
          is_primary: images.length === 0, // 最初の画像をメインに
        }
      ]);
      
      alert('画像をアップロードしました');
    } catch (err: any) {
      alert(err.response?.data?.message || '画像アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  // 画像削除処理
  const handleImageRemove = async (index: number) => {
    const image = images[index];
    
    if (confirm('この画像を削除しますか？')) {
      try {
        // サーバーから削除
        await imageService.deleteImage(image.image_path);
        
        // useStateから削除
        setImages(images.filter((_, i) => i !== index));
        
        alert('画像を削除しました');
      } catch (err: any) {
        alert('画像削除に失敗しました');
      }
    }
  };

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
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (err) {
      console.error('カテゴリ取得エラー:', err);
    }
  };

  const addSku = () => {
    setSkus([
      ...skus,
      {
        sku_code: '',
        jan_code: '',
        size: '',
        color: '',
        other_attribute: '',
        price: '',
        cost_price: '',
        is_active: true,
      }
    ]);
  };

  const removeSku = (index: number) => {
    if (skus.length <= 1) {
      alert('最低1つのSKUが必要です');
      return;
    }
    setSkus(skus.filter((_, i) => i !== index));
  };

  const updateSku = (index: number, field: string, value: any) => {
    const newSkus = [...skus];
    (newSkus[index] as any)[field] = value;
    setSkus(newSkus);
  };

  const updateImage = (index: number, field: string, value: any) => {
    const newImages = [...images];
    (newImages[index] as any)[field] = value;
    
    // is_primaryをtrueにした場合、他をfalseに
    if (field === 'is_primary' && value === true) {
      newImages.forEach((img, i) => {
        if (i !== index) img.is_primary = false;
      });
    }
    
    setImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // SKUバリデーション
      const validSkus = skus.filter(sku => sku.sku_code && sku.price);
      if (validSkus.length === 0) {
        throw new Error('最低1つのSKU（SKUコードと価格）が必要です');
      }

      // // 画像バリデーション
      // const validImages = images.filter(img => img.image_path);

      const data: ProductFormData = {
        category_id: categoryId !== 'none' ? Number(categoryId) : undefined,
        product_code: productCode,
        name,
        description: description || undefined,
        tax_rate: Number(taxRate),
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : undefined,
        sort_order: Number(sortOrder),
        skus: validSkus.map(sku => ({
          sku_code: sku.sku_code,
          jan_code: sku.jan_code || undefined,
          size: sku.size || undefined,
          color: sku.color || undefined,
          other_attribute: sku.other_attribute || undefined,
          price: Number(sku.price),
          cost_price: sku.cost_price ? Number(sku.cost_price) : undefined,
          is_active: sku.is_active,
        })),
        images: images.length > 0 ? images : undefined,
      };

      await productService.createProduct(data);
      router.push('/admin/products');
      alert('商品を登録しました');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.message ||
        '商品登録に失敗しました'
      );
    } finally {
      setLoading(false);
    }
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
        <Button
          variant="outline"
          onClick={() => router.push('/admin/products')}
          className="mb-4"
        >
          ← 商品一覧に戻る
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>商品新規登録</CardTitle>
            <CardDescription>商品情報を入力してください</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                  {error}
                </div>
              )}

              {/* 基本情報 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">基本情報</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product_code">商品コード *</Label>
                    <Input
                      id="product_code"
                      value={productCode}
                      onChange={(e) => setProductCode(e.target.value)}
                      required
                      placeholder="PROD-001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">カテゴリ</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
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
                    placeholder="ベーシックTシャツ"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">商品説明</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="商品の詳細説明"
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
              </div>

              {/* SKU情報 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-lg font-semibold">SKU情報</h3>
                  <Button type="button" size="sm" onClick={addSku}>
                    SKU追加
                  </Button>
                </div>

                {skus.map((sku, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold">SKU {index + 1}</h4>
                          {skus.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => removeSku(index)}
                            >
                              削除
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>SKUコード *</Label>
                            <Input
                              value={sku.sku_code}
                              onChange={(e) => updateSku(index, 'sku_code', e.target.value)}
                              required
                              placeholder="PROD-001-M-RED"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>JANコード</Label>
                            <Input
                              value={sku.jan_code}
                              onChange={(e) => updateSku(index, 'jan_code', e.target.value)}
                              placeholder="4901234567890"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>サイズ</Label>
                            <Input
                              value={sku.size}
                              onChange={(e) => updateSku(index, 'size', e.target.value)}
                              placeholder="M"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>色</Label>
                            <Input
                              value={sku.color}
                              onChange={(e) => updateSku(index, 'color', e.target.value)}
                              placeholder="赤"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>その他属性</Label>
                            <Input
                              value={sku.other_attribute}
                              onChange={(e) => updateSku(index, 'other_attribute', e.target.value)}
                              placeholder="追加属性"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>価格 *</Label>
                            <Input
                              type="number"
                              value={sku.price}
                              onChange={(e) => updateSku(index, 'price', e.target.value)}
                              required
                              min="0"
                              placeholder="2980"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>原価</Label>
                            <Input
                              type="number"
                              value={sku.cost_price}
                              onChange={(e) => updateSku(index, 'cost_price', e.target.value)}
                              min="0"
                              placeholder="1500"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>&nbsp;</Label>
                            <div className="flex items-center space-x-2 h-10">
                              <Checkbox
                                checked={sku.is_active}
                                onCheckedChange={(checked) => updateSku(index, 'is_active', checked === true)}
                              />
                              <Label>有効</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 画像情報 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-lg font-semibold">画像情報</h3>
                  <div className="flex gap-2">
                    {/* ファイル選択ボタン */}
                    <label htmlFor="image-upload">
                      <Button type="button" size="sm" asChild disabled={uploading}>
                        <span>
                          {uploading ? 'アップロード中...' : '画像アップロード'}
                        </span>
                      </Button>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>

                {images.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    画像がアップロードされていません
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          {/* 画像プレビュー */}
                          <div className="aspect-square bg-gray-200 rounded overflow-hidden mb-3">
                            <img
                              src={image.image_path}
                              alt={image.alt_text || `画像 ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>

                          {/* メインバッジ */}
                          {image.is_primary && (
                            <span className="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded mb-2">
                              メイン
                            </span>
                          )}

                          {/* ALTテキスト入力 */}
                          <div className="space-y-2 mb-3">
                            <Label className="text-xs">ALTテキスト</Label>
                            <Input
                              value={image.alt_text}
                              onChange={(e) => updateImage(index, 'alt_text', e.target.value)}
                              placeholder="画像の説明"
                              className="text-sm"
                            />
                          </div>

                          {/* メイン設定チェックボックス */}
                          <div className="flex items-center space-x-2 mb-3">
                            <Checkbox
                              checked={image.is_primary}
                              onCheckedChange={(checked) => updateImage(index, 'is_primary', checked === true)}
                            />
                            <Label className="text-sm">メイン画像</Label>
                          </div>

                          {/* 削除ボタン */}
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="w-full"
                            onClick={() => handleImageRemove(index)}
                          >
                            削除
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* 送信ボタン */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/products')}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? '登録中...' : '登録'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}