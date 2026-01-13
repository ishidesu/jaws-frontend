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
      // {
      //   protocol: 'https',
      //   hostname: 'jaws-api.indranug.my.id',
      //   pathname: '/library/**',
      // },
    ],
  },
};

export default nextConfig;
