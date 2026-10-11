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
  assert.equal(report.totalPaidAndUnpaidItemSales, 8000);
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
  assert.equal(report.totalPaidAndUnpaidItemSales, 1000);
  assert.equal(report.totalServiceCharge, 100);
  assert.equal(report.atcAllocatedItemSales, 2000);
  assert.equal(report.atcAllocatedItemCount, 1);
  assert.equal(report.totalProfit, -19_683);
});

test("computeContainerReport includes unpaid container sales and excludes cancelled and refunded items", () => {
  const report = computeContainerReport([
    {
      sales_allocation: "CONTAINER",
      auctions_inventory: { status: "UNPAID", price: 5000 },
    },
    {
      auctions_inventory: { status: "CANCELLED", price: 2000 },
    },
    {
      auctions_inventory: { status: "REFUNDED", price: 3000 },
    },
    { auctions_inventory: null },
  ]);

  assert.equal(report.totalItemSales, 0);
  assert.equal(report.totalPaidAndUnpaidItemSales, 5000);
  assert.equal(report.containerSalesCommission, 0);
  assert.equal(report.totalServiceCharge, 0);
});

test("computeContainerReport returns zero sales for an empty container", () => {
  const report = computeContainerReport([]);

  assert.equal(report.totalItemSales, 0);
  assert.equal(report.totalPaidAndUnpaidItemSales, 0);
  assert.deepEqual(computeContainerReport([], "PAID_AND_UNPAID"), report);
});

test("computeContainerReport projects bidder charges and recalculates commission and royalty tiers", () => {
  const inventories = [
    {
      auctions_inventory: {
        status: "PAID",
        price: 600_000,
        bidder: { service_charge: 10 },
      },
    },
    {
      auctions_inventory: {
        status: "UNPAID",
        price: 250_000,
        bidder: { service_charge: 8 },
      },
    },
    {
      auctions_inventory: {
        status: "CANCELLED",
        price: 100_000,
        bidder: { service_charge: 20 },
      },
    },
    {
      auctions_inventory: {
        status: "REFUNDED",
        price: 100_000,
        bidder: { service_charge: 20 },
      },
    },
    { auctions_inventory: null },
  ];
  const original = structuredClone(inventories);
  const current = computeContainerReport(inventories);
  const projected = computeContainerReport(inventories, "PAID_AND_UNPAID");

  assert.equal(current.totalItemSales, 600_000);
  assert.equal(current.containerSalesCommission, 150_000);
  assert.equal(current.royalty, 30_000);
  assert.equal(current.totalProfit, 160_000);
  assert.deepEqual(projected, {
    totalItemSales: 850_000,
    totalPaidAndUnpaidItemSales: 850_000,
    totalServiceCharge: 80_000,
    royalty: 35_000,
    containerSalesCommission: 127_500,
    atcGroupCommission: 42_500,
    sortingFee: 42_500,
    atcSales: 92_500,
    totalProfit: 172_500,
    atcAllocatedItemSales: 0,
    atcAllocatedItemCount: 0,
  });
  assert.deepEqual(inventories, original);
  assert.deepEqual(computeContainerReport(inventories), current);
});

test("computeContainerReport projects ATC allocated sales separately and uses zero for missing bidder rates", () => {
  const projected = computeContainerReport([
    {
      auctions_inventory: { status: "UNPAID", price: 800_000 },
    },
    {
      sales_allocation: "ATC",
      auctions_inventory: {
        status: "PAID",
        price: 1000,
        bidder: { service_charge: 10 },
      },
    },
    {
      sales_allocation: "ATC",
      auctions_inventory: {
        status: "UNPAID",
        price: 2000,
        bidder: { service_charge: 20 },
      },
    },
  ], "PAID_AND_UNPAID");

  assert.equal(projected.totalItemSales, 800_000);
  assert.equal(projected.totalServiceCharge, 0);
  assert.equal(projected.atcAllocatedItemSales, 3000);
  assert.equal(projected.atcAllocatedItemCount, 2);
  assert.equal(projected.totalProfit, 85_000);
});
