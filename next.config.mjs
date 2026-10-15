/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Keep the editor preview's Windows file handles separate from export builds.
  // With output:export, production distDir also changes the export destination,
  // so keep its default to preserve out/ for hosting.
  distDir: process.env.NODE_ENV === 'development' ? '.next-development' : '.next',
  images: { unoptimized: true },
  poweredByHeader: false,
  devIndicators: false,
};
export default nextConfig;
