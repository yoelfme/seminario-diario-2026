import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile the shared design package so its TypeScript/JSX source is
  // compiled by this app (no separate build step needed in the package).
  transpilePackages: ["@repo/ui"],
};

export default nextConfig;
