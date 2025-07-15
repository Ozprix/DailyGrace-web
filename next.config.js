/** @type {import('next').NextConfig} */

const nextConfig = {
  // The experimental serverComponentsExternalPackages setting is often
  // not needed with the latest versions of Next.js and Genkit,
  // as long as the libraries are structured correctly.
  // Removing it simplifies the configuration and can resolve some build issues.
  
  // The webpack fallback configuration can also sometimes be unnecessary
  // if dependencies correctly handle browser vs. server environments.
  // We will keep it for now as a safeguard.
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
