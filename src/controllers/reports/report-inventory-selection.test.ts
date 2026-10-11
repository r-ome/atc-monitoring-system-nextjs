import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import prisma from "@/app/lib/prisma/prisma";
import { ReportsRepository } from "src/infrastructure/repositories/reports.repository";
import { presentRefundCancellation } from "./get-refund-cancellation.controller";
import { presentPriceComparison } from "./get-price-comparison.controller";
import { buildRefundedHistoryRemark } from "src/entities/models/InventoryHistoryRemark";
import { patchMethod } from "src/test-utils/patch";
import type { RefundCancellationRow } from "src/entities/models/Report";

const restorers: Array<() => void> = [];
afterEach(() => { while (restorers.length) restorers.pop()?.(); });

// Simulate Prisma projection so missing selected fields affect the presenter tests.
function project(row: Record<string, unknown>, selection: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(selection).map(([key, rule]) => {
    const value = row[key];
    if (rule === true || value == null) return [key, value];
    const nested = (rule as { select: Record<string, unknown> }).select;
    return [key, Array.isArray(value)
      ? value.map(item => project(item, nested))
      : project(value as Record<string, unknown>, nested)];
  }));
}

function refundRow(): RefundCancellationRow {
  return {
    auction_inventory_id: "item-1", description: "Chair", price: 1234.5, status: "REFUNDED",
    updated_at: new Date("2026-05-10T00:00:00Z"),
    auction_bidder: {
      bidder: { bidder_number: "5013", first_name: "ATC", last_name: "Default" },
      auctions: { created_at: new Date("2026-04-30T16:00:00Z") },
    },
    inventory: { barcode: "32-04-001", control: "C1" },
    histories: [
      { auction_status: "PAID", created_at: new Date("2026-05-01T00:00:00Z"),
        remarks: "Ignored", tag: null, receipt: { remarks: "Ignored", auction_bidder: {
          bidder: { bidder_number: "9999", first_name: "Ignored", last_name: "Bidder" },
        } } },
      { auction_status: "REFUNDED", created_at: new Date("2026-05-02T00:00:00Z"),
        remarks: buildRefundedHistoryRemark({ bidder_number: "1001", bidder_name: "First Bidder" }, "Legacy reason", "operator"),
        tag: null, receipt: { remarks: "Missing", auction_bidder: {
          bidder: { bidder_number: "1001", first_name: "First", last_name: "Bidder" },
        } } },
      { auction_status: "CANCELLED", created_at: new Date("2026-05-03T00:00:00Z"),
        remarks: null, tag: "DAMAGED", receipt: { remarks: "Later reason", auction_bidder: {
          bidder: { bidder_number: "1002", first_name: "Later", last_name: "Bidder" },
        } } },
    ],
  };
}

test("lean refund query preserves full history, original bidder, reason, latest tag and status date", async () => {
  restorers.push(patchMethod(prisma.auctions_inventories, "findMany", (async args => {
    assert.deepEqual(args?.orderBy, { auction_date: "asc" });
    assert.deepEqual(args?.select?.histories && typeof args.select.histories === "object"
      ? args.select.histories.orderBy : null, { created_at: "asc" });
    assert.deepEqual(args?.where?.status, { in: ["REFUNDED", "CANCELLED"] });
    assert.equal(args?.where?.deleted_at, undefined);
    const row = { ...refundRow(), unused_large_column: "omitted" };
    return [project(row, args?.select as Record<string, unknown>)];
  }) as typeof prisma.auctions_inventories.findMany));
  const rows = await ReportsRepository.getRefundCancellationItems("branch-1", "2026-05");
  assert.equal("unused_large_column" in rows[0], false);
  assert.deepEqual(presentRefundCancellation(rows), [{
    auction_inventory_id: "item-1", auction_date: "May 01, 2026", status_date: "May 03, 2026",
    bidder_number: "1001", bidder_name: "First Bidder", description: "Chair",
    barcode: "32-04-001", control: "C1", price: 1234.5, status: "REFUNDED",
    reason: "Missing", tag: "DAMAGED", updated_by: "operator",
  }]);
});

test("refund selection preserves legacy and missing-history fallbacks", () => {
  const row = refundRow();
  row.histories = [{ auction_status: "CANCELLED", created_at: new Date("2026-05-02T00:00:00Z"),
    remarks: "Cancelled from bidder #1234 (Legacy Bidder): Missing", tag: null, receipt: null }];
  const [legacy] = presentRefundCancellation([row]);
  assert.equal(legacy.bidder_number, "1234");
  assert.equal(legacy.bidder_name, "Legacy Bidder");
  assert.equal(legacy.reason, "Missing");
  assert.equal(legacy.tag, "MISSING");
  row.histories = [];
  const [fallback] = presentRefundCancellation([row]);
  assert.equal(fallback.bidder_number, "5013");
  assert.equal(fallback.status_date, "May 10, 2026");
  assert.equal(fallback.reason, "");
  assert.equal(fallback.tag, null);
});

test("lean price query preserves Manila month boundaries, zero prices and rounded averages", async () => {
  const item = (old: number | null, price: number, date: string) => ({
    is_bought_item: old,
    auctions_inventory: { price, auction_bidder: { auctions: { created_at: new Date(date) } } },
    unused_large_column: "omitted",
  });
  const fixture = [item(0, 101, "2026-04-30T16:00:00Z"), item(101, 102, "2026-05-02T00:00:00Z"),
    item(null, 103, "2026-05-03T00:00:00Z"), item(300, 401, "2026-04-30T15:59:59Z"),
    { is_bought_item: 10, auctions_inventory: null }];
  restorers.push(patchMethod(prisma.inventories, "findMany", (async args => {
    assert.deepEqual(args?.where?.is_bought_item, { not: null });
    assert.equal(args?.where?.deleted_at, undefined);
    return fixture.map(row => project(row, args?.select as Record<string, unknown>));
  }) as typeof prisma.inventories.findMany));
  const rows = await ReportsRepository.getPriceComparisonByMonth("branch-1", "2026");
  assert.equal("unused_large_column" in rows[0], false);
  assert.deepEqual(presentPriceComparison(rows), [
    { month: "Apr 2026", avg_old_price: 300, avg_new_price: 401, item_count: 1 },
    { month: "May 2026", avg_old_price: 51, avg_new_price: 102, item_count: 3 },
  ]);
});
