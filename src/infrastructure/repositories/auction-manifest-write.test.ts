import test from "node:test";
import assert from "node:assert/strict";

import { buildReusedInventoryUpdates } from "./auction-manifest-write";

test("buildReusedInventoryUpdates keeps uploaded control for reused inventories", () => {
  const auctionDate = new Date("2026-04-11T00:00:00.000Z");

  const [normalUpdate] = buildReusedInventoryUpdates(
    [
      {
        BARCODE: "98-36-510",
        CONTROL: "1892",
        DESCRIPTION: "ASSTD",
        BIDDER: "0859",
        PRICE: "1000",
        QTY: "1",
        MANIFEST: "M-1",
        isValid: true,
        forUpdating: true,
        isSlashItem: null,
        error: "",
        inventory_id: "inventory-1",
      },
    ],
    auctionDate,
  );

  assert.equal(normalUpdate.inventory_id, "inventory-1");
  assert.deepEqual(normalUpdate.data, {
    control: "1892",
    status: "SOLD",
    auction_date: auctionDate,
  });
});

test("buildReusedInventoryUpdates preserves bought-item inventory mutations", () => {
  const auctionDate = new Date("2026-04-11T00:00:00.000Z");

  const [boughtItemUpdate] = buildReusedInventoryUpdates(
    [
      {
        BARCODE: "98-36-510",
        CONTROL: "1892",
        DESCRIPTION: "ASSTD",
        BIDDER: "0859",
        PRICE: "2500",
        QTY: "1",
        MANIFEST: "M-1",
        isValid: true,
        forUpdating: true,
        isSlashItem: null,
        error: "",
        inventory_id: "inventory-1",
      },
    ],
    auctionDate,
    true,
  );

  assert.deepEqual(boughtItemUpdate.data, {
    control: "1892",
    status: "BOUGHT_ITEM",
    auction_date: auctionDate,
    is_bought_item: 2500,
  });
});
