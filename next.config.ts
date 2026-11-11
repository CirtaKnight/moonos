import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev "N" badge sits on top of the OS chrome in every corner; errors still surface without it.
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
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
