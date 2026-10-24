import test from "node:test";
import assert from "node:assert/strict";
import { BidderRepository } from "src/infrastructure/di/repositories";
import * as activityLog from "@/app/lib/log-activity";
import { InputParseError } from "src/entities/errors/common";
import { RecalculateBidderActivityController } from "./recalculate-bidder-activity.controller";
import { patchMethod } from "src/test-utils/patch";

test("manual recalculation logs counts and cutoff after success, preserving SUPER_ADMIN audit exclusion", async context => {
  const result = { activated: 2, deactivated: 3, cutoff: "2026-04-24T00:00:00.000Z" };
  context.after(patchMethod(BidderRepository, "recalculateActivity", async branch => {
    assert.equal(branch, "branch"); return result;
  }));
  const logs: string[] = [];
  context.after(patchMethod(activityLog, "logActivity", async (action, entity, id, description) => {
    assert.equal(action, "UPDATE"); assert.equal(entity, "branch"); assert.equal(id, "branch"); logs.push(description);
  }));
  assert.deepEqual(await RecalculateBidderActivityController("branch"), { ok: true, value: result });
  assert.match(logs[0], /activated 2; deactivated 3; cutoff 2026-04-24T00:00:00.000Z; branch branch/);
  await RecalculateBidderActivityController("branch", false);
  assert.equal(logs.length, 1);
});

test("manual recalculation exposes readiness errors without logging success", async context => {
  context.after(patchMethod(BidderRepository, "recalculateActivity", async () => {
    throw new InputParseError("Activity records need review.");
  }));
  context.after(patchMethod(activityLog, "logActivity", async () => { assert.fail("No success log after failure"); }));
  assert.deepEqual(await RecalculateBidderActivityController("branch"), {
    ok: false, error: { message: "Activity records need review." },
  });
});
