export class DatabaseEnvError extends Error {
  override readonly name = "DatabaseEnvError";

  constructor(message: string) {
    super(message);
  }
}

export type DatabaseEnv = {
  databaseUrl: string;
  directUrl: string;
};

type EnvSource = Record<string, string | undefined>;

const PUBLIC_DATABASE_KEYS = ["NEXT_PUBLIC_DATABASE_URL", "NEXT_PUBLIC_DIRECT_URL"] as const;

/**
 * Local placeholder so drizzle-kit can load its config for generate/check
 * without a database. migrate, ping, and seed call readDatabaseEnv and refuse
 * to run unless DATABASE_URL is set.
 */
export const OFFLINE_MIGRATION_URL = "postgresql://postgres:postgres@127.0.0.1:5432/apex";

export function readDatabaseEnv(source: EnvSource): DatabaseEnv {
  for (const key of PUBLIC_DATABASE_KEYS) {
    if (source[key]?.trim()) {
      throw new DatabaseEnvError(
        `${key} is set. Database credentials are server-only and use DATABASE_URL or DIRECT_URL.`,
      );
    }
  }

  const databaseUrl = requiredPostgresUrl(source.DATABASE_URL, "DATABASE_URL");
  const directRaw = source.DIRECT_URL?.trim();
  const directUrl = directRaw ? requiredPostgresUrl(directRaw, "DIRECT_URL") : databaseUrl;

  return { databaseUrl, directUrl };
}

export function migrationDatabaseUrl(source: EnvSource): string {
  const directUrl = source.DIRECT_URL?.trim();
  if (directUrl) {
    return directUrl;
  }

  const databaseUrl = source.DATABASE_URL?.trim();
  if (databaseUrl) {
    return databaseUrl;
  }

  return OFFLINE_MIGRATION_URL;
}

function requiredPostgresUrl(value: string | undefined, name: string): string {
  const url = value?.trim();
  if (!url) {
    throw new DatabaseEnvError(
      `${name} is required. Add it to the repository root .env.local. Database credentials are server-only.`,
    );
  }

  if (!isPostgresUrl(url)) {
    throw new DatabaseEnvError(`${name} must be a postgresql:// or postgres:// URL.`);
  }

  return url;
}

function isPostgresUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "postgresql:" || url.protocol === "postgres:";
  } catch {
    return false;
  }
}
