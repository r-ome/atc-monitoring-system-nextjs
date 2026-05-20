"use server";

import {
  authorizeAction,
  runWithBranchContext,
  runWithUserContext,
} from "@/app/lib/protected-action";
import { err, ok, Result } from "src/entities/models/Result";
import { GetExpensesSummaryController } from "src/controllers/reports/get-expenses-summary.controller";
import { GetBranchesController } from "src/controllers/branches/get-branches.controller";

type AuthorizedUser = Extract<
  Awaited<ReturnType<typeof authorizeAction>>,
  { ok: true }
>["value"];

async function getTransactionsBranchId(
  user: AuthorizedUser,
  requestedBranchId?: string,
): Promise<Result<string>> {
  if (!["SUPER_ADMIN", "OWNER"].includes(user.role)) {
    return ok(user.branch.branch_id);
  }

  const branchesRes = await runWithBranchContext(
    user,
    async () => await GetBranchesController(),
  );

  if (!branchesRes.ok) return branchesRes;

  const branch = requestedBranchId
    ? branchesRes.value.find((item) => item.branch_id === requestedBranchId)
    : branchesRes.value.find((item) => item.name === "BIÑAN");

  if (!branch) {
    return err({
      message: "Branch not found",
      cause: "Please select a valid branch before downloading expenses.",
    });
  }

  return ok(branch.branch_id);
}

export const getMonthlyExpensesSummary = async (
  input: Record<string, unknown>,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const requestedBranchId =
    typeof input.branch_id === "string" ? input.branch_id : undefined;
  const branchIdRes = await getTransactionsBranchId(
    auth.value,
    requestedBranchId,
  );
  if (!branchIdRes.ok) return branchIdRes;

  const year = Number(input.year);
  const monthIndex = Number(input.monthIndex);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(monthIndex) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return err({
      message: "Invalid month",
      cause: "Please select a valid month before downloading expenses.",
    });
  }

  return await runWithUserContext(
    auth.value,
    async () =>
      await GetExpensesSummaryController(
        branchIdRes.value,
        `${year}-${monthIndex}`,
      ),
  );
};
