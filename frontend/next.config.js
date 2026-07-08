/** @type {import('next').NextConfig} */
// ⚠️ BACKEND_URL 必须在 Vercel 环境变量中设置（部署时或在 Dashboard 中）
// 本地开发默认 http://localhost:8000
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
