/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'bookthumb.phinf.pstatic.net',
      },
      {
        protocol: 'https',
        hostname: 'shopping-phinf.pstatic.net',
      },
      {
        protocol: 'https',
        hostname: 'image.aladin.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'k.kakaocdn.net',
      },
    ],
  },
};

module.exports = nextConfig;

