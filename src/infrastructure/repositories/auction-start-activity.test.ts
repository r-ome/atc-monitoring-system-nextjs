import test from "node:test";
import assert from "node:assert/strict";
import prisma from "@/app/lib/prisma/prisma";
import { AuctionRepository } from "./auctions.repository";
import { patchMethod } from "src/test-utils/patch";
import { auctionStartFixture } from "src/test-utils/auction-start-fixture";
import { SUPER_ADMIN_BRANCH } from "@/app/lib/prisma/prisma";

test("auction repository never falls back to a database default branch", async (context) => {
  context.after(patchMethod(prisma, "$transaction", (async () => { assert.fail("Invalid branches must fail before transaction creation"); }) as typeof prisma.$transaction));
  for (const branch of [undefined, "", "   ", SUPER_ADMIN_BRANCH]) {
    await assert.rejects(AuctionRepository.startAuction(new Date("2026-10-17"), branch as string), /valid auction branch/);
  }
});

  test("auction startup creates its own branch and always recalculates bidders", async (context) => {
    const { auction } = auctionStartFixture("selected");
    const updates: unknown[] = [];
    let readinessReads = 0;
    let data: Record<string, unknown> | undefined;
    const tx = {
      branches: { findFirst: async () => ({ branch_id: "selected" }) },
      bidders: {
        findMany: async () => [],
        findFirst: async (args: { where: Record<string, unknown> }) => {
          if (args.where.bidder_number === "5013") {
            assert.equal(args.where.branch_id, "selected"); return { bidder_id: "selected-atc" };
          }
          readinessReads++; return null;
        },
      },
      $executeRaw: async (query: unknown) => { updates.push(query); return 2; },
      auctions: { create: async (args: { data: Record<string, unknown> }) => { data = args.data; return auction; } },
    };
    const restore = patchMethod(prisma, "$transaction", (async (callback: (tx: unknown) => Promise<unknown>) => callback(tx)) as typeof prisma.$transaction);
    context.after(restore);
    const historic = new Date("2020-01-01T00:00:00Z");
    const result = await AuctionRepository.startAuction(historic, "selected");
    assert.equal(data?.branch_id, "selected");
    assert.equal(data?.created_at, historic);
    assert.equal(readinessReads, 1);
    assert.equal(updates.length, 2);
    assert.equal(result.auction.branch_id, "selected");
    assert.ok(result.bidder_activity);
    assert.ok(new Date(result.bidder_activity.cutoff) > historic);
  });

test("future activity aborts the auction transaction and reaches the caller", async (context) => {
  let committed = false;
  let created = false;
  const tx = {
    branches: { findFirst: async () => ({ branch_id: "branch-a" }) },
    bidders: { findFirst: async (args: { where: { bidder_number: unknown } }) => args.where.bidder_number === "5013" ? { bidder_id: "atc" } : { bidder_id: "unready" } },
    auctions: { create: async () => { created = true; return auctionStartFixture().auction; } },
  };
  const restore = patchMethod(prisma, "$transaction", (async (callback: (tx: unknown) => Promise<unknown>) => { const result = await callback(tx); committed = true; return result; }) as typeof prisma.$transaction);
  context.after(restore);
  await assert.rejects(AuctionRepository.startAuction(new Date("2026-10-17"), "branch-a"), /activity records need review/);
  assert.equal(created, true);
  assert.equal(committed, false);
});
