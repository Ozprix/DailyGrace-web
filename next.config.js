/** @type {import('next').NextConfig} */

const nextConfig = {
  // The experimental serverComponentsExternalPackages setting is often
  // not needed with the latest versions of Next.js and Genkit.
  // The webpack fallback configuration can also be unnecessary
  // if dependencies correctly handle browser vs. server environments.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
