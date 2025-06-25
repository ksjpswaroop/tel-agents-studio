/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    // Ignore ESLint errors during builds
    ignoreDuringBuilds: true,
  },
  experimental: {
    reactCompiler: true,
  },
};

module.exports = nextConfig; 