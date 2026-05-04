import test from "node:test";
import assert from "node:assert/strict";

import { presentTotalSales } from "./get-total-sales.controller";

test("presentTotalSales omits bidder and item counts from financial sales rows", () => {
  const result = presentTotalSales(
    [
      {
        auction_id: "auction-1",
        created_at: new Date("2026-05-04T00:00:00.000Z"),
        total_bidders: 10,
        total_items: 25,
        items_sold: 20,
        total_sales: 100000,
        total_registration_fee: 5000,
        total_bidder_percentage_amount: 7500,
      },
    ],
    "daily",
  );

  assert.deepEqual(result, [
    {
      key: "auction-1",
      label: "May 04, 2026",
      total_sales: 100000,
      total_registration_fee: 5000,
      total_bidder_percentage_amount: 7500,
    },
  ]);
  assert.equal("total_bidders" in result[0], false);
  assert.equal("total_items" in result[0], false);
});
