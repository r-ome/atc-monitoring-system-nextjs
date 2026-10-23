import test from "node:test";
import assert from "node:assert/strict";
import { Prisma, PrismaClient } from "@prisma/client";
import {
  BidderActivityInitializationRow,
  BidderActivityEvidence,
  BidderActivityInitializationOptions,
  buildBidderActivityEvidenceQuery,
  buildBidderActivityInitializationUpdate,
  initializeBidderActivity,
  parseBidderActivityInitializationArgs,
  planBidderActivityInitialization,
} from "./bidder-activity-initialization";

const NOW = new Date("2026-10-17T10:12:34.000Z");
const OPTIONS: BidderActivityInitializationOptions = {
  branch_id: "branch-a", all_branches: false, apply: false, batch_size: 2,
};

function bidder(
  input: Partial<BidderActivityInitializationRow> = {},
): BidderActivityInitializationRow {
  return {
    bidder_id: "bidder-a", bidder_number: "0007", branch_id: "branch-a",
    status: "ACTIVE", branch: { name: "Branch A" }, last_activity_at: null,
    created_at: new Date("2020-01-01T00:00:00.000Z"),
    updated_at: new Date("2020-01-01T00:00:00.000Z"),
    ...input,
  };
}

function harness(batches: BidderActivityInitializationRow[][], evidence: BidderActivityEvidence[] = []) {
  const reads: Prisma.biddersFindManyArgs[] = [];
  const queries: Prisma.Sql[] = [];
  const writes: Prisma.Sql[] = [];
  const transactionOptions: unknown[] = [];
  const tx = {
    bidders: {
      findMany: async (args: Prisma.biddersFindManyArgs) => {
        reads.push(args);
        return batches.shift() ?? [];
      },
    },
    $queryRaw: async (query: Prisma.Sql) => {
      queries.push(query);
      return evidence;
    },
    $executeRaw: async (query: Prisma.Sql) => {
      writes.push(query);
      return 1;
    },
  };
  // The transaction is deliberately fake: these tests check queries and control
  // flow, not MySQL's isolation or rollback guarantees.
  const prisma = {
    $transaction: async (callback: (client: typeof tx) => Promise<unknown>, options: unknown) => {
      transactionOptions.push(options);
      return callback(tx);
    },
  } as unknown as PrismaClient;
  return { prisma, tx, reads, queries, writes, transactionOptions };
}

test("activity initialization requires a scope and defaults to preview", () => {
  assert.deepEqual(parseBidderActivityInitializationArgs(["--branch-id", "branch-a"]), {
    branch_id: "branch-a", all_branches: false, apply: false, batch_size: 200,
  });
  assert.deepEqual(parseBidderActivityInitializationArgs(["--all-branches", "--apply", "--batch-size", "50"]), {
    all_branches: true, apply: true, batch_size: 50,
  });
  assert.equal(parseBidderActivityInitializationArgs(["--help"]), null);
  for (const args of [
    [], ["--apply"], ["--all-branches", "--branch-id", "a"],
    ["--branch-id"], ["--branch-id", "   "], ["--all-branches", "--unknown"],
    ["--all-branches", "--apply", "--apply"],
    ["--all-branches", "--batch-size", "0"],
    ["--all-branches", "--batch-size", "1001"],
    ["--all-branches", "--batch-size", "1.5"],
  ]) assert.throws(() => parseBidderActivityInitializationArgs(args), args.join(" "));
});

test("historical planning uses retained evidence rather than deployment time", () => {
  const result = planBidderActivityInitialization([bidder()], [
    { bidder_id: "bidder-a", source: "registration", activity_at: new Date("2024-01-01T00:00:00.000Z") },
    { bidder_id: "bidder-a", source: "payment", activity_at: new Date("2026-09-01T00:00:00.000Z") },
    { bidder_id: "other", source: "payment", activity_at: NOW },
  ], NOW);
  assert.equal(result[0].activity_at.toISOString(), "2026-09-01T00:00:00.000Z");
  assert.equal(result[0].would_deactivate, false);
  assert.equal(result[0].needs_initialization, true);
  assert.equal(planBidderActivityInitialization([bidder()], [], NOW)[0].activity_at.toISOString(), "2020-01-01T00:00:00.000Z");
});

test("historical planning uses creation and profile edits as conservative evidence", () => {
  const created = new Date("2026-10-01T00:00:00.000Z");
  const changed = new Date("2026-10-02T00:00:00.000Z");
  assert.equal(
    planBidderActivityInitialization([bidder({ created_at: created, updated_at: changed })], [], NOW)[0].activity_at.getTime(),
    changed.getTime(),
  );
});

test("an existing activity timestamp stays authoritative on later initialization runs", () => {
  const tracked = new Date("2026-01-01T00:00:00.000Z");
  const result = planBidderActivityInitialization([bidder({
    last_activity_at: tracked, updated_at: NOW,
  })], [{ bidder_id: "bidder-a", source: "receipt", activity_at: NOW }], NOW)[0];
  assert.equal(result.activity_at, tracked);
  assert.equal(result.needs_initialization, false);
  assert.equal(result.would_deactivate, true);
});

test("initialization previews both directions at the exact six-month cutoff", () => {
  const results = planBidderActivityInitialization([
    bidder({ bidder_id: "at", last_activity_at: new Date("2026-04-17T10:12:34.000Z") }),
    bidder({ bidder_id: "after", status: "INACTIVE", last_activity_at: new Date("2026-04-17T10:12:35.000Z") }),
    bidder({ bidder_id: "future", last_activity_at: new Date("2027-01-01T00:00:00.000Z") }),
  ], [], NOW);
  assert.equal(results[0].would_deactivate, true);
  assert.equal(results[1].would_activate, true);
  assert.equal(results[2].future_activity, true);
});

test("historical SQL binds bidder IDs and links number-only records through auction registration", () => {
  const unsafeId = "id' OR 1=1 --";
  const query = buildBidderActivityEvidenceQuery([unsafeId]);
  assert.equal(query.sql.includes(unsafeId), false);
  assert.ok(query.values.includes(unsafeId));
  assert.match(query.sql, /r.auction_id = m.auction_id/);
  assert.match(query.sql, /r.auction_id = c.auction_id/);
  assert.match(query.sql, /b.bidder_id = r.bidder_id/);
  assert.match(query.sql, /COALESCE\(m.error_message, ''\) = ''/);
  assert.match(query.sql, /COALESCE\(c.error, ''\) = ''/);
  assert.throws(() => buildBidderActivityEvidenceQuery([]), /requires bidder IDs/);
});

test("initialization SQL cannot overwrite concurrent activity, statuses, or updated_at", () => {
  const query = buildBidderActivityInitializationUpdate(planBidderActivityInitialization([bidder()], [], NOW));
  assert.match(query.sql, /SET b.last_activity_at = c.activity_at/);
  assert.match(query.sql, /WHERE b.last_activity_at IS NULL AND b.deleted_at IS NULL/);
  assert.match(query.sql, /c.branch_id = b.branch_id/);
  assert.match(query.sql, /b.status IN \('ACTIVE', 'INACTIVE'\)/);
  assert.ok(query.values.includes("5013"));
  assert.doesNotMatch(query.sql, /SET[^]*updated_at|SET[^]*status\s*=/);
  assert.throws(() => buildBidderActivityInitializationUpdate([]), /requires pending bidders/);
});

test("preview scans in bounded batches and never issues writes", async () => {
  const h = harness([[bidder()], [bidder({ bidder_id: "bidder-b" })], []]);
  const result = await initializeBidderActivity(h.prisma, OPTIONS, NOW);
  assert.equal(h.writes.length, 0);
  assert.equal(h.queries.length, 2);
  assert.equal(result[0].eligible_bidders, 2);
  assert.equal(result[0].needs_initialization, 2);
  assert.equal(result[0].would_deactivate, 2);
  assert.equal(result[0].timestamps_initialized, 0);
  assert.deepEqual(h.reads[0].where, {
    branch_id: "branch-a", deleted_at: null,
    status: { in: ["ACTIVE", "INACTIVE"] }, bidder_number: { not: "5013" },
  });
  assert.deepEqual(h.reads[1].where?.bidder_id, { gt: "bidder-a" });
  assert.equal(h.reads[0].take, 2);
  assert.deepEqual(h.reads[0].orderBy, { bidder_id: "asc" });
  assert.deepEqual(h.transactionOptions[0], { isolationLevel: "RepeatableRead", timeout: 30_000 });
});

test("apply initializes null rows only and reports a concurrent skip", async () => {
  const h = harness([[bidder()], []]);
  h.tx.$executeRaw = async (query) => {
    h.writes.push(query);
    return 0; // A concurrent activity writer initialized the timestamp first.
  };
  const result = await initializeBidderActivity(h.prisma, { ...OPTIONS, apply: true }, NOW);
  assert.equal(h.writes.length, 1);
  assert.equal(result[0].needs_initialization, 1);
  assert.equal(result[0].timestamps_initialized, 0);
});

test("apply does not query history or write already tracked bidders", async () => {
  const h = harness([[bidder({ last_activity_at: NOW, status: "INACTIVE" })], []]);
  const result = await initializeBidderActivity(h.prisma, { ...OPTIONS, apply: true }, NOW);
  assert.equal(h.queries.length, 0);
  assert.equal(h.writes.length, 0);
  assert.equal(result[0].already_tracked, 1);
  assert.equal(result[0].would_activate, 1);
});

test("explicit all-branch apply separates branch updates and summaries", async () => {
  const h = harness([[bidder(), bidder({
    bidder_id: "bidder-b", branch_id: "branch-b", branch: { name: "Branch B" },
  })], []]);
  const result = await initializeBidderActivity(h.prisma, {
    all_branches: true, apply: true, batch_size: 2,
  }, NOW);
  assert.equal(h.reads[0].where?.branch_id, undefined);
  assert.equal(h.writes.length, 2);
  assert.deepEqual(result.map((summary) => [summary.branch_id, summary.timestamps_initialized]), [
    ["branch-a", 1], ["branch-b", 1],
  ]);
});

test("initialization validates direct callers before opening a transaction", async () => {
  const h = harness([]);
  await assert.rejects(initializeBidderActivity(h.prisma, {
    all_branches: false, apply: true, batch_size: 2,
  }, NOW), /exactly one scope/);
  assert.equal(h.transactionOptions.length, 0);
});

test("initialization stops when a database write fails", async () => {
  const h = harness([[bidder()], [bidder({ bidder_id: "should-not-run" })]]);
  h.tx.$executeRaw = async () => { throw new Error("write failed"); };
  await assert.rejects(initializeBidderActivity(h.prisma, { ...OPTIONS, apply: true }, NOW), /write failed/);
  assert.equal(h.reads.length, 1);
});
