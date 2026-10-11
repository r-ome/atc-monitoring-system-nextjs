import test from "node:test";
import assert from "node:assert/strict";
import * as auth from "@/app/lib/auth";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { BranchRepository, ReportsRepository } from "src/infrastructure/di/repositories";
import { USER_ROLES } from "src/entities/models/User";
import { patchMethod } from "src/test-utils/patch";
import { getAuctionBranchComparison } from "./actions";

for (const role of USER_ROLES) {
  test(`auction comparison action: ${role} access is enforced before repository reads`, async (context) => {
    const restorers: Array<() => void> = [];
    context.after(() => { while (restorers.length) restorers.pop()?.(); });
    let branchReads = 0;
    let aggregateReads = 0;
    restorers.push(patchMethod(auth, "requireUser", async () => ({
      id: "user-1", name: "User", username: "user", role,
      branch: { branch_id: "home-branch", name: "Home" },
    })));
    restorers.push(patchMethod(BranchRepository, "getBranches", async () => {
      branchReads++;
      assert.equal(RequestContext.getStore()?.branch_id, "home-branch");
      return [{ branch_id: "11111111-1111-4111-8111-111111111111", name: "Other branch",
        created_at: new Date(), updated_at: new Date(), deleted_at: null }];
    }));
    restorers.push(patchMethod(ReportsRepository, "getAuctionBranchComparison", async (ids) => {
      aggregateReads++;
      assert.deepEqual(ids, ["11111111-1111-4111-8111-111111111111"]);
      assert.equal(RequestContext.getStore()?.branch_id, "home-branch");
      return [];
    }));
    const result = await getAuctionBranchComparison({ year: "2026" });
    const allowed = role === "SUPER_ADMIN" || role === "OWNER";
    assert.equal(result.ok, allowed);
    assert.equal(branchReads, allowed ? 1 : 0);
    assert.equal(aggregateReads, allowed ? 1 : 0);
    if (!allowed && !result.ok) assert.equal(result.error.message, "Unauthorized");
    assert.equal(RequestContext.getStore(), undefined);
  });
}
