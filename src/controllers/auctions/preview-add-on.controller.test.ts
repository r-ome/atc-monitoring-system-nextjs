import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { PreviewAddOnController } from "./preview-add-on.controller";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("PreviewAddOnController converts form input into a manifest row before previewing", async () => {
  const previewModule = await import(
    "src/application/use-cases/auctions/preview-manifest.use-case"
  );

  let capturedAuctionId = "";
  let capturedRows: unknown[] = [];

  restorers.push(
    patchMethod(
      previewModule,
      "previewManifestUseCase",
      async (auction_id, data) => {
        capturedAuctionId = auction_id;
        capturedRows = data;
        return [
          {
            ...data[0],
            isValid: true,
            forUpdating: false,
            isSlashItem: "",
            error: "",
          },
        ] as never;
      },
    ),
  );

  const result = await PreviewAddOnController("auction-1", {
    BARCODE: "32-04-001",
    DESCRIPTION: "  ASIS item  ",
    BIDDER: "7",
    PRICE: "100",
    QTY: "1",
  });

  assert.equal(capturedAuctionId, "auction-1");
  assert.deepEqual(capturedRows, [
    {
      BARCODE: "32-04-001",
      CONTROL: "",
      DESCRIPTION: "  ASIS item  ",
      BIDDER: "7",
      PRICE: "100",
      QTY: "1",
      MANIFEST: "ADD ON",
    },
  ]);
  assert.equal(result.ok, true);
});

test("PreviewAddOnController converts multiple add-on rows before previewing", async () => {
  const previewModule = await import(
    "src/application/use-cases/auctions/preview-manifest.use-case"
  );

  let capturedRows: unknown[] = [];

  restorers.push(
    patchMethod(
      previewModule,
      "previewManifestUseCase",
      async (_auction_id, data) => {
        capturedRows = data;
        return data.map((row) => ({
          ...row,
          isValid: true,
          forUpdating: false,
          isSlashItem: "",
          error: "",
        })) as never;
      },
    ),
  );

  const result = await PreviewAddOnController("auction-1", [
    {
      BARCODE: "32-04-001",
      CONTROL: "1",
      DESCRIPTION: "ITEM A",
      BIDDER: "7",
      PRICE: "100",
      QTY: "1",
    },
    {
      BARCODE: "32-04-002",
      CONTROL: "2",
      DESCRIPTION: "ITEM B",
      BIDDER: "8",
      PRICE: "200",
      QTY: "2",
    },
  ]);

  assert.deepEqual(capturedRows, [
    {
      BARCODE: "32-04-001",
      CONTROL: "1",
      DESCRIPTION: "ITEM A",
      BIDDER: "7",
      PRICE: "100",
      QTY: "1",
      MANIFEST: "ADD ON",
    },
    {
      BARCODE: "32-04-002",
      CONTROL: "2",
      DESCRIPTION: "ITEM B",
      BIDDER: "8",
      PRICE: "200",
      QTY: "2",
      MANIFEST: "ADD ON",
    },
  ]);
  assert.equal(result.ok, true);
});
