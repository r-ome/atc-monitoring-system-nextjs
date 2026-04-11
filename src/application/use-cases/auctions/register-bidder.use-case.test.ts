import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { registerBidderUseCase } from "./register-bidder.use-case";
import { unregisterBidderUseCase } from "./unregister-bidder.use-case";
import { AuctionRepository } from "src/infrastructure/di/repositories";
import { InputParseError } from "src/entities/errors/common";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("registerBidderUseCase blocks bidders whose unpaid balance exceeded their payment term", async () => {
  restorers.push(
    patchMethod(AuctionRepository, "getRegisteredBidders", async () => [] as never),
    patchMethod(AuctionRepository, "getBiddersWithBalance", async () => [
      {
        auction_id: "auction-prev",
        bidder_id: "bidder-1",
        balance: 2500,
        bidder: { bidder_number: "0007", payment_term: 3 },
        auctions_inventories: [
          { status: "UNPAID" },
          { status: "UNPAID" },
          { status: "PAID" },
        ],
      },
    ] as never),
    patchMethod(AuctionRepository, "getAuctionById", async (auctionId: string) =>
      auctionId === "auction-prev"
        ? ({ created_at: new Date("2026-03-20T00:00:00Z") } as never)
        : ({ created_at: new Date("2026-03-25T00:00:00Z") } as never),
    ),
  );

  await assert.rejects(
    () =>
      registerBidderUseCase({
        auction_id: "auction-current",
        bidder_id: "bidder-1",
        service_charge: 10,
        registration_fee: 500,
        balance: 0,
        payments: [{ payment_method: "CASH", amount_paid: 500 }],
      }),
    (error: unknown) => {
      assert.ok(error instanceof InputParseError);
      assert.match(String(error.cause?.bidder?.[0]), /2 unpaid items/);
      assert.match(String(error.cause?.bidder?.[0]), /5 days exceeding payment term/);
      return true;
    },
  );
});

test("registerBidderUseCase blocks duplicate registration in the same auction", async () => {
  restorers.push(
    patchMethod(AuctionRepository, "getRegisteredBidders", async () => [
      { bidder_id: "bidder-1" },
    ] as never),
    patchMethod(AuctionRepository, "getBiddersWithBalance", async () => [] as never),
  );

  await assert.rejects(
    () =>
      registerBidderUseCase({
        auction_id: "auction-1",
        bidder_id: "bidder-1",
        service_charge: 10,
        registration_fee: 500,
        balance: 0,
        payments: [{ payment_method: "CASH", amount_paid: 500 }],
      }),
    (error: unknown) => {
      assert.ok(error instanceof InputParseError);
      assert.equal(error.message, "Bidder already registered!");
      return true;
    },
  );
});

test("registerBidderUseCase delegates to the repository when constraints pass", async () => {
  restorers.push(
    patchMethod(AuctionRepository, "getRegisteredBidders", async () => [] as never),
    patchMethod(AuctionRepository, "getBiddersWithBalance", async () => [] as never),
    patchMethod(AuctionRepository, "registerBidder", async (input) => ({ ...input, auction_bidder_id: "ab-1" }) as never),
  );

  const result = await registerBidderUseCase({
    auction_id: "auction-1",
    bidder_id: "bidder-1",
    service_charge: 10,
    registration_fee: 500,
    balance: 0,
    payments: [{ payment_method: "CASH", amount_paid: 500 }],
  });

  assert.equal(result.auction_bidder_id, "ab-1");
});

test("unregisterBidderUseCase rejects removal once auction items already exist", async () => {
  restorers.push(
    patchMethod(AuctionRepository, "getRegisteredBidderById", async () => ({
      auctions_inventories: [{ auction_inventory_id: "ai-1" }],
    }) as never),
  );

  await assert.rejects(
    () => unregisterBidderUseCase("ab-1"),
    (error: unknown) => {
      assert.ok(error instanceof InputParseError);
      assert.equal(error.message, "Cannot Unregister Bidder!");
      return true;
    },
  );
});

test("unregisterBidderUseCase returns the removed bidder number after delete", async () => {
  restorers.push(
    patchMethod(AuctionRepository, "getRegisteredBidderById", async () => ({
      bidder: { bidder_number: "0042" },
      auctions_inventories: [],
    }) as never),
    patchMethod(AuctionRepository, "unregisterBidder", async () => undefined as never),
  );

  const result = await unregisterBidderUseCase("ab-1");

  assert.deepEqual(result, {
    auction_bidder_id: "ab-1",
    bidder_number: "0042",
  });
});
