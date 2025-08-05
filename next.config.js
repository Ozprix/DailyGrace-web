/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use server-side rendering instead of static generation for client-side pages
  output: 'standalone',
  
  // Disable static generation for pages that use client-side features
  trailingSlash: false,
  
  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression
  compress: true,

  // Webpack configuration for fallbacks
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    } else {
      // Server-side fallbacks for browser-specific modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        // Add fallbacks for browser-specific globals
        global: false,
        self: false,
        window: false,
        document: false,
        navigator: false,
        location: false,
        history: false,
        localStorage: false,
        sessionStorage: false,
        indexedDB: false,
        IDBKeyRange: false,
        crypto: false,
        performance: false,
        requestAnimationFrame: false,
        cancelAnimationFrame: false,
        webkitRequestAnimationFrame: false,
        webkitCancelAnimationFrame: false,
        mozRequestAnimationFrame: false,
        mozCancelAnimationFrame: false,
        oRequestAnimationFrame: false,
        oCancelAnimationFrame: false,
        msRequestAnimationFrame: false,
        msCancelAnimationFrame: false,
      };
    }

    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    };

    return config;
  },

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
            value: 'origin-when-cross-origin',
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
    ];
  },

  // Rewrites for API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
