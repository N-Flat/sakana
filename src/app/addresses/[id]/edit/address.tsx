// src/app/addresses/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { addressService, Address } from '@/lib/address';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function EditAddressPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [recipientName, setRecipientName] = useState('');
  const [recipientNameKana, setRecipientNameKana] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [city, setCity] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [phone, setPhone] = useState('');
  const [addressType, setAddressType] = useState<'home' | 'office' | 'other'>('home');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user && id) {
      fetchAddress();
    }
  }, [user, id]);

  const fetchAddress = async () => {
    try {
      setLoading(true);
      const address = await addressService.getAddress(id);
      setRecipientName(address.recipient_name);
      setRecipientNameKana(address.recipient_name_kana || '');
      setPostalCode(address.postal_code);
      setPrefecture(address.prefecture);
      setCity(address.city);
      setAddressLine1(address.address_line1);
      setAddressLine2(address.address_line2 || '');
      setPhone(address.phone);
      setAddressType(address.address_type);
      setIsDefault(address.is_default);
    } catch (err: any) {
      setError(err.message || '住所の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await addressService.updateAddress(id, {
        recipient_name: recipientName,
        recipient_name_kana: recipientNameKana || undefined,
        postal_code: postalCode,
        prefecture,
        city,
        address_line1: addressLine1,
        address_line2: addressLine2 || undefined,
        phone,
        address_type: addressType,
        is_default: isDefault,
      });
      router.push('/addresses');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        JSON.stringify(err.response?.data?.errors) ||
        err.message ||
        '更新に失敗しました'
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>配送先住所の編集</CardTitle>
          <CardDescription>配送先情報を変更できます</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="recipient_name">受取人名</Label>
              <Input
                id="recipient_name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient_name_kana">受取人名（カナ）</Label>
              <Input
                id="recipient_name_kana"
                value={recipientNameKana}
                onChange={(e) => setRecipientNameKana(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">郵便番号</Label>
              <Input
                id="postal_code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prefecture">都道府県</Label>
                <Input
                  id="prefecture"
                  value={prefecture}
                  onChange={(e) => setPrefecture(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">市区町村</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line1">町名・番地</Label>
              <Input
                id="address_line1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">建物名・部屋番号</Label>
              <Input
                id="address_line2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_type">住所種別</Label>
              <Select value={addressType} onValueChange={(value: any) => setAddressType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">自宅</SelectItem>
                  <SelectItem value="office">勤務先</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_default"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked === true)}
              />
              <Label htmlFor="is_default">デフォルト住所に設定</Label>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/addresses')} className="flex-1">
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
  );
}