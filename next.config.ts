import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/library/**',
      },
      {
        protocol: 'https',
        hostname: 'jaws-api.indranug.my.id',
        pathname: '/library/**',
      },
    ],
  },
  // Temporarily disable CSP to allow Dify chatbot
  // async headers() {
  //   return [
  //     {
  //       source: '/(.*)',
  //       headers: [
  //         {
  //           key: 'Content-Security-Policy',
  //           value: [
  //             "default-src 'self'",
  //             "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://udify.app https://*.udify.app",
  //             "style-src 'self' 'unsafe-inline'",
  //             "img-src 'self' data: blob: https: http:",
  //             "font-src 'self' data:",
  //             "connect-src 'self' https://*.supabase.co https://udify.app https://*.udify.app wss://*.udify.app http://localhost:8000 https://jaws-api.indranug.my.id",
  //             "frame-src 'self' https://udify.app https://*.udify.app",
  //             "worker-src 'self' blob:",
  //             "object-src 'none'",
  //             "base-uri 'self'",
  //             "form-action 'self'"
  //           ].join('; ')
  //         }
  //       ]
  //     }
  //   ]
  // }
};

export default nextConfig;
