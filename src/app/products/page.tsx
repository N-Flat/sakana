'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productService, Product } from '@/lib/product';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Category {
  id: number;
  name: string;
  slug: string;
  children?: Category[];
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  // 検索条件
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/api/public/categories');
      setCategories(response.data.categories);
    } catch (err) {
      console.error('カテゴリ取得エラー:', err);
    }
  };

  // カテゴリをフラット化（子カテゴリも含めて一覧に）
  const flattenCategories = (cats: Category[], depth = 0): { id: number; name: string; depth: number }[] => {
    let result: { id: number; name: string; depth: number }[] = [];
    cats.forEach(cat => {
      result.push({ id: cat.id, name: cat.name, depth });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, depth + 1));
      }
    });
    return result;
  };

  const flatCategories = flattenCategories(categories);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts({
        search: searchQuery || undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        sort_by: sortBy as any,
        page: currentPage,
        per_page: 20,
      });
      
      if (currentPage === 1) {
        setProducts(data.products);
      } else {
        setProducts(prev => [...prev, ...data.products]);
      }
      
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || '商品の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setProducts([]);
    fetchProducts();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryId('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('created_at');
    setCurrentPage(1);
    setProducts([]);
    // リセット後に再取得
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price);
  };

  // アクティブなフィルター数
  const activeFilterCount = [
    searchQuery,
    categoryId,
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  if (loading && currentPage === 1 && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>商品一覧</CardTitle>
                <CardDescription>お探しの商品を検索できます</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                絞り込み
                {activeFilterCount > 0 && (
                  <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              {/* キーワード検索 */}
              <div className="flex gap-4">
                <Input
                  placeholder="商品名・説明・商品コードで検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">検索</Button>
              </div>

              {/* 絞り込みパネル */}
              {showFilters && (
                <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* カテゴリ */}
                    <div className="space-y-2">
                      <Label>カテゴリ</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="すべてのカテゴリ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">すべてのカテゴリ</SelectItem>
                          {flatCategories.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                              {'　'.repeat(cat.depth)}{cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 最小価格 */}
                    <div className="space-y-2">
                      <Label>最低価格</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        min="0"
                      />
                    </div>

                    {/* 最大価格 */}
                    <div className="space-y-2">
                      <Label>最高価格</Label>
                      <Input
                        type="number"
                        placeholder="上限なし"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                    >
                      条件をクリア
                    </Button>
                    <Button type="submit" size="sm">
                      この条件で検索
                    </Button>
                  </div>
                </div>
              )}

              {/* 並び替え */}
              <div className="flex gap-4 items-center">
                <Select value={sortBy} onValueChange={(value) => {
                  setSortBy(value);
                  setCurrentPage(1);
                  setProducts([]);
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">新着順</SelectItem>
                    <SelectItem value="price_asc">価格が安い順</SelectItem>
                    <SelectItem value="price_desc">価格が高い順</SelectItem>
                    <SelectItem value="name">名前順</SelectItem>
                  </SelectContent>
                </Select>

                <span className="text-sm text-gray-500">
                  {pagination.total}件の商品
                </span>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        {products.length === 0 && !loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">商品が見つかりませんでした</p>
              {activeFilterCount > 0 && (
                <Button variant="outline" onClick={handleClearFilters}>
                  条件をクリアして再検索
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 商品カード一覧 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {products.map((product) => {
                const mainImage = product.images?.find(img => img.is_primary) || product.images?.[0];
                const minPrice = product.skus && product.skus.length > 0
                  ? Math.min(...product.skus.map(sku => sku.price))
                  : 0;

                return (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow pt-0 pb-0 gap-4"
                    onClick={() => router.push(`/products/${product.id}`)}
                  >
                    {/* 商品画像 */}
                    <div className="aspect-square bg-gray-200 relative overflow-hidden">
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

                    <CardContent className="p-4">
                      {/* カテゴリ */}
                      {product.category && (
                        <p className="text-xs text-gray-500 mb-1">
                          {product.category.name}
                        </p>
                      )}

                      {/* 商品名 */}
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {product.name}
                      </h3>

                      {/* 価格 */}
                      <p className="text-xl font-bold text-[#e81357]">
                        {formatPrice(minPrice)}
                        {product.skus && product.skus.length > 1 && (
                          <span className="text-sm font-normal text-[#e81357]">〜</span>
                        )}
                      </p>

                      {/* 商品コード */}
                      <p className="text-xs text-gray-400 mt-1">
                        {product.product_code}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* もっと見るボタン */}
            {pagination.current_page < pagination.last_page && (
              <div className="text-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  variant="outline"
                  size="lg"
                >
                  {loading ? '読み込み中...' : 'もっと見る'}
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  {pagination.total}件中 {products.length}件を表示
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}