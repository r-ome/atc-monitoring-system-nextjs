import test from "node:test";
import assert from "node:assert/strict";
import * as auth from "@/app/lib/auth";
import * as controller from "src/controllers/bidders/recalculate-bidder-activity.controller";
import { BranchRepository } from "src/infrastructure/di/repositories";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { SUPER_ADMIN_BRANCH } from "@/app/lib/prisma/prisma";
import { USER_ROLES } from "src/entities/models/User";
import { err, ok } from "src/entities/models/Result";
import { patchMethod } from "src/test-utils/patch";
import { auctionStartFixture } from "src/test-utils/auction-start-fixture";
import { recalculateBidderStatuses } from "./actions";
const cache: typeof import("next/cache") = require("next/cache");

for (const role of USER_ROLES) {
  test(`manual bidder recalculation enforces ${role} permissions and branch context`, async context => {
    const restore: (() => void)[] = [];
    context.after(() => { while (restore.length) restore.pop()?.(); });
    const { branch } = auctionStartFixture();
    const allowed = ["OWNER", "SUPER_ADMIN", "ADMIN", "CASHIER"].includes(role);
    let calls = 0;
    const paths: string[] = [];
    restore.push(patchMethod(auth, "requireUser", async () => ({
      id: "user", name: "Tester", username: "tester", role,
      branch: { branch_id: role === "SUPER_ADMIN" ? SUPER_ADMIN_BRANCH : branch.branch_id, name: "Home" },
    })));
    restore.push(patchMethod(BranchRepository, "getBranch", async id => {
      assert.ok(allowed); assert.equal(id, branch.branch_id); return branch;
    }));
    restore.push(patchMethod(controller, "RecalculateBidderActivityController", async (id, recordActivity) => {
      calls++; assert.equal(id, branch.branch_id);
      assert.equal(RequestContext.getStore()?.branch_id, branch.branch_id);
      assert.equal(RequestContext.getStore()?.username, "tester");
      assert.equal(recordActivity, role !== "SUPER_ADMIN");
      return ok({ activated: 2, deactivated: 3, cutoff: "2026-04-24T00:00:00.000Z" });
    }));
    restore.push(patchMethod(cache, "revalidatePath", path => { paths.push(path); }));
    const result = await recalculateBidderStatuses(role === "SUPER_ADMIN" ? branch.branch_id : undefined);
    assert.equal(result.ok, allowed);
    assert.equal(calls, Number(allowed));
    assert.deepEqual(paths, allowed ? ["/bidders"] : []);
    assert.equal(RequestContext.getStore(), undefined);
  });
}

test("manual bidder recalculation rejects cross-branch access and requires a real branch", async context => {
  const restore: (() => void)[] = [];
  context.after(() => { while (restore.length) restore.pop()?.(); });
  restore.push(patchMethod(BranchRepository, "getBranch", async () => { assert.fail("Invalid scopes cannot read branches"); }));
  const restoreUser = patchMethod(auth, "requireUser", async () => ({
    id: "user", name: "Tester", username: "tester", role: "CASHIER", branch: { branch_id: "home", name: "Home" },
  }));
  restore.push(restoreUser);
  assert.equal((await recalculateBidderStatuses("other")).ok, false);
  assert.equal((await recalculateBidderStatuses(" ")).ok, false);
  restoreUser();
  restore.push(patchMethod(auth, "requireUser", async () => ({
    id: "user", name: "Tester", username: "tester", role: "SUPER_ADMIN", branch: { branch_id: SUPER_ADMIN_BRANCH, name: "ALL" },
  })));
  assert.equal((await recalculateBidderStatuses()).ok, false);
});

test("failed readiness keeps the error visible without revalidating the bidders page", async context => {
  const restore: (() => void)[] = [];
  context.after(() => { while (restore.length) restore.pop()?.(); });
  const { branch } = auctionStartFixture();
  restore.push(patchMethod(auth, "requireUser", async () => ({
    id: "user", name: "Tester", username: "tester", role: "ADMIN", branch: { branch_id: branch.branch_id, name: branch.name },
  })));
  const restoreBranch = patchMethod(BranchRepository, "getBranch", async () => ({ ...branch, deleted_at: new Date() }));
  restore.push(restoreBranch);
  restore.push(patchMethod(controller, "RecalculateBidderActivityController", async () => err({ message: "Activity records need review." })));
  restore.push(patchMethod(cache, "revalidatePath", () => { assert.fail("No refresh after failure"); }));
  assert.equal((await recalculateBidderStatuses()).ok, false);
  restoreBranch();
  restore.push(patchMethod(BranchRepository, "getBranch", async () => branch));
  assert.deepEqual(await recalculateBidderStatuses(), err({ message: "Activity records need review." }));
});
