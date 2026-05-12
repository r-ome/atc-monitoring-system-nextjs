import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { MergeInventoriesController } from "./merge-inventories.controller";
import { InventoryRepository } from "src/infrastructure/di/repositories";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("MergeInventoriesController logs merged item details for activity logs", async () => {
  const logActivityModule = await import("@/app/lib/log-activity");
  let activityDescription = "";
  let entityId = "";

  restorers.push(
    patchMethod(InventoryRepository, "mergeInventories", async () => ({
      merged_into_barcode: "32-04",
      items: [
        {
          barcode: "32-04",
          control: "0004",
          description: "SOLD BAG",
          price: "1200",
          bidder_number: "740",
        },
        {
          barcode: "32-04-001",
          control: "0001",
          description: "UNSOLD BAG",
          price: "",
          bidder_number: "",
        },
      ],
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

  const result = await MergeInventoriesController({
    old_inventory_id: "sold-inventory-1",
    new_inventory_id: "unsold-inventory-1",
  });

  assert.equal(result.ok, true);
  assert.equal(entityId, "unsold-inventory-1");

  const parsed = JSON.parse(activityDescription) as {
    type: string;
    summary: string;
    items: Array<{
      barcode: string;
      control: string;
      description: string;
      price: string;
      bidder_number: string;
    }>;
  };

  assert.equal(parsed.type, "merged_inventories");
  assert.equal(parsed.summary, "Merged inventories into container 32-04");
  assert.deepEqual(parsed.items, [
    {
      barcode: "32-04",
      control: "0004",
      description: "SOLD BAG",
      price: "1200",
      bidder_number: "740",
    },
    {
      barcode: "32-04-001",
      control: "0001",
      description: "UNSOLD BAG",
      price: "",
      bidder_number: "",
    },
  ]);
});
