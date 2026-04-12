import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { ConfirmAddOnController } from "./confirm-add-on.controller";
import { AuctionRepository } from "src/infrastructure/di/repositories";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("ConfirmAddOnController submits previewed manifest rows to the repository", async () => {
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
      error: "",
      warning: 'Normalized description from "ASIS ITEM" to "AS IS ITEM".',
    },
  ];

  let capturedAuctionId = "";
  let capturedRows: unknown[] = [];

  restorers.push(
    patchMethod(AuctionRepository, "uploadManifest", async (auction_id, data) => {
      capturedAuctionId = auction_id;
      capturedRows = data;
      return [{ auction_inventory_id: "ai-1" }] as never;
    }),
    patchMethod(
      logActivityModule,
      "logActivity",
      async () => undefined as never,
    ),
  );

  const result = await ConfirmAddOnController("auction-1", previewData);

  assert.equal(capturedAuctionId, "auction-1");
  assert.equal(capturedRows, previewData);
  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail("Expected confirm add on to succeed");
  }
  assert.equal(result.value, "1 records uploaded!");
});
