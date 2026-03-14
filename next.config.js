/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent exposing of environment variables not prefixed with NEXT_PUBLIC_
  // This is default behavior, explicitly specified for clarity
  serverExternalPackages: [],
};

module.exports = nextConfig;