import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT_STANDALONE === '1' ? 'standalone' : undefined,
  transpilePackages: ['@campaign/shared'],
  turbopack: {
    root: process.env.NEXT_OUTPUT_STANDALONE === '1' ? '../..' : undefined,
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/:path*` },
    ];
  },
};

export default nextConfig;
