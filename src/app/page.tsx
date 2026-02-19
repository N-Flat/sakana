'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const setRef = (id: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[id] = el;
  };

  return (
    <div className="min-h-screen">
      {/* ========================================
          Hero Section - SAKANA.EC
          ======================================== */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        {/* メインタイトル */}
        <div
          className="text-center z-10"
          style={{
            transform: `translateY(${scrollY * 0.3}px)`,
            opacity: Math.max(0, 1 - scrollY / 500),
          }}
        >
          <h1 className="text-8xl font-bold mb-4 tracking-wider">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent drop-shadow-lg">
              SAKANA
            </span>
            <span className="text-rose-600 text-5xl">.EC</span>
          </h1>
          <p className="text-2xl text-blue-700/80 font-light tracking-wide mb-8">
            海のように広がる、ECの可能性
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
              onClick={() => router.push('/products')}
            >
              商品を見る
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-blue-400 text-blue-700 hover:bg-blue-50"
              onClick={() => router.push('/login')}
            >
              ログイン
            </Button>
          </div>
        </div>

        {/* スクロールインジケーター */}
        <div
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce"
          style={{ opacity: Math.max(0, 1 - scrollY / 200) }}
        >
          <div className="flex flex-col items-center text-blue-600/60">
            <span className="text-sm mb-2">Scroll</span>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* ========================================
          About Section - サイト概要
          ======================================== */}
      <section
        id="about"
        ref={setRef('about')}
        className={`py-24 px-4 transition-all duration-1000 ${
          isVisible['about'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-blue-800 mb-6">
            SAKANA.ECとは
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed mb-12">
            SAKANA.ECは、<span className="text-blue-600 font-semibold">在庫管理から注文・出荷まで</span>を
            一元管理できるECプラットフォームです。<br />
            直感的なUIと堅牢なバックエンドで、<br />
            ビジネスの可能性を引き出します。
          </p>

          {/* 特徴カード */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/90 backdrop-blur border-blue-100 hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">在庫管理</h3>
                <p className="text-gray-600">
                  リアルタイムな在庫追跡、<br />安全在庫アラート機能
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur border-blue-100 hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">注文管理</h3>
                <p className="text-gray-600">
                  注文から出荷まで<br />シームレスに管理
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur border-blue-100 hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">高速・軽量</h3>
                <p className="text-gray-600">
                  Next.js + Laravel<br />モダンな技術スタック
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ========================================
          Features Section - 機能紹介
          ======================================== */}
      <section
        id="features"
        ref={setRef('features')}
        className={`py-24 px-4 transition-all duration-1000 delay-200 ${
          isVisible['features'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-blue-800 mb-12 text-center">
            主な機能
          </h2>

          <div className="space-y-8">
            {/* 機能1 */}
            <div className="flex items-center gap-8 bg-white/80 backdrop-blur rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">商品管理</h3>
                <p className="text-gray-600">
                  商品の登録・編集・削除。SKU（バリエーション）管理、画像アップロード、カテゴリ分類に対応。
                  論理削除による安全なデータ管理も可能です。
                </p>
              </div>
            </div>

            {/* 機能2 */}
            <div className="flex items-center gap-8 bg-white/80 backdrop-blur rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">在庫管理</h3>
                <p className="text-gray-600">
                  実在庫・引当数・有効在庫をリアルタイムで把握。入庫・調整処理、
                  安全在庫を下回った際のアラート機能で欠品を防止します。
                </p>
              </div>
            </div>

            {/* 機能3 */}
            <div className="flex items-center gap-8 bg-white/80 backdrop-blur rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">注文・出荷管理</h3>
                <p className="text-gray-600">
                  カートから注文確定、在庫引当、ピッキング、梱包、発送、配達完了まで。
                  一連のフローをステータス管理し、部分出荷にも対応しています。
                </p>
              </div>
            </div>

            {/* 機能4 */}
            <div className="flex items-center gap-8 bg-white/80 backdrop-blur rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white text-2xl font-bold">4</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">顧客機能</h3>
                <p className="text-gray-600">
                  会員登録・ログイン、配送先住所管理、お気に入り機能、注文履歴確認。
                  顧客が使いやすいシンプルなUIを提供します。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          Tech Stack Section - 技術スタック
          ======================================== */}
      <section
        id="tech"
        ref={setRef('tech')}
        className={`py-24 px-4 transition-all duration-1000 delay-300 ${
          isVisible['tech'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-blue-800 mb-12">
            技術スタック
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow-sm">
              <div className="text-4xl mb-3">⚛️</div>
              <h3 className="font-bold text-gray-800">Next.js 14</h3>
              <p className="text-sm text-gray-500">Frontend</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow-sm">
              <div className="text-4xl mb-3">🐘</div>
              <h3 className="font-bold text-gray-800">Laravel 11</h3>
              <p className="text-sm text-gray-500">Backend API</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow-sm">
              <div className="text-4xl mb-3">🗄️</div>
              <h3 className="font-bold text-gray-800">MySQL</h3>
              <p className="text-sm text-gray-500">Database</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow-sm">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="font-bold text-gray-800">Tailwind CSS</h3>
              <p className="text-sm text-gray-500">Styling</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          CTA Section
          ======================================== */}
      <section
        id="cta"
        ref={setRef('cta')}
        className={`py-24 px-4 transition-all duration-1000 delay-400 ${
          isVisible['cta'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-blue-800 mb-6">
            さあ、始めましょう
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            SAKANA.ECで、ECビジネスを次のステージへ
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
              onClick={() => router.push('/products')}
            >
              商品一覧を見る
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-blue-400 text-blue-700 hover:bg-blue-50"
              onClick={() => router.push('/register')}
            >
              新規登録
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-lg px-8 py-6 text-blue-600 hover:bg-blue-50"
              onClick={() => router.push('/admin')}
            >
              管理画面へ →
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================
          Footer
          ======================================== */}
      <footer className="py-8 px-4 border-t border-blue-100">
        <div className="max-w-4xl mx-auto text-center text-gray-500">
          <p className="text-sm">
            © 2025 SAKANA.EC - Portfolio Project
          </p>
        </div>
      </footer>
    </div>
  );
}