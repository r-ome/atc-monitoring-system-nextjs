import test from "node:test";
import assert from "node:assert/strict";
import { reassign5013ToRandomBidders } from "./reassign5013";

test("reassign5013ToRandomBidders falls back to any non-5013 bidder when the same auction has no replacement", () => {
  const { monitoring, reassignedCount } = reassign5013ToRandomBidders(
    [
      {
        auction_inventory_id: "ai-1",
        auction_bidder_id: "ab-5013",
        inventory_id: "inv-1",
        auction_id: "auction-1",
        barcode: "98-47-001",
        control: "0001",
        description: "BAG",
        bidder_number: "5013",
        qty: "1",
        price: 100,
        status: "SOLD",
        auction_status: "PAID",
        manifest_number: "M1",
        auction_date: "May 25, 2026",
        was_bought_item: false,
        bought_item_price: 0,
      },
    ],
    [
      {
        auction_bidder_id: "ab-5013",
        auction_id: "auction-1",
        auction_date: "May 25, 2026",
        bidder_number: "5013",
        full_name: "ATC Account",
      },
      {
        auction_bidder_id: "ab-0001",
        auction_id: "auction-2",
        auction_date: "May 25, 2026",
        bidder_number: "0001",
        full_name: "Replacement Bidder",
      },
    ],
  );

  assert.equal(reassignedCount, 1);
  assert.equal(monitoring[0].bidder_number, "0001");
  assert.equal(monitoring[0].auction_bidder_id, "ab-0001");
});
