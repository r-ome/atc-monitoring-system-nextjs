import test from "node:test";
import assert from "node:assert/strict";

import { computeFinalReportBreakdown } from "./computeFinalReportBreakdown";

test("computeFinalReportBreakdown explains final report total differences", () => {
  const report = computeFinalReportBreakdown(
    [
      {
        auction_date: "Jan 24, 2026",
        sales_allocation: "CONTAINER",
        auctions_inventory: {
          status: "PAID",
          price: 1000,
          bidder: { bidder_number: "0008" },
        },
      },
      {
        auction_date: "---",
        sales_allocation: "CONTAINER",
        auctions_inventory: {
          status: "PAID",
          price: 300,
          bidder: { bidder_number: "0008" },
        },
      },
      {
        auction_date: "Jan 31, 2026",
        sales_allocation: "CONTAINER",
        auctions_inventory: {
          status: "PAID",
          price: 500,
          bidder: { bidder_number: "0740" },
        },
      },
      {
        auction_date: "Jan 31, 2026",
        sales_allocation: "ATC",
        auctions_inventory: {
          status: "PAID",
          price: 700,
          bidder: { bidder_number: "5013" },
        },
      },
      {
        auction_date: "Jan 31, 2026",
        sales_allocation: "CONTAINER",
        auctions_inventory: {
          status: "UNPAID",
          price: 900,
          bidder: { bidder_number: "0020" },
        },
      },
    ],
    200,
  );

  assert.equal(report.paidItemSalesTotal, 2500);
  assert.equal(report.atcAllocatedPaidTotal, 700);
  assert.equal(report.reportsTabTotal, 1800);
  assert.equal(report.paidWithoutAuctionDateTotal, 300);
  assert.equal(report.excludedBidder740Total, 500);
  assert.equal(report.originalFinalReportTotal, 1000);
  assert.equal(report.modifiedFinalReportTotal, 800);
});
