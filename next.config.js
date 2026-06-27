/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output so the repo's Docker / Cloud Run pipeline keeps working
  // (Vercel ignores this and uses its own build).
  output: "standalone",
  // Serve the static "Glen's Lemons" site (public/glens-lemons/) as the
  // homepage and at its own clean URL. `beforeFiles` runs ahead of the
  // existing app's "/" page so the lemonade site loads at the root domain.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/glens-lemons/index.html" },
        { source: "/glens-lemons", destination: "/glens-lemons/index.html" },
      ],
    };
  },
};

module.exports = nextConfig;
