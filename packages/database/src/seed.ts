import { getDatabase } from "./client";

/**
 * Development seed entry. Fixture inserts for a feature belong inside this
 * transaction, in a fixed order. There is no commerce data yet.
 */
export async function seed(): Promise<void> {
  const database = getDatabase();
  await database.transaction(async () => {
    // Feature fixtures are inserted here.
  });
}
