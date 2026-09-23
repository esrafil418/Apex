import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@apex/application",
    "@apex/database",
    "@apex/domain",
    "@apex/infrastructure",
    "@apex/types",
    "@apex/ui",
    "@apex/validation",
  ],
};

export default nextConfig;
