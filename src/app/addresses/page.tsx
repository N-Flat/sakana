'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { addressService, Address } from '@/lib/address';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AddressesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (err: any) {
      setError(err.message || '住所の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この住所を削除しますか？')) return;

    try {
      await addressService.deleteAddress(id);
      fetchAddresses();
    } catch (err: any) {
      alert(err.response?.data?.message || '削除に失敗しました');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await addressService.setDefaultAddress(id);
      fetchAddresses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'デフォルト変更に失敗しました');
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
              <CardTitle>配送先住所一覧</CardTitle>
              <CardDescription>登録されている配送先を管理できます</CardDescription>
            </div>
            <Button onClick={() => router.push('/addresses/new')}>
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

          {addresses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              配送先が登録されていません
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`border rounded p-4 ${
                    address.is_default ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      {address.is_default && (
                        <span className="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded mb-2">
                          デフォルト
                        </span>
                      )}
                      <p className="font-semibold">{address.recipient_name}</p>
                      {address.recipient_name_kana && (
                        <p className="text-sm text-gray-600">{address.recipient_name_kana}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!address.is_default && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetDefault(address.id)}
                        >
                          デフォルトに設定
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/addresses/${address.id}/edit`)}
                      >
                        編集
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(address.id)}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>〒{address.postal_code}</p>
                    <p>
                      {address.prefecture}
                      {address.city}
                      {address.address_line1}
                    </p>
                    {address.address_line2 && <p>{address.address_line2}</p>}
                    <p>TEL: {address.phone}</p>
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