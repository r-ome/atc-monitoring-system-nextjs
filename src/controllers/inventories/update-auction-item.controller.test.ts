import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { UpdateAuctionItemController } from "./update-auction-item.controller";
import { AuctionRepository, InventoryRepository } from "src/infrastructure/di/repositories";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("UpdateAuctionItemController logs container barcode changes instead of container ids", async () => {
  const useCaseModule = await import(
    "src/application/use-cases/inventories/update-auction-item.use-case"
  );
  const logActivityModule = await import("@/app/lib/log-activity");

  const previous = {
    auction_bidder: { bidder: { bidder_number: "0007" } },
    inventory: {
      barcode: "32-04-001",
      control: "0001",
      container_id: "container-1",
      container: { container_id: "container-1", barcode: "32-04" },
    },
    description: "AS IS ITEM",
    price: 100,
    qty: "1",
    manifest_number: "M-1",
    status: "UNPAID",
  };

  const updated = {
    auction_bidder: { bidder: { bidder_number: "0007" } },
    inventory: {
      barcode: "32-05-001",
      control: "0001",
      container_id: "container-2",
      container: { container_id: "container-2", barcode: "32-05" },
    },
    description: "AS IS ITEM",
    price: 100,
    qty: "1",
    manifest_number: "M-1",
    status: "UNPAID",
  };

  let getAuctionItemDetailsCalls = 0;
  let activityDescription = "";

  restorers.push(
    patchMethod(
      useCaseModule,
      "updateAuctionItemUseCase",
      async () => undefined as never,
    ),
    patchMethod(InventoryRepository, "getAuctionItemDetails", async () => {
      getAuctionItemDetailsCalls += 1;
      return (getAuctionItemDetailsCalls === 1 ? previous : updated) as never;
    }),
    patchMethod(AuctionRepository, "getAuctionById", async () => ({
      created_at: new Date("2026-04-13T00:00:00.000Z"),
    }) as never),
    patchMethod(
      logActivityModule,
      "logActivity",
      async (_action, _entityType, _entityId, description) => {
        activityDescription = description;
        return undefined as never;
      },
    ),
  );

  const result = await UpdateAuctionItemController({
    auction_id: "auction-1",
    auction_inventory_id: "ai-1",
    inventory_id: "inv-1",
    barcode: "32-05-001",
    control: "0001",
    description: "AS IS ITEM",
    price: 100,
    qty: "1",
    manifest_number: "M-1",
    bidder_number: "0007",
    container_id: "container-2",
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail("Expected update auction item request to succeed");
  }

  assert.match(activityDescription, /Container: 32-04 → 32-05/);
  assert.doesNotMatch(activityDescription, /Container: container-1 → container-2/);
});
