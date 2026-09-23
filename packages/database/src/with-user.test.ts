import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { InvalidUserIdError, withUser } from "./with-user";

describe("withUser", () => {
  it("rejects a non-uuid before touching SQL", async () => {
    await assert.rejects(() => withUser("not-a-uuid", async () => undefined), InvalidUserIdError);
    await assert.rejects(() => withUser("", async () => undefined), InvalidUserIdError);
  });
});
