import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, describe, it } from "node:test";
import { eq } from "drizzle-orm";
import { closeDatabase, getDatabase } from "./client";
import { loadRepoEnv } from "./load-env";
import { profiles } from "./schema/profiles";
import { withUser } from "./with-user";

loadRepoEnv();

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());
const customerId = randomUUID();
const otherId = randomUUID();

describe("profiles row level security", { skip: !hasDatabase }, () => {
  after(async () => {
    const database = getDatabase();
    await database.delete(profiles).where(eq(profiles.id, customerId));
    await database.delete(profiles).where(eq(profiles.id, otherId));
    await closeDatabase();
  });

  it("applies policies only inside withUser; the owner pool still sees every row", async () => {
    const database = getDatabase();
    await database.insert(profiles).values([
      { id: customerId, role: "customer", displayName: "A" },
      { id: otherId, role: "customer", displayName: "B" },
    ]);

    const asCustomer = await withUser(customerId, (tx) => tx.select().from(profiles));
    assert.deepEqual(
      asCustomer.map((row) => row.id),
      [customerId],
    );

    await database.update(profiles).set({ role: "admin" }).where(eq(profiles.id, customerId));

    const asAdmin = await withUser(customerId, (tx) => tx.select().from(profiles));
    assert.equal(asAdmin.length, 2);

    await withUser(customerId, (tx) =>
      tx.update(profiles).set({ displayName: "changed" }).where(eq(profiles.id, otherId)),
    );
    const other = await database.query.profiles.findFirst({
      where: eq(profiles.id, otherId),
    });
    assert.equal(other?.displayName, "B");

    const asOwner = await database.select().from(profiles);
    assert.equal(asOwner.filter((row) => row.id === customerId || row.id === otherId).length, 2);
  });
});
