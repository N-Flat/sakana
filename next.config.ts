import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // output: 'export',   
  trailingSlash: true,     // URLの末尾にスラッシュ
  basePath: '/ec',         // サブディレクトリで公開する場合
  images: {
    unoptimized: true,     // 静的エクスポートでは画像最適化無効
  },
  devIndicators: false,
};

export default nextConfig;
