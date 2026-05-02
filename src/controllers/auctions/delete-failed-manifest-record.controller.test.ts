import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { DeleteFailedManifestRecordController } from "./delete-failed-manifest-record.controller";
import { AuctionRepository } from "src/infrastructure/di/repositories";
import { NotFoundError } from "src/entities/errors/common";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("DeleteFailedManifestRecordController deletes failed manifest records and logs the deletion", async () => {
  const logActivityModule = await import("@/app/lib/log-activity");

  let capturedAuctionId = "";
  let capturedManifestId = "";
  let capturedDescription = "";

  restorers.push(
    patchMethod(
      AuctionRepository,
      "deleteFailedManifestRecord",
      async (auction_id, manifest_id) => {
        capturedAuctionId = auction_id;
        capturedManifestId = manifest_id;

        return {
          manifest_id,
          auction_id,
          barcode: "98-45-104",
          control: "0104",
          description: "ITEM",
          price: "100",
          bidder_number: "0001",
          qty: "1",
          manifest_number: "M-1",
          remarks: "encoder",
          error_message: "Container 98-45 does not exist",
          is_slash_item: null,
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        };
      },
    ),
    patchMethod(
      logActivityModule,
      "logActivity",
      async (_action, _entity, _entityId, description) => {
        capturedDescription = description;
      },
    ),
  );

  const result = await RequestContext.run(
    {
      branch_id: "branch-1",
      username: "admin",
      branch_name: "BIÑAN",
    },
    async () =>
      DeleteFailedManifestRecordController("auction-1", "manifest-1"),
  );

  assert.equal(result.ok, true);
  assert.equal(capturedAuctionId, "auction-1");
  assert.equal(capturedManifestId, "manifest-1");
  assert.equal(
    capturedDescription,
    "Deleted failed manifest record 98-45-104 / 0104",
  );
});

test("DeleteFailedManifestRecordController rejects missing or encoded manifest records", async () => {
  restorers.push(
    patchMethod(
      AuctionRepository,
      "deleteFailedManifestRecord",
      async () => {
        throw new NotFoundError("Failed manifest record not found!");
      },
    ),
  );

  const result = await DeleteFailedManifestRecordController(
    "auction-1",
    "manifest-1",
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("Expected failed manifest deletion to be rejected");
  }
  assert.equal(result.error.message, "Failed manifest record not found!");
  assert.equal(
    result.error.cause,
    "Only manifest records with errors can be deleted.",
  );
});
