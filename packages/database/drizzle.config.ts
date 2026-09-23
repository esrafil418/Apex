import { defineConfig } from "drizzle-kit";
import { migrationDatabaseUrl } from "./src/env";
import { loadRepoEnv } from "./src/load-env";

loadRepoEnv();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./migrations",
  strict: true,
  verbose: true,
  dbCredentials: {
    url: migrationDatabaseUrl(process.env),
  },
});
