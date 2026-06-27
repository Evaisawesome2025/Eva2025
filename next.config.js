/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output so the repo's Docker / Cloud Run pipeline keeps working
  // (Vercel ignores this and uses its own build).
  output: "standalone",
  // Serve the static "Glen's Lemons" site (public/glens-lemons/) at a clean URL.
  async rewrites() {
    return [
      { source: "/glens-lemons", destination: "/glens-lemons/index.html" },
    ];
  },
};

module.exports = nextConfig;
