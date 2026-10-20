import type { NextConfig } from "next";

// Fully static: every page is prerendered to HTML at build time and all data
// lives in the visitor's browser (IndexedDB). There is no server to call.
const nextConfig: NextConfig = {
  output: "export",
  // GitHub Pages serves the site under /<repo>; Vercel serves it at the root.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  // Emit /moves/squat/index.html so every static host resolves clean URLs.
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
