import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const forbidden = ["react", "next", "drizzle-orm", "postgres", "@supabase/supabase-js"];

describe("domain package boundary", () => {
  it("does not depend on framework or database libraries", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../package.json"), "utf8"),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };

    const declared = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
    };

    for (const name of forbidden) {
      assert.equal(declared[name], undefined, `${name} must not appear in @apex/domain`);
    }
  });
});
