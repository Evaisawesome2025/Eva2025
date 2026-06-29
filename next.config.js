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
  // Always revalidate the Glen's Lemons static files so visitors never get
  // served a stale cached page after an update.
  async headers() {
    return [
      {
        source: "/glens-lemons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        source: "/",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
};

module.exports = nextConfig;
