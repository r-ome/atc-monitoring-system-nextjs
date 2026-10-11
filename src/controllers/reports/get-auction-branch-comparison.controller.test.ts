import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { BranchRepository, ReportsRepository } from "src/infrastructure/di/repositories";
import type { AuctionBranchKpiRow } from "src/entities/models/Report";
import type { BranchRow } from "src/entities/models/Branch";
import { patchMethod } from "src/test-utils/patch";
import { presentAuctionKpis } from "./get-auction-kpis.controller";
import { GetAuctionBranchComparisonController, presentAuctionBranchComparison } from "./get-auction-branch-comparison.controller";

const FIRST_ID = "11111111-1111-4111-8111-111111111111";
const SECOND_ID = "22222222-2222-4222-8222-222222222222";
const DELETED_ID = "33333333-3333-4333-8333-333333333333";
const restorers: Array<() => void> = [];
afterEach(() => { while (restorers.length) restorers.pop()?.(); });
const branch = (branch_id: string, name: string): BranchRow => ({
  branch_id, name, created_at: new Date(), updated_at: new Date(), deleted_at: null,
});
const branches = [branch(FIRST_ID, "First"), branch(SECOND_ID, "Second")];
const auction = (changes: Partial<AuctionBranchKpiRow> = {}): AuctionBranchKpiRow => ({
  branch_id: FIRST_ID, auction_id: "auction-1", auction_date: new Date("2026-05-01T00:00:00Z"),
  total_sales: 100, items_sold: 1, registered_bidders: 2,
  total_registration_fee: 20, highest_item_sold: 100, ...changes,
});

test("branch comparison uses weighted averages, auction attendances and maximum sold prices", () => {
  const rows = [auction(), auction({ auction_id: "auction-2", total_sales: 900, items_sold: 3,
    registered_bidders: 2, total_registration_fee: 30, highest_item_sold: 500 })];
  const result = presentAuctionBranchComparison(branches, rows, "2026");
  assert.deepEqual(result.branches[0].summary, {
    total_sales: 1000, items_sold: 4, bidder_attendances: 4,
    total_registration_fee: 50, highest_item_sold: 500, avg_selling_price: 250, auction_count: 2,
  });
  assert.equal(result.branches[0].months[4].avg_selling_price, 250);
  assert.equal(result.branches[0].months.length, 12);
  assert.equal(result.branches[1].summary.auction_count, 0);
  assert.ok(result.branches[1].months.every((month) => month.total_sales === 0 && month.avg_selling_price === 0));
  const existing = presentAuctionKpis(rows);
  assert.equal(result.branches[0].summary.total_sales, existing.reduce((sum, row) => sum + row.total_sales, 0));
  assert.equal(result.branches[0].summary.total_registration_fee, existing.reduce((sum, row) => sum + row.total_registration_fee, 0));
});

test("comparison preserves Manila month and year boundaries and excludes unrelated rows", () => {
  const rows = [
    auction({ auction_id: "before", auction_date: new Date("2025-12-31T15:59:59Z") }),
    auction({ auction_id: "start", auction_date: new Date("2025-12-31T16:00:00Z") }),
    auction({ auction_id: "april", auction_date: new Date("2026-04-30T15:59:59Z") }),
    auction({ auction_id: "may", auction_date: new Date("2026-04-30T16:00:00Z") }),
    auction({ auction_id: "end", auction_date: new Date("2026-12-31T15:59:59Z") }),
    auction({ auction_id: "after", auction_date: new Date("2026-12-31T16:00:00Z") }),
    auction({ branch_id: DELETED_ID }),
    auction({ branch_id: SECOND_ID, items_sold: 0, total_sales: 0, highest_item_sold: 0 }),
  ];
  const result = presentAuctionBranchComparison(branches, rows, "2026");
  assert.equal(result.branches[0].summary.auction_count, 4);
  assert.equal(result.branches[0].months[0].auction_count, 1);
  assert.equal(result.branches[0].months[3].auction_count, 1);
  assert.equal(result.branches[0].months[4].auction_count, 1);
  assert.equal(result.branches[0].months[11].auction_count, 1);
  assert.equal(result.branches[1].summary.auction_count, 1);
  assert.equal(result.branches[1].summary.avg_selling_price, 0);
});

test("comparison aggregates unrounded totals across months", () => {
  const result = presentAuctionBranchComparison(branches, [
    auction({ total_sales: 101, items_sold: 2 }),
    auction({ auction_date: new Date("2026-06-01T00:00:00Z"), total_sales: 400, items_sold: 3 }),
  ], "2026");
  assert.equal(result.branches[0].months[4].avg_selling_price, 51);
  assert.equal(result.branches[0].months[5].avg_selling_price, 133);
  assert.equal(result.branches[0].summary.avg_selling_price, 100);
});

test("comparison sequences each branch's auctions by date with a stable same-date order", () => {
  const rows = [
    auction({ auction_id: "later", auction_date: new Date("2026-06-01T00:00:00Z"), total_sales: 101, items_sold: 2 }),
    auction({ auction_id: "same-b" }),
    auction({ auction_id: "other", branch_id: SECOND_ID, auction_date: new Date("2026-02-01T00:00:00Z"),
      items_sold: 0, total_sales: 0, highest_item_sold: 0 }),
    auction({ auction_id: "same-a" }),
  ];
  const originalOrder = rows.map((row) => row.auction_id);
  const result = presentAuctionBranchComparison(branches, rows, "2026");
  assert.deepEqual(result.branches[0].auctions.map((entry) => entry.auction_id), ["same-a", "same-b", "later"]);
  assert.deepEqual(result.branches[1].auctions.map((entry) => entry.auction_id), ["other"]);
  for (const entry of result.branches) {
    const expected = rows.filter((row) => row.branch_id === entry.branch_id).sort((a, b) =>
      a.auction_date.getTime() - b.auction_date.getTime() || a.auction_id.localeCompare(b.auction_id));
    assert.deepEqual(entry.auctions, presentAuctionKpis(expected));
    assert.equal(entry.summary.total_sales, entry.auctions.reduce((sum, auction) => sum + auction.total_sales, 0));
    assert.equal(entry.summary.auction_count, entry.auctions.length);
  }
  assert.equal(result.branches[0].auctions[2].avg_selling_price, 51);
  assert.equal(result.branches[1].auctions[0].avg_selling_price, 0);
  assert.deepEqual(rows.map((row) => row.auction_id), originalOrder);
});

test("per-auction data excludes other years and branches and displays Manila dates", () => {
  const result = presentAuctionBranchComparison(branches, [
    auction({ auction_id: "before", auction_date: new Date("2025-12-31T15:59:59Z") }),
    auction({ auction_id: "start", auction_date: new Date("2025-12-31T16:00:00Z") }),
    auction({ auction_id: "month", auction_date: new Date("2026-04-30T16:00:00Z") }),
    auction({ auction_id: "after", auction_date: new Date("2026-12-31T16:00:00Z") }),
    auction({ branch_id: DELETED_ID }),
  ], "2026");
  assert.deepEqual(result.branches[0].auctions.map((entry) => [entry.auction_id, entry.auction_date]),
    [["start", "Jan 01"], ["month", "May 01"]]);
  assert.deepEqual(result.branches[1].auctions, []);
});

test("comparison controller queries active business branches once and validates branch selections", async () => {
  let reads = 0;
  const deleted = { ...branch(DELETED_ID, "Deleted"), deleted_at: new Date() };
  restorers.push(patchMethod(BranchRepository, "getBranches", async () => [
    ...branches, deleted, branch("44444444-4444-4444-8444-444444444444", "ALL"),
  ]));
  restorers.push(patchMethod(ReportsRepository, "getAuctionBranchComparison", async (ids, year) => {
    reads++;
    assert.deepEqual(ids, [FIRST_ID, SECOND_ID]);
    assert.equal(year, "2026");
    return [auction()];
  }));
  const result = await GetAuctionBranchComparisonController({ year: "2026" });
  assert.equal(result.ok, true);
  if (!result.ok) assert.fail("Expected comparison");
  assert.deepEqual(result.value.branches.map((entry) => entry.branch_id), [FIRST_ID, SECOND_ID]);
  for (const input of [{ year: "bad" }, { year: "2026", branch_ids: [] },
    { year: "2026", branch_ids: [DELETED_ID] }, { year: "2026", branch_ids: ["bad"] }]) {
    assert.equal((await GetAuctionBranchComparisonController(input)).ok, false);
  }
  assert.equal(reads, 1);
});

test("comparison controller deduplicates selected branch IDs and avoids empty aggregate reads", async () => {
  let reads = 0;
  restorers.push(patchMethod(BranchRepository, "getBranches", async () => branches));
  restorers.push(patchMethod(ReportsRepository, "getAuctionBranchComparison", async (ids) => {
    reads++;
    assert.deepEqual(ids, [FIRST_ID]);
    return [];
  }));
  const selected = await GetAuctionBranchComparisonController({ year: "2026", branch_ids: [FIRST_ID, FIRST_ID] });
  assert.equal(selected.ok, true);
  if (!selected.ok) assert.fail("Expected selected comparison");
  assert.equal(selected.value.branches.length, 1);
  restorers.push(patchMethod(BranchRepository, "getBranches", async () => []));
  const empty = await GetAuctionBranchComparisonController({ year: "2026" });
  assert.equal(empty.ok, true);
  if (!empty.ok) assert.fail("Expected empty comparison");
  assert.deepEqual(empty.value.branches, []);
  assert.equal(reads, 1);
});

test("comparison controller returns a retryable error after a repository failure", async () => {
  const logger = await import("@/app/lib/logger");
  restorers.push(patchMethod(logger, "logger", () => {}));
  restorers.push(patchMethod(BranchRepository, "getBranches", async () => branches));
  restorers.push(patchMethod(ReportsRepository, "getAuctionBranchComparison", async () => { throw new Error("Database unavailable"); }));
  assert.deepEqual(await GetAuctionBranchComparisonController({ year: "2026" }), {
    ok: false, error: { message: "Failed to load branch comparison", cause: "Please try again." },
  });
});
