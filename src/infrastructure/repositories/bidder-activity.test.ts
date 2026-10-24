import test from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import type prisma from "@/app/lib/prisma/prisma";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { SUPER_ADMIN_BRANCH } from "@/app/lib/prisma/prisma";
import {
  BidderActivityTransaction, resolveActivityBidders, touchBidderActivity,
  withBidderActivity, recalculateBidderActivity,
} from "./bidder-activity";

const NOW = new Date("2026-10-17T10:12:34.987Z");

test("activity touch deduplicates IDs, preserves bans, and never decreases time", async () => {
  const queries: Prisma.Sql[] = [];
  const tx = { $executeRaw: async (query: Prisma.Sql) => { queries.push(query); return 1; } } as unknown as BidderActivityTransaction;
  await touchBidderActivity(tx, ["b", "a", "b"], NOW);
  assert.equal(queries.length, 1);
  assert.deepEqual(queries[0].values, [new Date("2026-10-17T10:12:34.000Z"), "a", "b", "5013"]);
  assert.match(queries[0].sql, /GREATEST\(COALESCE\(last_activity_at, created_at\)/);
  assert.match(queries[0].sql, /CASE WHEN status = 'INACTIVE' THEN 'ACTIVE' ELSE status END/);
  assert.match(queries[0].sql, /deleted_at IS NULL/);
  assert.doesNotMatch(queries[0].sql, /updated_at/);
  await touchBidderActivity(tx, [], NOW);
  assert.equal(queries.length, 1);
});

test("activity batches large imports without one write per item", async () => {
  let writes = 0;
  const tx = { $executeRaw: async () => { writes++; return 1; } } as unknown as BidderActivityTransaction;
  await touchBidderActivity(tx, Array.from({ length: 1001 }, (_, index) => `bidder-${index}`), NOW);
  assert.equal(writes, 3);
});

test("activity resolves receipt, payment, item, and container ownership inside the tenant scope", async () => {
  const reads: unknown[] = [];
  const tx = {
    auctions_bidders: { findMany: async (args: unknown) => { reads.push(args); return [{ bidder_id: "a" }, { bidder_id: "a" }]; } },
    inventories: { findMany: async (args: unknown) => { reads.push(args); return []; } },
  } as unknown as BidderActivityTransaction;
  const result = await RequestContext.run({ branch_id: "branch-a" }, () => resolveActivityBidders(tx, {
    registrationIds: ["registration"], itemIds: ["item"], inventoryIds: ["inventory"],
    containerIds: ["container"], receiptIds: ["receipt"], paymentIds: ["payment"],
  }));
  assert.deepEqual(result, ["a"]);
  const query = JSON.stringify(reads);
  for (const value of ["branch-a", "registration", "item", "inventory", "container", "receipt", "payment"]) assert.ok(query.includes(value));
});

test("number-only activity resolves through its auction and ignores invalid bidder numbers", async () => {
  let query: unknown;
  const tx = { auctions_bidders: { findMany: async (args: unknown) => { query = args; return []; } } } as unknown as BidderActivityTransaction;
  await resolveActivityBidders(tx, { auctionNumbers: [
    { auction_id: "auction-a", bidder_number: " 7 " },
    { auction_id: "auction-b", bidder_number: "0007" },
    { auction_id: "auction-a", bidder_number: "10001" },
    { auction_id: "auction-a", bidder_number: " " },
  ] });
  assert.deepEqual(query, { where: { OR: [
    { auction_id: "auction-a", bidder: { bidder_number: "0007" } },
    { auction_id: "auction-b", bidder: { bidder_number: "0007" } },
    { auction_id: "auction-a", bidder: { bidder_number: "10001" } },
  ] }, select: { bidder_id: true } });
});

test("activity captures ownership before a delete and after a reassignment in one transaction", async () => {
  const events: string[] = [];
  let reads = 0;
  const tx = {
    auctions_bidders: { findMany: async () => { events.push("read"); return [{ bidder_id: reads++ ? "new" : "old" }]; } },
    $executeRaw: async (query: Prisma.Sql) => { events.push(`touch:${query.values.includes("old") ? "old" : "new"}`); return 1; },
  } as unknown as BidderActivityTransaction;
  const client = { $transaction: async (work: (tx: BidderActivityTransaction) => Promise<string>) => { events.push("begin"); const result = await work(tx); events.push("commit"); return result; } } as unknown as Pick<typeof prisma, "$transaction">;
  assert.equal(await withBidderActivity(client, { itemIds: ["item"] }, async (activeTx) => {
    assert.equal(activeTx, tx); events.push("reassign"); return "saved";
  }), "saved");
  assert.deepEqual(events, ["begin", "read", "touch:old", "reassign", "read", "touch:new", "commit"]);
});

test("activity rejects a direct bidder outside the authorized scope before writing", async () => {
  let writes = 0;
  const tx = { $queryRaw: async () => [], bidders: { findMany: async () => [] }, $executeRaw: async () => { writes++; return 1; } } as unknown as BidderActivityTransaction;
  const client = { $transaction: async (work: (tx: BidderActivityTransaction) => Promise<unknown>) => work(tx) } as unknown as Pick<typeof prisma, "$transaction">;
  await assert.rejects(withBidderActivity(client, { bidderIds: ["foreign"] }, async () => { writes++; }), /not found in this branch/);
  assert.equal(writes, 0);
});

test("direct bidder activity locks current ownership and global access still names individual bidders", async () => {
  for (const branch of ["branch-a", SUPER_ADMIN_BRANCH]) {
    let lock: Prisma.Sql | undefined;
    const tx = {
      $queryRaw: async (query: Prisma.Sql) => { lock = query; return [{ bidder_id: "one" }]; },
      $executeRaw: async () => 1,
      bidders: { findMany: async () => [{ bidder_id: "one" }] },
    } as unknown as BidderActivityTransaction;
    const client = { $transaction: async (work: (tx: BidderActivityTransaction) => Promise<unknown>) => work(tx) } as unknown as Pick<typeof prisma, "$transaction">;
    await RequestContext.run({ branch_id: branch }, () => withBidderActivity(client, { bidderIds: ["one", "one"] }, async () => undefined));
    assert.ok(lock);
    assert.match(lock.sql, /WHERE bidder_id IN \(\?\)/);
    assert.match(lock.sql, /ORDER BY bidder_id FOR UPDATE/);
    assert.deepEqual(lock.values, branch === SUPER_ADMIN_BRANCH ? ["one"] : ["one", "branch-a"]);
  }
});

test("failed activity operations propagate the error without committing", async () => {
  let committed = false;
  const tx = {} as BidderActivityTransaction;
  const client = { $transaction: async (work: (tx: BidderActivityTransaction) => Promise<unknown>) => { const result = await work(tx); committed = true; return result; } } as unknown as Pick<typeof prisma, "$transaction">;
  await assert.rejects(withBidderActivity(client, {}, async () => { throw new Error("failed business write"); }), /failed business write/);
  assert.equal(committed, false);
});

test("deadlocks retry the complete transaction and stop after three attempts", async () => {
  let attempts = 0;
  const failure = new Prisma.PrismaClientKnownRequestError("deadlock", { code: "P2034", clientVersion: "test" });
  const client = { $transaction: async () => { attempts++; throw failure; } } as unknown as Pick<typeof prisma, "$transaction">;
  await assert.rejects(withBidderActivity(client, {}, async () => undefined), /deadlock/);
  assert.equal(attempts, 3);
});

test("recalculation has conditional predicates and explicit branch scope even for global users", async () => {
  const writes: Prisma.Sql[] = [];
  const tx = {
    bidders: {
      findFirst: async () => null,
      findMany: async () => [],
    },
    $executeRaw: async (query: Prisma.Sql) => { writes.push(query); return query.sql.includes("SET status = 'ACTIVE'") ? 2 : 3; },
  } as unknown as BidderActivityTransaction;
  const result = await RequestContext.run({ branch_id: SUPER_ADMIN_BRANCH }, () => recalculateBidderActivity(tx, "branch-a", NOW));
  assert.deepEqual(result, { activated: 2, deactivated: 3, cutoff: "2026-04-17T10:12:34.000Z" });
  for (const query of writes) {
    assert.match(query.sql, /FORCE INDEX \(bidders_branch_status_activity_idx\)/);
    assert.match(query.sql, /WHERE branch_id = \?/);
    assert.match(query.sql, /deleted_at IS NULL AND bidder_number <> \?/);
    assert.deepEqual(query.values, [new Date("2026-10-17T10:12:34.000Z"), "branch-a", new Date(result.cutoff), "5013"]);
    assert.doesNotMatch(query.sql.split("WHERE")[0], /last_activity_at\s*=/);
  }
  assert.match(writes[0].sql, /SET status = 'INACTIVE'/);
  assert.match(writes[0].sql, /status = 'ACTIVE' AND last_activity_at <= \?/);
  assert.match(writes[1].sql, /SET status = 'ACTIVE'/);
  assert.match(writes[1].sql, /status = 'INACTIVE' AND last_activity_at > \?/);
});

test("recalculation refuses future activity before changing statuses", async () => {
  let writes = 0;
  let query: Prisma.biddersFindFirstArgs | undefined;
  const tx = { bidders: {
    findFirst: async (args: Prisma.biddersFindFirstArgs) => { query = args; return { bidder_id: "unready" }; },
    }, $executeRaw: async () => { writes++; return 0; },
  } as unknown as BidderActivityTransaction;
  await assert.rejects(recalculateBidderActivity(tx, "branch-a", NOW), /activity records need review/);
  assert.deepEqual(query?.where?.last_activity_at, { gt: NOW });
  assert.equal(writes, 0);
});

test("recalculation rejects missing and global branch identifiers before database access", async () => {
  const tx = {} as BidderActivityTransaction;
  for (const branch of ["", "   ", SUPER_ADMIN_BRANCH]) {
    await assert.rejects(recalculateBidderActivity(tx, branch, NOW), /valid auction branch/);
  }
});

test("recalculation fills missing activity from retained history before updating statuses", async () => {
  const old = new Date("2020-01-01T00:00:00.000Z");
  const historical = new Date("2026-09-01T00:00:00.000Z");
  const writes: Prisma.Sql[] = [];
  let reads = 0;
  const tx = {
    bidders: {
      findFirst: async () => null,
      findMany: async (args: Prisma.biddersFindManyArgs) => {
        assert.equal(args.where?.branch_id, "branch-a");
        assert.equal(args.where?.last_activity_at, null);
        return reads++ ? [] : [{ bidder_id: "legacy", bidder_number: "0007", branch_id: "branch-a", status: "ACTIVE",
          created_at: old, updated_at: old, last_activity_at: null, branch: { name: "Branch A" } }];
      },
    },
    $queryRaw: async () => [{ bidder_id: "legacy", source: "payment", activity_at: historical }],
    $executeRaw: async (query: Prisma.Sql) => { writes.push(query); return 1; },
  } as unknown as BidderActivityTransaction;
  await recalculateBidderActivity(tx, "branch-a", NOW);
  assert.equal(writes.length, 3);
  assert.match(writes[0].sql, /SET b.last_activity_at = c.activity_at/);
  assert.ok(writes[0].values.some(value => value instanceof Date && value.getTime() === historical.getTime()));
  assert.doesNotMatch(writes[0].sql, /SET[^]*updated_at|SET[^]*status\s*=/);
  assert.match(writes[1].sql, /SET status = 'INACTIVE'/);
  assert.match(writes[2].sql, /SET status = 'ACTIVE'/);
});
