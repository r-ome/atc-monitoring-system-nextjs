import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { ConfirmAddOnController } from "./confirm-add-on.controller";
import {
  AuctionRepository,
  ContainerRepository,
  InventoryRepository,
} from "src/infrastructure/di/repositories";
import { type UploadManifestInput } from "src/entities/models/Manifest";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("ConfirmAddOnController revalidates previewed rows before saving", async () => {
  const logActivityModule = await import("@/app/lib/log-activity");

  const previewData = [
    {
      BARCODE: "32-04-001",
      CONTROL: "0001",
      DESCRIPTION: "AS IS ITEM",
      BIDDER: "0007",
      PRICE: "100",
      QTY: "1",
      MANIFEST: "ADD ON",
      auction_bidder_id: "ab-1",
      service_charge: 10,
      container_id: "container-1",
      isValid: true,
      forUpdating: false,
      isSlashItem: "",
      error: "Already sold to bidder #0060 on Apr 25, 2026",
      warning: 'Normalized description from "ASIS ITEM" to "AS IS ITEM".',
    },
  ];

  let capturedAuctionId = "";
  let capturedRows: UploadManifestInput[] = [];

  restorers.push(
    patchMethod(AuctionRepository, "getMonitoring", async () => [] as never),
    patchMethod(
      AuctionRepository,
      "getRegisteredBiddersForManifest",
      async () =>
        [
          {
            auction_bidder_id: "ab-1",
            service_charge: 10,
            bidder: { bidder_number: "0007", status: "ACTIVE" },
          },
        ] as never,
    ),
    patchMethod(AuctionRepository, "uploadManifest", async (auction_id, data) => {
      capturedAuctionId = auction_id;
      capturedRows = data;
      return [{ auction_inventory_id: "ai-1" }] as never;
    }),
    patchMethod(
      InventoryRepository,
      "getAllInventoriesForManifest",
      async () => [] as never,
    ),
    patchMethod(
      ContainerRepository,
      "getContainerBarcodes",
      async () =>
        [{ container_id: "container-1", barcode: "32-04" }] as never,
    ),
    patchMethod(
      logActivityModule,
      "logActivity",
      async () => undefined as never,
    ),
  );

  const result = await ConfirmAddOnController("auction-1", previewData);

  assert.equal(capturedAuctionId, "auction-1");
  assert.notEqual(capturedRows, previewData);
  assert.equal(capturedRows.length, 1);
  assert.equal(capturedRows[0]?.error, "");
  assert.equal(capturedRows[0]?.isValid, true);
  assert.equal(capturedRows[0]?.container_id, "container-1");
  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail("Expected confirm add on to succeed");
  }
  assert.equal(result.value, "1 records uploaded!");
});
