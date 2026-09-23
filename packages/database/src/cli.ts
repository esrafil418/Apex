import { closeDatabase, pingDatabase } from "./client";
import { readDatabaseEnv } from "./env";
import { loadRepoEnv } from "./load-env";
import { seed } from "./seed";

loadRepoEnv();

const command = process.argv[2];

let exitCode = 0;

try {
  await run(command);
} catch (error) {
  console.error(redact(error instanceof Error ? error.message : String(error)));
  exitCode = 1;
} finally {
  if (command === "ping" || command === "seed") {
    await closeDatabase();
  }
}

process.exit(exitCode);

async function run(name: string | undefined): Promise<void> {
  if (name === "assert") {
    readDatabaseEnv(process.env);
    return;
  }

  if (name === "ping") {
    readDatabaseEnv(process.env);
    await pingDatabase();
    console.log("Database connection succeeded.");
    return;
  }

  if (name === "seed") {
    readDatabaseEnv(process.env);
    await seed();
    console.log("Seed completed.");
    return;
  }

  throw new Error("Usage: tsx src/cli.ts <assert|ping|seed>");
}

function redact(message: string): string {
  const secrets = [process.env.DATABASE_URL, process.env.DIRECT_URL].filter(
    (value): value is string => Boolean(value),
  );
  return secrets.reduce((text, secret) => text.split(secret).join("[redacted]"), message);
}
