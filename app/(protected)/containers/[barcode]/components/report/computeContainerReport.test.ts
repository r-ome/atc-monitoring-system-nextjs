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
  assert.equal(report.totalProfit, -18_950);
  assert.equal(report.atcAllocatedItemSales, 0);
  assert.equal(report.atcAllocatedItemCount, 0);
});

test("computeContainerReport excludes ATC allocated paid items from container profit", () => {
  const report = computeContainerReport([
    {
      sales_allocation: "CONTAINER",
      auctions_inventory: {
        status: "PAID",
        price: 1000,
        bidder: { service_charge: 10 },
      },
    },
    {
      sales_allocation: "ATC",
      auctions_inventory: {
        status: "PAID",
        price: 2000,
        bidder: { service_charge: 15 },
      },
    },
    {
      sales_allocation: "ATC",
      auctions_inventory: {
        status: "UNPAID",
        price: 5000,
        bidder: { service_charge: 20 },
      },
    },
  ]);

  assert.equal(report.totalItemSales, 1000);
  assert.equal(report.totalServiceCharge, 100);
  assert.equal(report.atcAllocatedItemSales, 2000);
  assert.equal(report.atcAllocatedItemCount, 1);
  assert.equal(report.totalProfit, -19_683);
});
