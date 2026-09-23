import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DatabaseEnvError, migrationDatabaseUrl, OFFLINE_MIGRATION_URL, readDatabaseEnv } from "./env";

const validUrl = "postgresql://apex:secret@127.0.0.1:5432/apex";
const directUrl = "postgresql://apex:other-secret@127.0.0.1:5432/apex";

describe("readDatabaseEnv", () => {
  it("requires DATABASE_URL", () => {
    assert.throws(() => readDatabaseEnv({}), DatabaseEnvError);
  });

  it("accepts a postgres URL and defaults DIRECT_URL to DATABASE_URL", () => {
    const env = readDatabaseEnv({ DATABASE_URL: validUrl });
    assert.equal(env.databaseUrl, validUrl);
    assert.equal(env.directUrl, validUrl);
  });

  it("accepts the postgres:// protocol and an explicit DIRECT_URL", () => {
    const env = readDatabaseEnv({
      DATABASE_URL: "postgres://apex:secret@127.0.0.1:5432/apex",
      DIRECT_URL: directUrl,
    });
    assert.equal(env.directUrl, directUrl);
  });

  it("rejects a public database variable and omits the secret from the error", () => {
    assert.throws(
      () => readDatabaseEnv({ DATABASE_URL: validUrl, NEXT_PUBLIC_DATABASE_URL: validUrl }),
      (error: unknown) => {
        assert.ok(error instanceof DatabaseEnvError);
        assert.equal(error.message.includes("secret"), false);
        assert.equal(error.message.includes("NEXT_PUBLIC_DATABASE_URL"), true);
        return true;
      },
    );
  });

  it("rejects NEXT_PUBLIC_DIRECT_URL", () => {
    assert.throws(
      () => readDatabaseEnv({ DATABASE_URL: validUrl, NEXT_PUBLIC_DIRECT_URL: directUrl }),
      DatabaseEnvError,
    );
  });

  it("rejects a non-postgres URL without echoing it", () => {
    assert.throws(
      () => readDatabaseEnv({ DATABASE_URL: "https://user:secret@example.com/db" }),
      (error: unknown) => {
        assert.ok(error instanceof DatabaseEnvError);
        assert.equal(error.message.includes("secret"), false);
        return true;
      },
    );
  });
});

describe("migrationDatabaseUrl", () => {
  it("prefers DIRECT_URL, then DATABASE_URL, then the offline placeholder", () => {
    assert.equal(migrationDatabaseUrl({ DIRECT_URL: directUrl, DATABASE_URL: validUrl }), directUrl);
    assert.equal(migrationDatabaseUrl({ DATABASE_URL: validUrl }), validUrl);
    assert.equal(migrationDatabaseUrl({}), OFFLINE_MIGRATION_URL);
  });
});
