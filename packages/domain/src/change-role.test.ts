import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { changeRole } from "./change-role";
import type { Profile } from "./profile";
import type { Role } from "./role";

const at = new Date("2026-01-01T00:00:00.000Z");

function profile(id: string, role: Role): Profile {
  return { id, role, displayName: id, createdAt: at, updatedAt: at };
}

const admin = profile("11111111-1111-4111-8111-111111111111", "admin");
const otherAdmin = profile("22222222-2222-4222-8222-222222222222", "admin");
const customer = profile("33333333-3333-4333-8333-333333333333", "customer");

describe("changeRole", () => {
  it("lets an admin assign a known role to someone else", () => {
    assert.deepEqual(
      changeRole({ actor: admin, target: customer, nextRole: "editor", adminCount: 1 }),
      { ok: true, role: "editor" },
    );
  });

  it("rejects every non-admin actor", () => {
    for (const role of ["customer", "manager", "editor", "support", "analyst"] as const) {
      assert.deepEqual(
        changeRole({
          actor: profile("44444444-4444-4444-8444-444444444444", role),
          target: customer,
          nextRole: "editor",
          adminCount: 1,
        }),
        { ok: false, error: "not_admin" },
      );
    }
  });

  it("rejects an admin changing their own role", () => {
    assert.deepEqual(
      changeRole({ actor: admin, target: admin, nextRole: "customer", adminCount: 2 }),
      { ok: false, error: "self_change" },
    );
  });

  it("rejects demoting the last admin", () => {
    assert.deepEqual(
      changeRole({ actor: admin, target: otherAdmin, nextRole: "support", adminCount: 1 }),
      { ok: false, error: "last_admin" },
    );
  });

  it("allows demoting an admin when another admin remains", () => {
    assert.deepEqual(
      changeRole({ actor: admin, target: otherAdmin, nextRole: "support", adminCount: 2 }),
      { ok: true, role: "support" },
    );
  });

  it("allows leaving the last admin as admin", () => {
    assert.deepEqual(
      changeRole({ actor: admin, target: otherAdmin, nextRole: "admin", adminCount: 1 }),
      { ok: true, role: "admin" },
    );
  });

  it("rejects an unknown next role", () => {
    assert.deepEqual(
      changeRole({ actor: admin, target: customer, nextRole: "ADMIN", adminCount: 1 }),
      { ok: false, error: "unknown_role" },
    );
  });
});
