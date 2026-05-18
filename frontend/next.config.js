/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Code splitting and optimization
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // Webpack optimization
  webpack: (config, { isServer }) => {
    config.optimization = {
      ...config.optimization,
      minimize: true,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            filename: 'chunks/vendor.js',
            test: /node_modules/,
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Separate chunk for lucide-react
          lucide: {
            test: /[\\/]node_modules[\\/]lucide-react/,
            name: 'lucide-react',
            priority: 20,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Separate chunk for framer-motion
          framer: {
            test: /[\\/]node_modules[\\/]framer-motion/,
            name: 'framer-motion',
            priority: 20,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    };
    return config;
  },

  // Enable SWR caching headers
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },

  // Headers for cache control
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },

  // Redirects for optimization
  async redirects() {
    return [];
  },

  // Rewrites for API optimization
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: 'http://localhost:5000/api/:path*',
        },
      ],
    };
  },
};

module.exports = nextConfig;
