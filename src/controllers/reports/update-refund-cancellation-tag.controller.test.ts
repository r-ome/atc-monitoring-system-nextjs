import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { UpdateRefundCancellationTagController } from "./update-refund-cancellation-tag.controller";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("UpdateRefundCancellationTagController updates the tag and logs the activity", async () => {
  const logActivityModule = await import("@/app/lib/log-activity");

  const repoCalls: Array<{ auction_inventory_id: string; tag: string }> = [];
  const activities: Array<{
    action: string;
    entityType: string;
    entityId: string;
    description: string;
  }> = [];

  restorers.push(
    patchMethod(
      ReportsRepository,
      "updateRefundCancellationTag",
      async (auction_inventory_id, tag) => {
        repoCalls.push({ auction_inventory_id, tag });
      },
    ),
    patchMethod(
      logActivityModule,
      "logActivity",
      async (action, entityType, entityId, description) => {
        activities.push({
          action,
          entityType,
          entityId,
          description: description ?? "",
        });
        return undefined as never;
      },
    ),
  );

  const result = await UpdateRefundCancellationTagController({
    auction_inventory_id: "ai-1",
    tag: "DAMAGED",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(repoCalls, [
    { auction_inventory_id: "ai-1", tag: "DAMAGED" },
  ]);
  assert.equal(activities.length, 1);
  assert.equal(activities[0].action, "UPDATE");
  assert.equal(activities[0].entityType, "auction_inventory");
  assert.equal(activities[0].entityId, "ai-1");
  assert.match(activities[0].description, /Damaged/);
});

test("UpdateRefundCancellationTagController rejects invalid tag values", async () => {
  let repoCalled = false;

  restorers.push(
    patchMethod(
      ReportsRepository,
      "updateRefundCancellationTag",
      async () => {
        repoCalled = true;
      },
    ),
  );

  const result = await UpdateRefundCancellationTagController({
    auction_inventory_id: "ai-1",
    // @ts-expect-error — intentionally invalid for the test
    tag: "NOT_A_TAG",
  });

  assert.equal(result.ok, false);
  if (result.ok) assert.fail("Expected invalid input to fail");
  assert.equal(repoCalled, false);
  assert.match(result.error.message, /Invalid Data/);
});

test("UpdateRefundCancellationTagController rejects missing auction_inventory_id", async () => {
  let repoCalled = false;

  restorers.push(
    patchMethod(
      ReportsRepository,
      "updateRefundCancellationTag",
      async () => {
        repoCalled = true;
      },
    ),
  );

  const result = await UpdateRefundCancellationTagController({
    tag: "MISSING",
  });

  assert.equal(result.ok, false);
  assert.equal(repoCalled, false);
});
