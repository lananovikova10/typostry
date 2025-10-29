/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent exposing of environment variables not prefixed with NEXT_PUBLIC_
  // This is default behavior, explicitly specified for clarity
  serverExternalPackages: [],

  // Webpack configuration for Web Workers and code splitting
  webpack: (config, { isServer }) => {
    // Support for Web Workers
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: { loader: 'worker-loader' },
    });

    // Optimize bundle splitting
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
            },
            // Markdown processing libraries
            markdown: {
              test: /[\\/]node_modules[\\/](unified|remark-.*|rehype-.*|micromark|katex|shiki|mermaid)[\\/]/,
              name: 'markdown',
              priority: 20,
            },
            // UI components
            ui: {
              test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
              name: 'ui-components',
              priority: 15,
            },
            // Common chunks
            commons: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
};

module.exports = nextConfig;