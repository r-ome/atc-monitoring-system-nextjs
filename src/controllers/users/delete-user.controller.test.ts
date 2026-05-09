import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { DeleteUserController } from "./delete-user.controller";
import { UserRepository } from "src/infrastructure/di/repositories";
import { patchMethod } from "src/test-utils/patch";
import { NotFoundError } from "src/entities/errors/common";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("DeleteUserController deletes a user and logs the action", async () => {
  let loggedDescription = "";

  restorers.push(
    patchMethod(UserRepository, "deleteUser", async () => ({
      user_id: "user-1",
      name: "Test User",
      username: "testuser",
      role: "ENCODER",
      branch_id: "branch-1",
      last_activity_at: null,
      branch: { branch_id: "branch-1", name: "BIÑAN" },
      created_at: new Date("2026-05-08T00:00:00.000Z"),
      updated_at: new Date("2026-05-08T00:00:00.000Z"),
    }) as never),
  );

  const logActivityModule = await import("@/app/lib/log-activity");
  restorers.push(
    patchMethod(
      logActivityModule,
      "logActivity",
      async (_action, _entityType, _entityId, description) => {
        loggedDescription = description;
        return undefined as never;
      },
    ),
  );

  const result = await RequestContext.run(
    {
      branch_id: "branch-1",
      username: "tester",
      branch_name: "BIÑAN",
    },
    async () => await DeleteUserController("user-1"),
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail("Expected delete user request to succeed");
  }

  assert.equal(loggedDescription, "Deleted user testuser (ENCODER)");
});

test("DeleteUserController returns not found when the user is missing", async () => {
  restorers.push(
    patchMethod(UserRepository, "deleteUser", async () => {
      throw new NotFoundError("User not found!");
    }),
  );

  const result = await RequestContext.run(
    {
      branch_id: "branch-1",
      username: "tester",
      branch_name: "BIÑAN",
    },
    async () => await DeleteUserController("missing-user"),
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("Expected delete user request to fail");
  }
  assert.equal(result.error.message, "User not found!");
});
