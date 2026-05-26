import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { DeleteInventoryController } from "./delete-inventory.controller";
import { InventoryRepository } from "src/infrastructure/di/repositories";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("DeleteInventoryController logs barcode and control instead of raw inventory id", async () => {
  const logActivityModule = await import("@/app/lib/log-activity");
  let entityId = "";
  let activityDescription = "";

  restorers.push(
    patchMethod(InventoryRepository, "deleteInventory", async () => ({
      barcode: "25-38-749",
      control: "2772",
    })),
    patchMethod(
      logActivityModule,
      "logActivity",
      async (_action, _entityType, loggedEntityId, description) => {
        entityId = loggedEntityId;
        activityDescription = description;
        return undefined as never;
      },
    ),
  );

  const result = await DeleteInventoryController("inventory-1");

  assert.equal(result.ok, true);
  assert.equal(entityId, "inventory-1");
  assert.equal(activityDescription, "Deleted inventory 25-38-749:2772");
});
