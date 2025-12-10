import type { NextConfig } from "next";
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // 開発中は無効化
  register: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {}, // Silence Turbopack configuration warning
};

export default withPWA(nextConfig);
