
import withPWAInit from '@ducanh2912/next-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // This is the fix for the "Module not found: Can't resolve 'fs'" and other server-side module errors.
    // It prevents server-side packages from being bundled for the browser.
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        net: false,
        tls: false,
        'async_hooks': false,
        http2: false,
        dns: false,
      };
    }
    
    // Add path alias
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    
    return config;
  },
};

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
});

export default withPWA(nextConfig);
