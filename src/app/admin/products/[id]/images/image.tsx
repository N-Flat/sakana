'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { productService, Product } from '@/lib/product';
import { imageService } from '@/lib/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProductImagesPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);
  const { user, loading: authLoading } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchProduct();
    }
  }, [user, productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await productService.getProduct(productId);
      setProduct(data);
    } catch (err: any) {
      setError(err.message || '商品の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 画像アップロード＆追加
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // 1. 画像をアップロード
      const imageUrl = await imageService.uploadImage(file);

      // 2. DBに保存
      await productService.addImages(productId, [{
        image_path: imageUrl,
        alt_text: '',
        is_primary: !product?.images || product.images.length === 0, // 最初の画像はメインに
        sort_order: product?.images?.length || 0,
      }]);

      // 3. 商品情報を再取得
      fetchProduct();

      alert('画像を追加しました');
    } catch (err: any) {
      alert(err.response?.data?.message || '画像追加に失敗しました');
    } finally {
      setUploading(false);
    }
  };

  // ALTテキスト更新
  const handleUpdateAlt = async (imageId: number, altText: string) => {
    try {
      const image = product?.images?.find(img => img.id === imageId);
      if (!image) return;

      await productService.updateImage(productId, imageId, {
        ...image,
        alt_text: altText,
      });

      fetchProduct();
    } catch (err: any) {
      alert(err.response?.data?.message || 'ALTテキスト更新に失敗しました');
    }
  };

  // メイン画像設定
  const handleSetPrimary = async (imageId: number) => {
    try {
      const image = product?.images?.find(img => img.id === imageId);
      if (!image) return;

      await productService.updateImage(productId, imageId, {
        ...image,
        is_primary: true,
      });

      fetchProduct();
      alert('メイン画像を設定しました');
    } catch (err: any) {
      alert(err.response?.data?.message || 'メイン画像設定に失敗しました');
    }
  };

  // 画像削除
  const handleDeleteImage = async (imageId: number, imagePath: string) => {
    if (!confirm('この画像を削除しますか？')) return;

    try {
      // 1. DBから削除
      await productService.deleteImage(productId, imageId);

      // 2. ファイルを削除
      await imageService.deleteImage(imagePath);

      // 3. 商品情報を再取得
      fetchProduct();

      alert('画像を削除しました');
    } catch (err: any) {
      alert(err.response?.data?.message || '画像削除に失敗しました');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  if (!user || !product) return null;

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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>画像管理: {product.name}</CardTitle>
            <CardDescription>商品コード: {product.product_code}</CardDescription>
          </CardHeader>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        {/* 画像アップロードボタン */}
        <div className="mb-6">
          <label htmlFor="image-upload">
            <Button type="button" asChild disabled={uploading}>
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

        {/* 画像一覧 */}
        {product.images && product.images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {product.images.map((image) => (
              <Card key={image.id}>
                <CardContent className="p-4">
                  {/* 画像プレビュー */}
                  <div className="aspect-square bg-gray-200 rounded overflow-hidden mb-3">
                    <img
                      src={image.image_path}
                      alt={image.alt_text || product.name}
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
                      key={image.id}
                      defaultValue={image.alt_text || ''}
                      onBlur={(e) => handleUpdateAlt(image.id, e.target.value)}
                      placeholder="画像の説明"
                      className="text-sm"
                    />
                  </div>

                  {/* アクション */}
                  <div className="space-y-2">
                    {!image.is_primary && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleSetPrimary(image.id)}
                      >
                        メインに設定
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleDeleteImage(image.id, image.image_path)}
                    >
                      削除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            画像が登録されていません
          </div>
        )}
      </div>
    </div>
  );
}