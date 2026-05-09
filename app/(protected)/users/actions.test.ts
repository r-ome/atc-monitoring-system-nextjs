import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { deleteUser } from "./actions";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("deleteUser blocks self-delete", async () => {
  const protectedActionModule = await import("@/app/lib/protected-action");

  restorers.push(
    patchMethod(protectedActionModule, "authorizeAction", async () => ({
      ok: true,
      value: {
        id: "user-1",
        role: "OWNER",
        branch: { branch_id: "branch-1", name: "BIÑAN" },
      },
    })),
  );

  const result = await deleteUser("user-1");

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("Expected self-delete to be blocked");
  }

  assert.equal(result.error.message, "Unauthorized");
  assert.equal(result.error.cause, "You cannot delete your own account.");
});
