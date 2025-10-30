/** @type {import('next').NextConfig} */
// Temporarily disable PWA to fix Webpack issues in development
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === 'development',
//   runtimeCaching: [
//     {
//       urlPattern: /^https:\/\/taxasge-dev\.firebase\.com\/.*/i,
//       handler: 'NetworkFirst',
//       options: {
//         cacheName: 'api-cache',
//         expiration: {
//           maxEntries: 50,
//           maxAgeSeconds: 5 * 60, // 5 minutes
//         },
//       },
//     },
//     {
//       urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
//       handler: 'CacheFirst',
//       options: {
//         cacheName: 'image-cache',
//         expiration: {
//           maxEntries: 100,
//           maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
//         },
//       },
//     },
//   ],
// });

const nextConfig = {
  output: 'export', // Enable static export for Firebase Hosting
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: [
      'taxasge-dev.firebase.com',
      'taxasge-prod.firebase.com',
      'storage.googleapis.com',
      'firebasestorage.googleapis.com'
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // SEO & Performance
  compress: true,
  poweredByHeader: false,

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=60',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/services',
        destination: '/search',
        permanent: true,
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /node_modules/,
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true,
        },
      },
    };

    return config;
  },

  // Environment variables
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'https://taxasge-dev.firebase.com',
    SITE_URL: process.env.SITE_URL || 'https://taxasge-dev.web.app',
  },

  // Experimental features
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'date-fns',
      'lodash',
    ],
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
};

// module.exports = withPWA(nextConfig); // Temporarily disabled
module.exports = nextConfig;