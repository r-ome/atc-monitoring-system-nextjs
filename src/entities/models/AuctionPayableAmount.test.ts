import test from "node:test";
import assert from "node:assert/strict";

import {
  getAuctionInventoriesPayableBase,
  getAuctionInventoryPayableBase,
} from "./AuctionPayableAmount";

test("getAuctionInventoryPayableBase returns full price for unpaid items", () => {
  assert.equal(
    getAuctionInventoryPayableBase({
      status: "UNPAID",
      price: 5900,
      histories: [],
    }),
    5900,
  );
});

test("getAuctionInventoryPayableBase returns the latest partial price delta", () => {
  assert.equal(
    getAuctionInventoryPayableBase({
      status: "PARTIAL",
      price: 5900,
      histories: [
        {
          auction_status: "DISCREPANCY",
          remarks: "Item updated | Price: 500 → 5900 | Updated by: RHEA",
          created_at: "2026-04-27T06:27:05.000Z",
        },
      ],
    }),
    5400,
  );
});

test("getAuctionInventoriesPayableBase excludes paid items", () => {
  assert.equal(
    getAuctionInventoriesPayableBase([
      { status: "PAID", price: 5900, histories: [] },
      {
        status: "PARTIAL",
        price: 5900,
        histories: [
          {
            remarks: "Item updated | Price: 500 → 5900",
            created_at: "2026-04-27T06:27:05.000Z",
          },
        ],
      },
    ]),
    5400,
  );
});
