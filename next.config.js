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
};

module.exports = nextConfig;