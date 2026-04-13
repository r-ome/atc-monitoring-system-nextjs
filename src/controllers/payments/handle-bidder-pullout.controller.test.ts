import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { HandleBidderPullOutController } from "./handle-bidder-pullout.controller";
import { PaymentRepository } from "src/infrastructure/di/repositories";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];
const asFieldErrors = (cause: unknown) => cause as Record<string, string[]>;

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("HandleBidderPullOutController requires payment totals to match the pull-out amount", async () => {
  const result = await HandleBidderPullOutController({
    auction_bidder_id: "ab-1",
    amount_to_be_paid: 500,
    auction_inventory_ids: ["ai-1"],
    payments: [{ payment_method: "CASH", amount_paid: 400 }],
    remarks: null,
    storage_fee: 0,
  });

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("Expected payment mismatch to fail");
  }
  assert.match(
    String(asFieldErrors(result.error?.cause).amount_paid?.[0]),
    /Grand Total\(₱500\)/,
  );
});

test("HandleBidderPullOutController logs the bidder number with a pound sign", async () => {
  const logActivityModule = await import("@/app/lib/log-activity");
  let activityDescription = "";

  restorers.push(
    patchMethod(PaymentRepository, "handleBidderPullOut", async () => ({
      receipt_id: "receipt-1",
      bidder_number: "0755",
    }) as never),
    patchMethod(
      logActivityModule,
      "logActivity",
      async (_action, _entityType, _entityId, description) => {
        activityDescription = description;
        return undefined as never;
      },
    ),
  );

  const result = await HandleBidderPullOutController({
    auction_bidder_id: "ab-1",
    amount_to_be_paid: 24160,
    auction_inventory_ids: ["ai-1"],
    payments: [{ payment_method: "CASH", amount_paid: 24160 }],
    remarks: null,
    storage_fee: 0,
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail("Expected valid pull-out request to succeed");
  }
  assert.equal(
    activityDescription,
    "Pull-out payment ₱24,160 for bidder #0755",
  );
});
