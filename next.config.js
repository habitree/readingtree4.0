/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack 활성화 (성능 향상)
  experimental: {
    turbo: {
      // Turbopack 최적화 설정
      resolveAlias: {
        // 필요한 경우 별칭 설정
      },
      // 메모리 사용량 제한 (필요한 경우)
      // memoryLimit: 4096,
    },
  },
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
  // 개발 환경에서 CSP 설정 (Turbopack HMR을 위해 필요)
  async headers() {
    // 개발 환경에서만 unsafe-eval 허용
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://*.kakao.com https://*.googleapis.com",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: https: blob:",
                "font-src 'self' data:",
                "connect-src 'self' https://*.supabase.co https://*.kakao.com https://*.googleapis.com wss://*.supabase.co",
                "frame-src 'self' https://*.supabase.co https://*.kakao.com https://accounts.google.com",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'none'",
                "upgrade-insecure-requests",
              ].join('; '),
            },
          ],
        },
      ];
    }
    // 프로덕션 환경에서는 strict CSP
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://*.supabase.co https://*.kakao.com https://*.googleapis.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://*.kakao.com https://*.googleapis.com wss://*.supabase.co",
              "frame-src 'self' https://*.supabase.co https://*.kakao.com https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

