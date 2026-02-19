'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import CartIcon from '@/components/CartIcon';
import { Button } from '@/components/ui/button';
import Image from "next/image";

export default function Navbar() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const adminMenuItems = [
    { label: '管理者ホーム', path: '/admin' },
    { label: '注文管理', path: '/admin/orders' },
    { label: '出荷管理', path: '/admin/shipments' },
    { label: '在庫管理', path: '/admin/inventories' },
    { label: '商品管理', path: '/admin/products' },
    { label: 'カテゴリ管理', path: '/admin/categories' },
  ];

  return (
    <nav className="bg-[#F2F8FF] border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          {/* ロゴ */}
          <div
            className="font-bold text-xl cursor-pointer"
            onClick={() => router.push('/')}
          >
            <Image
              src="/SAKANAec.png"
              alt="メインロゴ"
              width={250}
              height={50}
            />
          </div>

          {/* ナビリンク */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/products')}>
              商品一覧
            </Button>

            {!loading && (
              <>
                {user ? (
                  <>
                    {/* 顧客メニュー */}
                    <Button variant="ghost" size="sm" onClick={() => router.push('/orders')}>
                      注文履歴
                    </Button>

                    <Button variant="ghost" size="sm" onClick={() => router.push('/addresses')}>
                      住所登録
                    </Button>

                    <Button variant="ghost" size="sm" onClick={() => router.push('/wishlists')}>
                      お気に入り
                    </Button>
                    
                    {/* 管理者メニュー（ホバープルダウン） */}
                    {user.role === 'admin' && (
                      <div
                        className="relative"
                        onMouseEnter={() => setAdminMenuOpen(true)}
                        onMouseLeave={() => setAdminMenuOpen(false)}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-900"
                        >
                          管理者メニュー
                          <svg
                            className={`ml-1 w-4 h-4 transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </Button>

                        {/* プルダウンメニュー */}
                        {adminMenuOpen && (
                          <div className="absolute top-full left-0 mt-0 w-48 bg-white border rounded-md shadow-lg py-1 z-50">
                            {adminMenuItems.map((item) => (
                              <button
                                key={item.path}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                onClick={() => {
                                  router.push(item.path);
                                  setAdminMenuOpen(false);
                                }}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* カートアイコン */}
                    <CartIcon />

                    {/* ユーザー名・ログアウト */}
                    <span className="text-sm text-gray-600 max-w-[100px] overflow-hidden truncate">{user.name}</span>
                    
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                      ログアウト
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>
                      ログイン
                    </Button>
                    <Button size="sm" onClick={() => router.push('/register')}>
                      新規登録
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}