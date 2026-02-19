'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { productService, Product, ProductSku } from '@/lib/product';
import { wishlistService } from '@/lib/wishlist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSku, setSelectedSku] = useState<ProductSku | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await productService.getProduct(id);
      setProduct(data);
      
      // デフォルトで最初のSKUを選択
      if (data.skus && data.skus.length > 0) {
        setSelectedSku(data.skus[0]);
      }
    } catch (err: any) {
      setError(err.message || '商品の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!selectedSku) {
      alert('バリエーションを選択してください');
      return;
    }

    setCartLoading(true);
    const success = await addItem(selectedSku.id, quantity);
    setCartLoading(false);

    if (success) {
      alert('カートに追加しました');
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      setFavoriteLoading(true);
      await wishlistService.addToWishlist(
        product!.id,
        selectedSku?.id
      );
      setIsFavorite(true);
      alert('お気に入りに追加しました');
    } catch (err: any) {
      alert(err.response?.data?.message || 'お気に入り追加に失敗しました');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-600">{error || '商品が見つかりませんでした'}</p>
            <Button onClick={() => router.push('/products')} className="mt-4">
              商品一覧に戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const images = product.images || [];
  const mainImage = images[selectedImage] || images[0];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.push('/products')}
          className="mb-4"
        >
          ← 商品一覧に戻る
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 画像エリア */}
          <div>
            {/* メイン画像 */}
            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4">
              {mainImage ? (
                <img
                  src={mainImage.image_path}
                  alt={mainImage.alt_text || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>

            {/* サムネイル */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className={`aspect-square bg-gray-200 rounded cursor-pointer overflow-hidden ${
                      selectedImage === index ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img
                      src={image.image_path}
                      alt={image.alt_text || product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 商品情報エリア */}
          <div>
            <Card>
              <CardHeader>
                {product.category && (
                  <CardDescription>{product.category.name}</CardDescription>
                )}
                <CardTitle className="text-2xl">{product.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 価格 */}
                <div>
                  <p className="text-3xl font-bold">
                    {selectedSku ? formatPrice(selectedSku.price) : '---'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    税込 {product.tax_rate}%
                  </p>
                </div>

                {/* 商品コード */}
                <div>
                  <p className="text-sm text-gray-500">
                    商品コード: {product.product_code}
                  </p>
                  {selectedSku && (
                    <p className="text-sm text-gray-500">
                      SKUコード: {selectedSku.sku_code}
                    </p>
                  )}
                </div>

                {/* SKU選択 */}
                {product.skus && product.skus.length > 1 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">バリエーション</label>
                    <Select
                      value={selectedSku?.id.toString()}
                      onValueChange={(value) => {
                        const sku = product.skus?.find(s => s.id === Number(value));
                        if (sku) setSelectedSku(sku);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {product.skus.map((sku) => (
                          <SelectItem key={sku.id} value={sku.id.toString()}>
                            {[sku.size, sku.color, sku.other_attribute]
                              .filter(Boolean)
                              .join(' / ') || 'デフォルト'} - {formatPrice(sku.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* sku在庫 */}
                <div>
                  {selectedSku && (
                    <p className="text-sm font-medium">
                      在庫数: {selectedSku.available_quantity || '在庫切れ'}
                    </p>
                  )}
                </div>

                {/* 数量選択 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">数量</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-20 text-center"
                      min="1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* 説明 */}
                {product.description && (
                  <div>
                    <h3 className="font-semibold mb-2">商品説明</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* アクションボタン */}
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={cartLoading || !selectedSku}
                  >
                    {cartLoading ? '追加中...' : 'カートに追加'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleAddToWishlist}
                    disabled={favoriteLoading || !selectedSku}
                  >
                    {favoriteLoading ? '追加中...' : '♡ お気に入りに追加'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}