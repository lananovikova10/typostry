/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent exposing of environment variables not prefixed with NEXT_PUBLIC_
  // This is default behavior, explicitly specified for clarity
  serverExternalPackages: [],

  // Webpack configuration for Web Workers
  webpack: (config) => {
    // Support for Web Workers
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: { loader: 'worker-loader' },
    });

    return config;
  },
};

module.exports = nextConfig;