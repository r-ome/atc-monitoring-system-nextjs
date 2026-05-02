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
