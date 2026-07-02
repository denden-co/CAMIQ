/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next 16: typedRoutes graduated out of experimental.
  typedRoutes: true,
  // Pin the workspace root — a stray ~/package-lock.json was making
  // Turbopack infer the wrong root (warning on every dev start).
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
