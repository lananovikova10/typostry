/** @type {import('next').NextConfig} */
const nextConfig = {
  // Runtime environment variable validation
  onDemandEntries: {
    // Validate that required environment variables are set
    websocketPort: () => {
      // Verify Unsplash API keys if used in the application
      const requiredEnvVars = ['UNSPLASH_ACCESS_KEY', 'UNSPLASH_SECRET_KEY'];

      const missingVars = requiredEnvVars.filter(
        (varName) => !process.env[varName] || process.env[varName].trim() === ''
      );

      if (missingVars.length > 0) {
        console.warn(
          `\n⚠️  Missing required environment variables: ${missingVars.join(', ')}\n` +
          `   Please set these in your .env.local file.\n`
        );
      }

      // Default websocket port
      return 3001;
    }
  },

  // Prevent exposing of environment variables not prefixed with NEXT_PUBLIC_
  // This is default behavior, explicitly specified for clarity
  experimental: {
    serverComponentsExternalPackages: [],
  },

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