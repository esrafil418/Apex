import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Loads repository-root env files into process.env.
 * Existing process variables win. .env.local wins over .env.
 */
export function loadRepoEnv(): void {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  config({ path: resolve(repoRoot, ".env.local") });
  config({ path: resolve(repoRoot, ".env") });
}
