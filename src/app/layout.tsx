import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Navbar from "@/components/Navbar";
import SeaBackground from "@/components/SeaBackground";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EC Shop",
  description: "海の中のECショップ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {/* 海中背景 */}
        <SeaBackground />
        
        <AuthProvider>
          <CartProvider>
            {/* ナビゲーションバー */}
            <Navbar />
            
            {/* メインコンテンツ */}
            <main className="relative z-10">
              {children}
            </main>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}