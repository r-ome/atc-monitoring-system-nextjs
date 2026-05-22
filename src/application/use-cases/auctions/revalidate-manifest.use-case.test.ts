import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { patchMethod } from "src/test-utils/patch";
import {
  AuctionRepository,
  ContainerRepository,
  InventoryRepository,
} from "src/infrastructure/di/repositories";
import { revalidateManifestUseCase } from "./revalidate-manifest.use-case";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("revalidateManifestUseCase preserves slash metadata on preview rows", async () => {
  restorers.push(
    patchMethod(AuctionRepository, "getMonitoring", async () => [] as never),
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
      async () => [] as never,
    ),
    patchMethod(
      ContainerRepository,
      "getContainerBarcodes",
      async () => [] as never,
    ),
  );

  const [row] = await revalidateManifestUseCase("auction-1", [
    {
      BARCODE: "98-45-104",
      CONTROL: "1158",
      DESCRIPTION: "F. CHAIR",
      BIDDER: "0007",
      PRICE: "100",
      QTY: "1",
      MANIFEST: "M-1",
      auction_bidder_id: "ab-1",
      service_charge: 0,
      container_id: "container-1",
      inventory_id: "inventory-1",
      isValid: true,
      forUpdating: true,
      status: "UNPAID",
      isSlashItem: "slash-group-1",
      auction_inventory_id: "ai-1",
      error: "",
      warning: "",
    },
  ] as never);

  assert.equal(row.isSlashItem, "slash-group-1");
  assert.equal(row.BARCODE, "98-45-104");
});

test("revalidateManifestUseCase clears stale missing container errors when the container exists", async () => {
  restorers.push(
    patchMethod(AuctionRepository, "getMonitoring", async () => [] as never),
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
      async () => [] as never,
    ),
    patchMethod(
      ContainerRepository,
      "getContainerBarcodes",
      async () =>
        [
          {
            container_id: "container-1",
            barcode: "98-45",
          },
        ] as never,
    ),
  );

  const [row] = await revalidateManifestUseCase("auction-1", [
    {
      BARCODE: "98-45-104",
      CONTROL: "1158",
      DESCRIPTION: "F. CHAIR",
      BIDDER: "0007",
      PRICE: "100",
      QTY: "1",
      MANIFEST: "M-1",
      auction_bidder_id: "ab-1",
      service_charge: 0,
      container_id: null,
      inventory_id: null,
      isValid: false,
      forUpdating: false,
      status: undefined,
      isSlashItem: null,
      auction_inventory_id: null,
      error: "Container 98-45 does not exist",
      warning: "",
    },
  ] as never);

  assert.equal(row.isValid, true);
  assert.equal(row.error, "");
  assert.equal(row.container_id, "container-1");
});

test("revalidateManifestUseCase expands slashed barcode edits", async () => {
  restorers.push(
    patchMethod(AuctionRepository, "getMonitoring", async () => [] as never),
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
      async () => [] as never,
    ),
    patchMethod(
      ContainerRepository,
      "getContainerBarcodes",
      async () =>
        [
          {
            container_id: "container-1",
            barcode: "25-04",
          },
          {
            container_id: "container-2",
            barcode: "32-04",
          },
        ] as never,
    ),
  );

  const rows = await revalidateManifestUseCase("auction-1", [
    {
      BARCODE: "25-04/32-04-123",
      CONTROL: "100/200",
      DESCRIPTION: "CHAIRS",
      BIDDER: "0007",
      PRICE: "200",
      QTY: "2",
      MANIFEST: "M-1",
      auction_bidder_id: "ab-1",
      service_charge: 0,
      container_id: null,
      inventory_id: null,
      isValid: true,
      forUpdating: false,
      status: undefined,
      isSlashItem: null,
      auction_inventory_id: null,
      error: "",
      warning: "",
    },
  ] as never);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].BARCODE, "25-04");
  assert.equal(rows[1].BARCODE, "32-04-123");
  assert.equal(rows[0].isSlashItem, rows[1].isSlashItem);
  assert.ok(rows[0].isSlashItem);
  assert.deepEqual(
    rows.map((row) => row.container_id),
    ["container-1", "container-2"],
  );
});
