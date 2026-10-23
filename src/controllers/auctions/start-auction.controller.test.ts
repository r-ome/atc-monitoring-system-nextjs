import test from "node:test";
import assert from "node:assert/strict";
import { AuctionRepository } from "src/infrastructure/di/repositories";
import * as activityLog from "@/app/lib/log-activity";
import { StartAuctionController } from "./start-auction.controller";
import { patchMethod } from "src/test-utils/patch";
import { auctionStartFixture } from "src/test-utils/auction-start-fixture";

test("startup rejects invalid or normalized-overflow dates before repository writes", async (context) => {
  context.after(patchMethod(AuctionRepository, "startAuction", async () => { assert.fail("Invalid dates must not create auctions"); }));
  for (const date of ["invalid", "2026-02-31", "2026-13-01", "2026-10-17T00:00:00Z"]) {
    const result = await StartAuctionController(date, "branch-a");
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.message, "Select a valid auction date.");
  }
});

test("startup logs changed counts after success while preserving the global-user exclusion", async (context) => {
  const { auction } = auctionStartFixture();
  const summary = { activated: 2, deactivated: 3, cutoff: "2026-04-17T00:00:00.000Z" };
  const descriptions: string[] = [];
  context.after(patchMethod(AuctionRepository, "startAuction", async (date, branch) => {
    assert.equal(date.toISOString(), "2026-10-17T00:00:00.000Z");
    assert.equal(branch, "branch-a");
    return { auction, bidder_activity: summary };
  }));
  context.after(patchMethod(activityLog, "logActivity", async (_action, _entity, _id, description) => { descriptions.push(description); }));
  assert.equal((await StartAuctionController("2026-10-17", "branch-a", true)).ok, true);
  assert.equal(descriptions.length, 1);
  assert.match(descriptions[0], /2 active, 3 inactive/);
  assert.ok(descriptions[0].includes(summary.cutoff));
  assert.ok(descriptions[0].includes("branch-a"));
  assert.equal((await StartAuctionController("2026-10-17", "branch-a", false)).ok, true);
  assert.equal(descriptions.length, 1);
});
