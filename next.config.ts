import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // output: 'export',   
  images: {
    unoptimized: true,     // 静的エクスポートでは画像最適化無効
  },
  devIndicators: false,
};

export default nextConfig;
