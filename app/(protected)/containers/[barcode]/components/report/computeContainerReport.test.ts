import test from "node:test";
import assert from "node:assert/strict";

import { computeContainerReport } from "./computeContainerReport";

test("computeContainerReport calculates service charge per paid item bidder rate", () => {
  const report = computeContainerReport([
    {
      auctions_inventory: {
        status: "PAID",
        price: 1000,
        bidder: { service_charge: 10 },
      },
    },
    {
      auctions_inventory: {
        status: "PAID",
        price: 2000,
        bidder: { service_charge: 15 },
      },
    },
    {
      auctions_inventory: {
        status: "UNPAID",
        price: 5000,
        bidder: { service_charge: 20 },
      },
    },
    {
      auctions_inventory: null,
    },
  ]);

  assert.equal(report.totalItemSales, 3000);
  assert.equal(report.totalServiceCharge, 400);
});
