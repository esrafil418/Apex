import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseRole, ROLES } from "./role";

describe("parseRole", () => {
  it("accepts the six lowercase roles", () => {
    for (const role of ROLES) {
      assert.equal(parseRole(role), role);
    }
  });

  it("rejects unknown strings, empty strings, and mixed case", () => {
    assert.equal(parseRole("ADMIN"), undefined);
    assert.equal(parseRole("Admin"), undefined);
    assert.equal(parseRole("customer "), undefined);
    assert.equal(parseRole(""), undefined);
    assert.equal(parseRole("superadmin"), undefined);
  });
});
