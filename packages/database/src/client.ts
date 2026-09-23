import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { readDatabaseEnv } from "./env";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

type DatabaseStore = {
  client: postgres.Sql;
  database: Database;
};

const globalForDatabase = globalThis as typeof globalThis & {
  __apexDatabase?: DatabaseStore;
};

/**
 * Server-side Postgres client. The connection uses DATABASE_URL, which is the
 * database owner role and bypasses row level security. Keep this pool for
 * migrations, seeds, and trusted jobs. User-scoped reads go through withUser.
 */
export function getDatabase(): Database {
  const existing = globalForDatabase.__apexDatabase;
  if (existing) {
    return existing.database;
  }

  const { databaseUrl } = readDatabaseEnv(process.env);
  const client = postgres(databaseUrl, {
    prepare: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  const database = drizzle({ client, schema });
  globalForDatabase.__apexDatabase = { client, database };
  return database;
}

export async function pingDatabase(): Promise<void> {
  await getDatabase().execute(sql`select 1`);
}

export async function closeDatabase(): Promise<void> {
  const current = globalForDatabase.__apexDatabase;
  if (!current) {
    return;
  }

  delete globalForDatabase.__apexDatabase;
  await current.client.end({ timeout: 5 });
}
