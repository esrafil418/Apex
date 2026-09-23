import { sql } from "drizzle-orm";
import { getDatabase, type Database } from "./client";

export const APEX_APP_ROLE = "apex_app";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class InvalidUserIdError extends Error {
  override readonly name = "InvalidUserIdError";

  constructor() {
    super("withUser requires a uuid");
  }
}

/**
 * User-scoped work. Sets a transaction-local user id, then SET LOCAL ROLE to
 * apex_app so row level security applies. getDatabase() stays the owner pool
 * and still bypasses those policies.
 */
export async function withUser<T>(userId: string, fn: (tx: Database) => Promise<T>): Promise<T> {
  if (!UUID_PATTERN.test(userId)) {
    throw new InvalidUserIdError();
  }

  return getDatabase().transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.user_id', ${userId}, true)`);
    await tx.execute(sql`set local role apex_app`);
    return fn(tx);
  });
}
