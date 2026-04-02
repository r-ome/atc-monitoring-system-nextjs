import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { RegisterBidderController } from "./register-bidder.controller";
import { AuctionRepository, BidderRepository } from "src/infrastructure/di/repositories";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];
const asFieldErrors = (cause: unknown) => cause as Record<string, string[]>;

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("RegisterBidderController requires payment lines to exactly equal the registration fee", async () => {
  const result = await RegisterBidderController({
    auction_id: "auction-1",
    bidder_id: "bidder-1",
    service_charge: 10,
    registration_fee: 500,
    balance: 0,
    payments: [{ payment_method: "CASH", amount_paid: 400 }],
  });

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("Expected registration mismatch to fail");
  }
  assert.match(String(asFieldErrors(result.error?.cause).amount_paid?.[0]), /₱500/);
});

test("RegisterBidderController returns success when payment totals match and registration succeeds", async () => {
  const useCaseModule = await import("src/application/use-cases/auctions/register-bidder.use-case");
  const logActivityModule = await import("@/app/lib/log-activity");

  restorers.push(
    patchMethod(useCaseModule, "registerBidderUseCase", async () => ({
      auction_bidder_id: "ab-1",
    }) as never),
    patchMethod(AuctionRepository, "getAuctionById", async () => ({
      created_at: new Date("2026-04-01T00:00:00Z"),
    }) as never),
    patchMethod(BidderRepository, "getBidder", async () => ({
      bidder_number: "0007",
    }) as never),
    patchMethod(logActivityModule, "logActivity", async () => undefined as never),
  );

  const result = await RegisterBidderController({
    auction_id: "auction-1",
    bidder_id: "bidder-1",
    service_charge: 10,
    registration_fee: 500,
    balance: 0,
    payments: [{ payment_method: "CASH", amount_paid: 500 }],
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail("Expected valid registration to succeed");
  }
  assert.equal(result.value?.auction_bidder_id, "ab-1");
});
