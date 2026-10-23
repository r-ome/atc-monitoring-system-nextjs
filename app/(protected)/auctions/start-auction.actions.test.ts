import test from "node:test";
import assert from "node:assert/strict";
import * as auth from "@/app/lib/auth";
import * as controller from "src/controllers/auctions/start-auction.controller";
const cache: typeof import("next/cache") = require("next/cache");
import { BranchRepository } from "src/infrastructure/di/repositories";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { SUPER_ADMIN_BRANCH } from "@/app/lib/prisma/prisma";
import { USER_ROLES } from "src/entities/models/User";
import { ok } from "src/entities/models/Result";
import { startAuction } from "./actions";
import { patchMethod } from "src/test-utils/patch";
import { auctionStartFixture } from "src/test-utils/auction-start-fixture";

for (const role of USER_ROLES) {
  test(`auction startup enforces ${role} access and propagates the actual branch`, async (context) => {
    const restorers: (() => void)[] = [];
    context.after(() => { while (restorers.length) restorers.pop()?.(); });
    const allowed = ["OWNER", "SUPER_ADMIN", "ADMIN", "CASHIER"].includes(role);
    let branchReads = 0;
    let starts = 0;
    const paths: string[] = [];
    const { branch, auction } = auctionStartFixture();
    restorers.push(patchMethod(auth, "requireUser", async () => ({
      id: "user", name: "Test", username: "tester", role,
      branch: { branch_id: role === "SUPER_ADMIN" ? SUPER_ADMIN_BRANCH : branch.branch_id, name: "Home" },
    })));
    restorers.push(patchMethod(BranchRepository, "getBranch", async (id) => {
      branchReads++; assert.equal(id, branch.branch_id); return branch;
    }));
    restorers.push(patchMethod(controller, "StartAuctionController", async (date, id, recordActivity) => {
      starts++; assert.equal(date, "2026-10-17"); assert.equal(id, branch.branch_id);
      assert.equal(RequestContext.getStore()?.branch_id, branch.branch_id);
      assert.equal(RequestContext.getStore()?.username, "tester");
      assert.equal(recordActivity, role !== "SUPER_ADMIN");
      return ok({ ...auction, bidder_activity: null });
    }));
    restorers.push(patchMethod(cache, "revalidatePath", (path) => { paths.push(path); }));
    const result = await startAuction("2026-10-17", role === "SUPER_ADMIN" ? branch.branch_id : undefined);
    assert.equal(result.ok, allowed);
    assert.equal(branchReads, Number(allowed));
    assert.equal(starts, Number(allowed));
    assert.deepEqual(paths, allowed ? ["/bidders", "/auctions/2026-10-17"] : []);
    assert.equal(RequestContext.getStore(), undefined);
  });
}

test("cashiers cannot override the branch and global users must choose a real branch", async (context) => {
  const restorers: (() => void)[] = [];
  context.after(() => { while (restorers.length) restorers.pop()?.(); });
  restorers.push(patchMethod(BranchRepository, "getBranch", async () => { assert.fail("Invalid scope must fail before branch reads"); }));
  const restoreCashier = patchMethod(auth, "requireUser", async () => ({
    id: "user", name: "Test", username: "tester", role: "CASHIER", branch: { branch_id: "home", name: "Home" },
  }));
  restorers.push(restoreCashier);
  assert.equal((await startAuction("2026-10-17", "other")).ok, false);
  restoreCashier();
  restorers.push(patchMethod(auth, "requireUser", async () => ({
    id: "user", name: "Test", username: "tester", role: "SUPER_ADMIN", branch: { branch_id: SUPER_ADMIN_BRANCH, name: "ALL" },
  })));
  assert.equal((await startAuction("2026-10-17")).ok, false);
});

test("auction startup rejects deleted or ALL branches before creating an auction", async (context) => {
  const restorers: (() => void)[] = [];
  context.after(() => { while (restorers.length) restorers.pop()?.(); });
  restorers.push(patchMethod(auth, "requireUser", async () => ({
    id: "user", name: "Test", username: "tester", role: "OWNER", branch: { branch_id: "home", name: "Home" },
  })));
  restorers.push(patchMethod(controller, "StartAuctionController", async () => { assert.fail("Invalid branch must never create an auction"); }));
  const restoreDeleted = patchMethod(BranchRepository, "getBranch", async () => ({ ...auctionStartFixture().branch, deleted_at: new Date() }));
  restorers.push(restoreDeleted);
  assert.equal((await startAuction("2026-10-17", "deleted")).ok, false);
  restoreDeleted();
  restorers.push(patchMethod(BranchRepository, "getBranch", async () => ({ ...auctionStartFixture().branch, name: "ALL" })));
  assert.equal((await startAuction("2026-10-17", "all-marker")).ok, false);
});
