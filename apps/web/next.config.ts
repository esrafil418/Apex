import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = dirname(fileURLToPath(import.meta.url));
loadEnvConfig(resolve(appDirectory, "../.."), process.env.NODE_ENV !== "production");

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
