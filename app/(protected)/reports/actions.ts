"use server";

import { requireUser } from "@/app/lib/auth";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { logActivity } from "@/app/lib/log-activity";
import {
  authorizeAction,
  runWithBranchContext,
  runWithUserContext,
} from "@/app/lib/protected-action";
import { GetAuctionBranchComparisonController } from "src/controllers/reports/get-auction-branch-comparison.controller";
import { GetExpensesSummaryController } from "src/controllers/reports/get-expenses-summary.controller";
import {
  UpdateRefundCancellationTagController,
  UpdateRefundCancellationTagInput,
} from "src/controllers/reports/update-refund-cancellation-tag.controller";

export const getAuctionBranchComparison = async (input: Record<string, unknown>) => {
  const auth = await authorizeAction({ allowedRoles: ["SUPER_ADMIN", "OWNER"] });
  if (!auth.ok) return auth;
  return await runWithBranchContext(auth.value, async () =>
    GetAuctionBranchComparisonController(input),
  );
};

export const getExpensesSummary = async (
  branch_id: string,
  date: string,
) => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetExpensesSummaryController(branch_id, date),
  );
};

export const updateRefundCancellationTag = async (
  input: Partial<UpdateRefundCancellationTagInput>,
) => {
  const user = await requireUser();
  return await runWithUserContext(
    user,
    async () => await UpdateRefundCancellationTagController(input),
  );
};

export const logReportTabView = async (
  tabValue: string,
  tabLabel: string,
) => {
  const user = await requireUser();

  await runWithUserContext(user, async () => {
    await logActivity(
      "CREATE",
      "report_view",
      tabValue,
      `Viewed Reports — ${tabLabel}`,
    );
  });
};
