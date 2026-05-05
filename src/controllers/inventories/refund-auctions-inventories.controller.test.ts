import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { RefundAuctionsInventoriesController } from "./refund-auctions-inventories.controller";
import {
  InventoryRepository,
  PaymentRepository,
} from "src/infrastructure/di/repositories";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];
const asFieldErrors = (cause: unknown) => cause as Record<string, string[]>;

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("RefundAuctionsInventoriesController rejects empty selections and blank reasons", async () => {
  const emptySelection = await RefundAuctionsInventoriesController({
    auction_bidder_id: "ab-1",
    reason: "Damaged",
    auction_inventories: JSON.stringify([]),
  } as never);

  assert.equal(emptySelection.ok, false);
  if (emptySelection.ok) {
    assert.fail("Expected empty selection to fail");
  }
  assert.match(
    String(asFieldErrors(emptySelection.error?.cause).auction_inventories?.[0]),
    /Select at least one item to refund/,
  );

  const blankReason = await RefundAuctionsInventoriesController({
    auction_bidder_id: "ab-1",
    reason: "",
    auction_inventories: JSON.stringify([
      {
        auction_inventory_id: "ai-1",
        inventory_id: "inv-1",
        prev_price: 1000,
        new_price: 1000,
      },
    ]),
  } as never);

  assert.equal(blankReason.ok, false);
  if (blankReason.ok) {
    assert.fail("Expected blank reason to fail");
  }
  assert.match(String(asFieldErrors(blankReason.error?.cause).reason?.[0]), /This field is required/);
});

test("RefundAuctionsInventoriesController parses JSON payloads and delegates valid refunds", async () => {
  let capturedInput: Record<string, unknown> | undefined;
  const logActivityModule = await import("@/app/lib/log-activity");

  restorers.push(
    patchMethod(PaymentRepository, "refundAuctionInventories", async (input) => {
      capturedInput = input as never;
      return undefined as never;
    }),
    patchMethod(InventoryRepository, "getAuctionItemDetails", async () => ({
      auction_inventory_id: "ai-1",
      inventory: { barcode: "32-04-001", control: "0001" },
    }) as never),
    patchMethod(logActivityModule, "logActivity", async () => undefined as never),
  );

  const result = await RefundAuctionsInventoriesController({
    auction_bidder_id: "ab-1",
    reason: "Damaged",
    auction_inventories: JSON.stringify([
      {
        auction_inventory_id: "ai-1",
        inventory_id: "inv-1",
        prev_price: 1000,
        new_price: 800,
      },
    ]),
  } as never);

  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail("Expected valid refund request to succeed");
  }
  assert.deepEqual(capturedInput, {
    auction_bidder_id: "ab-1",
    reason: "Damaged",
    auction_inventories: [
      {
        auction_inventory_id: "ai-1",
        inventory_id: "inv-1",
        prev_price: 1000,
        new_price: 800,
      },
    ],
  });
});
