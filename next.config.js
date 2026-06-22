/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output so the repo's Docker / Cloud Run pipeline keeps working
  // (Vercel ignores this and uses its own build).
  output: "standalone",
};

module.exports = nextConfig;
