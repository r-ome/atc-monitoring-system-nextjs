import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { patchMethod } from "src/test-utils/patch";
import {
  AuctionRepository,
  ContainerRepository,
  InventoryRepository,
} from "src/infrastructure/di/repositories";
import { updateManifestUseCase } from "./update-manifest.use-case";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("updateManifestUseCase normalizes control before inventory lookup and persistence", async () => {
  let delegatedRows: Array<Record<string, unknown>> = [];

  restorers.push(
    patchMethod(
      AuctionRepository,
      "getRegisteredBiddersForManifest",
      async () =>
        [
          {
            auction_bidder_id: "ab-1",
            service_charge: 0,
            bidder: { bidder_number: "0007", status: "ACTIVE" },
          },
        ] as never,
    ),
    patchMethod(
      InventoryRepository,
      "getAllInventoriesForManifest",
      async () =>
        [
          {
            inventory_id: "inventory-1",
            container_id: "container-1",
            barcode: "32-04",
            control: "0040",
            status: "UNSOLD",
            auction_date: null,
            auctions_inventory: null,
          },
        ] as never,
    ),
    patchMethod(
      ContainerRepository,
      "getContainerBarcodes",
      async () => [] as never,
    ),
    patchMethod(AuctionRepository, "getMonitoring", async () => [] as never),
    patchMethod(AuctionRepository, "updateManifest", async (_manifestId, rows) => {
      delegatedRows = rows as never;
      return { manifest_id: "manifest-1" } as never;
    }),
  );

  await updateManifestUseCase("auction-1", "manifest-1", {
    manifest_id: "manifest-1",
    barcode: "32-04",
    control: "40",
    description: "ITEM",
    bidder_number: "7",
    price: "100",
    qty: "1",
    manifest_number: "M-1",
    error: "",
  });

  assert.equal(delegatedRows[0]?.control, "0040");
  assert.equal(delegatedRows[0]?.inventory_id, "inventory-1");
});

test("updateManifestUseCase marks sold items in the same auction as DOUBLE ENCODE", async () => {
  let delegatedRows: Array<Record<string, unknown>> = [];

  restorers.push(
    patchMethod(
      AuctionRepository,
      "getRegisteredBiddersForManifest",
      async () =>
        [
          {
            auction_bidder_id: "ab-1",
            service_charge: 0,
            bidder: { bidder_number: "0007", status: "ACTIVE" },
          },
        ] as never,
    ),
    patchMethod(
      InventoryRepository,
      "getAllInventoriesForManifest",
      async () =>
        [
          {
            inventory_id: "inventory-sold",
            container_id: "container-1",
            barcode: "32-04-001",
            control: "0001",
            status: "SOLD",
            auction_date: new Date("2026-05-09T00:00:00.000Z"),
            auctions_inventory: {
              auction_bidder: {
                auction_id: "auction-1",
                bidder: {
                  bidder_number: "0043",
                },
              },
            },
          },
        ] as never,
    ),
    patchMethod(
      ContainerRepository,
      "getContainerBarcodes",
      async () => [] as never,
    ),
    patchMethod(AuctionRepository, "getMonitoring", async () => [] as never),
    patchMethod(AuctionRepository, "updateManifest", async (_manifestId, rows) => {
      delegatedRows = rows as never;
      return { manifest_id: "manifest-1" } as never;
    }),
  );

  await updateManifestUseCase("auction-1", "manifest-1", {
    manifest_id: "manifest-1",
    barcode: "32-04-001",
    control: "0001",
    description: "ITEM",
    bidder_number: "7",
    price: "100",
    qty: "1",
    manifest_number: "M-1",
    error: "",
  });

  assert.equal(
    delegatedRows[0]?.error,
    "DOUBLE ENCODE: already encoded in this auction to bidder #0043",
  );
  assert.equal(delegatedRows[0]?.isValid, false);
});
