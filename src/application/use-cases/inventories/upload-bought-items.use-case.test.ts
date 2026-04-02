import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { uploadBoughtItemsUseCase } from "./upload-bought-items.use-case";
import { AuctionRepository, InventoryRepository } from "src/infrastructure/di/repositories";
import { NotFoundError } from "src/entities/errors/common";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("uploadBoughtItemsUseCase uses the latest auction and routes rows to the ATC default bidder", async () => {
  let capturedManifest: unknown[] | undefined;
  let capturedAuctionId: string | undefined;
  let capturedStatuses: string[] | undefined;
  let capturedInventoryIds: string[] | undefined;

  restorers.push(
    patchMethod(AuctionRepository, "getAuctionsByBranch", async () => [
      {
        auction_id: "auction-latest",
        registered_bidders: [
          {
            bidder: { bidder_number: "5013" },
          },
        ],
      },
      {
        auction_id: "auction-old",
        registered_bidders: [],
      },
    ] as never),
    patchMethod(InventoryRepository, "updateBulkInventoryStatus", async (status, inventoryIds) => {
      capturedStatuses = [status];
      capturedInventoryIds = inventoryIds;
      return undefined as never;
    }),
  );

  const uploadModule = await import("src/application/use-cases/auctions/upload-manifest.use-case");
  restorers.push(
    patchMethod(uploadModule, "uploadManifestUseCase", async (auctionId, manifestRows) => {
      capturedAuctionId = auctionId;
      capturedManifest = manifestRows as unknown[];
      return [
        { inventory_id: "inv-1" },
        { inventory_id: "inv-2" },
      ] as never;
    }),
  );

  await uploadBoughtItemsUseCase("branch-1", [
    {
      BARCODE: "32-04-001",
      CONTROL: "0001",
      DESCRIPTION: "ITEM A",
      OLD_PRICE: "1000",
      NEW_PRICE: "1200",
    },
    {
      BARCODE: "32-04-002",
      CONTROL: "0002",
      DESCRIPTION: "ITEM B",
      OLD_PRICE: "1500",
      NEW_PRICE: "1800",
    },
  ]);

  assert.equal(capturedAuctionId, "auction-latest");
  assert.deepEqual(capturedManifest, [
    {
      BARCODE: "32-04-001",
      CONTROL: "0001",
      DESCRIPTION: "ITEM A",
      BIDDER: "5013",
      PRICE: "1000",
      QTY: "1",
      MANIFEST: "BOUGHT ITEM",
    },
    {
      BARCODE: "32-04-002",
      CONTROL: "0002",
      DESCRIPTION: "ITEM B",
      BIDDER: "5013",
      PRICE: "1500",
      QTY: "1",
      MANIFEST: "BOUGHT ITEM",
    },
  ]);
  assert.deepEqual(capturedStatuses, ["BOUGHT_ITEM"]);
  assert.deepEqual(capturedInventoryIds, ["inv-1", "inv-2"]);
});

test("uploadBoughtItemsUseCase fails when the branch has no auctions or no ATC bidder in the latest auction", async () => {
  restorers.push(
    patchMethod(AuctionRepository, "getAuctionsByBranch", async () => [] as never),
  );

  await assert.rejects(
    () => uploadBoughtItemsUseCase("branch-1", []),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundError);
      assert.equal(error.message, "There are no available auctions");
      return true;
    },
  );

  restorers.push(
    patchMethod(AuctionRepository, "getAuctionsByBranch", async () => [
      { auction_id: "auction-1", registered_bidders: [] },
    ] as never),
  );

  await assert.rejects(
    () => uploadBoughtItemsUseCase("branch-1", []),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundError);
      assert.equal(error.message, "ATC Bidder not found!");
      return true;
    },
  );
});
